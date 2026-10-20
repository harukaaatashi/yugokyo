import { useEffect, useRef } from "react";
import { komaImageUrl } from "../../lib/corpus";
import { useUi } from "../../lib/i18n";
import type { Term, TermCrop } from "../../lib/terms";

/** 原本画像の実寸（全38枚で共通） */
const FULL_W = 1600;
/** 切り抜きを出す幅（px）。w-20 と揃える */
const CROP_W = 80;

/**
 * 訳文に残した江戸の語。明朝＋ルビ＋朱の点線で、ほかの地の文と見分けられるようにする。
 * 書体を変えるのは語の部分だけなので、段落の読みやすさは変わらない。
 */
export function TermWord({ term, onOpen }: { term: Term; onOpen: (term: Term) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(term)}
      className="term rounded-sm font-genbun text-ink underline decoration-shu decoration-dotted decoration-1 underline-offset-4 hover:bg-paper-warm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yu-blue"
    >
      <ruby>
        {term.word}
        <rt>{term.yomi}</rt>
      </ruby>
    </button>
  );
}

/** 原本でその語が書かれている部分。原寸画像を CSS で切り抜く */
function TermCropImage({ term, crop }: { term: Term; crop: TermCrop }) {
  const ui = useUi();
  const { koma, x, y, w, h } = crop;
  const scale = CROP_W / w;
  return (
    <div
      className="relative w-20 overflow-hidden rounded-lg border border-line bg-paper-warm"
      style={{ height: Math.round(h * scale) }}
    >
      <img
        src={komaImageUrl(koma, "full")}
        alt={ui.termCropAlt(term.word)}
        className="absolute max-w-none"
        style={{ width: FULL_W * scale, left: -x * scale, top: -y * scale }}
      />
    </div>
  );
}

/** 語をタップしたときに出る札。意味と、原本でのその字と、原文での言い回し */
export function TermSheet({ term, onClose }: { term: Term; onClose: () => void }) {
  const ui = useUi();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      opener?.focus();
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-labelledby="term-sheet-word"
      className="fixed inset-x-3 bottom-24 z-40 mx-auto flex max-w-md gap-4 rounded-2xl border border-line bg-white p-4"
    >
      {term.crop && (
        <figure className="flex shrink-0 flex-col items-center gap-1.5">
          <TermCropImage term={term} crop={term.crop} />
          <figcaption className="text-caption text-ink-soft">{ui.termFrom(term.crop.koma)}</figcaption>
        </figure>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p id="term-sheet-word" lang="ja" className="pt-1 font-genbun text-2xl leading-snug text-ink">
            {term.word}
            <span className="block font-body text-caption text-ink-soft">{term.yomi}</span>
          </p>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 items-center rounded-full px-2 font-maru text-sm font-bold text-yu-blue hover:text-yu-blue-deep transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yu-blue"
          >
            {ui.close}
          </button>
        </div>
        <p lang="ja" className="mt-1 text-caption text-ink">{term.mean}</p>
        <p lang="ja" className="mt-2 border-t border-line pt-2 font-genbun text-caption text-ink-muted">
          {term.source}
        </p>
      </div>
    </div>
  );
}
