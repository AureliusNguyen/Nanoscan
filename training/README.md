# Training

Reproducible training scripts for the two models the web app serves:

- `train_xception.py` -- Xception transfer-learning model (input 299x299).
  Saves Keras weights (`.weights.h5`).
- `train_cnn.py` -- Custom CNN built from scratch (input 224x224). Saves
  the full Keras model (`.h5`) so the API can load it without rebuilding
  the architecture.

The dataset is the Kaggle "brain-tumor-mri-dataset" (~7,000 MRIs across
4 classes: glioma, meningioma, notumor, pituitary).

## Run in Google Colab (recommended -- you get a free GPU)

In a Colab notebook:

```
!git clone https://github.com/<your-user>/<this-repo>.git
%cd <this-repo>/training
!pip install -r requirements.txt

# Upload your kaggle.json (Account -> Create New API Token on kaggle.com)
from google.colab import files
files.upload()
!mkdir -p ~/.kaggle && mv kaggle.json ~/.kaggle/ && chmod 600 ~/.kaggle/kaggle.json

# Download dataset (~150 MB, ~30s on Colab)
!python download_dataset.py --out /content

# Train Xception (~10-15 min on a T4 GPU)
!python train_xception.py --data-dir /content --output xception.weights.h5 --epochs 5

# Train custom CNN (~15-25 min on a T4 GPU)
!python train_cnn.py --data-dir /content --output cnn_model.h5 --epochs 10

# Download both files to your local machine
from google.colab import files
files.download("xception.weights.h5")
files.download("cnn_model.h5")
```

Place the two downloaded files in `../api/models/` to use them with the
local backend.

## Run locally

```
pip install -r requirements.txt
python download_dataset.py --out ./data
python train_xception.py --data-dir ./data --output ../api/models/xception.weights.h5
python train_cnn.py --data-dir ./data --output ../api/models/cnn_model.h5
```

You'll need a CUDA-capable GPU for reasonable speed (~10x faster than CPU).

## Expected accuracy

- Xception (5 epochs): ~98% test accuracy
- Custom CNN (10 epochs): ~92-95% test accuracy

If your numbers are far below these, double-check the data directory
layout and that `brightness_range` augmentation is only applied to the
training generator, not val/test.
