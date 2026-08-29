# yugokyo — 『湯語教』対訳リーダー

江戸の銭湯経営手引書『湯語教／一名銭湯手引草』（向晦亭等琳・嘉永4年/1851）を
現代語で読めるようにする個人プロジェクト。まずローカル、公開は後日相談。

## 構成

- Vite + React + TS + Tailwind（sentokentei と同系。DADSは不使用、オリジナルトークン）
- UIルールは **DESIGN.md が唯一の正**。実装前に必ず読む
- `corpus/koma-XX.json` … 1見開き=1ファイルの翻刻・現代語訳データ（進捗が消えない単位でコミット）
- `sources/ndl/` … NDL画像（出典・ライセンスは sources/README.md）
- `public/koma/` … Web表示用縮小画像

## 資料の扱い（重要）

- サイト掲載画像は **NDL本（保護期間満了）のみ**。東書文庫本（国書DB）は照合参照のみで転載禁止
- 翻刻は AI翻刻・未校正。UI・aboutページで必ず明示する
- 崩れて読めない字は推測で確定しない。`confidence` フラグで「未確定」にする

## コマンド

- `npm run dev` / `npm run build` / `npm run typecheck`
- `npm run fetch:sources` … NDL画像の再取得
- `npm run check:corpus` … コーパス整合チェック
