import { Link, Route, Routes, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Chapter from "./pages/Chapter";
import KomaRedirect from "./pages/KomaRedirect";
import About from "./pages/About";
import { FIRST_CHAPTER_ID } from "./lib/corpus";

export default function App() {
  const { pathname } = useLocation();
  const inReader =
    pathname.startsWith("/chapter") || pathname.startsWith("/read");
  return (
    <div className="min-h-dvh flex flex-col">
      <header className="px-5 py-4 flex items-baseline justify-between max-w-2xl w-full mx-auto">
        <Link to="/" className="font-maru font-bold text-yu-blue text-lg leading-none">
          湯語教
        </Link>
        <nav className="flex gap-5 text-sm text-ink-soft">
          <Link
            to={`/chapter/${FIRST_CHAPTER_ID}`}
            className="hover:text-yu-blue transition-colors"
          >
            読む
          </Link>
          <Link to="/about" className="hover:text-yu-blue transition-colors">
            この本について
          </Link>
        </nav>
      </header>
      <main className={`flex-1 w-full ${inReader ? "pb-24" : ""}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/chapter/:id" element={<Chapter />} />
          {/* 公開済みの丁単位URLを章へ転送する互換ルート */}
          <Route path="/read/:koma" element={<KomaRedirect />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>
      {!inReader && (
        <footer className="px-5 py-10 max-w-2xl w-full mx-auto text-xs text-ink-soft leading-relaxed">
          <p>
            原本画像:{" "}
            <a
              href="https://dl.ndl.go.jp/pid/2539997"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-yu-blue transition-colors"
            >
              国立国会図書館デジタルコレクション『洗湯手引草』
            </a>
            （保護期間満了）
          </p>
          <p className="mt-1">翻刻・現代語訳はAIによる下訳（未校正）です。</p>
        </footer>
      )}
    </div>
  );
}
