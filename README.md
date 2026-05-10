# NeuroScan -- Brain Tumor MRI Atlas

A full-stack web app that classifies brain MRI scans into four categories
(glioma, meningioma, pituitary, no-tumor), shows which regions of the
image the model focused on, and uses Gemini to explain the result in
plain English.

> Status: in development. Frontend live URL: TBD. Backend live URL:
> https://madarame1337-brain-tumor.hf.space

**Disclaimer:** Research / portfolio project. Not a medical device. Not
for diagnosis.

## Repo layout

| Path | What it is |
|------|------------|
| `web/` | Next.js 15 frontend (App Router, TypeScript, Tailwind v4) |
| `api/` | FastAPI backend with TensorFlow inference + Gemini integration |
| `training/` | Standalone training scripts. The dataset (~150 MB) lands at `training/data/Training` and `training/data/Testing` and is gitignored. Bootstrap it via `python download_dataset.py --out ./data` (needs a Kaggle API token). |
| `notebooks/` | Original training notebook, kept for reference |

## Models

Three architectures are exposed in the UI; the user picks one before
classifying:

| Model | Backbone | Input | Saved as |
|-------|----------|-------|----------|
| Xception | Xception (ImageNet pretrained) + small dense head | 299x299 | `xception_model.weights.h5` (weights only) |
| ResNet50V2 | ResNet50V2 (ImageNet pretrained) + same head | 299x299 | `resNet50V2.weights.h5` (weights only) |
| Custom CNN | 4-block conv-pool stack trained from scratch | 224x224 | `cnn_model.h5` (full model) |

All three use Adamax at lr 0.001. The two transfer-learning models share
the same classifier head (`Flatten -> Dropout -> Dense(128) -> Dropout
-> Dense(4)`) so they are a clean apples-to-apples comparison.

If a weight file is missing, that model's slot is unavailable and the
backend serves it in **stub mode** instead -- deterministic random
predictions plus a placeholder Gaussian heatmap. The full pipeline
(upload, predict, saliency render, Gemini explanation) still works in
stub mode, which is what makes the app demo-able before training.

## Run locally

You'll need: Node 18.18+, Python 3.11, and (for full functionality) a
free Google Gemini API key from <https://aistudio.google.com>.

In one terminal -- backend:

```
cd api
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# edit .env: paste your GEMINI_API_KEY
uvicorn main:app --reload
```

In another terminal -- frontend (uses pnpm):

```
cd web
pnpm install
cp .env.example .env.local       # PowerShell: copy .env.example .env.local
pnpm dev
# open http://localhost:3000
```

Drop any combination of the three weight files into `api/models/` to
enable real predictions for that model.

## Train models

The Kaggle Brain Tumor MRI Dataset (~150MB) lives at
`training/data/Training/<class>/*.jpg` and `training/data/Testing/...`
(gitignored). To retrain locally:

```
cd training
python train_xception.py --output ../api/models/xception_model.weights.h5
python train_cnn.py --output ../api/models/cnn_model.h5
```

The original notebook in `notebooks/` also trains ResNet50V2; recreate
that cell or copy the `_build_resnet` body from `api/inference.py` into
a `train_resnet.py` if you want a standalone script.

Colab gives you a free T4 GPU and is the easiest way to retrain --
see `training/README.md` for the cells.

## Deploy

- **Frontend**: see `web/README.md`. Vercel, root directory `web/`, set
  `API_URL` env var to point at the backend.
- **Backend**: see `api/README.md`. HuggingFace Spaces (Docker SDK), set
  `GEMINI_API_KEY` and `CORS_ORIGINS` secrets. Upload the `.h5` model
  files into the Space's `models/` folder via the Files tab; HF handles
  Git LFS automatically.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS v4, Fraunces + Geist |
| Backend | FastAPI, Pydantic v2, Uvicorn |
| ML | TensorFlow 2 (CPU), Keras, OpenCV, Pillow |
| LLM | Google Gemini (gemini-2.5-flash) |
| Hosting | Vercel (frontend), HuggingFace Spaces (backend) |
