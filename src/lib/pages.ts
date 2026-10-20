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

/**
 * 切り出す矩形（原寸1600×1383のピクセル座標）。
 * 右ページは画像の右半分（綴じ目より右）、左ページは左半分
 */
export const PAGE_CROP: Record<PageSide, { x: number; y: number; w: number; h: number }> = {
  r: { x: 815, y: 60, w: 700, h: 1090 },
  l: { x: 115, y: 60, w: 700, h: 1090 },
};

/**
 * 割らない丁。
 * 1=表紙は本が左半分、38=裏表紙は本が右半分にだけ写る別構図、8=光明皇后の施浴は見開き全面の一枚絵、
 * 37=三宝日の裏写りはほぼ白紙。いずれも割ると意味が壊れる
 */
export const SPREAD_ONLY_KOMA: readonly number[] = [1, 8, 37, 38];

export function isSplittable(koma: number): boolean {
  return !SPREAD_ONLY_KOMA.includes(koma);
}

/**
 * 見開き画像のうち本が写っている範囲（原寸の座標）。幕間はこの範囲だけを見せる。
 * `src/index.css` の `.koma-book` はこの値から作った割合なので、変えるときは両方を直す
 */
export const BOOK_RECT = { x: 128, y: 52, w: 1382, h: 1090 } as const;

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * 本が見開きの片側にだけ写っている丁（表紙・裏表紙）で、本が写っている範囲（原寸の座標）。
 * 見開きから本だけを切り出す `.koma-book` の範囲に収まらないので、この矩形で切る。
 * 紙の色で本の縁を拾い、少し余白を足した値
 */
export const HALF_BOOK_RECT: Readonly<Record<number, Rect>> = {
  1: { x: 70, y: 55, w: 760, h: 1080 },
  38: { x: 790, y: 55, w: 760, h: 1080 },
};
