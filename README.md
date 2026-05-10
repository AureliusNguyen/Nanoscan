# NeuroScan -- Brain Tumor MRI Atlas

A full-stack web app that classifies brain MRI scans into four categories
(glioma, meningioma, pituitary, no-tumor), shows which regions of the
image the model focused on, and uses Gemini to explain the result in
plain English.

> Status: in development. Frontend live URL: TBD. Backend live URL:
> https://madarame1337-brain-tumor.hf.space

**Disclaimer:** Research / portfolio project. Not a medical device. Not
for diagnosis.

## Architecture

```
+---------------------+         +----------------------------+
|  Next.js 15 (web/)  |  HTTPS  |  FastAPI (api/) on HF      |
|  React 19, Tailwind |  ---->  |  Spaces (Docker, CPU)      |
|  hosted on Vercel   |         |  - TF/Keras inference      |
|                     |         |  - Saliency map (cv2 + tf) |
|  /api/predict       |         |  - Gemini explanation call |
|  /api/explain       |         +----------------------------+
|     proxies                              ^
+---------------------+                    |
                                           |
                            two trained models in api/models/
                            xception.weights.h5    cnn_model.h5
                            (trained via training/)
```

## Repo layout

| Path | What it is |
|------|------------|
| `web/` | Next.js 15 frontend (App Router, TypeScript, Tailwind v4) |
| `api/` | FastAPI backend with TensorFlow inference + Gemini integration |
| `training/` | Standalone training scripts. The dataset (~150 MB) lands at `training/data/Training` and `training/data/Testing` and is gitignored. Bootstrap it via `python download_dataset.py --out ./data` (needs a Kaggle API token). |
| `notebooks/` | Original training notebook, kept for reference |

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

Without trained model files in `api/models/`, the backend runs in **stub
mode** -- you still get a working UI with placeholder predictions, useful
while the real models are training. To enable real predictions, drop
`xception.weights.h5` and `cnn_model.h5` into `api/models/` (see
`training/README.md` for how to produce them).

## Train models

The Kaggle Brain Tumor MRI Dataset (~150MB) lives at
`training/data/Training/<class>/*.jpg` and `training/data/Testing/...`
(gitignored). To retrain locally:

```
cd training
python train_xception.py --output ../api/models/xception.weights.h5
python train_cnn.py --output ../api/models/cnn_model.h5
```

Or use Colab for free GPU -- see `training/README.md`.

## Deploy

- **Frontend**: see `web/README.md`. Vercel, root directory `web/`, set
  `API_URL` env var to point at the backend.
- **Backend**: see `api/README.md`. HuggingFace Spaces (Docker SDK), set
  `GEMINI_API_KEY` and `CORS_ORIGINS` secrets. Upload the two `.h5` model
  files into `models/`.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS v4, Fraunces + Geist |
| Backend | FastAPI, Pydantic v2, Uvicorn |
| ML | TensorFlow 2 (CPU), Keras, OpenCV, Pillow |
| LLM | Google Gemini (gemini-1.5-flash) |
| Hosting | Vercel (frontend), HuggingFace Spaces (backend) |
