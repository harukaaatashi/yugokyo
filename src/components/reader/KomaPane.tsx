import { useEffect, useState } from "react";
import { komaImageUrl, komaPageUrl, ndlViewerUrl } from "../../lib/corpus";
import { isSplittable, type PageSide } from "../../lib/pages";
import type { ActiveSpot } from "../../lib/useActiveKoma";

/**
 * 読んでいる丁に追随する原本写真。
 * 狭い画面では画面上部に固定、広い画面では右カラムに固定する（DESIGN §6）。
 *
 * **広い画面では見開きを割って1ページずつ**出す。縦長のパネルにページが丸ごと入るので、
 * 1ページあたりの表示がおよそ2倍になり、くずし字が読める大きさになる。
 * 狭い画面では縦の余地がないので見開きのまま（割ると横幅が痩せて損をする）。
 *
 * どの段落が右ページか左ページかは corpus に書かれていないので位置から推定している。
 * 外したときのために、読者が自分でめくれるようにしておく。
 */

interface Props {
  komas: readonly number[];
  active: ActiveSpot;
  /** 広い画面か。1ページ表示にするかどうかの判断に使う */
  wide: boolean;
  onZoom: (koma: number) => void;
}

export default function KomaPane({ komas, active, wide, onZoom }: Props) {
  const { koma } = active;
  // 読者が自分でめくったら、その丁のあいだはその面を優先する
  const [flipped, setFlipped] = useState<PageSide | null>(null);
  useEffect(() => setFlipped(null), [koma]);

  const splitView = wide && isSplittable(koma);
  const side: PageSide = flipped ?? active.side;
  const pageSrc = splitView ? komaPageUrl(koma, side) : null;
  const src = pageSrc ?? komaImageUrl(koma, "w960");

  // 直近3枚だけ DOM に残す。未到達の丁は通信しないまま、切り替えのフェード元は生かす
  const [layers, setLayers] = useState<string[]>([src]);
  useEffect(() => {
    setLayers((prev) => [src, ...prev.filter((s) => s !== src)].slice(0, 3));
  }, [src]);

  // 次の丁を1枚だけ先読みしてキャッシュを温める
  useEffect(() => {
    const next = komas[komas.indexOf(koma) + 1];
    if (next === undefined) return;
    const img = new Image();
    img.decoding = "async";
    img.src =
      (wide && isSplittable(next) ? komaPageUrl(next, "r") : null) ??
      komaImageUrl(next, "w960");
  }, [koma, komas, wide]);

  return (
    <div className="bg-paper">
      <button
        type="button"
        onClick={() => onZoom(koma)}
        aria-label={`${koma}丁の原本画像を拡大する`}
        className={`relative block w-full overflow-hidden bg-paper-warm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yu-blue focus-visible:ring-offset-2 lg:rounded-2xl lg:border lg:border-line ${
          pageSrc
            ? "aspect-koma-page max-h-pane-lg"
            : "aspect-koma max-h-pane lg:max-h-none"
        }`}
      >
        {layers.map((layer) => (
          <img
            key={layer}
            src={layer}
            alt={
              layer !== src
                ? ""
                : pageSrc
                  ? `『湯語教』${koma}丁の${side === "r" ? "右" : "左"}ページ`
                  : `『湯語教』${koma}丁目の原本画像`
            }
            aria-hidden={layer !== src}
            decoding="async"
            // 見開きは下端の定規帯を切るので cover、切り出し済みの片ページは contain
            className={`absolute inset-0 h-full w-full object-top motion-safe:transition-opacity motion-safe:duration-200 ${
              pageSrc ? "object-contain" : "object-cover"
            } ${layer === src ? "opacity-100" : "opacity-0"}`}
          />
        ))}
      </button>

      <div className="flex items-center gap-3 px-5 lg:px-1">
        <span className="shrink-0 text-caption text-ink-soft tabular-nums">
          {koma} 丁{splitView && (side === "r" ? "・右" : "・左")}
        </span>
        <span className="h-px flex-1 bg-line" aria-hidden="true" />
        {splitView && (
          <span className="flex shrink-0 items-center">
            {(["r", "l"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setFlipped(s)}
                aria-pressed={side === s}
                aria-label={s === "r" ? "右ページを見る" : "左ページを見る"}
                className={`inline-flex min-h-11 items-center px-3 text-caption transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yu-blue ${
                  side === s
                    ? "font-maru font-bold text-yu-blue"
                    : "text-ink-soft hover:text-yu-blue"
                }`}
              >
                {s === "r" ? "右" : "左"}
              </button>
            ))}
          </span>
        )}
        <a
          href={ndlViewerUrl(koma)}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 inline-flex min-h-11 items-center text-caption text-ink-soft underline underline-offset-4 hover:text-yu-blue transition-colors"
        >
          NDLで見る
        </a>
      </div>
    </div>
  );
}
