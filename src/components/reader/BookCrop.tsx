import type { Rect } from "../../lib/pages";

/** 原本画像の実寸（全38枚で共通） */
const FULL_W = 1600;

/**
 * 見開き画像から矩形を切り出して見せる。画像は作らず CSS で切る（DESIGN §8.5）。
 * 位置は割合で指定するので、縮小画像（w960 など）でも原寸の座標のまま使える。
 */
export default function BookCrop({
  src,
  rect,
  alt,
  className = "",
}: {
  src: string;
  rect: Rect;
  alt: string;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ aspectRatio: `${rect.w} / ${rect.h}` }}
    >
      <img
        src={src}
        alt={alt}
        decoding="async"
        className="absolute h-auto max-w-none"
        style={{
          width: `${(FULL_W / rect.w) * 100}%`,
          left: `${(-rect.x / rect.w) * 100}%`,
          top: `${(-rect.y / rect.h) * 100}%`,
        }}
      />
    </div>
  );
}
