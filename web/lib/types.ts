// Pure types only. Runtime constants (label maps, metadata) live in
// ./constants.ts. The four-class taxonomy is also declared on the
// backend (api/schemas.py: ClassName, api/inference.py: CLASSES). When
// adding or renaming a class, update all three.

export type ModelId = "xception" | "resnet" | "cnn";
export type ClassName = "glioma" | "meningioma" | "notumor" | "pituitary";

export interface ClassMeta {
  label: string;
  code: string;
  blurb: string;
}

export interface ModelInfo {
  id: ModelId;
  name: string;
  input_size: number;
  description: string;
  loaded: boolean;
}

export interface PredictionResult {
  model_id: ModelId;
  predicted_class: ClassName;
  confidence: number;
  probabilities: Record<ClassName, number>;
  saliency_map_png_b64: string;
  elapsed_ms: number;
  stub: boolean;
}

export interface ExplanationResult {
  explanation: string;
  stub: boolean;
}
