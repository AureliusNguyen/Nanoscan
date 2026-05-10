"""Download the Kaggle brain-tumor MRI dataset.

Requires the Kaggle API to be configured:
- Locally: ~/.kaggle/kaggle.json
- In Colab: upload kaggle.json or set KAGGLE_USERNAME / KAGGLE_KEY env vars

Usage:
    python download_dataset.py --out /content
"""
from __future__ import annotations

import argparse
import os
import subprocess
from pathlib import Path

DATASET = "masoudnickparvar/brain-tumor-mri-dataset"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", default="/content", help="Where to unzip the dataset")
    args = parser.parse_args()

    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    cmd = ["kaggle", "datasets", "download", "-d", DATASET, "--unzip", "-p", str(out)]
    print(" ".join(cmd))
    subprocess.run(cmd, check=True)

    train = out / "Training"
    test = out / "Testing"
    if not train.is_dir() or not test.is_dir():
        raise SystemExit(f"Expected Training/ and Testing/ under {out} after unzip.")
    print(f"Done. {train} and {test} ready.")


if __name__ == "__main__":
    main()
