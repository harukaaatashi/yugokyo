/**
 * corpus/*.json と章定義の整合チェック:
 * - koma がファイル名と一致し 1..38 の範囲
 * - 必須フィールドが揃っている
 * - image が public/ 配下に実在する
 * - 章（src/lib/chapters.ts）が全セクションを過不足なく覆っている
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { CHAPTERS } from "../src/lib/chapters";
import { isSplittable } from "../src/lib/pages";

const root = join(import.meta.dirname ?? ".", "..");
const corpusDir = join(root, "corpus");

interface RawSection {
  kind?: string;
  original?: string;
  modern?: string;
  english?: string;
  note?: string;
  noteEn?: string;
}

const errors: string[] = [];
const files = readdirSync(corpusDir).filter((f) => /^koma-\d{2}\.json$/.test(f));
/** koma番号 → その丁のセクション一覧。章チェックと一覧表示で使う */
const sectionsByKoma = new Map<number, RawSection[]>();

for (const f of files) {
  const data = JSON.parse(readFileSync(join(corpusDir, f), "utf8"));
  const num = Number(f.match(/koma-(\d{2})/)![1]);
  if (data.koma !== num) errors.push(`${f}: koma=${data.koma} がファイル名と不一致`);
  if (data.koma < 1 || data.koma > 38) errors.push(`${f}: koma範囲外`);
  for (const key of ["label", "image", "summary", "sections", "status"]) {
    if (data[key] === undefined) errors.push(`${f}: ${key} がない`);
  }
  if (data.image && !existsSync(join(root, "public", data.image.replace(/^\//, "")))) {
    errors.push(`${f}: 画像 ${data.image} が見つからない`);
  }
  // 表示用の派生画像（npm run make:derivatives で作る）
  const base = `koma-${String(num).padStart(2, "0")}.jpg`;
  for (const size of ["w960", "w320"]) {
    if (!existsSync(join(root, "public", "koma", size, base))) {
      errors.push(`${f}: 派生画像 koma/${size}/${base} がない（npm run make:derivatives）`);
    }
  }
  if (isSplittable(num)) {
    for (const side of ["r", "l"]) {
      const page = `koma-${String(num).padStart(2, "0")}-${side}.jpg`;
      if (!existsSync(join(root, "public", "koma", "page", page))) {
        errors.push(`${f}: 片ページ koma/page/${page} がない（npm run make:derivatives）`);
      }
    }
  }
  if (Array.isArray(data.sections)) {
    sectionsByKoma.set(num, data.sections);
    data.sections.forEach((s: Record<string, unknown>, i: number) => {
      if (!["heading", "text", "illustration"].includes(s.kind as string)) {
        errors.push(`${f}: sections[${i}].kind が不正 (${s.kind})`);
      }
      if (s.kind !== "illustration" && !s.original) {
        errors.push(`${f}: sections[${i}] に original がない`);
      }
      const original = String(s.original ?? "");
      const open = (original.match(/｛/g) ?? []).length;
      const close = (original.match(/｝/g) ?? []).length;
      if (open !== close) errors.push(`${f}: sections[${i}] の｛｝が非対称`);
      if (/｛[^｝]*｛/.test(original)) errors.push(`${f}: sections[${i}] の｛｝が入れ子`);
      // ルビ括弧は全角で閉じる（半角 ) の混入は翻刻ミス）
      if (/（[ぁ-ゖー]+\)/.test(original)) {
        errors.push(`${f}: sections[${i}] にルビ括弧の半角 ) が混入`);
      }
      // 英訳の抜け。訳や注を足したら英訳も揃える（UIは日本語にフォールバックするが、英語表示で混ざる）
      if (s.modern && !s.english) errors.push(`${f}: sections[${i}] に english がない`);
      if (s.note && !s.noteEn) errors.push(`${f}: sections[${i}] に noteEn がない`);
      // heading の modern は短いラベルにする（説明は note へ）
      if (s.kind === "heading" && String(s.modern ?? "").length > 20) {
        errors.push(
          `${f}: sections[${i}] heading の modern が長すぎる（20字以内。説明は note へ）`
        );
      }
      // 段落が原本のどこに書かれているか（幕間の朱の枠）。原寸 1600×1383 の内側の矩形
      if (s.regions !== undefined) {
        const rs = s.regions as Record<string, number>[];
        const ok =
          Array.isArray(rs) &&
          rs.length > 0 &&
          rs.every(
            (r) =>
              [r.x, r.y, r.w, r.h].every(Number.isInteger) &&
              r.x >= 0 && r.y >= 0 && r.w > 0 && r.h > 0 &&
              r.x + r.w <= 1600 && r.y + r.h <= 1383
          );
        if (!ok) errors.push(`${f}: sections[${i}].regions が原本画像の範囲外か空`);
      }
      // 訳文に残す江戸の語。訳文は書き換えない方針なので、語は訳文にそのまま出てくること
      if (s.terms !== undefined) {
        if (!Array.isArray(s.terms)) {
          errors.push(`${f}: sections[${i}].terms が配列でない`);
        } else {
          for (const t of s.terms as Record<string, unknown>[]) {
            const where = `${f}: sections[${i}].terms「${t.word}」`;
            for (const key of ["word", "yomi", "mean", "source"]) {
              if (typeof t[key] !== "string" || !t[key]) errors.push(`${where} に ${key} がない`);
            }
            if (typeof t.word === "string" && !String(s.modern ?? "").includes(t.word)) {
              errors.push(`${where} が訳文に出てこない`);
            }
            // 原文での言い回しは、原文からルビ・未確定の括弧・改行・空白を除いたものにそのまま含まれること
            // （原文を読み直したときに、札の引用だけが古いまま残らないように）
            const flat = (x: string) => x.replace(/[\s　]/g, "");
            const plainOriginal = flat(
              original.replace(/（[ぁ-ゖー]+）/g, "").replace(/[｛｝]/g, "")
            );
            if (typeof t.source === "string" && !plainOriginal.includes(flat(t.source))) {
              errors.push(`${where} の source が原文に見つからない`);
            }
            const c = t.crop as Record<string, number> | undefined;
            if (c !== undefined) {
              // 原寸 1600×1383 の内側に収まる矩形
              const ok =
                [c.koma, c.x, c.y, c.w, c.h].every(Number.isInteger) &&
                c.koma >= 1 && c.koma <= 38 && c.x >= 0 && c.y >= 0 &&
                c.w > 0 && c.h > 0 && c.x + c.w <= 1600 && c.y + c.h <= 1383;
              if (!ok) errors.push(`${where} の crop が原本画像の範囲外`);
            }
          }
        }
      }
    });
  }
}

/* ---------- 章の整合チェック ---------- */

/** 全セクションを koma → section の順に並べたフラット列 */
const flat: { koma: number; section: number }[] = [];
for (const koma of [...sectionsByKoma.keys()].sort((a, b) => a - b)) {
  sectionsByKoma.get(koma)!.forEach((_, section) => flat.push({ koma, section }));
}
const rankOf = new Map(flat.map((c, i) => [`${c.koma}:${c.section}`, i]));

const seenIds = new Set<string>();
/** 各章の開始位置のフラット順。順序チェックと範囲の導出に使う */
const startRanks: number[] = [];

CHAPTERS.forEach((ch, i) => {
  const where = `chapters[${i}] ${ch.id}`;
  if (!/^[a-z0-9-]+$/.test(ch.id)) errors.push(`${where}: id が不正（^[a-z0-9-]+$）`);
  if (seenIds.has(ch.id)) errors.push(`${where}: id が重複`);
  seenIds.add(ch.id);
  if (!ch.title) errors.push(`${where}: title が空`);
  if (!ch.summary) errors.push(`${where}: summary が空`);
  if (!ch.titleEn || !ch.summaryEn) errors.push(`${where}: titleEn / summaryEn が空`);
  if (ch.kind === "front" && i !== 0) errors.push(`${where}: front は先頭章のみ`);
  if (ch.kind === "back" && i !== CHAPTERS.length - 1) {
    errors.push(`${where}: back は最終章のみ`);
  }
  if (!ch.exhibitCover || ch.exhibitCover.koma < 1 || ch.exhibitCover.koma > 38) {
    errors.push(`${where}: exhibitCover（章扉のページ）が不正`);
  }

  const rank = rankOf.get(`${ch.start.koma}:${ch.start.section}`);
  if (rank === undefined) {
    errors.push(
      `${where}: start ${ch.start.koma}:${ch.start.section} は存在しないセクション`
    );
    return;
  }
  startRanks.push(rank);
  if (i === 0 && rank !== 0) {
    errors.push(`${where}: 最初の章は 1:0 から始めること（本文の先頭が欠ける）`);
  }
  const prev = startRanks[startRanks.length - 2];
  if (prev !== undefined && rank <= prev) {
    errors.push(`${where}: start が前章以前を指している（章は昇順・重複なし）`);
  }
});

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

/* ---------- 章構成の一覧を出す ---------- */

/** 全角を2桁として数える簡易パディング（CLIの桁を揃えるため） */
const width = (s: string) =>
  [...s].reduce((n, c) => n + (/[\x20-\x7E]/.test(c) ? 1 : 2), 0);
const pad = (s: string, w: number) => s + " ".repeat(Math.max(0, w - width(s)));
const padStart = (s: string, w: number) => " ".repeat(Math.max(0, w - width(s))) + s;

let chapterNo = 0;
let totalChars = 0;
const lines: string[] = [];

CHAPTERS.forEach((ch, i) => {
  const from = rankOf.get(`${ch.start.koma}:${ch.start.section}`)!;
  const to = (i + 1 < CHAPTERS.length
    ? rankOf.get(`${CHAPTERS[i + 1]!.start.koma}:${CHAPTERS[i + 1]!.start.section}`)!
    : flat.length) - 1;
  const slice = flat.slice(from, to + 1);
  const chars = slice.reduce((n, c) => {
    const s = sectionsByKoma.get(c.koma)![c.section]!;
    return n + (s.original ?? "").length + (s.modern ?? "").length;
  }, 0);
  totalChars += chars;

  const komaFrom = slice[0]!.koma;
  const komaTo = slice[slice.length - 1]!.koma;
  const label =
    ch.kind === "chapter" ? String(++chapterNo) : ch.kind === "front" ? "扉" : "巻末";
  const range = komaFrom === komaTo ? `${komaFrom}丁` : `${komaFrom}〜${komaTo}丁`;
  lines.push(
    `${padStart(label, 4)}  ${pad(ch.title, 30)}${padStart(range, 9)}` +
      `${padStart(`${slice.length}節`, 6)}${padStart(`${chars.toLocaleString()}字`, 9)}`
  );
});

console.log(`corpus files: ${files.length}`);
console.log(`chapters: ${CHAPTERS.length}（本編${chapterNo}章）`);
console.log(lines.join("\n"));
console.log(`total ${flat.length} sections / ${totalChars.toLocaleString()}字`);
console.log("ok");
