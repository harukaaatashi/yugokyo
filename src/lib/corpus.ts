export type SectionKind = "heading" | "text" | "illustration";

export interface Section {
  kind: SectionKind;
  /** 翻刻（通行字体）。読みが不確かな箇所は ｛…｝ で囲む。判読不能字は 〓 */
  original?: string;
  /** 現代語訳 */
  modern?: string;
  /** 注記（現代人向けの補足） */
  note?: string;
}

export interface Koma {
  koma: number;
  label: string;
  image: string;
  /** この見開きの内容ひとこと */
  summary: string;
  sections: Section[];
  status: "ai-draft" | "reviewed";
}

const modules = import.meta.glob<{ default: Koma }>("../../corpus/koma-*.json", {
  eager: true,
});

export const komaList: Koma[] = Object.values(modules)
  .map((m) => m.default)
  .sort((a, b) => a.koma - b.koma);

export const komaByNumber = new Map(komaList.map((k) => [k.koma, k]));

export const TOTAL_KOMA = 38;

export const NDL_ITEM_URL = "https://dl.ndl.go.jp/pid/2539997";

export function ndlViewerUrl(koma: number): string {
  return `${NDL_ITEM_URL}/1/${koma}`;
}

const LAST_KOMA_KEY = "yugokyo:lastKoma";

export function saveLastKoma(koma: number) {
  try {
    localStorage.setItem(LAST_KOMA_KEY, String(koma));
  } catch {
    /* private mode等では保存しない */
  }
}

export function loadLastKoma(): number | null {
  try {
    const v = localStorage.getItem(LAST_KOMA_KEY);
    if (!v) return null;
    const n = Number(v);
    return Number.isInteger(n) && komaByNumber.has(n) ? n : null;
  } catch {
    return null;
  }
}
