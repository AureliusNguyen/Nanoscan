# Brain Tumor Classifier API - Docker image for HuggingFace Spaces.
# HF Spaces (Docker SDK) listens on port 7860 by default, so we expose it here.
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# OpenCV needs libgl, libglib for video/image ops; tensorflow needs build-essential
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 libglib2.0-0 build-essential \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

# HF Spaces requires writable /app for model downloads
RUN mkdir -p /app/models && chmod -R 777 /app/models

EXPOSE 7860

# HF Spaces sets PORT=7860; default to 7860 if unset.
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-7860}"]
