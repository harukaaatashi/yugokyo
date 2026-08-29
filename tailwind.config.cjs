/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F6F4EF",
        "paper-warm": "#EFEBE2",
        ink: "#33302B",
        "ink-soft": "#736E64",
        "yu-blue": "#3D6EB4",
        "yu-blue-deep": "#2F5A96",
        "yu-blue-soft": "#DCE6F2",
        kuchinashi: "#E8A63D",
        line: "#DDD8CC",
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
