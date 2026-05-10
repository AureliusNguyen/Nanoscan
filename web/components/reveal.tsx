"use client";

import { type ElementType, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

type Variant = "lift" | "rule" | "develop" | "type";

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  variant?: Variant;
  as?: ElementType;
  /** When false, element re-hides as it leaves the viewport. Default false (bidirectional). */
  once?: boolean;
  threshold?: number;
}

/**
 * Scroll-triggered reveal that respects prefers-reduced-motion.
 * Variants:
 *  - lift:    fade + soft 16px lift up
 *  - rule:    hairline above content draws left-to-right, then content lifts
 *  - develop: image plates "develop" like photo chemicals (blur + brightness)
 *  - type:    Fraunces variable-font weight + SOFT axis animate in
 */
export function Reveal({
  children,
  className,
  delay = 0,
  variant = "lift",
  as,
  once = false,
  threshold = 0.18,
}: RevealProps) {
  const Tag = (as ?? "div") as ElementType;
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce) {
      setShown(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            if (once) obs.disconnect();
          } else if (!once) {
            // Hide again only when fully out of view, not on edge crossings
            if (entry.intersectionRatio === 0) setShown(false);
          }
        }
      },
      { threshold: [0, threshold] },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [once, threshold]);

  return (
    <Tag
      ref={ref as unknown as React.Ref<HTMLDivElement>}
      data-reveal={shown ? "in" : "out"}
      data-variant={variant}
      style={{ transitionDelay: shown ? `${delay}ms` : "0ms" }}
      className={cn("reveal", className)}
    >
      {children}
    </Tag>
  );
}
