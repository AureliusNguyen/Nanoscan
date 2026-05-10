import { CLASS_META, MODEL_LABELS } from "@/lib/constants";
import type { PredictionResult } from "@/lib/types";

interface PredictionCardProps {
  result: PredictionResult;
}

export function PredictionCard({ result }: PredictionCardProps) {
  const meta = CLASS_META[result.predicted_class];
  const pct = (result.confidence * 100).toFixed(1);
  return (
    <div className="plate flex h-full flex-col justify-between p-7">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-2">
          Diagnosis
        </p>
        <p className="mt-3 font-display text-5xl leading-[0.95] tracking-tight">
          {meta.label}
        </p>
        <p className="mt-3 max-w-md text-sm text-ink-2">{meta.blurb}</p>
      </div>
      <div className="mt-8 flex items-end justify-between border-t border-ink/30 pt-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-2">
            Confidence
          </p>
          <p className="mt-1 font-display text-4xl tracking-tight text-copper">
            {pct}
            <span className="text-2xl text-ink-2">%</span>
          </p>
        </div>
        <p className="text-right font-mono text-[11px] tracking-[0.05em] text-ink-2">
          {MODEL_LABELS[result.model_id]}
          <br />
          <span className="opacity-80">
            {result.elapsed_ms} ms
            {result.stub && " - stub mode"}
          </span>
        </p>
      </div>
    </div>
  );
}
