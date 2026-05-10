"""Model loading, prediction, and saliency-map generation.

Both models are loaded once at module import time. If a weight file is
missing, that model becomes unavailable and predict() raises for it.
If neither weight is present, the API still serves predictions in
"stub mode" with random probabilities -- useful while training is in
progress and for frontend development.
"""
from __future__ import annotations

import base64
import io
import os
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import cv2
import numpy as np
from PIL import Image, UnidentifiedImageError

# Cap how many pixels Pillow will decode. Anything bigger raises
# Image.DecompressionBombError. Defaults to ~89MP in Pillow which is too
# generous for an MRI demo; 50MP is plenty (a 7000x7000 image).
Image.MAX_IMAGE_PIXELS = 50_000_000

CLASSES = ["glioma", "meningioma", "notumor", "pituitary"]


def _find_models_dir() -> Path:
    """Pick where to look for .h5 weight files.

    Resolution order:
      1. MODELS_DIR env var if set (explicit override)
      2. <api>/models/  if it exists and contains any .h5 files
      3. <api>/         if any .h5 sit at the api root (handy on HF Spaces
         where the Files tab drops files at the repo root by default)
      4. fall back to <api>/models/ even if empty -- standard local layout
    """
    here = Path(__file__).parent
    explicit = os.environ.get("MODELS_DIR")
    if explicit:
        return Path(explicit)
    nested = here / "models"
    if nested.exists() and any(nested.glob("*.h5")):
        return nested
    if any(here.glob("*.h5")):
        return here
    return nested


MODELS_DIR = _find_models_dir()


class InvalidImageError(ValueError):
    """User-facing 'we could not read your image' error."""


_XCEPTION_WEIGHTS = MODELS_DIR / "xception_model.weights.h5"
_RESNET_WEIGHTS = MODELS_DIR / "resNet50V2.weights.h5"
_CNN_MODEL = MODELS_DIR / "cnn_model.h5"

_xception_model = None
_resnet_model = None
_cnn_model = None
_tf_loaded = False


@dataclass
class PredictionResult:
    model_id: str
    predicted_class: str
    confidence: float
    probabilities: dict[str, float]
    saliency_map_png_b64: str
    elapsed_ms: int
    stub: bool


def _lazy_import_tf():
    global _tf_loaded
    import tensorflow as tf  # noqa: WPS433

    _tf_loaded = True
    return tf


def _build_classifier_head(tf, base, input_shape: tuple[int, int, int]):
    """Wrap a backbone (Xception or ResNet50V2) in our standard classifier
    head: Flatten -> Dropout -> Dense(128) -> Dropout -> Dense(4).
    Matches the architecture in notebooks/Brain_Tumor_Classification.ipynb."""
    from tensorflow.keras.layers import Dense, Dropout, Flatten
    from tensorflow.keras.metrics import Precision, Recall
    from tensorflow.keras.models import Sequential
    from tensorflow.keras.optimizers import Adamax

    model = Sequential(
        [
            base,
            Flatten(),
            Dropout(0.3),
            Dense(128, activation="relu"),
            Dropout(0.25),
            Dense(len(CLASSES), activation="softmax"),
        ]
    )
    model.build((None, *input_shape))
    model.compile(
        optimizer=Adamax(learning_rate=0.001),
        loss="categorical_crossentropy",
        metrics=["accuracy", Precision(name="precision"), Recall(name="recall")],
    )
    return model


def _build_xception(tf):
    base = tf.keras.applications.Xception(
        input_shape=(299, 299, 3),
        include_top=False,
        weights=None,
        pooling="max",
    )
    return _build_classifier_head(tf, base, (299, 299, 3))


def _build_resnet(tf):
    base = tf.keras.applications.ResNet50V2(
        input_shape=(299, 299, 3),
        include_top=False,
        weights=None,
        pooling="max",
    )
    return _build_classifier_head(tf, base, (299, 299, 3))


