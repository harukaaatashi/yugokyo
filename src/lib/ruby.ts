/**
 * 原文翻刻テキストを表示用トークンに分解する。
 *
 * corpus の原文には2種類の注記が埋まっている:
 *   - ｛…｝       読みが未確定の箇所（510件 / 64セクション）
 *   - 漢字（かな） 振り仮名（866件）
 *
 * 全38ファイルの実測で、ルビの親文字とその括弧が ｛｝ の境界をまたぐケースは 0 件だった。
 * よって「｛｝で切ってから、各断片の中だけでルビを解く」順序が安全に使える
 * （この不変条件は scripts/check-ruby.ts が守る）。
 *
 * このファイルは scripts/ からも import する。**Vite の API を書かないこと。**
 */

/** ルビの親文字になりうる漢字（CJK統合漢字＋々〆〇） */
const KANJI = /[々〆〇㐀-䶿一-鿿]/;

/** ルビの読み。実測で866件すべて平仮名（＋長音符）だった */
const KANA_ONLY = /^[ぁ-ゖー]+$/;

/** 括弧。閉じは半角 ) も受ける（翻刻ミスが再混入しても画面が壊れないように） */
const PAREN = /（([^）)]*)[）)]/g;

/**
 * 親文字を「直前の連続する漢字列」で取ると3字以上になる箇所の全件表。
 * 値 = 末尾から何字を親文字にするか（貪欲結果が正しければ自分自身の長さ）。
 *
 * 誤るのは「ルビの付かない修飾語が無仮名で前置される」型だけで、
 * モーラ数などの推測ルールでは解けないことが実測で確認済み
 * （月三日/みっか は3字3モーラで通過し、御立会/おたちあ が誤って削られる）。
 *
 * corpus に未知の長い親文字が現れたら check:ruby が落ちる。
 */
export const LONG_BASE: ReadonlyMap<string, number> = new Map([
  // ── 貪欲だと誤るもの（14種） ──
  ["横山町三丁目柳屋銀藏", 4], // 柳屋銀藏（やなぎやぎんざう）
  ["四十五代聖武皇帝", 4], // 聖武皇帝（しやうむくわうてい）
  ["男女入込湯", 3], // 入込湯（いりごみゆ）
  ["諸道具一式", 2], // 一式（いっしき）
  ["三月朔日", 2], // 朔日（ついたち）
  ["十組惣合", 2], // 惣合（そうがふ）
  ["同七午年", 2], // 午年（うまどし）
  ["湯屋家作", 2], // 家作（かさく）
  ["湯屋建家", 2], // 建家（たてや）
  ["湯屋敷金", 2], // 敷金（しきがね）
  ["右金子", 2], // 金子（きんす）
  ["月三日", 2], // 三日（みっか）
  ["湯屋譲", 1], // 譲（ゆず）り
  ["他人亦", 1], // 亦（また）
  // ── 貪欲で正しいもの（49種）。値は自分自身の長さ ──
  ["小田切土佐守様", 7],
  ["根岸肥前守様", 6],
  ["湯屋仲間番組", 6],
  ["奉公人請状", 5],
  ["文化五辰年", 5],
  ["何程何分", 4],
  ["光明皇后", 4],
  ["喜怒哀楽", 4],
  ["大願成就", 4],
  ["天保十三", 4],
  ["如是我聞", 4],
  ["店法度書", 4],
  ["御公儀様", 4],
  ["御奉行所", 4],
  ["沐浴上人", 4],
  ["洗湯語教", 4],
  ["湯屋十組", 4],
  ["湯屋渡世", 4],
  ["八分板", 3],
  ["右之通", 3],
  ["堀井戸", 3],
  ["壱人前", 3],
  ["奉公人", 3],
  ["奉行所", 3],
  ["客数多", 3],
  ["寺手形", 3],
  ["御府内", 3],
  ["御改革", 3],
  ["御法度", 3],
  ["御無用", 3],
  ["御立会", 3],
  ["文字金", 3],
  ["新湯屋", 3],
  ["早割附", 3],
  ["江戸中", 3],
  ["浄瑠璃", 3],
  ["深井戸", 3],
  ["湯澤山", 3],
  ["湯語教", 3],
  ["田舎者", 3],
  ["石榴口", 3],
  ["破風造", 3],
  ["祢宜町", 3],
  ["薪買出", 3],
  ["見世先", 3],
  ["観世音", 3],
  ["諸株式", 3],
  ["銭風呂", 3],
  ["阿閦佛", 3],
]);

export type RubyToken =
  | { t: "text"; s: string }
  | { t: "ruby"; base: string; rt: string };

/** ｛…｝の層。uncertain=true は「読みが未確定」 */
export interface GenbunRun {
  uncertain: boolean;
  tokens: RubyToken[];
}

/** 1行 = ラン（｛｝の内外）の並び。原文の \n は対句の改行なので行として構造化する */
export type GenbunLine = GenbunRun[];

function pushText(tokens: RubyToken[], s: string) {
  if (!s) return;
  const last = tokens[tokens.length - 1];
  if (last && last.t === "text") last.s += s;
  else tokens.push({ t: "text", s });
}

/** ｛｝を含まない断片をルビ解析する */
export function parseRuby(fragment: string): RubyToken[] {
  const tokens: RubyToken[] = [];
  let cursor = 0;
  PAREN.lastIndex = 0;
  let m: RegExpExecArray | null;

  while ((m = PAREN.exec(fragment)) !== null) {
    const reading = m[1] ?? "";
    const before = fragment.slice(cursor, m.index);

    // 読みが平仮名のみ、かつ直前が漢字のときだけルビにする。
    // それ以外（（此内佃島とも）（署名）等18件）は素の括弧のまま残す
    if (!KANA_ONLY.test(reading) || !before || !KANJI.test(before.slice(-1))) {
      pushText(tokens, fragment.slice(cursor, m.index + m[0].length));
      cursor = m.index + m[0].length;
      continue;
    }

    // 直前の連続する漢字列を親文字の候補にする
    let start = before.length;
    while (start > 0 && KANJI.test(before[start - 1]!)) start -= 1;
    const run = before.slice(start);
    const keep = run.length >= 3 ? (LONG_BASE.get(run) ?? run.length) : run.length;
    const base = run.slice(run.length - keep);

    pushText(tokens, before.slice(0, before.length - base.length));
    tokens.push({ t: "ruby", base, rt: reading });
    cursor = m.index + m[0].length;
  }

  pushText(tokens, fragment.slice(cursor));
  return tokens;
}

/** 原文1本 → 行の配列。各行は ｛｝のラン に分かれ、ランの中がルビトークン */
export function parseGenbun(source: string): GenbunLine[] {
  return source.split("\n").map((line) =>
    line
      .split(/(｛[^｝]*｝)/)
      .filter((part) => part !== "")
      .map<GenbunRun>((part) =>
        part.startsWith("｛") && part.endsWith("｝")
          ? { uncertain: true, tokens: parseRuby(part.slice(1, -1)) }
          : { uncertain: false, tokens: parseRuby(part) }
      )
  );
}

/** ルビと｛｝を取り除いた素の本文。往復一致テストに使う */
export function plainText(lines: GenbunLine[]): string {
  return lines
    .map((line) =>
      line
        .map((run) =>
          run.tokens.map((t) => (t.t === "text" ? t.s : t.base)).join("")
        )
        .join("")
    )
    .join("\n");
}
