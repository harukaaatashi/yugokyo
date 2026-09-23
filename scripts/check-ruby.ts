/**
 * ルビ解析（src/lib/ruby.ts）の不変条件を corpus 全体で保証する。
 *
 * 中心は往復一致テスト: 解析結果からトークンを組み直したものが、
 * 元の原文と1文字も違わないこと。ルビ化で本文が落ちたり増えたりしていないことを、
 * UI から独立に確かめられる。
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  LONG_BASE,
  parseGenbun,
  type GenbunLine,
} from "../src/lib/ruby";

const root = join(import.meta.dirname ?? ".", "..");
const corpusDir = join(root, "corpus");

const KANJI = /[々〆〇㐀-䶿一-鿿]/;
const KANA_ONLY = /^[ぁ-ゖー]+$/;

/** 解析結果を元の表記に組み直す。これが原文と一致すれば無損失 */
function reconstruct(lines: GenbunLine[]): string {
  return lines
    .map((line) =>
      line
        .map((run) => {
          const body = run.tokens
            .map((t) => (t.t === "text" ? t.s : `${t.base}（${t.rt}）`))
            .join("");
          return run.uncertain ? `｛${body}｝` : body;
        })
        .join("")
    )
    .join("\n");
}

const errors: string[] = [];
const warnings: string[] = [];
let rubyCount = 0;
let literalCount = 0;
let longest = { base: "", rt: "" };
const seenLongBases = new Set<string>();
const literals = new Set<string>();

const files = readdirSync(corpusDir).filter((f) => /^koma-\d{2}\.json$/.test(f));

for (const f of files.sort()) {
  const data = JSON.parse(readFileSync(join(corpusDir, f), "utf8"));
  if (!Array.isArray(data.sections)) continue;

  data.sections.forEach((s: Record<string, unknown>, i: number) => {
    const original = typeof s.original === "string" ? s.original : "";
    if (!original) return;
    const where = `${f}: sections[${i}]`;

    // 1. 往復一致 — ルビ化で1文字も失われていない
    const lines = parseGenbun(original);
    const back = reconstruct(lines);
    if (back !== original) {
      errors.push(
        `${where}: 往復一致しない\n    元: ${original.slice(0, 60)}\n    後: ${back.slice(0, 60)}`
      );
    }

    // 2. ｛｝境界をまたぐ親文字がない（解析順序が依存する不変条件）
    //    ｝の直後にルビ括弧が来ていたら、親文字が境界をまたいでいる可能性がある
    if (/｝（[ぁ-ゖー]+）/.test(original)) {
      errors.push(`${where}: ｛｝の直後にルビ括弧がある（親文字が境界をまたぐ）`);
    }

    // 3. 統計と、未レビューの長い親文字の検出
    for (const line of lines) {
      for (const run of line) {
        for (const t of run.tokens) {
          if (t.t !== "ruby") continue;
          rubyCount += 1;
          if (t.rt.length > longest.rt.length) longest = { base: t.base, rt: t.rt };
          if (!KANA_ONLY.test(t.rt)) {
            warnings.push(`${where}: 読みに平仮名以外 「${t.rt}」`);
          }
        }
      }
    }

    // 素の括弧（ルビにしなかったもの）を数える
    for (const m of original.matchAll(/（([^）)]*)）/g)) {
      const before = original.slice(0, m.index);
      const isRuby = KANA_ONLY.test(m[1] ?? "") && !!before && KANJI.test(before.slice(-1));
      if (!isRuby) {
        literalCount += 1;
        literals.add(m[0]);
      }
    }

    // 貪欲に取ると3字以上になる親文字が LONG_BASE に載っているか
    for (const m of original.matchAll(/（([ぁ-ゖー]+)）/g)) {
      const before = original.slice(0, m.index);
      if (!before || !KANJI.test(before.slice(-1))) continue;
      let start = before.length;
      while (start > 0 && KANJI.test(before[start - 1]!)) start -= 1;
      const run = before.slice(start);
      if (run.length < 3) continue;
      seenLongBases.add(run);
      if (!LONG_BASE.has(run)) {
        errors.push(
          `${where}: 未レビューの長い親文字 「${run}（${m[1]}）」` +
            ` — src/lib/ruby.ts の LONG_BASE に、末尾何字を親文字にするか書くこと`
        );
      }
    }
  });
}

// 4. LONG_BASE 自体の健全性
for (const [key, keep] of LONG_BASE) {
  if (keep < 1 || keep > key.length) {
    errors.push(`LONG_BASE["${key}"] = ${keep} が範囲外（1〜${key.length}）`);
  }
  if (!seenLongBases.has(key)) {
    errors.push(`LONG_BASE["${key}"] は corpus のどこにも現れない（死んだエントリ）`);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`corpus files: ${files.length}`);
console.log(`ruby: ${rubyCount} / literal parens: ${literalCount}`);
console.log(`longest reading: ${longest.base}（${longest.rt}）`);
console.log(`long bases reviewed: ${seenLongBases.size} / LONG_BASE: ${LONG_BASE.size}`);
console.log(`literal parens: ${[...literals].join(" ")}`);
if (warnings.length) console.warn(warnings.join("\n"));
console.log("ok");
