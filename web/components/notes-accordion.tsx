"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/cn";

export interface Note {
  title: string;
  body: React.ReactNode;
}

interface NotesAccordionProps {
  notes: Note[];
}

/**
 * Editorial accordion for the Method appendix.
 * Each row: title + copper toggle indicator. Click to expand inline with
 * a smooth height transition. Multiple may be open simultaneously.
 */
export function NotesAccordion({ notes }: NotesAccordionProps) {
  const [open, setOpen] = useState<Set<number>>(new Set([0]));

  const toggle = (i: number) => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  return (
    <ul className="border-t border-ink/40">
      {notes.map((note, i) => (
        <Row
          key={note.title}
          note={note}
          open={open.has(i)}
          onToggle={() => toggle(i)}
        />
      ))}
    </ul>
  );
}

function Row({
  note,
  open,
  onToggle,
}: {
  note: Note;
  open: boolean;
  onToggle: () => void;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState<number>(0);

  useEffect(() => {
    if (!bodyRef.current) return;
    setMaxHeight(open ? bodyRef.current.scrollHeight : 0);
  }, [open, note]);

  // Recompute height on resize so wrapping changes don't get clipped.
  useEffect(() => {
    if (!bodyRef.current || !open) return;
    const ro = new ResizeObserver(() => {
      if (bodyRef.current && open) setMaxHeight(bodyRef.current.scrollHeight);
    });
    ro.observe(bodyRef.current);
    return () => ro.disconnect();
  }, [open]);

  return (
    <li className="border-b border-ink/40">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={cn(
          "group flex w-full cursor-pointer items-baseline justify-between gap-6 py-5 text-left transition-colors",
          "hover:text-copper",
        )}
      >
        <span className="font-display text-2xl leading-tight md:text-3xl">
          {note.title}
        </span>
        <span
          aria-hidden
          className="font-mono text-base leading-none text-copper transition-transform"
          style={{ transform: open ? "rotate(45deg)" : "rotate(0deg)" }}
        >
          +
        </span>
      </button>
      <div
        ref={bodyRef as React.RefObject<HTMLDivElement>}
        style={{ maxHeight }}
        className={cn(
          "overflow-hidden transition-[max-height,opacity] duration-500",
          "ease-[cubic-bezier(0.22,1,0.36,1)]",
          open ? "opacity-100" : "opacity-0",
        )}
        aria-hidden={!open}
      >
        <div className="grid gap-3 pb-7 pr-2 text-base leading-relaxed text-ink-2">
          {note.body}
        </div>
      </div>
    </li>
  );
}
