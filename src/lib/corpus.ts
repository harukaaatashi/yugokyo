import { CHAPTERS, type ChapterDef, type Cursor } from "./chapters";

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

/**
 * corpus の image は "/koma/koma-01.jpg" の絶対パス。
 * GitHub Pages のようなサブディレクトリ配信に備えて base を前置する。
 */
export function imageUrl(path: string): string {
  return import.meta.env.BASE_URL.replace(/\/$/, "") + path;
}

/* ---------------- 章の組み立て ----------------
 * 章定義（chapters.ts）は開始位置だけを持つ。終端は次章の開始の直前として導出する。
 * 表示用には「丁マーカー」と「セクション」が交互に並ぶ平坦な列に変換する。
 */

export interface FlatSection {
  koma: number;
  index: number;
  section: Section;
}

/** 全セクションを koma → section の順に並べたもの */
export const flatSections: FlatSection[] = komaList.flatMap((k) =>
  k.sections.map((section, index) => ({ koma: k.koma, index, section }))
);

const rankByCursor = new Map(
  flatSections.map((f, i) => [`${f.koma}:${f.index}`, i] as const)
);

function cursorRank(c: Cursor): number {
  const rank = rankByCursor.get(`${c.koma}:${c.section}`);
  if (rank === undefined) {
    throw new Error(`chapters.ts: 存在しない位置 ${c.koma}:${c.section}`);
  }
  return rank;
}

export type FlowItem =
  | {
      type: "koma";
      key: string;
      koma: Koma;
      /** アンカー用のDOM id。/read/:koma からの転送先 */
      anchorId: string;
      /** この丁が章をまたいでいるか（前の章から続く / 次の章へ続く） */
      continues: { from: boolean; to: boolean };
    }
  | {
      type: "section";
      key: string;
      koma: number;
      index: number;
      section: Section;
    };

export interface Chapter {
  def: ChapterDef;
  /** kind==="chapter" の通し番号。扉・巻末は null */
  number: number | null;
  items: FlowItem[];
  komaFrom: number;
  komaTo: number;
  charCount: number;
  /** 循環参照を避けるため id で持つ */
  prevId: string | null;
  nextId: string | null;
}

export function komaAnchorId(koma: number): string {
  return `koma-${koma}`;
}

function buildChapters(): Chapter[] {
  let chapterNo = 0;

  return CHAPTERS.map((def, i) => {
    const from = cursorRank(def.start);
    const next = CHAPTERS[i + 1];
    const to = (next ? cursorRank(next.start) : flatSections.length) - 1;
    const slice = flatSections.slice(from, to + 1);

    const komaFrom = slice[0].koma;
    const komaTo = slice[slice.length - 1].koma;
    // 章の先頭・末尾が丁の途中なら、その丁は隣の章と画像を共有する
    const startsMidKoma = def.start.section > 0;
    const lastKomaSections = komaByNumber.get(komaTo)?.sections.length ?? 0;
    const endsMidKoma = slice[slice.length - 1].index < lastKomaSections - 1;

    const items: FlowItem[] = [];
    let currentKoma: number | null = null;
    for (const f of slice) {
      if (f.koma !== currentKoma) {
        currentKoma = f.koma;
        const koma = komaByNumber.get(f.koma);
        if (koma) {
          items.push({
            type: "koma",
            key: `k${f.koma}`,
            koma,
            anchorId: komaAnchorId(f.koma),
            continues: {
              from: f.koma === komaFrom && startsMidKoma,
              to: f.koma === komaTo && endsMidKoma,
            },
          });
        }
      }
      items.push({
        type: "section",
        key: `s${f.koma}-${f.index}`,
        koma: f.koma,
        index: f.index,
        section: f.section,
      });
    }

    return {
      def,
      number: def.kind === "chapter" ? ++chapterNo : null,
      items,
      komaFrom,
      komaTo,
      charCount: slice.reduce(
        (n, f) =>
          n + (f.section.original?.length ?? 0) + (f.section.modern?.length ?? 0),
        0
      ),
      prevId: CHAPTERS[i - 1]?.id ?? null,
      nextId: next?.id ?? null,
    };
  });
}

export const chapters: Chapter[] = buildChapters();

export const chapterById = new Map(chapters.map((c) => [c.def.id, c]));

/** 番号つき本編の章数（扉・巻末を除く） */
export const TOTAL_CHAPTERS = chapters.filter(
  (c) => c.def.kind === "chapter"
).length;

export const FIRST_CHAPTER_ID = chapters[0].def.id;

/** 丁番号から、その丁の先頭セクションを含む章を引く（旧 /read/:koma の転送用） */
export function chapterForKoma(koma: number): Chapter | null {
  return (
    chapters.find((c) =>
      c.items.some((it) => it.type === "section" && it.koma === koma)
    ) ?? null
  );
}

export const NDL_ITEM_URL = "https://dl.ndl.go.jp/pid/2539997";

export function ndlViewerUrl(koma: number): string {
  return `${NDL_ITEM_URL}/1/${koma}`;
}

/* ---------------- 読書位置 ----------------
 * v1 は丁番号だけを持っていた。章化にともない {章id, 丁} に移行する。
 * 旧キーは読むだけで消さない（切り戻しても読者の進捗が失われないように）。
 */

const LAST_READ_KEY = "yugokyo:lastRead"; // v2: {chapterId, koma}
const LAST_KOMA_KEY = "yugokyo:lastKoma"; // v1: 丁番号のみ

export interface Progress {
  chapterId: string;
  koma: number;
}

export function saveProgress(p: Progress) {
  try {
    localStorage.setItem(LAST_READ_KEY, JSON.stringify(p));
  } catch {
    /* private mode等では保存しない */
  }
}

export function loadProgress(): Progress | null {
  try {
    const raw = localStorage.getItem(LAST_READ_KEY);
    if (raw) {
      const v = JSON.parse(raw) as Partial<Progress>;
      const chapter =
        typeof v?.chapterId === "string" ? chapterById.get(v.chapterId) : undefined;
      if (chapter) {
        const koma = Number(v.koma);
        return {
          chapterId: chapter.def.id,
          koma: komaByNumber.has(koma) ? koma : chapter.komaFrom,
        };
      }
    }
    // v1 からの移行: 丁番号を、その丁を含む章に読み替える
    const legacy = localStorage.getItem(LAST_KOMA_KEY);
    if (legacy) {
      const n = Number(legacy);
      const chapter = Number.isInteger(n) ? chapterForKoma(n) : null;
      if (chapter) return { chapterId: chapter.def.id, koma: n };
    }
    return null;
  } catch {
    return null;
  }
}
