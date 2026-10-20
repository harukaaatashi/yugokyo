import { useEffect, useRef } from "react";
import { komaImageUrl } from "../../lib/corpus";
import { useUi } from "../../lib/i18n";
import { bookBoxStyle, HALF_BOOK_RECT, type Rect } from "../../lib/pages";
import BookCrop from "./BookCrop";

/**
 * 下の帯。いま読んでいる丁の見開きを小さく出し、読んでいる段落の位置に朱の枠を重ねる。
 *
 * 本文の途中に原本のカードを挟むと、読んでいる流れが止まる（DESIGN §9）。
 * 押さなくても原本が目に入るよう画面の下に添えるが、出しっぱなしだと読む場所が狭く見づらい。
 * スクロールしているあいだは引っ込め、手を止めて少し経ったら下からすっと出す。読み進めると朱の枠が原本の上を移る。
 * タップで見開きを大きく開く（GenponView）。
 */
export function GenponStrip({
  koma,
  regions,
  shown,
  onOpen,
}: {
  koma: number;
  /** 出すか（引っ込めているあいだは高さ0。押せず、読み上げにも出ない） */
  shown: boolean;
  /** いま読んでいる段落が原本のどこにあるか。測っていない段落では渡さない */
  regions?: readonly Rect[];
  onOpen: () => void;
}) {
  const ui = useUi();
  const halfBook = HALF_BOOK_RECT[koma];
  return (
    // 高さを 0fr ⇄ 1fr で開閉する。ナビの上に積んであるので、引っ込むとナビだけが残る
    <div
      aria-hidden={!shown}
      className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${
        shown ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      }`}
    >
      <div className="overflow-hidden">
        <button
          type="button"
          onClick={onOpen}
          tabIndex={shown ? 0 : -1}
          aria-label={ui.genponAria(koma)}
          className="block w-full border-b border-line bg-white text-left hover:bg-paper transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-yu-blue"
        >
          <span className="mx-auto flex max-w-2xl items-center gap-3.5 px-5 py-3">
            {halfBook ? (
              <BookCrop
                src={komaImageUrl(koma, "w320")}
                rect={halfBook}
                alt=""
                className="h-[3.75rem] shrink-0 rounded ring-1 ring-line"
              />
            ) : (
              <span className="koma-book block w-[4.75rem] shrink-0 rounded ring-1 ring-line">
                <img src={komaImageUrl(koma, "w320")} alt="" decoding="async" />
                {regions?.map((r, i) => (
                  <span
                    key={i}
                    className="absolute rounded-sm border-[1.5px] border-shu transition-[left,width] duration-300 motion-reduce:transition-none"
                    style={bookBoxStyle(r)}
                  />
                ))}
              </span>
            )}
            <span className="min-w-0 flex-1">
              <span className="block font-genbun text-[0.9375rem] text-ink">{ui.genponTitle(koma)}</span>
              <span className="mt-0.5 block text-caption text-ink-soft">
                {regions?.length ? ui.genponHere : ui.genponKoma}
              </span>
            </span>
            <span aria-hidden="true" className="shrink-0 font-maru text-caption font-bold text-yu-blue">
              {ui.genponOpen}
            </span>
          </span>
        </button>
      </div>
    </div>
  );
}

/**
 * 帯から開く原本の見開き。読んでいた段落の位置に朱の枠を残す。
 * 撮影時の背景と定規は落として本だけを見せる。資料としての全体（定規・請求記号つき）は「原寸で見る」から
 */
export function GenponView({
  koma,
  regions,
  onClose,
  onZoom,
}: {
  koma: number;
  regions?: readonly Rect[];
  onClose: () => void;
  onZoom: (koma: number) => void;
}) {
  const ui = useUi();
  const closeRef = useRef<HTMLButtonElement>(null);
  const halfBook = HALF_BOOK_RECT[koma];

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      opener?.focus();
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-label={ui.genponTitle(koma)}
      className="sheet-up fixed inset-0 z-50 flex flex-col overflow-auto overscroll-contain bg-ink text-paper"
    >
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-3 py-3 pl-5 pr-3">
        <p className="font-genbun text-base tracking-wider">{ui.genponTitle(koma)}</p>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label={ui.close}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full text-2xl hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
      <div className="flex flex-1 items-center justify-center px-2 lg:px-5">
        {halfBook ? (
          <BookCrop
            src={komaImageUrl(koma, "w960")}
            rect={halfBook}
            alt={ui.spreadAlt(koma)}
            className="w-full max-w-sm"
          />
        ) : (
          <div className="koma-book w-full max-w-4xl">
            <img
              src={komaImageUrl(koma, "w960")}
              srcSet={`${komaImageUrl(koma, "w960")} 960w, ${komaImageUrl(koma, "full")} 1600w`}
              sizes="(min-width: 1024px) 896px, 116vw"
              alt={ui.spreadAlt(koma)}
              decoding="async"
            />
            {regions?.map((r, i) => (
              <span
                key={i}
                role="img"
                aria-label={ui.regionAria}
                className="absolute rounded-sm border-2 border-shu"
                style={bookBoxStyle(r)}
              />
            ))}
          </div>
        )}
      </div>
      <div className="mx-auto w-full max-w-4xl space-y-1 px-5 pb-7 pt-4 text-caption">
        {/* 表紙・裏表紙には読む本文がないので、読み方の一言は出さない */}
        {!halfBook && (
          <p className="text-paper/80">{regions?.length ? ui.genponGuideHere : ui.genponGuide}</p>
        )}
        <p className="text-paper/65">
          {ui.genponCaption}{" "}
          <button
            type="button"
            onClick={() => onZoom(koma)}
            className="inline-flex min-h-11 items-center underline underline-offset-4 hover:text-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            {ui.genponFull}
          </button>
        </p>
      </div>
    </div>
  );
}