def load_models() -> dict[str, bool]:
    """Try to load all three models. Returns a map of model_id -> loaded."""
    global _xception_model, _resnet_model, _cnn_model

    status = {"xception": False, "resnet": False, "cnn": False}

    if not (
        _XCEPTION_WEIGHTS.exists()
        or _RESNET_WEIGHTS.exists()
        or _CNN_MODEL.exists()
    ):
        print(f"[inference] No weights found in {MODELS_DIR} - running in STUB mode.")
        return status

    tf = _lazy_import_tf()

    if _XCEPTION_WEIGHTS.exists():
        try:
            print(f"[inference] Loading Xception weights from {_XCEPTION_WEIGHTS}")
            _xception_model = _build_xception(tf)
            _xception_model.load_weights(str(_XCEPTION_WEIGHTS))
            status["xception"] = True
        except Exception as exc:
            print(f"[inference] Failed to load Xception: {exc}")

    if _RESNET_WEIGHTS.exists():
        try:
            print(f"[inference] Loading ResNet50V2 weights from {_RESNET_WEIGHTS}")
            _resnet_model = _build_resnet(tf)
            _resnet_model.load_weights(str(_RESNET_WEIGHTS))
            status["resnet"] = True
        except Exception as exc:
            print(f"[inference] Failed to load ResNet: {exc}")

    if _CNN_MODEL.exists():
        try:
            print(f"[inference] Loading CNN model from {_CNN_MODEL}")
            _cnn_model = tf.keras.models.load_model(str(_CNN_MODEL))
            status["cnn"] = True
        except Exception as exc:
            print(f"[inference] Failed to load CNN: {exc}")

    return status


def models_loaded() -> dict[str, bool]:
    return {
        "xception": _xception_model is not None,
        "resnet": _resnet_model is not None,
        "cnn": _cnn_model is not None,
    }


def _get_model(model_id: str):
    if model_id == "xception":
        return _xception_model, (299, 299)
    if model_id == "resnet":
        return _resnet_model, (299, 299)
    if model_id == "cnn":
        return _cnn_model, (224, 224)
    raise ValueError(f"unknown model_id: {model_id}")


def _open_image(image_bytes: bytes) -> Image.Image:
    """Decode user-uploaded bytes into a PIL Image with safe failure modes."""
    try:
        img = Image.open(io.BytesIO(image_bytes))
        # Force decode now so a corrupt file raises here, not deep in inference.
        img.load()
        return img.convert("RGB")
    except UnidentifiedImageError as exc:
        raise InvalidImageError("file is not a recognised image") from exc
    except Image.DecompressionBombError as exc:
        raise InvalidImageError("image exceeds the 50 MP decode cap") from exc
    except (OSError, ValueError) as exc:
        raise InvalidImageError(f"could not decode image: {exc}") from exc


def _prepare_image(image_bytes: bytes, target_size: tuple[int, int]) -> tuple[np.ndarray, Image.Image]:
    img = _open_image(image_bytes)
    resized = img.resize(target_size)
    arr = np.asarray(resized, dtype=np.float32) / 255.0
    arr = np.expand_dims(arr, axis=0)
    return arr, resized


