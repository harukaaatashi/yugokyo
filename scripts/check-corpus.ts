/**
 * corpus/*.json の整合チェック:
 * - koma がファイル名と一致し 1..38 の範囲
 * - 必須フィールドが揃っている
 * - image が public/ 配下に実在する
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname ?? ".", "..");
const corpusDir = join(root, "corpus");

const errors: string[] = [];
const files = readdirSync(corpusDir).filter((f) => /^koma-\d{2}\.json$/.test(f));

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
    data.sections.forEach((s: Record<string, unknown>, i: number) => {
      if (!["heading", "text", "illustration"].includes(s.kind as string)) {
        errors.push(`${f}: sections[${i}].kind が不正 (${s.kind})`);
      }
      if (s.kind !== "illustration" && !s.original) {
        errors.push(`${f}: sections[${i}] に original がない`);
      }
      const braces = String(s.original ?? "");
      const open = (braces.match(/｛/g) ?? []).length;
      const close = (braces.match(/｝/g) ?? []).length;
      if (open !== close) errors.push(`${f}: sections[${i}] の｛｝が非対称`);
    });
  }
}

console.log(`corpus files: ${files.length}`);
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log("ok");
