import { memo } from "react";
import { ndlViewerUrl, type Section } from "../../lib/corpus";
import Honkoku from "./Honkoku";
import NoteDisclosure from "./NoteDisclosure";

/**
 * 段落の描画。**現代語訳が主役**で、原文はその下に引用として控える。
 *
 * 従位は4つの手がかりで積み上げる（どれか1つに頼らない）:
 *   位置=後 / 面=なし＋左罫 / 書体=明朝 / サイズと色=小さく淡く
 * 面（塗り）で層を分けると「箱に入っているほうが主」に見えてしまうため、
 * 淡青の箱は使わない（DESIGN §2）。
 */

interface Props {
  section: Section;
  koma: number;
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

function SectionBlock({ section, koma, onOpenKoma }: Props) {
  if (section.kind === "illustration") {
    // 絵そのものは追随パネルに出ているので、ここはその絵の説明として置く
    return (
      <figure data-koma={koma} className="scroll-below-pane border-y border-line py-5">
        <figcaption className="text-caption text-ink">
          <span className="font-maru font-bold text-yu-blue mr-2">挿絵</span>
          {section.note}
        </figcaption>
        <button
          type="button"
          onClick={() => onOpenKoma(koma)}
          className="mt-3 inline-flex items-center min-h-11 px-4 rounded-full border border-yu-blue text-yu-blue font-maru font-bold text-caption hover:bg-yu-blue-soft transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yu-blue focus-visible:ring-offset-2"
        >
          この絵を大きく見る
        </button>
      </figure>
    );
  }

  if (section.kind === "heading") {
    return (
      <h2 data-koma={koma} className="scroll-below-pane border-t border-line pt-8">
        <span className="block font-maru font-bold text-xl text-yu-blue text-balance">
          {section.modern ?? section.original}
        </span>
        {section.original && section.modern && (
          <span className="mt-1 block font-genbun text-genbun text-ink-muted honkoku">
            <Honkoku text={section.original} />
          </span>
        )}
      </h2>
    );
  }

  return (
    <article data-koma={koma} className="scroll-below-pane">
      {section.modern && (
        <p className="text-yaku text-ink">
          <Lines text={section.modern} />
        </p>
      )}
      {section.original && (
        <blockquote
          cite={ndlViewerUrl(koma)}
          className="mt-4 border-l-2 border-line pl-4 font-genbun text-genbun text-ink-muted honkoku"
        >
          <Honkoku text={section.original} />
        </blockquote>
      )}
      {section.note && <NoteDisclosure>{section.note}</NoteDisclosure>}
    </article>
  );
}

// 追随パネルの丁が変わるたびに本文88セクションを再描画しないようにする
export default memo(SectionBlock);
