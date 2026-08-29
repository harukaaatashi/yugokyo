/**
 * NDLデジタルコレクション『洗湯手引草』(pid 2539997, 保護期間満了) の
 * 全38コマを IIIF Image API から sources/ndl/ へダウンロードする。
 * 再実行しても既存ファイルはスキップする。
 */
import { mkdirSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const PID = "2539997";
const KOMA_COUNT = 38;
const OUT_DIR = join(import.meta.dirname ?? ".", "..", "sources", "ndl");

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  for (let i = 1; i <= KOMA_COUNT; i++) {
    const koma = `R${String(i).padStart(7, "0")}`;
    const out = join(OUT_DIR, `koma-${String(i).padStart(2, "0")}.jpg`);
    if (existsSync(out)) {
      console.log(`skip ${out}`);
      continue;
    }
    const url = `https://dl.ndl.go.jp/api/iiif/${PID}/${koma}/full/2400,/0/default.jpg`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url} -> ${res.status}`);
    writeFileSync(out, Buffer.from(await res.arrayBuffer()));
    console.log(`saved ${out}`);
    await new Promise((r) => setTimeout(r, 800)); // NDLに負荷をかけない
  }
}

main();
