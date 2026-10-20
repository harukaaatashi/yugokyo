/**
 * 現代語訳の中に残す江戸の語。corpus の段落が `terms` として持つ。
 *
 * 訳は現代の言葉で読みやすく保ったまま、要の語だけを明朝＋ルビで残し、
 * タップで意味と「原本でのその字」を出す。古いものを読んでいる感覚を、
 * 本文の読みやすさを削らずに足すための仕掛け。
 *
 * 訳文は書き換えない。`word` が訳文にそのまま出てくる語だけを選ぶ
 * （その段落で最初に出てきた1か所だけを語として扱う）。`npm run check:corpus` が確かめる。
 */
export interface TermCrop {
  koma: number;
  /** 原寸画像（1600×1383）上の矩形。原本で同じ語が書かれている位置を目で測ったもの */
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Term {
  word: string;
  yomi: string;
  /** 意味（現代の言葉で1〜2文） */
  mean: string;
  /** 原文での言い回し（その語が出てくる句） */
  source: string;
  /** 原本でのその字。まだ測っていない語にはない */
  crop?: TermCrop;
}
