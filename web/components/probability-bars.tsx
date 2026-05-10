import { CLASS_META } from "@/lib/constants";
import type { ClassName, PredictionResult } from "@/lib/types";
import { cn } from "@/lib/cn";

interface ProbabilityBarsProps {
  result: PredictionResult;
}

export function ProbabilityBars({ result }: ProbabilityBarsProps) {
  const entries = (Object.entries(result.probabilities) as [ClassName, number][])
    .sort((a, b) => b[1] - a[1]);

  return (
    <div className="plate flex h-full flex-col p-7">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-2">
        Distribution
      </p>
      <ul className="mt-5 space-y-4">
        {entries.map(([label, prob]) => {
          const meta = CLASS_META[label];
          const isTop = label === result.predicted_class;
          return (
            <li key={label}>
              <div className="mb-1.5 flex items-baseline justify-between gap-3">
                <span
                  className={cn(
                    "font-display text-base leading-tight",
                    isTop && "text-copper",
                  )}
                >
                  {meta.label}
                </span>
                <span className="font-mono text-xs tabular-nums text-ink-2">
                  {(prob * 100).toFixed(2)}%
                </span>
              </div>
              <div className="h-px w-full overflow-hidden bg-ink/15">
                <div
                  className={cn(
                    "h-full transition-[width] duration-700 ease-out",
                    isTop ? "bg-copper" : "bg-ink/60",
                  )}
                  style={{ width: `${Math.max(prob * 100, 0.5)}%` }}
                />
              </div>
              <div
                className={cn(
                  "h-2 w-full transition-[transform] duration-700",
                  isTop ? "scale-y-100 origin-top" : "scale-y-100",
                )}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
