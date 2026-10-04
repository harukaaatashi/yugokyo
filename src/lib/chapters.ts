/**
 * 章の定義 — corpus（1見開き=1ファイル）の上に載せる索引。
 *
 * 原本の章境界は紙の途中に来る（14丁は前半が序の末尾、後半から湯語教の本文）。
 * そのため章は丁ではなく **{ koma, section } のセクション単位** で開始位置を指す。
 *
 * 各章は `start` だけを持ち、**終端は次章の start の直前として導出する**。
 * 範囲を両端で持つと、終端と次章の開始を手で同期し続けることになり、
 * 隙間・重複・ずれが起こりうる。start だけならそのバグのクラスが原理的に消える。
 *
 * このファイルは scripts/check-corpus.ts からも import される。
 * **Vite の API（import.meta.glob 等）を書かないこと。**
 */

/** corpus 全体を koma → section の順に並べたときの位置 */
export type Cursor = { koma: number; section: number };

/** front=扉 / chapter=番号つき本編 / back=巻末。番号は chapter にだけ振る */
export type ChapterKind = "front" | "chapter" | "back";

export interface ChapterDef {
  /** URLスラッグ。/chapter/:id */
  id: string;
  kind: ChapterKind;
  /** 現代表記の章タイトル。目次とリーダーのヘッダに出す */
  title: string;
  /** 目次に出す1〜2文 */
  summary: string;
  /** 英語表示のときのタイトルと要約 */
  titleEn: string;
  summaryEn: string;
  /** 章の開始位置。終端は次章の start の直前 */
  start: Cursor;
  /** 目次のサムネに使う丁。未指定なら章内の挿絵、なければ komaFrom */
  cover?: number;
}

