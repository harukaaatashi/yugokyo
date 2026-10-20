import { komaAnchorId, type FlowItem } from "../../lib/corpus";
import { useUi } from "../../lib/i18n";

/**
 * 章のなかで丁が変わる位置に置く、紙の変わり目の印。
 *
 * 以前のレイアウトでは丁番号は追随パネルが常に出しているので、ここには置かない
 * （並ぶと同じものが二重に見える）。展示レイアウトにはパネルがないので罫線の頭に出す。細い罫線だけにして、
 * /read/:koma からのアンカーの受け皿としての役割を残す。
 */
export default function KomaRule({
  item,
  showLabel = false,
}: {
  item: Extract<FlowItem, { type: "koma" }>;
  /** 丁番号を罫線の頭に出すか。写真パネルがない展示レイアウトでだけ出す */
  showLabel?: boolean;
}) {
  const ui = useUi();
  const n = item.koma.koma;
  return (
    <div
      id={komaAnchorId(n)}
      data-koma={n}
      data-side="r"
      className="scroll-below-pane"
    >
      {showLabel ? (
        <span className="flex items-center gap-3">
          <span className="shrink-0 text-caption text-ink-soft tabular-nums">{ui.komaLabel(n)}</span>
          <span className="h-px flex-1 bg-line" aria-hidden="true" />
        </span>
      ) : (
        <span className="block h-px bg-line" aria-hidden="true" />
      )}
      {item.continues.from && (
        <p className="mt-3 text-caption text-ink-soft">
          {ui.continuesFrom}
        </p>
      )}
    </div>
  );
}
