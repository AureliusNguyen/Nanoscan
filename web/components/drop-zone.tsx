"use client";

import { useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { cn } from "@/lib/cn";

const MAX_BYTES = 10 * 1024 * 1024; // matches the backend cap

interface DropZoneProps {
  onFile: (file: File) => void;
  filename?: string;
  disabled?: boolean;
}

export function DropZone({ onFile, filename, disabled }: DropZoneProps) {
  const [rejection, setRejection] = useState<string | null>(null);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: (accepted) => {
      if (!accepted[0]) return;
      setRejection(null);
      onFile(accepted[0]);
    },
    onDropRejected: (rejections: FileRejection[]) => {
      const r = rejections[0];
      if (!r) return;
      const code = r.errors[0]?.code;
      if (code === "file-too-large") {
        setRejection(`File is too large (max 10 MB).`);
      } else if (code === "file-invalid-type") {
        setRejection("Only JPG, PNG, or WebP images are accepted.");
      } else if (code === "too-many-files") {
        setRejection("Drop one image at a time.");
      } else {
        setRejection(r.errors[0]?.message || "File rejected.");
      }
    },
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    maxFiles: 1,
    maxSize: MAX_BYTES,
    disabled,
    noClick: true,
    noKeyboard: true,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "plate group relative flex h-full min-h-[420px] cursor-pointer flex-col justify-between gap-8 overflow-hidden p-8 transition-colors",
        "hover:border-ink",
        isDragActive && "border-copper bg-paper-3",
        disabled && "cursor-not-allowed opacity-55",
      )}
      onClick={() => !disabled && open()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (!disabled && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          open();
        }
      }}
    >
      <input {...getInputProps()} />

      {/* dashed inner frame to read as a drop target */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-4 border border-dashed transition-colors",
          isDragActive ? "border-copper" : "border-ink/25",
        )}
      />

      <div className="relative">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-ink-2">
          Specimen
        </p>
        <p className="mt-3 font-display text-4xl leading-[0.95] tracking-tight md:text-5xl">
          {filename ? (
            <span className="font-display-italic break-all">{filename}</span>
          ) : (
            <>Bring a scan.</>
          )}
        </p>
      </div>

      {/* center call to action */}
      <div className="relative flex flex-1 flex-col items-center justify-center text-center">
        <DropGlyph active={isDragActive} hasFile={!!filename} />
        <p className="mt-5 font-display text-xl text-ink">
          {isDragActive
            ? "Release to load"
            : filename
              ? "Drop another image to replace"
              : "Drag & drop an MRI here"}
        </p>
        <p className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2">
          or
        </p>
        <button
          type="button"
          className="btn-quiet mt-2"
          onClick={(e) => {
            e.stopPropagation();
            if (!disabled) open();
          }}
          disabled={disabled}
        >
          Browse files
        </button>
      </div>

      <div className="relative w-full border-t border-ink/30 pt-4 text-center">
        <p
          className={cn(
            "font-mono text-[11px] tracking-[0.05em]",
            rejection ? "text-rust" : "text-ink-2",
          )}
        >
          {rejection || "JPG, PNG, WebP. Max 10 MB."}
        </p>
      </div>
    </div>
  );
}

function DropGlyph({ active, hasFile }: { active: boolean; hasFile: boolean }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn(
        "h-14 w-14 transition-transform",
        active && "scale-110",
      )}
      aria-hidden
    >
      {/* tray */}
      <path
        d="M 8 40 L 8 52 L 56 52 L 56 40"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        opacity="0.6"
      />
      {/* arrow into tray */}
      <g
        fill="none"
        stroke={active ? "var(--color-copper)" : "currentColor"}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="32" y1="10" x2="32" y2="40" />
        <polyline points="22,30 32,40 42,30" />
      </g>
      {hasFile && (
        <circle
          cx="48"
          cy="14"
          r="4"
          fill="var(--color-copper)"
          stroke="none"
        />
      )}
    </svg>
  );
}