export const CHAPTERS: readonly ChapterDef[] = [
  {
    id: "hyoshi",
    cover: 1,
    kind: "front",
    title: "表紙と目録",
    summary:
      "題箋だけの素朴な仮綴じの表紙と、巻頭の目録。銭湯の由来から証文のひな形、薪の相場表まで、この一冊が何を載せているかが目録だけで見渡せます。",
    titleEn: "Cover and contents",
    summaryEn:
      "A plain paper cover with only a title slip, followed by the table of contents. From the origins of the bathhouse to model deeds and a firewood price table, the contents alone show everything this little book covers.",
    start: { koma: 1, section: 0 },
  },
  {
    // 2丁の右半分は目録。sections[2] の見出し「序」から本編がはじまる
    id: "jo",
    cover: 3,
    kind: "chapter",
    title: "序 — 銭湯に五常の道あり",
    summary:
      "湯屋という商売のいろはを、忙しい人のために手っ取り早く説く、という書き出し。裸になれば身分の上下はないという銭湯讃歌から、仁・義・礼・智・信の五常になぞらえた経営者の心得へ。",
    titleEn: "Preface — the Five Virtues of the bathhouse",
    summaryEn:
      "The author promises busy readers a quick, practical guide to the bathhouse trade. It opens in praise of the bath, where rank disappears once everyone is naked, and moves on to an owner’s code modeled on the Five Constant Virtues: benevolence, righteousness, propriety, wisdom and sincerity.",
    start: { koma: 2, section: 2 },
  },
  {
    id: "yurai",
    cover: 8,
    kind: "chapter",
    title: "洗湯之由来 — 光明皇后の施浴",
    summary:
      "銭湯の起源として語られる光明皇后の千人施浴伝説。千人目に現れた病人の正体は阿閦仏だった、という結びまで。挿絵が2枚つきます。",
    titleEn: "How bathhouses began — Empress Kōmyō’s baths",
    summaryEn:
      "The legend told as the origin of the bathhouse: Empress Kōmyō vows to wash a thousand people, and the thousandth, a sick man, turns out to be Akshobhya Buddha. With two illustrations.",
    start: { koma: 7, section: 0 },
  },
  {
    id: "gokyo-jo",
    cover: 12,
    kind: "chapter",
    title: "湯語教のはしがき",
    summary:
      "本文に入る前の断り書き。寺子屋の教科書『実語教』の体裁を借りて湯屋の心得を説く、というこの本の趣向を説明します。湯屋の道具を描いた挿絵から。",
    titleEn: "A note before the Yugokyō",
    summaryEn:
      "A short foreword before the main text. It explains the book’s conceit: teaching the bathhouse trade in the style of the Jitsugokyō, the standard primer of Edo-period temple schools. Opens with an illustration of bathhouse tools.",
    start: { koma: 12, section: 0 },
  },
  {
    // 14丁の右半分は「はしがき」の末尾。sections[1] の見出し「湯語教」から本文
    id: "gokyo",
    cover: 14,
    kind: "chapter",
    title: "湯語教 本文",
    summary:
      "この本の中心。『実語教』そっくりの総ルビの対句で、湯屋株・客あしらい・井戸と薪・設備と防火・使用人まで、経営の心得を一気に説きます。「湯屋磨かざれば光沢なし」。",
    titleEn: "The Yugokyō — main text",
    summaryEn:
      "The heart of the book. In rhythmic couplets that mimic the Jitsugokyō, it covers bathhouse licenses, handling customers, wells and firewood, fittings and fire safety, and staff. “A bathhouse unpolished has no shine.”",
    start: { koma: 14, section: 1 },
  },
  {
    id: "bangumi",
    cover: 23,
    kind: "chapter",
    title: "湯屋番組大意略と十組割附",
    summary:
      "文化5年（1808）に町奉行所が公認した湯屋仲間の組合組織と、十の組に分かれた江戸の湯屋の株数一覧。合計はおよそ600株。組合を回す当番表まで載ります。",
    titleEn: "The guild and its Ten Groups",
    summaryEn:
      "The bathhouse guild officially recognized by the city magistrate in Bunka 5 (1808), and a list of Edo’s bathhouse licenses, about 600 in all, divided into ten groups. Includes the duty roster used to run the guild.",
    start: { koma: 22, section: 1 },
  },
  {
    id: "banzai",
    cover: 26,
    kind: "chapter",
    title: "湯屋万歳暦 — 銭湯の年表",
    summary:
      "寛永の湯女風呂から、湯銭の変遷、寛政3年の混浴禁止、文政の大火、天保の改革まで。江戸の銭湯およそ200年を年表で追います。",
    titleEn: "The Bathhouse Almanac — a timeline",
    summaryEn:
      "From the yuna bathhouses of the Kan’ei era to changing bath fees, the ban on mixed bathing in Kansei 3 (1791), the great Bunsei fire and the Tenpō reforms: some 200 years of Edo bathhouses in a timeline.",
    start: { koma: 25, section: 2 },
  },
  {
    id: "sadame",
    cover: 29,
    kind: "chapter",
    title: "定・店法度書",
    summary:
      "店先に掲げる決まり書き。喧嘩口論の禁止、金銀の預かり、そして男湯・女湯それぞれの定。",
    titleEn: "House rules",
    summaryEn:
      "Rules to post at the entrance: no quarrels or fights, how money and valuables are left with the house, and separate rules for the men’s and women’s baths.",
    start: { koma: 29, section: 0 },
  },
  {
    id: "shomon",
    cover: 31,
    kind: "chapter",
    title: "証文ひな形集",
    summary:
      "湯屋の譲渡・敷金・家作の売渡し、それぞれの証文の書き方。途中の「薪買出し早割附」は、原本が上段の別の帯として挟み込んだ薪の早見表です。",
    titleEn: "Model deeds",
    summaryEn:
      "How to write deeds for transferring a bathhouse, for a security deposit, and for selling the building. The firewood quick-reference table in the middle runs as a separate band across the top of the original pages.",
    start: { koma: 30, section: 1 },
  },
  {
    id: "ukejo",
    cover: 33,
    kind: "chapter",
    title: "奉公人請状",
    summary:
      "奉公人を雇うときの身元保証書のひな形と、稼人（かせぎにん）の心得。給金や引板の取り決めまで具体的です。",
    titleEn: "A servant’s letter of guarantee",
    summaryEn:
      "A model letter of guarantee for hiring staff, plus rules for live-in workers. It goes into specifics, down to wages and the “hikiita” arrangements.",
    start: { koma: 33, section: 0 },
  },
  {
    id: "maki",
    cover: 35,
    kind: "chapter",
    title: "諸薪・古木の相場",
    summary:
      "枯松・下松・古木など、薪の種類ごとの値段表。文化年間の値上がりの記録でもあります。早見表のほうは前章31丁の上段から続いています。",
    titleEn: "Prices of firewood and scrap timber",
    summaryEn:
      "A price table by type of fuel, such as dead pine, lower-grade pine and scrap timber. It also records how prices rose during the Bunka era. The quick-reference table continues from the top band of spread 31 in the previous chapter.",
    start: { koma: 35, section: 0 },
  },
  {
    id: "owari",
    cover: 36,
    kind: "chapter",
    title: "町触・刊記と三宝日",
    summary:
      "天保12年（1841）の町奉行所の触書。湯屋の開業が完全な許可制だったことがわかります。嘉永4年5月の刊記と、巻末に三宝日を知るための円盤図。",
    titleEn: "Town ordinance, colophon and the sanpō-bi wheel",
    summaryEn:
      "An ordinance from the city magistrate in Tenpō 12 (1841), showing that opening a bathhouse required full official permission. Then the colophon dated the 5th month of Kaei 4 (1851), and at the very end a dial chart for finding sanpō-bi, the “Three Treasures” days.",
    start: { koma: 36, section: 0 },
  },
  {
    id: "urabyoshi",
    cover: 38,
    kind: "back",
    title: "裏表紙",
    summary: "無地の裏表紙。左端に和装本の四つ目綴じの糸が見えます。",
    titleEn: "Back cover",
    summaryEn:
      "A plain back cover. At the left edge you can see the thread of the traditional four-hole Japanese binding.",
    start: { koma: 38, section: 0 },
  },
];
