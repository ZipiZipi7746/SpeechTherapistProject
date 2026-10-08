import clsx from "clsx";
import type { ImageKind, Word } from "@/lib/types";

/** Shows the word's image of the requested kind (falls back to any image, then the emoji placeholder). */
export function WordVisual({ word, kind, className, emojiClass = "text-6xl" }: { word: Word; kind?: ImageKind; className?: string; emojiClass?: string }) {
  const img = (kind && word.images.find((i) => i.kind === kind)) || word.images.find((i) => i.url) || word.images[0];
  const bw = (kind ?? img?.kind) === "bw";
  return (
    <div className={clsx("flex items-center justify-center overflow-hidden", className)}>
      {img?.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={img.url} alt={word.plain_text} loading="lazy" className={clsx("size-full object-contain", bw && "grayscale")} />
      ) : (
        <span aria-hidden className={clsx(emojiClass, "select-none leading-none", bw && "grayscale")}>{word.emoji ?? "🖼️"}</span>
      )}
    </div>
  );
}
