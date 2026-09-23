/**
 * 表示用の縮小画像を public/koma/w960 と public/koma/w320 に作る。
 *
 * 原寸（1600×1383・1枚480KB）は拡大表示でしか使わない。
 * 追随パネルの表示幅は最大440px（2倍DPRで880px）、目次のサムネは80pxなので、
 * 原寸のまま出すと目次を開くだけで6MBになる。
 *
 * トリミング（下端の定規・ラベル帯を落とす）は **CSS 側で行う**ので、ここでは縮小だけ。
 * 切り方を変えたくなったときに画像を作り直さずに済む。
 *
 * macOS の sips を使う（追加の依存を増やさないため）。生成物はコミットするので、
 * CI では実行しない。原本を取り直したときだけ手元で流す。
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname ?? ".", "..");
const src = join(root, "public", "koma");
const SIZES = [960, 320] as const;
const KOMA_COUNT = 38;

for (const size of SIZES) {
  const outDir = join(src, `w${size}`);
  mkdirSync(outDir, { recursive: true });
  let made = 0;
  let bytes = 0;

  for (let i = 1; i <= KOMA_COUNT; i++) {
    const name = `koma-${String(i).padStart(2, "0")}.jpg`;
    const input = join(src, name);
    const output = join(outDir, name);
    if (!existsSync(input)) throw new Error(`原本が見つからない: ${input}`);
    if (!existsSync(output)) {
      execFileSync("sips", ["-Z", String(size), input, "--out", output], {
        stdio: "pipe",
      });
      made += 1;
    }
    bytes += statSync(output).size;
  }
  console.log(
    `w${size}: ${made}枚生成 / 合計 ${(bytes / 1024 / 1024).toFixed(1)}MB`
  );
}
