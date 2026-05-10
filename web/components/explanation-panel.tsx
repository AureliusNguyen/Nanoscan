import type { ExplanationResult } from "@/lib/types";

interface ExplanationPanelProps {
  loading: boolean;
  result: ExplanationResult | null;
  error: string | null;
  hasPrediction: boolean;
}

export function ExplanationPanel({
  loading,
  result,
  error,
  hasPrediction,
}: ExplanationPanelProps) {
  return (
    <aside className="plate p-7">
      <div className="flex items-baseline justify-between">
        <p className="font-display text-2xl leading-tight">
          Reading the plate.
        </p>
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-2">
          Gemini 1.5
        </p>
      </div>
      <div className="mt-5 min-h-[120px] text-base leading-relaxed">
        {!hasPrediction && (
          <p className="font-display-italic text-ink-2">
            Awaiting a classification. Run inference to see a written
            interpretation here.
          </p>
        )}
        {hasPrediction && loading && (
          <p className="text-ink-2">
            <span className="font-display-italic">Reading.</span>
            <Dots />
          </p>
        )}
        {hasPrediction && !loading && error && (
          <p className="text-rust">{error}</p>
        )}
        {hasPrediction && !loading && result && (
          <>
            <p>{result.explanation}</p>
            {result.stub && (
              <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2">
                Stub mode &middot; backend missing GEMINI_API_KEY
              </p>
            )}
          </>
        )}
      </div>
    </aside>
  );
}

function Dots() {
  return (
    <span className="ml-1 inline-flex gap-0.5 align-baseline">
      <span className="animate-pulse [animation-delay:0ms]">.</span>
      <span className="animate-pulse [animation-delay:200ms]">.</span>
      <span className="animate-pulse [animation-delay:400ms]">.</span>
    </span>
  );
}
