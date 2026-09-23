import { useEffect, useState } from "react";
import { komaImageUrl, ndlViewerUrl } from "../../lib/corpus";

/**
 * 読んでいる丁に追随する原本写真。
 * 狭い画面では画面上部に固定、広い画面では右カラムに固定する（DESIGN §6）。
 *
 * 画像は下端15%が定規と請求記号のラベル帯なので、aspect-koma + object-cover object-top で
 * 縦にだけ落とす。横は切らない（表紙・裏表紙は本が左半分という別構図のため）。
 * 拡大表示では無加工の原寸を出す。
 */

interface Props {
  komas: readonly number[];
  active: number;
  onZoom: (koma: number) => void;
}

export default function KomaPane({ komas, active, onZoom }: Props) {
  // 直近3枚だけ DOM に残す。未到達の丁は通信しないまま、前後のクロスフェード元は生かす
  const [layers, setLayers] = useState<number[]>([active]);
  useEffect(() => {
    setLayers((prev) => [active, ...prev.filter((n) => n !== active)].slice(0, 3));
  }, [active]);

  // 次の丁を1枚だけ先読みしてキャッシュを温める
  useEffect(() => {
    const next = komas[komas.indexOf(active) + 1];
    if (next === undefined) return;
    const img = new Image();
    img.decoding = "async";
    img.src = komaImageUrl(next, "w960");
  }, [active, komas]);

  return (
    <div className="bg-paper">
      <button
        type="button"
        onClick={() => onZoom(active)}
        aria-label={`${active}丁の原本画像を拡大する`}
        className="relative block w-full aspect-koma max-h-pane lg:max-h-none overflow-hidden bg-paper-warm lg:rounded-2xl lg:border lg:border-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yu-blue focus-visible:ring-offset-2"
      >
        {layers.map((n) => (
          <img
            key={n}
            src={komaImageUrl(n, "w960")}
            alt={n === active ? `『湯語教』${n}丁目の原本画像` : ""}
            aria-hidden={n !== active}
            width={960}
            height={830}
            decoding="async"
            className={`absolute inset-0 h-full w-full object-cover object-top motion-safe:transition-opacity motion-safe:duration-200 ${
              n === active ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
      </button>
      <div className="flex items-center gap-3 px-5 lg:px-1">
        <span className="shrink-0 text-caption text-ink-soft tabular-nums">
          {active} 丁
        </span>
        <span className="h-px flex-1 bg-line" aria-hidden="true" />
        <a
          href={ndlViewerUrl(active)}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 inline-flex items-center min-h-11 text-caption text-ink-soft underline underline-offset-4 hover:text-yu-blue transition-colors"
        >
          NDLで見る
        </a>
      </div>
    </div>
  );
}
