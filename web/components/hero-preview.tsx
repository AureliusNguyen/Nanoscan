/* eslint-disable @next/next/no-img-element */
"use client";

import { useRef, useState } from "react";
import { CLASS_META } from "@/lib/constants";
import type { PredictionResult } from "@/lib/types";

interface HeroPreviewProps {
  previewUrl: string | null;
  prediction: PredictionResult | null;
}

interface Coord {
  x: number; // 0..1 normalised within the frame
  y: number;
}

/**
 * The hero specimen frame. Three states:
 *  - empty:        editorial atlas plate (web/public/hero.png)
 *  - file loaded:  uploaded MRI inside the museum frame
 *  - predicted:    uploaded MRI + class + confidence in the caption strip
 *
 * Hover interaction: a copper crosshair tracks the cursor across the
 * specimen, a focal dot marks the intersection, and a mono readout in
 * the bottom-right shows normalised (x, y). Cursor switches to crosshair.
 * Inspired by radiology viewer chrome.
 */
export function HeroPreview({ previewUrl, prediction }: HeroPreviewProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  // We keep the LAST coord even after the cursor leaves so the crosshair
  // can fade out in place instead of snapping back to center mid-fade.
  const [coord, setCoord] = useState<Coord | null>(null);
  const [visible, setVisible] = useState(false);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setCoord({
      x: Math.min(1, Math.max(0, x)),
      y: Math.min(1, Math.max(0, y)),
    });
    if (!visible) setVisible(true);
  };

  const onLeave = () => setVisible(false);

  return (
    <div className="group relative">
      <div
        ref={frameRef}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        className="specimen-frame scanlight relative aspect-square w-full overflow-hidden cursor-crosshair"
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={prediction ? `Predicted ${prediction.predicted_class}` : "Uploaded MRI"}
            className="h-full w-full object-cover mix-blend-multiply"
          />
        ) : (
          <img
            src="/hero.png"
            alt="Editorial atlas plate -- axial section of a cerebral tumor"
            className="h-full w-full object-cover"
          />
        )}

        {/* Discreet status pill, only when there's an actual scan loaded */}
        {previewUrl && (
          <div className="absolute left-3 top-3 rounded-sm border border-ink/60 bg-paper/85 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ink backdrop-blur">
            <span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-copper align-middle" />
            Specimen loaded
          </div>
        )}

        {/* HOVER LOUPE */}
        <Loupe coord={coord} visible={visible} />
      </div>

      {/* Museum label below the plate */}
      <div className="mt-3 flex items-baseline justify-between gap-4 border-t border-ink/30 pt-3 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2">
        <span>
          Plate{" "}
          <span className="text-ink">
            {prediction
              ? CLASS_META[prediction.predicted_class].label
              : previewUrl
                ? "in queue"
                : "XXVII -- tumor cerebri"}
          </span>
        </span>
        <span>
          {prediction ? (
            <>
              conf{" "}
              <span className="text-copper">
                {(prediction.confidence * 100).toFixed(2)}%
              </span>
            </>
          ) : previewUrl ? (
            "awaiting analysis"
          ) : (
            "axial section"
          )}
        </span>
      </div>

      {/* Hover-only descriptor for the empty state. Sits below, never covers. */}
      {!previewUrl && (
        <span className="hover-label">
          From the editorial atlas, plate XXVII. Click upload to load your own.
        </span>
      )}
    </div>
  );
}

function Loupe({ coord, visible }: { coord: Coord | null; visible: boolean }) {
  // Use the last known coord even when visible=false so the crosshair
  // fades out in place. Fall back to 50% only if the user has never
  // hovered yet (initial mount).
  const x = coord ? `${coord.x * 100}%` : "50%";
  const y = coord ? `${coord.y * 100}%` : "50%";

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 220ms ease" }}
    >
      {/* Subtle warm wash on hover -- ties the inspection moment together */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at " +
            x +
            " " +
            y +
            ", oklch(0.55 0.16 45 / 0.10) 0%, oklch(0.55 0.16 45 / 0.04) 30%, transparent 60%)",
          mixBlendMode: "multiply",
        }}
      />

      {/* Vertical hairline (instant snap to cursor, no easing) */}
      <div
        className="absolute top-0 bottom-0"
        style={{
          left: x,
          width: "1px",
          background: "oklch(0.55 0.16 45 / 0.7)",
        }}
      />
      {/* Horizontal hairline */}
      <div
        className="absolute left-0 right-0"
        style={{
          top: y,
          height: "1px",
          background: "oklch(0.55 0.16 45 / 0.7)",
        }}
      />

      {/* Focal dot at the intersection */}
      <div
        className="absolute h-2 w-2 rounded-full"
        style={{
          left: x,
          top: y,
          transform: "translate(-50%, -50%)",
          background: "oklch(0.55 0.16 45)",
          boxShadow: "0 0 0 3px oklch(0.96 0.01 80 / 0.7)",
        }}
      />

      {/* Coordinate readout, bottom-right */}
      <div
        className="absolute bottom-3 right-3 rounded-sm border border-ink/40 bg-paper/85 px-2 py-1 font-mono text-[10px] tracking-[0.05em] text-ink backdrop-blur"
      >
        <span className="text-ink-2">x</span>{" "}
        {coord ? coord.x.toFixed(3) : "0.000"}
        {"   "}
        <span className="text-ink-2">y</span>{" "}
        {coord ? coord.y.toFixed(3) : "0.000"}
      </div>
    </div>
  );
}
