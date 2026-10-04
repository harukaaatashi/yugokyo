import { useCallback, useState } from "react";

/**
 * 原文翻刻を本文に出すかどうか。既定は「出さない」（現代語訳だけが途切れずに続く）。
 *
 * 原文を読みたい人は一度オンにすれば、章を移っても・次に開いたときもそのまま。
 * 保存できない環境（プライベートモード等）では既定のまま動く。
 */
const KEY = "yugokyo:showGenbun";

function load(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function useShowGenbun(): [boolean, (next: boolean) => void] {
  const [show, setShow] = useState(load);
  const update = useCallback((next: boolean) => {
    setShow(next);
    try {
      localStorage.setItem(KEY, next ? "1" : "0");
    } catch {
      /* 保存できなくても表示は切り替える */
    }
  }, []);
  return [show, update];
}
