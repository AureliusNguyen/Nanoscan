"use client";

import type { ModelId } from "@/lib/types";
import { cn } from "@/lib/cn";

interface ModelSelectorProps {
  value: ModelId;
  onChange: (id: ModelId) => void;
  disabled?: boolean;
}

const OPTIONS: { id: ModelId; label: string; sub: string }[] = [
  {
    id: "xception",
    label: "Xception",
    sub: "Transfer learning, ImageNet",
  },
  {
    id: "resnet",
    label: "ResNet50V2",
    sub: "Transfer learning, ImageNet",
  },
  {
    id: "cnn",
    label: "Custom CNN",
    sub: "Trained from scratch",
  },
];

export function ModelSelector({ value, onChange, disabled }: ModelSelectorProps) {
  return (
    <div className="plate divide-y divide-ink/15">
      {OPTIONS.map((opt) => {
        const active = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            disabled={disabled}
            className={cn(
              "group flex w-full cursor-pointer items-baseline justify-between gap-6 px-5 py-4 text-left transition-colors",
              "hover:bg-paper-3",
              active && "bg-paper-3",
              disabled && "cursor-not-allowed opacity-55",
            )}
          >
            <div>
              <p className="font-display text-lg leading-tight">{opt.label}</p>
              <p className="mt-0.5 text-sm text-ink-2">{opt.sub}</p>
            </div>
            <span
              aria-hidden
              className={cn(
                "h-3 w-3 shrink-0 rounded-full border border-ink transition-colors",
                active ? "bg-copper border-copper" : "bg-transparent",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
