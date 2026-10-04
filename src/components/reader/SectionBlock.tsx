import { memo } from "react";
import { localized, ndlViewerUrl, pageSideOf, type Section } from "../../lib/corpus";
import { UI } from "../../lib/i18n";
import type { Lang } from "../../lib/lang";
import Honkoku from "./Honkoku";
import NoteDisclosure from "./NoteDisclosure";

/**
 * 段落の描画。**現代語訳が主役**で、原文はその下に引用として控える。
 *
 * 従位は4つの手がかりで積み上げる（どれか1つに頼らない）:
 *   位置=後 / 面=なし＋左罫 / 書体=明朝 / サイズと色=小さく淡く
 * 面（塗り）で層を分けると「箱に入っているほうが主」に見えてしまうため、
 * 淡青の箱は使わない（DESIGN §2）。
 *
 * 原文は既定では出さない。訳だけが地の文として続くほうが読み物として途切れないため。
 * 読者が「原文」スイッチを入れたときだけ、各段落の下に引用として戻す（DESIGN §6）。
 */

interface Props {
  section: Section;
  koma: number;
  /** その丁の中での位置。右ページか左ページかの推定に使う */
  index: number;
  /** 原文翻刻を出すか（既定は訳だけ） */
  showGenbun: boolean;
  /** 表示言語。memo を効かせるため context ではなく props で受ける */
  lang: Lang;
  onOpenKoma: (koma: number) => void;
}

function Lines({ text }: { text: string }) {
  return (
    <>
      {text.split("\n").map((line, i) => (
        <span key={i} className="block">
          {line}
        </span>
      ))}
    </>
  );
}

function SectionBlock({ section, koma, index, showGenbun, lang, onOpenKoma }: Props) {
  const side = pageSideOf(koma, index);
  const ui = UI[lang];
  const { text, textLang, note, noteLang } = localized(section, lang);
  if (section.kind === "illustration") {
    // 絵そのものは追随パネルに出ているので、ここはその絵の説明として置く
    return (
      <figure data-koma={koma} data-side={side} className="scroll-below-pane border-y border-line py-5">
        <figcaption className="text-caption text-ink">
          <span className="font-maru font-bold text-yu-blue mr-2">{ui.illustration}</span>
          <span lang={noteLang}>{note}</span>
        </figcaption>
        <button
          type="button"
          onClick={() => onOpenKoma(koma)}
          className="mt-3 inline-flex items-center min-h-11 px-4 rounded-full border border-yu-blue text-yu-blue font-maru font-bold text-caption hover:bg-yu-blue-soft transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yu-blue focus-visible:ring-offset-2"
        >
          {ui.viewLarger}
        </button>
      </figure>
    );
  }

  if (section.kind === "heading") {
    return (
      <h2 data-koma={koma} data-side={side} className="scroll-below-pane border-t border-line pt-8">
        <span
          lang={text ? textLang : "ja"}
          className="block font-maru font-bold text-xl text-yu-blue text-balance"
        >
          {text ?? section.original}
        </span>
        {showGenbun && section.original && text && (
          <span lang="ja" className="mt-1 block font-genbun text-genbun text-ink-muted honkoku">
            <Honkoku text={section.original} />
          </span>
        )}
      </h2>
    );
  }

  return (
    <article data-koma={koma} data-side={side} className="scroll-below-pane">
      {text && (
        <p lang={textLang} className="text-yaku text-ink">
          <Lines text={text} />
        </p>
      )}
      {/* 訳がない段落は原文しか中身がないので、スイッチに関わらず出す */}
      {section.original && (showGenbun || !text) && (
        <blockquote
          lang="ja"
          cite={ndlViewerUrl(koma)}
          className="mt-4 border-l-2 border-line pl-4 font-genbun text-genbun text-ink-muted honkoku"
        >
          <Honkoku text={section.original} />
        </blockquote>
      )}
      {note && <NoteDisclosure lang={noteLang}>{note}</NoteDisclosure>}
    </article>
  );
}

// 追随パネルの丁が変わるたびに本文88セクションを再描画しないようにする
export default memo(SectionBlock);
