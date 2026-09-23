import { useEffect, useState, type RefObject } from "react";
import type { PageSide } from "./pages";

/**
 * いま読んでいる丁を、本文の要素から検出する。
 *
 * 丁マーカーだけを見るのでは足りない。9丁17セクションの章ではマーカー間が
 * 画面数個ぶんあり、マーカーが視界の外にいる時間のほうが長いため。
 * 本文の各ブロックが持つ `data-koma` を全部監視する。
 *
 * ビューポートを負の rootMargin で「読んでいる行の帯」に潰し、
 * 帯にかかった要素のうち最も上のものを採用する。
 */
export interface ActiveSpot {
  koma: number;
  /** 見開きの右ページか左ページか（本文の位置から推定したもの） */
  side: PageSide;
}

export function useActiveKoma(
  rootRef: RefObject<HTMLElement>,
  fallback: ActiveSpot,
  /** 上部に固定された写真パネルの高さ（広い画面では 0） */
  offsetTop: number,
  /** 章が変わったら張り直すためのキー */
  resetKey: string
): ActiveSpot {
  const [active, setActive] = useState(fallback);
  // 画面サイズが変わると「読んでいる行の帯」の位置が変わる。
  // ウィンドウのリサイズ・端末の回転で observer を張り直すためのカウンタ
  const [viewportKey, setViewportKey] = useState(0);

  useEffect(() => {
    setActive(fallback);
  }, [fallback.koma, fallback.side, resetKey]);

  useEffect(() => {
    let frame = 0;
    const onResize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setViewportKey((n) => n + 1));
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === "undefined") return;

    const viewport = window.innerHeight;
    const wide = window.matchMedia("(min-width: 1024px)").matches;
    // 広い画面は画面の上から20%〜50%。狭い画面は固定パネルの真下から180px
    const bandTop = wide ? Math.round(viewport * 0.2) : offsetTop + 8;
    const bandBottom = Math.min(
      viewport - 1,
      bandTop + (wide ? Math.round(viewport * 0.3) : 180)
    );
    // 極端に低いビューポート（ソフトキーボード表示中など）では監視しない
    if (bandBottom <= bandTop) return;

    const visible = new Set<Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target);
          else visible.delete(entry.target);
        }
        // 帯が空のときは直前の丁を保つ（ちらつき防止）
        if (visible.size === 0) return;
        // 交差時の座標は保持しない。まとめてスクロールすると古い値になるので、
        // 選ぶ瞬間に測り直す
        let best: Element | null = null;
        let bestTop = Infinity;
        for (const el of visible) {
          const top = el.getBoundingClientRect().top;
          if (top < bestTop) {
            bestTop = top;
            best = el;
          }
        }
        const el = best as HTMLElement | null;
        const koma = Number(el?.dataset.koma);
        const side = (el?.dataset.side === "l" ? "l" : "r") as PageSide;
        if (Number.isInteger(koma)) {
          setActive((current) =>
            current.koma === koma && current.side === side ? current : { koma, side }
          );
        }
      },
      {
        rootMargin: `${-bandTop}px 0px ${-(viewport - bandBottom)}px 0px`,
        threshold: 0,
      }
    );

    root.querySelectorAll<HTMLElement>("[data-koma]").forEach((el) => {
      observer.observe(el);
    });
    return () => observer.disconnect();
  }, [rootRef, offsetTop, resetKey, viewportKey]);

  return active;
}
