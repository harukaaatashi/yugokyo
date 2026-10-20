import {
  chapterSummary,
  chapterTitle,
  komaImageUrl,
  komaPageUrl,
  type Chapter,
} from "../../lib/corpus";
import { UI } from "../../lib/i18n";
import type { Lang } from "../../lib/lang";
import { HALF_BOOK_RECT } from "../../lib/pages";
import BookCrop from "./BookCrop";
import GenbunSwitch from "./GenbunSwitch";

/**
 * 章扉。原本の1ページを章の表紙として大きく見せる。
 * 狭い画面では画面幅いっぱいに、広い画面では見出しの右に置く。
 * 表紙・裏表紙は本の写っている範囲を切り出す。そのほかの割らない丁は見開きを指定された側に寄せて切り取る。
 */
export default function ExhibitCover({
  chapter,
  lang,
  position,
  showGenbun,
  onToggleGenbun,
}: {
  chapter: Chapter;
  lang: Lang;
  /** 「第4章 / 全11章」などの現在位置 */
  position: string;
  showGenbun: boolean;
  onToggleGenbun: (next: boolean) => void;
}) {
  const ui = UI[lang];
  const cover = chapter.def.exhibitCover;
  const pageSrc = komaPageUrl(cover.koma, cover.side);
  const src = pageSrc ?? komaImageUrl(cover.koma, "w960");
  const align = cover.side === "r" ? "object-right-top" : "object-left-top";
  const halfBook = HALF_BOOK_RECT[cover.koma];
  return (
    <header className="lg:mx-auto lg:flex lg:max-w-5xl lg:flex-row-reverse lg:items-center lg:gap-12 lg:px-5 lg:pt-8">
      <figure className="lg:w-5/12 lg:shrink-0">
        {halfBook ? (
          <BookCrop
            src={src}
            rect={halfBook}
            alt={ui.spreadAlt(cover.koma)}
            className="bg-paper-warm lg:rounded-2xl lg:border lg:border-line"
          />
        ) : (
          <img
            src={src}
            alt={pageSrc ? ui.pageAlt(cover.koma, cover.side) : ui.spreadAlt(cover.koma)}
            className={`block h-cover w-full bg-paper-warm object-cover ${align} lg:h-auto lg:max-h-pane-lg lg:rounded-2xl lg:border lg:border-line lg:object-contain`}
          />
        )}
        <figcaption className="px-5 pt-2 text-caption text-ink-soft lg:px-1">
          {pageSrc ? ui.coverCaption(cover.koma, cover.side) : ui.coverCaptionSpread(cover.koma)}
        </figcaption>
      </figure>
      <div className="mx-auto max-w-2xl px-5 pt-6 lg:mx-0 lg:flex-1 lg:px-0 lg:pt-0">
        <p className="text-caption text-ink-soft tabular-nums">
          {position} ・ {ui.komaRange(chapter.komaFrom, chapter.komaTo)} ・ {ui.aiBadge}
        </p>
        <h1 className="mt-1 font-maru text-3xl font-bold text-yu-blue text-balance">
          {chapterTitle(chapter.def, lang)}
        </h1>
        <p className="mt-3 text-caption text-ink-muted">{chapterSummary(chapter.def, lang)}</p>
        <div className="mt-3">
          <GenbunSwitch checked={showGenbun} onChange={onToggleGenbun} />
        </div>
      </div>
    </header>
  );
}
