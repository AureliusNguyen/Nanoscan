"use client";

import { useEffect, useState } from "react";

import { DropZone } from "@/components/drop-zone";
import { ExplanationPanel } from "@/components/explanation-panel";
import { HeroPreview } from "@/components/hero-preview";
import { ModelSelector } from "@/components/model-selector";
import { PredictionCard } from "@/components/prediction-card";
import { NotesAccordion, type Note } from "@/components/notes-accordion";
import { ProbabilityBars } from "@/components/probability-bars";
import { Reveal } from "@/components/reveal";
import { SaliencyView } from "@/components/saliency-view";
import { explain, predict } from "@/lib/api-client";
import { cn } from "@/lib/cn";
import { CLASS_META } from "@/lib/constants";
import type {
  ClassName,
  ExplanationResult,
  ModelId,
  PredictionResult,
} from "@/lib/types";

const CLASS_ORDER: ClassName[] = ["glioma", "meningioma", "pituitary", "notumor"];

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [modelId, setModelId] = useState<ModelId>("xception");

  const [predicting, setPredicting] = useState(false);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [predictionError, setPredictionError] = useState<string | null>(null);

  const [explaining, setExplaining] = useState(false);
  const [explanation, setExplanation] = useState<ExplanationResult | null>(null);
  const [explanationError, setExplanationError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const reset = () => {
    setPrediction(null);
    setPredictionError(null);
    setExplanation(null);
    setExplanationError(null);
  };

  const handleFile = (next: File) => {
    setFile(next);
    reset();
  };

  const handleClassify = async () => {
    if (!file) return;
    reset();
    setPredicting(true);
    try {
      const result = await predict(file, modelId);
      setPrediction(result);
      void runExplanation(result);
    } catch (err) {
      setPredictionError((err as Error).message);
    } finally {
      setPredicting(false);
    }
  };

  const runExplanation = async (result: PredictionResult) => {
    setExplaining(true);
    try {
      const exp = await explain(
        result.predicted_class,
        result.confidence,
        result.saliency_map_png_b64,
      );
      setExplanation(exp);
    } catch (err) {
      setExplanationError((err as Error).message);
    } finally {
      setExplaining(false);
    }
  };

  const hasPrediction = prediction !== null;

  return (
    <div className="mx-auto w-full max-w-[1280px] px-8 pt-12">
      {/* HERO */}
      <section className="grid grid-cols-1 gap-12 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-16">
        <div>
          <p className="lift-1 font-mono text-[11px] uppercase tracking-[0.28em] text-ink-2">
            Brain Tumour Atlas
          </p>
          <h1 className="lift-2 mt-6 font-display text-[64px] font-medium leading-[0.95] tracking-tight md:text-[88px]">
            Reading the brain,
            <br />
            <span className="font-display-italic">one specimen</span>
            <br />
            at a time.
          </h1>
          <p className="lift-3 mt-8 max-w-lg text-lg leading-relaxed text-ink-2">
            An interactive atlas. Upload a brain MRI and a deep neural network
            classifies it across four diagnostic categories: glioma,
            meningioma, pituitary, or none. It also shows you{" "}
            <span className="font-display-italic">where</span> in the scan it
            looked.
          </p>
          <div className="lift-4 mt-10 flex flex-wrap gap-3">
            <a href="#console" className="btn-primary">
              Begin a reading
            </a>
            <a href="#method" className="btn-quiet">
              How it works
            </a>
          </div>
        </div>
        <div className="lift-3">
          <HeroPreview previewUrl={previewUrl} prediction={prediction} />
        </div>
      </section>

      {/* CONSOLE -- upload + model + classify */}
      <section id="console" className="scroll-pad mt-32">
        <SectionHeading eyebrow="Console" title="Run a reading." rule />
        <Reveal
          variant="lift"
          delay={120}
          className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-stretch"
        >
          <DropZone
            onFile={handleFile}
            filename={file?.name}
            disabled={predicting}
          />
          <div className="flex flex-col gap-6">
            <ModelSelector
              value={modelId}
              onChange={setModelId}
              disabled={predicting}
            />
            <button
              type="button"
              className="btn-primary w-full justify-center py-3"
              disabled={!file || predicting}
              onClick={handleClassify}
            >
              {predicting ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner />
                  Reading
                  <Dots />
                </span>
              ) : (
                "Classify specimen"
              )}
            </button>
            {predictionError && (
              <p className="text-sm text-rust">{predictionError}</p>
            )}
          </div>
        </Reveal>
      </section>

      {/* RESULTS -- always rendered so the Gemini explanation has a fixed home */}
      <section id="reading" className="scroll-pad mt-32">
        <SectionHeading eyebrow="Reading" title="The verdict." rule />
        {predicting ? (
          <ReadingSkeleton />
        ) : !hasPrediction ? (
          <Reveal variant="lift" delay={120} className="mt-10 plate-tight border-dashed p-12 text-center">
            <p className="font-display-italic text-2xl text-ink-2">
              No reading yet.
            </p>
            <p className="mt-2 mx-auto max-w-md text-sm text-ink-2">
              Choose a specimen above, pick a model, and click{" "}
              <span className="font-display-italic">classify</span>. The
              prediction, attention overlay, and a written interpretation will
              appear here.
            </p>
          </Reveal>
        ) : (
          <div className="mt-10 grid gap-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Reveal variant="lift">
                <PredictionCard result={prediction!} />
              </Reveal>
              <Reveal variant="lift" delay={120}>
                <ProbabilityBars result={prediction!} />
              </Reveal>
            </div>
            {previewUrl && (
              <Reveal variant="develop">
                <SaliencyView
                  originalUrl={previewUrl}
                  saliencyMapPngB64={prediction!.saliency_map_png_b64}
                />
              </Reveal>
            )}
            <Reveal variant="lift" delay={80}>
              <ExplanationPanel
                loading={explaining}
                result={explanation}
                error={explanationError}
                hasPrediction={hasPrediction}
              />
            </Reveal>
          </div>
        )}
      </section>

      {/* ATLAS -- the four classes, equal-height cards with thumbnails */}
      <section id="atlas" className="scroll-pad mt-32">
        <SectionHeading
          eyebrow="Atlas"
          title="Four scenarios."
          rule
        />
        <ul className="mt-10 grid auto-rows-fr grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {CLASS_ORDER.map((id, i) => {
            const meta = CLASS_META[id];
            return (
              <Reveal
                key={id}
                as="li"
                variant="develop"
                delay={i * 120}
                className="plate group flex h-full flex-col overflow-hidden p-0"
              >
                <div className="specimen-frame relative aspect-square w-full overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/samples/${id}.jpg`}
                    alt={`${meta.label} sample`}
                    className="h-full w-full object-cover mix-blend-multiply transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <div className="flex items-baseline justify-between">
                    <h3 className="font-display text-2xl leading-tight">
                      {meta.label}
                    </h3>
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-2">
                      Plate {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-ink-2">
                    {meta.blurb}
                  </p>
                  <div className="mt-auto h-px w-full bg-ink/20" />
                </div>
              </Reveal>
            );
          })}
        </ul>
      </section>

      {/* METHOD -- folded in instead of /about page */}
      <section id="method" className="scroll-pad mt-32">
        <SectionHeading
          eyebrow="Method"
          title="From MRI to analysis."
          rule
        />
        <PipelinePanel />


        {/* Appendix -- expandable notes (replaces the /about page) */}
        <div className="mt-20">
          <div className="mb-5 flex items-baseline justify-between border-b border-ink/40 pb-2">
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-ink-2">
              Appendix
            </p>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2">
              Click to open
            </p>
          </div>
          <Reveal variant="lift">
            <NotesAccordion notes={NOTES} />
          </Reveal>
        </div>
      </section>
    </div>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden
      className="block h-3.5 w-3.5 animate-spin rounded-full border border-current border-t-transparent"
    />
  );
}

