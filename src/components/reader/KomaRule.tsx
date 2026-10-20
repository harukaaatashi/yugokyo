import { komaAnchorId, type FlowItem } from "../../lib/corpus";
import { useUi } from "../../lib/i18n";

/**
 * 章のなかで丁が変わる位置に置く、紙の変わり目の印。
 *
 * 以前のレイアウトでは丁番号は追随パネルが常に出しているので、ここには罫線だけを置く
 * （並ぶと同じものが二重に見える）。
 * 展示レイアウトでも、いまの丁は下の帯が出しているので何も見せない（本文の途中に挟まると読む流れが止まる。DESIGN §9）。
 * どちらも /read/:koma からのアンカーの受け皿と、読んでいる丁の検出の目印としての役割は残す。
 */
export default function KomaRule({
  item,
  quiet = false,
}: {
  item: Extract<FlowItem, { type: "koma" }>;
  /** 見た目を持たない目印にする（展示レイアウト）。高さも段落の間の余白も取らない */
  quiet?: boolean;
}) {
  const ui = useUi();
  const n = item.koma.koma;
  if (quiet) {
    return (
      <div
        id={komaAnchorId(n)}
        data-koma={n}
        data-side="r"
        aria-hidden="true"
        className="scroll-below-pane !mt-0 h-0"
      />
    );
  }
  return (
    <div
      id={komaAnchorId(n)}
      data-koma={n}
      data-side="r"
      className="scroll-below-pane"
    >
      <span className="block h-px bg-line" aria-hidden="true" />
      {item.continues.from && (
        <p className="mt-3 text-caption text-ink-soft">
          {ui.continuesFrom}
        </p>
      )}
    </div>
  );
}
