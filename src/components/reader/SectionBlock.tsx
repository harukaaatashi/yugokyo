import { memo, type ReactNode } from "react";
import {
  localized,
  ndlViewerUrl,
  pageSideOf,
  sectionAnchorId,
  type Section,
} from "../../lib/corpus";
import { UI } from "../../lib/i18n";
import type { Lang } from "../../lib/lang";
import type { Term } from "../../lib/terms";
import Honkoku from "./Honkoku";
import NoteDisclosure from "./NoteDisclosure";
import { TermWord } from "./TermSheet";

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
  /** 訳文に残した江戸の語を開く。渡されたときだけ語を出す（展示レイアウト） */
  onOpenTerm?: (term: Term) => void;
  /** 段落の頭に出す番号。幕間の朱の枠の番号と対応する（原本の位置を測ってある段落だけ） */
  mark?: number;
}

/** 行の中の語を TermWord に置き換える。語ごとに、段落で最初に出てきた1か所だけ */
function withTerms(
  line: string,
  terms: readonly Term[],
  used: Set<Term>,
  onOpenTerm: (term: Term) => void
): ReactNode[] {
  const out: ReactNode[] = [];
  let rest = line;
  while (rest) {
    let hit: { term: Term; at: number } | null = null;
    for (const term of terms) {
      if (used.has(term)) continue;
      const at = rest.indexOf(term.word);
      if (at >= 0 && (!hit || at < hit.at)) hit = { term, at };
    }
    if (!hit) {
      out.push(rest);
      break;
    }
    if (hit.at > 0) out.push(rest.slice(0, hit.at));
    used.add(hit.term);
    out.push(<TermWord key={hit.term.word} term={hit.term} onOpen={onOpenTerm} />);
    rest = rest.slice(hit.at + hit.term.word.length);
  }
  return out;
}

function Lines({
  text,
  terms,
  onOpenTerm,
  lead,
}: {
  text: string;
  terms?: readonly Term[];
  onOpenTerm?: (term: Term) => void;
  /** 最初の行の頭に置くもの（段落の番号）。行は block なので外に置くと1行ぶん浮く */
  lead?: ReactNode;
}) {
  const used = new Set<Term>();
  return (
    <>
      {text.split("\n").map((line, i) => (
        <span key={i} className="block">
          {i === 0 && lead}
          {terms?.length && onOpenTerm ? withTerms(line, terms, used, onOpenTerm) : line}
        </span>
      ))}
    </>
  );
}

function SectionBlock({
  section,
  koma,
  index,
  showGenbun,
  lang,
  onOpenKoma,
  onOpenTerm,
  mark,
}: Props) {
  const side = pageSideOf(koma, index);
  // しおりの着地点。読書位置はこの id で記録する
  const id = sectionAnchorId(koma, index);
  const ui = UI[lang];
  const { text, textLang, note, noteLang } = localized(section, lang);
  if (section.kind === "illustration") {
    // 絵そのものは幕間（以前のレイアウトでは追随パネル）に出るので、ここはその絵の説明として置く
    return (
      <figure id={id} data-koma={koma} data-side={side} className="scroll-below-pane border-y border-line py-5">
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
      <h2 id={id} data-koma={koma} data-side={side} className="scroll-below-pane border-t border-line pt-8">
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
    <article id={id} data-koma={koma} data-side={side} className="scroll-below-pane">
      {text && (
        <p lang={textLang} className="text-yaku text-ink">
          <Lines
            text={text}
            terms={textLang === "ja" ? section.terms : undefined}
            onOpenTerm={onOpenTerm}
            lead={
              mark !== undefined && (
                <span aria-hidden="true" className="mr-1.5 font-genbun text-shu">
                  {ui.paragraphMark(mark)}
                </span>
              )
            }
          />
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

// 読んでいる丁が変わるたびに本文88セクションを再描画しないようにする
export default memo(SectionBlock);
