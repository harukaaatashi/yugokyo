import { useLang, type Lang } from "./lang";

/**
 * UIの文言。読み物の本文（訳・注・章タイトル）は corpus と chapters.ts が持ち、
 * ここにはボタン・ラベル・位置表示のような短い文言だけを置く。
 *
 * 「丁」は英語では spread（見開き1枚の画像）と呼ぶ。
 */
const ja = {
  logo: "湯語教",
  navRead: "読む",
  navAbout: "この本について",
  /** 言語スイッチ。いまと反対の言語の名前を、その言語で出す */
  switchTo: "English",
  switchToLabel: "英語で読む（Read in English）",

  footerImages: "原本画像:",
  ndlTitle: "国立国会図書館デジタルコレクション『洗湯手引草』",
  publicDomain: "（保護期間満了）",
  aiDraft: "翻刻・現代語訳はAIによる下訳（未校正）です。",

  front: "扉",
  back: "巻末",
  position: (n: number, total: number) => `第${n}章 / 全${total}章`,
  chapterNo: (n: number) => `第${n}章`,
  komaRange: (from: number, to: number) => (from === to ? `${from}丁` : `${from}〜${to}丁`),
  aiBadge: "AI翻刻（未校正）",
  notFound: "その章は見つかりませんでした。",
  backToIndex: "目次にもどる",
  continuesFrom: "この丁は前の章の続きから始まります。",
  continuesTo: "この丁の続きは次の章にあります。",
  sourceLabel: "原本:",
  sourceTail: "（保護期間満了）／翻刻・現代語訳はAIによる下訳（未校正）です。",
  prev: "← 前の章",
  next: "次の章 →",
  finish: "読了 →",

  paneLabel: "原本の写真",
  komaLabel: (koma: number) => `${koma} 丁`,
  sideSuffix: (side: "r" | "l"): string => (side === "r" ? "・右" : "・左"),
  sideButton: (side: "r" | "l"): string => (side === "r" ? "右" : "左"),
  sideAria: (side: "r" | "l"): string => (side === "r" ? "右ページを見る" : "左ページを見る"),
  zoomAria: (koma: number) => `${koma}丁の原本画像を拡大する`,
  pageAlt: (koma: number, side: "r" | "l") =>
    `『湯語教』${koma}丁の${side === "r" ? "右" : "左"}ページ`,
  spreadAlt: (koma: number) => `『湯語教』${koma}丁目の原本画像`,
  genbunSwitch: "原文",

  illustration: "挿絵",
  viewLarger: "この絵を大きく見る",
  note: "注",
  noteOpen: "をひらく",
  noteClose: "をとじる",

  zoomDialog: (koma: number) => `『湯語教』${koma}丁目の原本画像の拡大表示`,
  zoomAlt: (koma: number) => `『湯語教』${koma}丁目の原本画像（拡大）`,
  zoomCaption: "下部の定規と請求記号の札は国立国会図書館の撮影によるものです。",
  zoomNdl: "NDLデジタルコレクションで見る",
  close: "閉じる",
};

export type UiText = typeof ja;

const en: UiText = {
  logo: "Yugokyō",
  navRead: "Read",
  navAbout: "About",
  switchTo: "日本語",
  switchToLabel: "日本語で読む (Read in Japanese)",

  footerImages: "Original images:",
  ndlTitle: "National Diet Library Digital Collections, Sentō Tebikigusa",
  publicDomain: " (public domain)",
  aiDraft:
    "The transcription and both translations are unreviewed AI drafts.",

  front: "Front matter",
  back: "Back matter",
  position: (n, total) => `Chapter ${n} of ${total}`,
  chapterNo: (n) => `Chapter ${n}`,
  komaRange: (from, to) => (from === to ? `Spread ${from}` : `Spreads ${from}–${to}`),
  aiBadge: "AI draft (unreviewed)",
  notFound: "We couldn’t find that chapter.",
  backToIndex: "Back to contents",
  continuesFrom: "This spread begins partway through the previous chapter.",
  continuesTo: "This spread continues in the next chapter.",
  sourceLabel: "Original:",
  sourceTail:
    " (public domain). The transcription and English translation are unreviewed AI drafts.",
  prev: "← Previous",
  next: "Next →",
  finish: "Finish →",

  paneLabel: "Photo of the original",
  komaLabel: (koma) => `Spread ${koma}`,
  sideSuffix: (side) => (side === "r" ? " · right" : " · left"),
  sideButton: (side) => (side === "r" ? "R" : "L"),
  sideAria: (side) => (side === "r" ? "Show the right page" : "Show the left page"),
  zoomAria: (koma) => `Enlarge the original image of spread ${koma}`,
  pageAlt: (koma, side) =>
    `Yugokyō, spread ${koma}, ${side === "r" ? "right" : "left"} page`,
  spreadAlt: (koma) => `Yugokyō, original image of spread ${koma}`,
  genbunSwitch: "Original",

  illustration: "Illustration",
  viewLarger: "View larger",
  note: "Note",
  noteOpen: "show",
  noteClose: "hide",

  zoomDialog: (koma) => `Enlarged original image of spread ${koma}`,
  zoomAlt: (koma) => `Yugokyō, original image of spread ${koma} (enlarged)`,
  zoomCaption:
    "The ruler and call-number tag at the bottom were added when the National Diet Library photographed the book.",
  zoomNdl: "View at NDL Digital Collections",
  close: "Close",
};

export const UI: Record<Lang, UiText> = { ja, en };

/** いまの言語のUI文言 */
export function useUi(): UiText {
  return UI[useLang().lang];
}
