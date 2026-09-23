import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages (harukaaatashi.github.io/yugokyo/) 配下に置くためサブパスを指定。
// 独自ドメインに移す場合は "/" に戻す。
export default defineConfig({
  base: "/yugokyo/",
  plugins: [react()],
});
