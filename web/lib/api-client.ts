import type {
  ClassName,
  ExplanationResult,
  ModelId,
  PredictionResult,
} from "./types";

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      if (body?.detail) message = body.detail;
    } catch {
      /* ignore */
    }
    throw new Error(message || `request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

export async function predict(
  file: File,
  modelId: ModelId,
): Promise<PredictionResult> {
  const form = new FormData();
  form.append("image", file);
  form.append("model_id", modelId);
  const res = await fetch("/api/predict", { method: "POST", body: form });
  return handle<PredictionResult>(res);
}

export async function explain(
  predictedClass: ClassName,
  confidence: number,
  saliencyMapPngB64: string,
): Promise<ExplanationResult> {
  const res = await fetch("/api/explain", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      predicted_class: predictedClass,
      confidence,
      saliency_map_png_b64: saliencyMapPngB64,
    }),
  });
  return handle<ExplanationResult>(res);
}
