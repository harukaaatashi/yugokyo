import { komaAnchorId, type FlowItem } from "../../lib/corpus";

/**
 * 章のなかで丁が変わる位置に置く、紙の変わり目の印。
 *
 * 丁番号とNDLリンクは追随パネルが常に出しているので、ここには置かない
 * （並ぶと同じものが二重に見える）。細い罫線だけにして、
 * /read/:koma からのアンカーの受け皿としての役割を残す。
 */
export default function KomaRule({
  item,
}: {
  item: Extract<FlowItem, { type: "koma" }>;
}) {
  const n = item.koma.koma;
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
          この丁は前の章の続きから始まります。
        </p>
      )}
    </div>
  );
}
