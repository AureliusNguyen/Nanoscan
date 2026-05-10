# Brain Tumor Classifier - Backend API

FastAPI service that loads two TensorFlow models, runs predictions on
uploaded MRI images, generates saliency maps, and produces natural-
language explanations via Gemini.

## Endpoints

| Method | Path       | Body                                         | Returns |
|--------|------------|----------------------------------------------|---------|
| GET    | `/health`  | -                                            | health + which models are loaded |
| GET    | `/models`  | -                                            | list of available models |
| POST   | `/predict` | multipart: `image` (file), `model_id` (str)  | predicted class, probabilities, saliency map |
| POST   | `/explain` | json: `{predicted_class, confidence, saliency_map_png_b64}` | text explanation |

## Stub mode

If neither model file is present in `./models/`, the API still responds.
`/predict` returns deterministic random probabilities and a placeholder
heatmap. Useful while you wait for training to finish or for frontend
development. Look at the `stub: true` field in responses to know.

## Local development

```
cd api
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                # then edit .env to add your Gemini key
uvicorn main:app --reload
# -> http://localhost:8000
# OpenAPI docs at http://localhost:8000/docs
```

Drop trained weight files in `./models/`:

- `xception.weights.h5` (from `training/train_xception.py`)
- `cnn_model.h5` (from `training/train_cnn.py`)

## Deploy to HuggingFace Spaces

1. Create a new Space at https://huggingface.co/new-space.
   - Name: `brain-tumor-classifier-api` (or similar)
   - SDK: **Docker**
   - Hardware: CPU basic (free)
2. Add this directory to the Space repo. The simplest way:
   ```
   git remote add hf https://huggingface.co/spaces/<your-user>/brain-tumor-classifier-api
   git subtree push --prefix api hf main
   ```
3. In the Space's Settings -> Variables and secrets, add:
   - `GEMINI_API_KEY` (secret)
   - `CORS_ORIGINS` (variable) -- include your Vercel URL,
     e.g. `https://brain-tumor.vercel.app,http://localhost:3000`
4. Models: upload the two `.h5` files via the Space's "Files" tab into
   `models/`. They are large enough that you should use Git LFS or the
   web UI's drag-and-drop. Alternatively, host them in a separate
   HuggingFace Model repo and have `inference.py` fetch them on cold
   start (TODO).
5. The first build takes ~5-10 minutes. After it's up, hit
   `https://<your-user>-brain-tumor-classifier-api.hf.space/health`
   to verify.
