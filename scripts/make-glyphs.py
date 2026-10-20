"""
本文に残した江戸の語の「原本の字」を、背景を抜いた墨の字にして public/glyphs/ に書き出す。

corpus の `terms[].crop`（原寸画像上の矩形）を切り抜き、紙を透明に、墨を ink(#33302B) にする。
作るのは2種類:

  {koma}-{x}-{y}.png      語まるごと（縦書きのまま）。語の札の左に大きく出す
  {koma}-{x}-{y}-{i}.png  1字ずつ。本文の中に横に並べて、訳語の代わりに置く

1字ずつのほうは、原本の表記が訳語と同じ語（`source` に `word` がそのまま出てくる語）だけ作る。
「湯株」を「湯屋株」として本文にはめると、原本にない字を原本の字として見せてしまうため。
語の中の字は同じ縮尺にそろえる（字ごとに高さを合わせると、小さい字だけ太って見える）。

Pillow と NumPy を使う。生成物はコミットするので CI では実行しない。
語の切り抜きを足したり測り直したりしたときだけ手元で流す:  npm run make:glyphs
"""

import glob
import json
import os
from collections import deque

import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
SRC = os.path.join(ROOT, "public", "koma")
OUT = os.path.join(ROOT, "public", "glyphs")
INK = (0x33, 0x30, 0x2B)
PAD = 4


def alpha_of(gray: np.ndarray) -> np.ndarray:
    """紙=0、墨=1 の不透明度。紙と墨の明るさは切り抜きごとに測る（丁ごとに紙の焼けが違う）"""
    paper = np.percentile(gray, 90)
    ink = np.percentile(gray, 3)
    hi, lo = paper - 12, ink + 20
    return np.clip((hi - gray) / max(hi - lo, 1), 0, 1)


def keep_strokes(alpha: np.ndarray) -> np.ndarray:
    """紙の染み・裏写りの小さな点を落とす。大きい塊（字の画）と、その周りだけを残す"""
    solid = alpha > 0.35
    h, w = solid.shape
    label = np.zeros((h, w), dtype=np.int32)
    sizes = [0]
    for sy in range(h):
        for sx in range(w):
            if not solid[sy, sx] or label[sy, sx]:
                continue
            n = len(sizes)
            label[sy, sx] = n
            size = 0
            queue = deque([(sy, sx)])
            while queue:
                y, x = queue.popleft()
                size += 1
                for dy in (-1, 0, 1):
                    for dx in (-1, 0, 1):
                        ny, nx = y + dy, x + dx
                        if 0 <= ny < h and 0 <= nx < w and solid[ny, nx] and not label[ny, nx]:
                            label[ny, nx] = n
                            queue.append((ny, nx))
            sizes.append(size)
    if len(sizes) == 1:
        return alpha
    floor = max(40, max(sizes) * 0.04)
    boxes = {}
    for i in range(1, len(sizes)):
        ys, xs = np.nonzero(label == i)
        boxes[i] = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)
    # 字の柱（大きい画が並ぶ横幅）。原本のふりがなは柱の右に小さく添えてあるので、柱の外の塊は落とす
    big = [i for i in boxes if sizes[i] >= max(sizes) * 0.25]
    left = min(boxes[i][0] for i in big)
    right = max(boxes[i][2] for i in big)
    reach = h * 0.12

    def kept(i: int) -> bool:
        if sizes[i] < floor:
            return False
        x0, y0, x1, y1 = boxes[i]
        if not left - 4 <= (x0 + x1) / 2 <= right + 4:
            return False
        # 上下の端にかかった塊は、隣の字のはみ出し（切り抜きの外の字の一部）
        if (y0 == 0 and y1 < reach * 2) or (y1 == h and y0 > h - reach * 2):
            return False
        return True

    keep = np.isin(label, [i for i in boxes if kept(i)])
    # 画の縁のかすれ（閾値に届かない淡い墨）を落とさないよう、残す範囲を少し広げる
    mask = Image.fromarray((keep * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5))
    return alpha * (np.asarray(mask) > 0)


def bbox(alpha: np.ndarray):
    ys, xs = np.nonzero(alpha > 0.05)
    if len(ys) == 0:
        raise ValueError("墨が見つからない")
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


def to_png(alpha: np.ndarray, path: str) -> None:
    h, w = alpha.shape
    rgba = np.zeros((h, w, 4), dtype=np.uint8)
    rgba[..., :3] = INK
    rgba[..., 3] = np.round(alpha * 255).astype(np.uint8)
    Image.fromarray(rgba, "RGBA").save(path, optimize=True)


def padded(alpha: np.ndarray, x0, y0, x1, y1, height=None) -> np.ndarray:
    """矩形の墨を余白つきで取り出す。height を渡すと、その高さの中で上下中央に置く"""
    part = alpha[y0:y1, x0:x1]
    h = height if height is not None else part.shape[0]
    out = np.zeros((h + PAD * 2, part.shape[1] + PAD * 2))
    top = PAD + (h - part.shape[0]) // 2
    out[top : top + part.shape[0], PAD : PAD + part.shape[1]] = part
    return out


def split_rows(alpha: np.ndarray, n: int) -> list:
    """縦に並んだ n 字を、字と字の間（墨のいちばん少ない行）で切り分ける"""
    h = alpha.shape[0]
    rows = alpha.sum(axis=1)
    cuts = [0]
    for k in range(1, n):
        guess = round(h * k / n)
        reach = max(2, round(h / n * 0.3))
        lo, hi = max(cuts[-1] + 1, guess - reach), min(h - 1, guess + reach)
        cuts.append(lo + int(np.argmin(rows[lo:hi])))
    cuts.append(h)
    return list(zip(cuts, cuts[1:]))


def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    made = []
    for path in sorted(glob.glob(os.path.join(ROOT, "corpus", "koma-*.json"))):
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        for section in data.get("sections", []):
            for term in section.get("terms", []):
                crop = term.get("crop")
                if not crop:
                    continue
                koma, x, y, w, h = crop["koma"], crop["x"], crop["y"], crop["w"], crop["h"]
                image = Image.open(os.path.join(SRC, f"koma-{koma:02d}.jpg")).convert("L")
                gray = np.asarray(image.crop((x, y, x + w, y + h)), dtype=np.float64)
                alpha = keep_strokes(alpha_of(gray))
                stem = f"{koma}-{x}-{y}"

                to_png(padded(alpha, *bbox(alpha)), os.path.join(OUT, f"{stem}.png"))
                made.append(f"{stem}.png")

                word = term["word"]
                if word not in term["source"]:
                    continue
                chars = []
                for top, bottom in split_rows(alpha, len(word)):
                    cx0, cy0, cx1, cy1 = bbox(alpha[top:bottom])
                    chars.append((cx0, top + cy0, cx1, top + cy1))
                height = max(c[3] - c[1] for c in chars)
                for i, c in enumerate(chars):
                    to_png(padded(alpha, *c, height=height), os.path.join(OUT, f"{stem}-{i}.png"))
                    made.append(f"{stem}-{i}.png")
                print(f"{word}: {len(chars)}字")
    print(f"{len(made)}枚を public/glyphs/ に書き出した")


if __name__ == "__main__":
    main()
