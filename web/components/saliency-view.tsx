/* eslint-disable @next/next/no-img-element */
interface SaliencyViewProps {
  originalUrl: string;
  saliencyMapPngB64: string;
}

export function SaliencyView({ originalUrl, saliencyMapPngB64 }: SaliencyViewProps) {
  const saliency = `data:image/png;base64,${saliencyMapPngB64}`;
  return (
    <div className="plate p-7">
      <div className="flex items-baseline justify-between">
        <p className="font-display text-2xl leading-tight">
          Two views of one specimen.
        </p>
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-2">
          Plate I
        </p>
      </div>
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <Plate caption="Original MRI">
          <img
            src={originalUrl}
            alt="Original MRI"
            className="aspect-square w-full object-cover mix-blend-multiply"
          />
        </Plate>
        <Plate caption="Attention overlay" annotated>
          <img
            src={saliency}
            alt="Saliency map"
            className="aspect-square w-full object-cover"
          />
        </Plate>
      </div>
      <p className="mt-5 text-sm text-ink-2">
        The right plate marks pixels with the strongest gradient with respect
        to the predicted class: the regions that swayed the prediction most.
        Read it as <span className="font-display-italic">where</span>, not{" "}
        <span className="font-display-italic">why</span>.
      </p>
    </div>
  );
}

function Plate({
  children,
  caption,
  annotated,
}: {
  children: React.ReactNode;
  caption: string;
  annotated?: boolean;
}) {
  return (
    <figure>
      <div className={`specimen-frame relative overflow-hidden ${annotated ? "scanlight" : ""}`}>
        {children}
      </div>
      <figcaption className="mt-2 flex items-baseline justify-between font-mono text-[10px] uppercase tracking-[0.22em] text-ink-2">
        <span>{caption}</span>
        {annotated && <span className="text-copper">annotated</span>}
      </figcaption>
    </figure>
  );
}
