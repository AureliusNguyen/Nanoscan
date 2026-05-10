"""Train the custom CNN on the brain tumor MRI dataset.

Usage (locally or in Colab):
    python train_cnn.py \
        --data-dir /content \
        --output cnn_model.h5 \
        --epochs 10 \
        --batch-size 16

Saves a full Keras model (architecture + weights) to --output, so the API
can load it with tf.keras.models.load_model() without rebuilding the graph.
"""
from __future__ import annotations

import argparse
import os
import random
from pathlib import Path

import numpy as np
import pandas as pd
import tensorflow as tf
from sklearn.model_selection import train_test_split
from tensorflow.keras.layers import Conv2D, Dense, Dropout, Flatten, MaxPooling2D
from tensorflow.keras.metrics import Precision, Recall
from tensorflow.keras.models import Sequential
from tensorflow.keras.optimizers import Adamax
from tensorflow.keras.preprocessing.image import ImageDataGenerator

CLASSES = ["glioma", "meningioma", "notumor", "pituitary"]
IMG_SIZE = (224, 224)
INPUT_SHAPE = (224, 224, 3)


def set_seed(seed: int) -> None:
    random.seed(seed)
    np.random.seed(seed)
    tf.random.set_seed(seed)
    os.environ["PYTHONHASHSEED"] = str(seed)


def get_class_paths(root: Path) -> pd.DataFrame:
    rows = []
    for label in sorted(os.listdir(root)):
        label_dir = root / label
        if not label_dir.is_dir():
            continue
        for image in os.listdir(label_dir):
            rows.append({"path": str(label_dir / image), "class": label})
    return pd.DataFrame(rows)


def build_model() -> Sequential:
    model = Sequential(
        [
            Conv2D(512, (3, 3), activation="relu", input_shape=INPUT_SHAPE, padding="same"),
            MaxPooling2D(pool_size=(2, 2)),
            Conv2D(256, (3, 3), activation="relu", padding="same"),
            MaxPooling2D(pool_size=(2, 2)),
            Dropout(0.25),
            Conv2D(128, (3, 3), activation="relu", padding="same"),
            MaxPooling2D(pool_size=(2, 2)),
            Dropout(0.25),
            Conv2D(64, (3, 3), activation="relu", padding="same"),
            MaxPooling2D(pool_size=(2, 2)),
            Flatten(),
            Dense(256, activation="relu"),
            Dropout(0.35),
            Dense(len(CLASSES), activation="softmax"),
        ]
    )
    model.compile(
        optimizer=Adamax(learning_rate=0.001),
        loss="categorical_crossentropy",
        metrics=["accuracy", Precision(name="precision"), Recall(name="recall")],
    )
    return model


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--data-dir",
        default="./data",
        help="Dir containing Training/ and Testing/. Default: ./data",
    )
    parser.add_argument("--output", default="cnn_model.h5")
    parser.add_argument("--epochs", type=int, default=10)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    set_seed(args.seed)

    data_dir = Path(args.data_dir)
    train_root = data_dir / "Training"
    test_root = data_dir / "Testing"
    if not train_root.is_dir() or not test_root.is_dir():
        raise SystemExit(f"Dataset not found under {data_dir}. Expected Training/ and Testing/.")

    train_df = get_class_paths(train_root)
    test_df = get_class_paths(test_root)
    val_df, test_df = train_test_split(
        test_df, train_size=0.5, stratify=test_df["class"], random_state=args.seed
    )
    print(f"Train: {len(train_df)}  Val: {len(val_df)}  Test: {len(test_df)}")

    train_gen_src = ImageDataGenerator(rescale=1.0 / 255, brightness_range=(0.8, 1.2))
    eval_gen_src = ImageDataGenerator(rescale=1.0 / 255)

    train_gen = train_gen_src.flow_from_dataframe(
        train_df,
        x_col="path",
        y_col="class",
        target_size=IMG_SIZE,
        batch_size=args.batch_size,
        classes=CLASSES,
    )
    val_gen = eval_gen_src.flow_from_dataframe(
        val_df,
        x_col="path",
        y_col="class",
        target_size=IMG_SIZE,
        batch_size=args.batch_size,
        classes=CLASSES,
        shuffle=False,
    )
    test_gen = eval_gen_src.flow_from_dataframe(
        test_df,
        x_col="path",
        y_col="class",
        target_size=IMG_SIZE,
        batch_size=16,
        classes=CLASSES,
        shuffle=False,
    )

    model = build_model()
    model.summary()
    model.fit(train_gen, validation_data=val_gen, epochs=args.epochs)

    train_score = model.evaluate(train_gen, verbose=1)
    val_score = model.evaluate(val_gen, verbose=1)
    test_score = model.evaluate(test_gen, verbose=1)
    print(f"\nTrain  acc={train_score[1]*100:.2f}%  loss={train_score[0]:.4f}")
    print(f"Val    acc={val_score[1]*100:.2f}%  loss={val_score[0]:.4f}")
    print(f"Test   acc={test_score[1]*100:.2f}%  loss={test_score[0]:.4f}")

    out = Path(args.output)
    out.parent.mkdir(parents=True, exist_ok=True)
    model.save(str(out))
    print(f"\nSaved model to {out.resolve()}")


if __name__ == "__main__":
    main()
