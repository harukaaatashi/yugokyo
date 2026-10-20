import { komaImageUrl } from "../../lib/corpus";
import { useUi } from "../../lib/i18n";
import { HALF_BOOK_RECT } from "../../lib/pages";
import BookCrop from "./BookCrop";

/**
 * 幕間。丁を読み終えたところに、その丁の見開きを墨の帯の上で大きく見せる。
 *
 * 本文を読んでいる最中は原本を出さず、ひと区切りついたところで「いま読んだ丁」を見せる。
 * 原本は読む邪魔をしない場所で、いまのパネルより大きく出す。
 *
 * 撮影時の灰色の背景と定規は `.koma-book` で落とす（拡大表示では落とさない）。
 * 本が片側にだけ写っている表紙・裏表紙は、その範囲に収まらないので本の矩形で切る（縦長になる）。
 */
export default function KomaInterlude({
  koma,
  onZoom,
}: {
  koma: number;
  onZoom: (koma: number) => void;
}) {
  const ui = useUi();
  const label = ui.interludeLabel(koma);
  const halfBook = HALF_BOOK_RECT[koma];
  return (
    <section aria-label={ui.interludeAria(koma)} className="bg-ink py-14 text-paper lg:py-20">
      <div className="mx-auto max-w-5xl lg:flex lg:items-start lg:justify-center lg:gap-10 lg:px-5">
        <p className="text-center font-genbun text-xl tracking-widest lg:hidden">{label}</p>
        {halfBook ? (
          <button
            type="button"
            onClick={() => onZoom(koma)}
            aria-label={ui.zoomAria(koma)}
            className="mx-auto mt-6 block w-full max-w-xs cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper lg:mx-0 lg:mt-0"
          >
            <BookCrop src={komaImageUrl(koma, "w960")} rect={halfBook} alt={ui.spreadAlt(koma)} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onZoom(koma)}
            aria-label={ui.zoomAria(koma)}
            className="koma-book mt-6 block w-full cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper lg:mt-0 lg:max-w-3xl lg:flex-1"
          >
            <img
              src={komaImageUrl(koma, "w960")}
              srcSet={`${komaImageUrl(koma, "w960")} 960w, ${komaImageUrl(koma, "full")} 1600w`}
              sizes="(min-width: 1024px) 890px, 116vw"
              alt={ui.spreadAlt(koma)}
              loading="lazy"
              decoding="async"
            />
          </button>
        )}
        <p className="mt-5 px-5 text-center text-caption text-line lg:hidden">
          {ui.interludeCaption} ・ {ui.enlarge}
        </p>
        <div className="hidden shrink-0 items-start gap-4 pt-1 lg:flex">
          <p className="tategaki font-genbun text-xl tracking-widest">{label}</p>
          <p className="tategaki text-caption tracking-wide text-line">{ui.interludeCaption}</p>
        </div>
      </div>
    </section>
  );
}