function Dots() {
  return (
    <span aria-hidden className="ml-0.5 inline-flex items-baseline gap-0.5">
      <span className="animate-pulse [animation-delay:0ms]">.</span>
      <span className="animate-pulse [animation-delay:200ms]">.</span>
      <span className="animate-pulse [animation-delay:400ms]">.</span>
    </span>
  );
}

function ReadingSkeleton() {
  return (
    <Reveal variant="lift" className="mt-10 grid gap-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <SkelPlate>
          <SkelLabel>Diagnosis</SkelLabel>
          <SkelLine className="mt-3 h-9 w-1/2" />
          <SkelLine className="mt-3 h-3 w-3/4" />
          <div className="mt-8 border-t border-ink/30 pt-4">
            <SkelLabel>Confidence</SkelLabel>
            <SkelLine className="mt-2 h-9 w-24" />
          </div>
        </SkelPlate>
        <SkelPlate>
          <SkelLabel>Distribution</SkelLabel>
          <div className="mt-5 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <SkelLine className="mb-2 h-3 w-1/3" />
                <div className="h-1.5 w-full overflow-hidden bg-ink/10">
                  <div
                    className="h-full animate-pulse bg-ink/30"
                    style={{
                      width: ["62%", "21%", "11%", "6%"][i],
                      animationDelay: `${i * 120}ms`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </SkelPlate>
      </div>
      <SkelPlate>
        <div className="flex items-baseline justify-between">
          <SkelLabel>Reading the plate</SkelLabel>
          <SkelLine className="h-3 w-20" />
        </div>
        <p className="mt-5 inline-flex items-center gap-2 text-base text-ink-2">
          <Spinner /> <span className="font-display-italic">Reading</span>
          <Dots />
        </p>
      </SkelPlate>
    </Reveal>
  );
}

function SkelPlate({ children }: { children: React.ReactNode }) {
  return <div className="plate p-7">{children}</div>;
}

function SkelLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-2">
      {children}
    </p>
  );
}