def _saliency_map(tf, model, img_array: np.ndarray, class_index: int, target_size: tuple[int, int], original: Image.Image) -> bytes:
    """Replicates the notebook's saliency algorithm with bug fixes."""
    img_tensor = tf.convert_to_tensor(img_array)
    with tf.GradientTape() as tape:
        tape.watch(img_tensor)
        predictions = model(img_tensor)
        target = predictions[:, class_index]
    gradients = tape.gradient(target, img_tensor)
    gradients = tf.math.abs(gradients)
    gradients = tf.reduce_max(gradients, axis=-1)
    gradients = gradients.numpy().squeeze()

    gradients = cv2.resize(gradients, target_size)

    h, w = gradients.shape
    cy, cx = h // 2, w // 2
    radius = min(cy, cx) - 10
    yy, xx = np.ogrid[:h, :w]
    mask = (xx - cx) ** 2 + (yy - cy) ** 2 <= radius ** 2

    masked = gradients * mask
    brain = masked[mask]
    if brain.size and brain.max() > brain.min():
        brain = (brain - brain.min()) / (brain.max() - brain.min())
        masked[mask] = brain

    if mask.any():
        threshold = float(np.percentile(masked[mask], 80))
        masked[masked < threshold] = 0

    masked = cv2.GaussianBlur(masked, (11, 11), 0)
    heatmap = cv2.applyColorMap(np.uint8(255 * masked), cv2.COLORMAP_JET)
    heatmap = cv2.cvtColor(heatmap, cv2.COLOR_BGR2RGB)
    heatmap = cv2.resize(heatmap, target_size)

    original_arr = np.asarray(original.resize(target_size), dtype=np.float32)
    superimposed = heatmap.astype(np.float32) * 0.7 + original_arr * 0.3
    superimposed = np.clip(superimposed, 0, 255).astype(np.uint8)

    out_img = Image.fromarray(superimposed)
    buf = io.BytesIO()
    out_img.save(buf, format="PNG")
    return buf.getvalue()


def _stub_saliency(original: Image.Image, target_size: tuple[int, int]) -> bytes:
    """Generate a placeholder heatmap when no model is loaded."""
    base = np.asarray(original.resize(target_size), dtype=np.float32)
    h, w, _ = base.shape
    yy, xx = np.mgrid[0:h, 0:w]
    cy, cx = h // 2, w // 2
    sigma = min(h, w) / 4
    gauss = np.exp(-((xx - cx) ** 2 + (yy - cy) ** 2) / (2 * sigma ** 2))
    heat = (255 * gauss).astype(np.uint8)
    heatmap = cv2.applyColorMap(heat, cv2.COLORMAP_JET)
    heatmap = cv2.cvtColor(heatmap, cv2.COLOR_BGR2RGB)
    superimposed = heatmap.astype(np.float32) * 0.7 + base * 0.3
    superimposed = np.clip(superimposed, 0, 255).astype(np.uint8)
    buf = io.BytesIO()
    Image.fromarray(superimposed).save(buf, format="PNG")
    return buf.getvalue()


def predict(model_id: str, image_bytes: bytes) -> PredictionResult:
    started = time.perf_counter()
    model, target_size = _get_model(model_id)

    if model is None:
        original = _open_image(image_bytes)
        rng = np.random.default_rng(seed=hash(image_bytes) & 0xFFFFFFFF)
        raw = rng.dirichlet(alpha=[1.5, 1.5, 1.5, 1.5])
        idx = int(np.argmax(raw))
        png = _stub_saliency(original, target_size)
        elapsed = int((time.perf_counter() - started) * 1000)
        return PredictionResult(
            model_id=model_id,
            predicted_class=CLASSES[idx],
            confidence=float(raw[idx]),
            probabilities={c: float(raw[i]) for i, c in enumerate(CLASSES)},
            saliency_map_png_b64=base64.b64encode(png).decode("ascii"),
            elapsed_ms=elapsed,
            stub=True,
        )

    tf = _lazy_import_tf()
    arr, original = _prepare_image(image_bytes, target_size)
    preds = model.predict(arr, verbose=0)[0]
    idx = int(np.argmax(preds))

    saliency_png = _saliency_map(tf, model, arr, idx, target_size, original)
    elapsed = int((time.perf_counter() - started) * 1000)
    return PredictionResult(
        model_id=model_id,
        predicted_class=CLASSES[idx],
        confidence=float(preds[idx]),
        probabilities={c: float(preds[i]) for i, c in enumerate(CLASSES)},
        saliency_map_png_b64=base64.b64encode(saliency_png).decode("ascii"),
        elapsed_ms=elapsed,
        stub=False,
    )
