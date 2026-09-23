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

const root = join(import.meta.dirname ?? ".", "..");
const corpusDir = join(root, "corpus");

interface RawSection {
  kind?: string;
  original?: string;
  modern?: string;
  note?: string;
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
      // heading の modern は短いラベルにする（説明は note へ）
      if (s.kind === "heading" && String(s.modern ?? "").length > 20) {
        errors.push(
          `${f}: sections[${i}] heading の modern が長すぎる（20字以内。説明は note へ）`
        );
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
  if (ch.kind === "front" && i !== 0) errors.push(`${where}: front は先頭章のみ`);
  if (ch.kind === "back" && i !== CHAPTERS.length - 1) {
    errors.push(`${where}: back は最終章のみ`);
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
