"""FastAPI entry point for the Brain Tumor Classifier backend."""
from __future__ import annotations

import os
from contextlib import asynccontextmanager

# Load .env from the api/ directory before importing other modules that
# read environment variables at import time (explain.py reads
# GEMINI_API_KEY at module level).
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, File, Form, HTTPException, UploadFile  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402

from explain import explain as run_explain  # noqa: E402
from explain import is_configured as gemini_configured  # noqa: E402
from inference import (  # noqa: E402
    InvalidImageError,
    load_models,
    models_loaded,
    predict,
)
from schemas import (  # noqa: E402
    ExplainRequest,
    ExplainResponse,
    HealthResponse,
    ModelInfo,
    PredictionResponse,
)

MAX_IMAGE_BYTES = 10 * 1024 * 1024
ALLOWED_MIME = {"image/jpeg", "image/png", "image/webp", "image/jpg"}

ALLOWED_ORIGINS = [
    o.strip()
    for o in os.environ.get(
        "CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000",
    ).split(",")
    if o.strip()
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_models()
    yield


app = FastAPI(
    title="Brain Tumor Classifier API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    loaded = models_loaded()
    return HealthResponse(
        status="ok",
        models_loaded=[k for k, v in loaded.items() if v],
        gemini_configured=gemini_configured(),
    )


@app.get("/models", response_model=list[ModelInfo])
def list_models() -> list[ModelInfo]:
    loaded = models_loaded()
    return [
        ModelInfo(
            id="xception",
            name="Xception (Transfer Learning)",
            input_size=299,
            description="ImageNet-pretrained Xception backbone with a small classifier head.",
            loaded=loaded["xception"],
        ),
        ModelInfo(
            id="resnet",
            name="ResNet50V2 (Transfer Learning)",
            input_size=299,
            description="ImageNet-pretrained ResNet50V2 backbone with the same classifier head as Xception.",
            loaded=loaded["resnet"],
        ),
        ModelInfo(
            id="cnn",
            name="Custom CNN",
            input_size=224,
            description="Four-block convolutional network trained from scratch.",
            loaded=loaded["cnn"],
        ),
    ]


@app.post("/predict", response_model=PredictionResponse)
async def predict_route(
    image: UploadFile = File(...),
    model_id: str = Form(...),
) -> PredictionResponse:
    if model_id not in {"xception", "resnet", "cnn"}:
        raise HTTPException(400, f"unknown model_id: {model_id}")
    if image.content_type not in ALLOWED_MIME:
        raise HTTPException(415, f"unsupported image type: {image.content_type}")

    data = await image.read()
    if not data:
        raise HTTPException(400, "empty file")
    if len(data) > MAX_IMAGE_BYTES:
        raise HTTPException(413, f"file too large (max {MAX_IMAGE_BYTES} bytes)")

    try:
        result = predict(model_id, data)
    except InvalidImageError as exc:
        raise HTTPException(415, f"invalid image: {exc}") from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(500, f"prediction failed: {exc}") from exc

    return PredictionResponse(
        model_id=result.model_id,  # type: ignore[arg-type]
        predicted_class=result.predicted_class,  # type: ignore[arg-type]
        confidence=result.confidence,
        probabilities=result.probabilities,  # type: ignore[arg-type]
        saliency_map_png_b64=result.saliency_map_png_b64,
        elapsed_ms=result.elapsed_ms,
        stub=result.stub,
    )


@app.post("/explain", response_model=ExplainResponse)
def explain_route(req: ExplainRequest) -> ExplainResponse:
    try:
        result = run_explain(
            predicted_class=req.predicted_class,
            confidence=req.confidence,
            saliency_map_png_b64=req.saliency_map_png_b64,
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(500, f"explanation failed: {exc}") from exc
    return ExplainResponse(explanation=result.text, stub=result.stub)
