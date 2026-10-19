/**
 * 現代語訳の中に残す江戸の語（試作）。
 *
 * 訳は現代の言葉で読みやすく保ったまま、要の語だけを明朝＋ルビで残し、
 * タップで意味と「原本でのその字」を出す。古いものを読んでいる感覚を、
 * 本文の読みやすさを削らずに足すための仕掛け。
 *
 * 訳文は書き換えない。`word` が訳文にそのまま出てくる語だけを選ぶ
 * （その段落で最初に出てきた1か所だけを語として扱う）。
 *
 * `crop` は原寸画像（1600×1383）上の矩形。原本で同じ語が書かれている位置を目で測ったもの。
 */
export interface TermCrop {
  koma: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Term {
  /** 語を置く段落 */
  koma: number;
  index: number;
  word: string;
  yomi: string;
  /** 意味（現代の言葉で1〜2文） */
  mean: string;
  /** 原文での言い回し（その語が出てくる句） */
  source: string;
  crop: TermCrop;
}

export const TERMS: readonly Term[] = [
  {
    koma: 14,
    index: 2,
    word: "湯屋株",
    yomi: "ゆやかぶ",
    mean: "湯屋を営む権利。売り買いも相続もできる財産で、この本は「万代の財」と呼ぶ。",
    source: "湯株は是万代の財",
    crop: { koma: 14, x: 177, y: 138, w: 106, h: 167 },
  },
  {
    koma: 15,
    index: 0,
    word: "湯屋",
    yomi: "ゆや",
    mean: "江戸での銭湯の呼び名。上方では「風呂屋」と呼んだ。",
    source: "湯屋磨かざれば光澤なし",
    crop: { koma: 15, x: 1293, y: 132, w: 122, h: 160 },
  },
  {
    koma: 15,
    index: 0,
    word: "糠汁",
    yomi: "ぬかじる",
    mean: "米ぬかを布袋に入れて体を洗った、その汁。流し場を汚すもとになった。",
    source: "石垣磨かざれば糠汁に穢る",
    crop: { koma: 15, x: 1167, y: 378, w: 116, h: 164 },
  },
  {
    koma: 15,
    index: 1,
    word: "薪",
    yomi: "まき",
    mean: "湯を沸かす燃料。薪代は湯屋のいちばん重い出費で、後の丁には薪の相場表が続く。",
    source: "一日の薪代に引き合はず",
    crop: { koma: 15, x: 940, y: 882, w: 115, h: 100 },
  },
];

const EMPTY: readonly Term[] = [];
const byParagraph = new Map<string, Term[]>();
for (const t of TERMS) {
  const key = `${t.koma}:${t.index}`;
  byParagraph.set(key, [...(byParagraph.get(key) ?? []), t]);
}

/** その段落に置く語。段落ごとに同じ配列を返す（SectionBlock の memo を効かせるため） */
export function termsFor(koma: number, index: number): readonly Term[] {
  return byParagraph.get(`${koma}:${index}`) ?? EMPTY;
}
