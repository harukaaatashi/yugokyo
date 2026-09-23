/**
 * 見開き画像から片ページを切り出すための定義。
 *
 * 原本画像は全38枚 1600×1383 の見開き。綴じ目は実測で画像の 49〜51.5%、
 * 本の左端は約9%、右端は約94%、上端5%、下端は最大でも82.6%に収まる。
 * 日本の本なので**右ページが先**に来る。
 *
 * このファイルは scripts/ からも import する。**Vite の API を書かないこと。**
 */

export type PageSide = "r" | "l";

/** 切り出す矩形（原寸1600×1383のピクセル座標） */
export const PAGE_CROP: Record<PageSide, { x: number; y: number; w: number; h: number }> = {
  r: { x: 115, y: 60, w: 700, h: 1090 },
  l: { x: 815, y: 60, w: 700, h: 1090 },
};

/**
 * 割らない丁。
 * 1=表紙・38=裏表紙は本が左半分だけの別構図、8=光明皇后の施浴は見開き全面の一枚絵、
 * 37=三宝日の裏写りはほぼ白紙。いずれも割ると意味が壊れる
 */
export const SPREAD_ONLY_KOMA: readonly number[] = [1, 8, 37, 38];

export function isSplittable(koma: number): boolean {
  return !SPREAD_ONLY_KOMA.includes(koma);
}
