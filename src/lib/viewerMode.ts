/**
 * 試作中の「展示」レイアウトに切り替えるフラグ。
 *
 * 展示レイアウトでは本文の横・上に原本写真を置かない。原本は章扉と、
 * 丁を読み終えたところの幕間でだけ大きく見せる（読むときは文章だけ、読み終えたら原本）。
 *
 * 切り替えは URL の `?viewer=exhibit` / `?viewer=classic`（HashRouter の # より前に付ける）。
 * 一度指定すると localStorage に残る。試作の範囲は EXHIBIT_CHAPTERS の章だけで、
 * ほかの章はいままでどおりの表示になる。
 */
export type ViewerMode = "classic" | "exhibit";

const KEY = "yugokyo:viewer";

export const EXHIBIT_CHAPTERS: ReadonlySet<string> = new Set(["gokyo"]);

function readMode(): ViewerMode {
  try {
    const q = new URLSearchParams(window.location.search).get("viewer");
    if (q === "exhibit" || q === "classic") {
      localStorage.setItem(KEY, q);
      return q;
    }
    return localStorage.getItem(KEY) === "exhibit" ? "exhibit" : "classic";
  } catch {
    return "classic";
  }
}

export const viewerMode: ViewerMode =
  typeof window === "undefined" ? "classic" : readMode();