function SkelLine({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-sm bg-ink/15", className)}
      aria-hidden
    />
  );
}

function SectionHeading({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
  rule?: boolean;
}) {
  return (
    <Reveal as="header" variant="rule" className="space-y-4">
      <div className="flex items-baseline justify-between gap-4 pt-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-ink-2">
          {eyebrow}
        </p>
      </div>
      <Reveal
        as="h2"
        variant="type"
        delay={400}
        className="font-display text-5xl leading-[0.95] tracking-tight md:text-6xl"
      >
        {title}
      </Reveal>
    </Reveal>
  );
}

const PIPELINE_STEPS = [
  {
    n: "01",
    t: "Preprocess",
    d: "Decode the upload, resize to the model's input resolution (299x299 for Xception, 224x224 for the custom CNN), and normalise pixel values to [0, 1].",
  },
  {
    n: "02",
    t: "Infer",
    d: "Forward pass through the chosen model. The network produces a softmax over four classes; we take the argmax as the prediction and keep the full distribution for display.",
  },
  {
    n: "03",
    t: "Interpret",
    d: "TensorFlow's GradientTape gives a per-pixel saliency map of the predicted logit. Gemini reads the overlay back to you in plain English, in four sentences.",
  },
];

function PipelinePanel() {
  return (
    <Reveal
      variant="lift"
      delay={120}
      className="relative mt-10 overflow-hidden rounded bg-paper-3 p-8 md:p-12"
    >
      {/* Anatomical-blueprint background, very faint */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.18 0.018 60 / 0.18) 1px, transparent 1px), linear-gradient(90deg, oklch(0.18 0.018 60 / 0.18) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      {/* Two-tone copper rule across the top */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-copper"
      />
      <div className="relative">
        <div className="flex items-baseline justify-between gap-4 border-b border-ink/30 pb-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-ink-2">
            Pipeline
          </p>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2">
            Three steps, in order
          </p>
        </div>
        <div className="mt-10 grid gap-12 lg:grid-cols-3">
          {PIPELINE_STEPS.map((step, i) => (
            <Reveal as="article" variant="lift" delay={i * 140} key={step.n}>
              <div className="flex items-baseline gap-3">
                <span
                  aria-hidden
                  className="block h-px w-6 bg-copper"
                />
                <p className="font-mono text-[12px] tracking-[0.28em] text-copper">
                  {step.n}
                </p>
              </div>
              <h3 className="mt-4 font-display text-3xl leading-tight">
                {step.t}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-2">
                {step.d}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </Reveal>
  );
}

const NOTES: Note[] = [
  {
    title: "Dataset",
    body: (
      <>
        <p>
          7,023 MRIs from the{" "}
          <a
            href="https://www.kaggle.com/datasets/masoudnickparvar/brain-tumor-mri-dataset"
            className="text-ink underline-offset-4 hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            Kaggle Brain Tumor MRI dataset
          </a>.
        </p>
        <p>
          5,712 train, 655 validation, 656 test. The test set is split 50/50
          from the original Testing folder, stratified by class with a fixed random seed.
        </p>
      </>
    ),
  },
  {
    title: "Models",
    body: (
      <>
        <p>
          <span className="font-display-italic">Xception:</span>{" "}
          ImageNet-pretrained backbone with a small dense classifier on top.
          Trained for 5 epochs at 299x299.
        </p>
        <p>
          <span className="font-display-italic">ResNet50V2:</span>{" "}
          ImageNet-pretrained backbone using the same classifier head as
          Xception, for a side-by-side architecture comparison at 299x299.
        </p>
        <p>
          <span className="font-display-italic">Custom CNN:</span> four
          conv-pool blocks (512, 256, 128, 64 filters) and a 256-unit dense head. Trained for 10 epochs at 224x224.
        </p>
        <p>All three use the Adamax optimiser at learning rate 0.001.</p>
      </>
    ),
  },
  {
    title: "Saliency",
    body: (
      <>
        <p>
          Per-pixel absolute gradient of the predicted logit, reduced over
          channels, masked to a circular brain region, thresholded at the 80th
          percentile, smoothed with a Gaussian blur, then composited as a JET
          overlay on top of the original scan.
        </p>
        <p>
          Read it as <span className="font-display-italic">where</span> the
          model attended, not <span className="font-display-italic">why</span>.
        </p>
      </>
    ),
  },
  {
    title: "Limitations",
    body: (
      <>
        <p>
          Test-set accuracy is high (&gt;99% on all three models). During
          interpretability checks the saliency overlay sometimes attends to
          cortical surface features even when predicting tumours that
          anatomically live elsewhere. For example, pituitary lesions live
          at the sella turcica, not the cortex. Two likely causes: vanilla
          gradient saliency is noisy and biased toward high-frequency edges,
          and per-class folders in the dataset may carry distinct
          preprocessing artefacts that the network has learned as shortcuts
          (a Clever Hans signal).
        </p>
        <p>
          Useful next steps would be Grad-CAM or Integrated Gradients for
          better localisation, plus per-folder preprocessing audits to rule
          out the shortcut hypothesis. The takeaway for now: the classifier
          is accurate, but the attention maps should not be read as a
          radiologist's reasoning.
        </p>
      </>
    ),
  },
  {
    title: "Stack",
    body: (
      <>
        <p>
          Frontend in Next.js 15 (App Router, React 19) on Vercel. Python
          backend (FastAPI + TensorFlow) in a Docker container on HuggingFace
          Spaces. Explanations from Google Gemini 2.5 Flash.
        </p>
      </>
    ),
  },
];
