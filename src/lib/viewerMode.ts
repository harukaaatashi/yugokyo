/**
 * リーダーのレイアウト。既定は「展示」（DESIGN §6）。
 *
 * 展示レイアウトでは本文の横・上に原本写真を置かない。原本は章扉で大きく見せ、
 * 読んでいるあいだは下の帯に小さく添える（タップで見開きを開く）。
 *
 * 写真パネルを固定する以前のレイアウトは、見比べるために `?viewer=classic` で残してある
 * （HashRouter の # より前に付ける。戻すときは `?viewer=exhibit`）。一度指定すると localStorage に残る。
 */
export type ViewerMode = "classic" | "exhibit";

const KEY = "yugokyo:viewer";

function readMode(): ViewerMode {
  try {
    const q = new URLSearchParams(window.location.search).get("viewer");
    if (q === "exhibit" || q === "classic") {
      localStorage.setItem(KEY, q);
      return q;
    }
    return localStorage.getItem(KEY) === "classic" ? "classic" : "exhibit";
  } catch {
    return "exhibit";
  }
}

export const viewerMode: ViewerMode =
  typeof window === "undefined" ? "exhibit" : readMode();
