/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F6F4EF",
        "paper-warm": "#EFEBE2",
        ink: "#33302B",
        // 原文翻刻の本文。ink より退き ink-soft より読める中間層（paper上 6.7:1）
        "ink-muted": "#5A554C",
        "ink-soft": "#736E64",
        "yu-blue": "#3D6EB4",
        "yu-blue-deep": "#2F5A96",
        "yu-blue-soft": "#DCE6F2",
        kuchinashi: "#E8A63D",
        // 未確定箇所の下線。paper上 3.47:1 で非テキストUIの3:1を満たす
        "kuchinashi-deep": "#B2761A",
        line: "#DDD8CC",
      },
      fontSize: {
        rubi: ["0.625rem", { lineHeight: "1" }],
        caption: ["0.8125rem", { lineHeight: "1.7" }],
        // 行間2.5はルビが行の上にせり出すぶんの確保（DESIGN §3）
        genbun: ["0.9375rem", { lineHeight: "2.5" }],
        lede: ["0.9375rem", { lineHeight: "2" }],
        yaku: ["1.0625rem", { lineHeight: "1.9" }],
      },
      aspectRatio: {
        // 原本写真から下端の定規・ラベル帯を落とす比率（本の下端は最大でも高さの82.6%）
        koma: "1600 / 1160",
      },
      maxHeight: {
        // 狭い画面で上部に固定する写真パネルの上限。本文の読む面を確保する
        pane: "34vh",
      },
      width: {
        // 原本画像の実寸。拡大表示で等倍に開く
        koma: "1600px",
      },
      fontFamily: {
        maru: ['"Zen Maru Gothic"', "sans-serif"],
        body: ['"Zen Kaku Gothic New"', "system-ui", "sans-serif"],
        genbun: ['"Shippori Mincho"', "serif"],
      },
    },
  },
  plugins: [],
};
