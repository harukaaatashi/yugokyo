import { useEffect, useRef } from "react";
import { useUi } from "../../lib/i18n";
import { glyphUrl, inlineGlyphUrls, type Term } from "../../lib/terms";

/**
 * 訳文に残した江戸の語。上に朱のルビを添えて、ほかの地の文と見分けられるようにする。
 *
 * 原本の字を切り抜いてある語は、本文の中に原本の筆の字をはめ、ルビにいまの字を出す。
 * 筆の字はそれだけで地の文と違って見えるので、下線を引かなくても押せるものだと分かる
 * （点線の下線だけでは押せるか分からない、という声があった。DESIGN §9）。
 * 切り抜きのない語は明朝で書き、ルビに読みを出す。朱のルビはどちらにも付けて手がかりを揃える。
 *
 * 筆の字の画像は飾り（alt なし）。ボタンの名前といまの字のルビで、読み上げ・コピーとも訳語になる。
 */
export function TermWord({ term, onOpen }: { term: Term; onOpen: (term: Term) => void }) {
  const ui = useUi();
  const glyphs = inlineGlyphUrls(term);
  return (
    <button
      type="button"
      onClick={() => onOpen(term)}
      aria-label={glyphs ? ui.termGlyphAria(term.word) : undefined}
      className="term mx-px rounded px-px font-genbun text-ink hover:bg-paper-warm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yu-blue"
    >
      {glyphs ? (
        <ruby>
          <span className="term-glyph">
            {glyphs.map((src) => (
              <img key={src} src={src} alt="" decoding="async" />
            ))}
          </span>
          <rt>{term.word}</rt>
        </ruby>
      ) : (
        <ruby>
          {term.word}
          <rt>{term.yomi}</rt>
        </ruby>
      )}
    </button>
  );
}

/** 語をタップしたときに出る札。左に原本の字を大きく、右に意味と原文での言い回し */
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
      className="sheet-up fixed inset-x-3 bottom-24 z-40 mx-auto flex max-w-md gap-4 rounded-2xl border border-line bg-white p-3.5"
    >
      {term.crop && (
        <figure className="flex w-[5.75rem] shrink-0 flex-col items-center justify-center gap-2 rounded-xl bg-paper-warm px-2 pb-2.5 pt-3.5">
          <img
            src={glyphUrl(term.crop)}
            alt={ui.termCropAlt(term.word)}
            className="block h-auto max-h-36 w-auto max-w-full"
          />
          <figcaption className="font-genbun text-[0.6875rem] tracking-widest text-ink-muted">
            {ui.termFrom(term.crop.koma)}
          </figcaption>
        </figure>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <p id="term-sheet-word" lang="ja" className="pt-0.5 font-genbun text-2xl leading-tight text-ink">
            {term.word}
            <span className="mt-1 block font-body text-caption tracking-wider text-ink-soft">{term.yomi}</span>
          </p>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={ui.close}
            className="-mr-2 -mt-2 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl text-ink-soft hover:bg-paper-warm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yu-blue"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <p lang="ja" className="mt-2 text-sm leading-relaxed text-ink">{term.mean}</p>
        <div className="mt-auto pt-3">
          <p lang="ja" className="border-t border-line pt-2.5 font-genbun text-caption text-ink-muted">
            {term.source}
          </p>
        </div>
      </div>
    </div>
  );
}
