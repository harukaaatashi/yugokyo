import { useEffect, useRef } from "react";
import { komaImageUrl, ndlViewerUrl } from "../../lib/corpus";

/** 原本画像の実寸（全38枚で共通） */
const FULL_W = 1600;
const FULL_H = 1383;

/**
 * 原本画像の拡大表示。
 * ここでは**トリミングせず原寸のまま**出す。下端の定規と請求記号も含めた
 * 「資料としての姿」を見られるようにするため。
 */
export default function KomaZoom({
  koma,
  onClose,
}: {
  koma: number;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    openerRef.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      openerRef.current?.focus();
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 overflow-auto overscroll-contain bg-ink/90"
      role="dialog"
      aria-label={`『湯語教』${koma}丁目の原本画像の拡大表示`}
      onClick={onClose}
    >
      <img
        src={komaImageUrl(koma, "full")}
        alt={`『湯語教』${koma}丁目の原本画像（拡大）`}
        width={FULL_W}
        height={FULL_H}
        className="h-auto w-koma max-w-none"
      />
      <div className="sticky bottom-0 bg-ink/90 px-5 py-3 text-caption text-paper">
        <p>
          下部の定規と請求記号の札は国立国会図書館の撮影によるものです。{" "}
          <a
            href={ndlViewerUrl(koma)}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4"
            onClick={(e) => e.stopPropagation()}
          >
            NDLデジタルコレクションで見る
          </a>
        </p>
      </div>
      <button
        type="button"
        ref={closeRef}
        onClick={onClose}
        className="fixed right-4 top-4 min-h-11 rounded-full bg-white px-5 font-maru font-bold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
      >
        閉じる
      </button>
    </div>
  );
}
