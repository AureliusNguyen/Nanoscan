"""Pydantic models for API request and response payloads."""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

ModelId = Literal["xception", "cnn"]
ClassName = Literal["glioma", "meningioma", "notumor", "pituitary"]


class ModelInfo(BaseModel):
    id: ModelId
    name: str
    input_size: int
    description: str
    loaded: bool


class HealthResponse(BaseModel):
    status: Literal["ok"]
    models_loaded: list[ModelId]
    gemini_configured: bool


class PredictionResponse(BaseModel):
    model_id: ModelId
    predicted_class: ClassName
    confidence: float = Field(ge=0.0, le=1.0)
    probabilities: dict[ClassName, float]
    saliency_map_png_b64: str
    elapsed_ms: int
    stub: bool = False


class ExplainRequest(BaseModel):
    predicted_class: ClassName
    confidence: float = Field(ge=0.0, le=1.0)
    saliency_map_png_b64: str


class ExplainResponse(BaseModel):
    explanation: str
    stub: bool = False
