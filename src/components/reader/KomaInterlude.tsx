import { komaImageUrl } from "../../lib/corpus";
import { useUi } from "../../lib/i18n";
import { BOOK_RECT, HALF_BOOK_RECT, type Rect } from "../../lib/pages";
import BookCrop from "./BookCrop";

/**
 * 幕間。丁を読み終えたところに「いま読んだ◯丁」として、その丁の見開きを生成りのカードで見せる。
 *
 * 本文を読んでいる最中は原本を出さず、ひと区切りついたところで答え合わせとして見せる。
 * 墨の帯で額装するより、本文の流れになじむカードのほうが読み物として見やすい（DESIGN §6）。
 * 読み方（右上から縦に）を一言添え、原本に不慣れな人でも朱の枠と本文を結びつけられるようにする。
 *
 * 撮影時の灰色の背景と定規は `.koma-book` で落とす（拡大表示では落とさない）。
 * 本が片側にだけ写っている表紙・裏表紙は、その範囲に収まらないので本の矩形で切る（縦長になる）。
 *
 * 段落が原本のどこにあるか測ってあれば、朱の枠と番号で示す（本文の段落の頭の番号と対応する）。
 * いま読んだ文が原本のどこか、の答え合わせになる。
 */

export interface InterludeMark {
  /** 本文の段落の頭に出している番号 */
  n: number;
  regions: Rect[];
}

/** 原寸の座標を、本だけを切り出した枠の中の割合にする */
function boxStyle(r: Rect) {
  return {
    left: `${((r.x - BOOK_RECT.x) / BOOK_RECT.w) * 100}%`,
    top: `${((r.y - BOOK_RECT.y) / BOOK_RECT.h) * 100}%`,
    width: `${(r.w / BOOK_RECT.w) * 100}%`,
    height: `${(r.h / BOOK_RECT.h) * 100}%`,
  };
}

export default function KomaInterlude({
  koma,
  onZoom,
  marks = [],
}: {
  koma: number;
  onZoom: (koma: number) => void;
  marks?: readonly InterludeMark[];
}) {
  const ui = useUi();
  const halfBook = HALF_BOOK_RECT[koma];
  return (
    <section aria-label={ui.interludeAria(koma)} className="bg-paper-warm py-6 lg:py-8">
      <div className="mx-auto max-w-3xl lg:px-5">
        <div className="flex items-center justify-between gap-3 px-5 lg:px-0">
          <p className="font-genbun text-base tracking-wider text-ink">{ui.interludeTitle(koma)}</p>
          <button
            type="button"
            onClick={() => onZoom(koma)}
            className="inline-flex min-h-11 shrink-0 items-center rounded-full text-caption text-yu-blue-deep hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yu-blue"
          >
            {ui.enlarge}
          </button>
        </div>
        {/* 表紙・裏表紙には読む本文がないので、読み方の一言は出さない */}
        {halfBook ? (
          <div className="pb-4" />
        ) : (
          <p className="px-5 pb-4 text-caption text-ink lg:px-0">
            {ui.interludeGuide(marks.map((m) => m.n))}
          </p>
        )}
        {halfBook ? (
          <button
            type="button"
            onClick={() => onZoom(koma)}
            aria-label={ui.zoomAria(koma)}
            className="mx-auto block w-full max-w-xs cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yu-blue"
          >
            <BookCrop src={komaImageUrl(koma, "w960")} rect={halfBook} alt={ui.spreadAlt(koma)} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onZoom(koma)}
            aria-label={ui.zoomAria(koma)}
            className="koma-book block w-full cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yu-blue"
          >
            <img
              src={komaImageUrl(koma, "w960")}
              srcSet={`${komaImageUrl(koma, "w960")} 960w, ${komaImageUrl(koma, "full")} 1600w`}
              sizes="(min-width: 1024px) 728px, 116vw"
              alt={ui.spreadAlt(koma)}
              loading="lazy"
              decoding="async"
            />
            {marks.flatMap((m) =>
              m.regions.map((r, i) => (
                <span
                  key={`${m.n}-${i}`}
                  role="img"
                  aria-label={ui.regionAria(m.n)}
                  className="absolute rounded-sm border-2 border-shu"
                  style={boxStyle(r)}
                >
                  {i === 0 && (
                    <span
                      aria-hidden="true"
                      className="absolute -top-3 left-1/2 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full bg-shu font-genbun text-caption text-white"
                    >
                      {ui.paragraphMark(m.n)}
                    </span>
                  )}
                </span>
              ))
            )}
          </button>
        )}
        <p className="px-5 pt-3 text-caption text-ink-muted lg:px-0">{ui.interludeCaption}</p>
      </div>
    </section>
  );
}
