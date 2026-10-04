import { Link, Route, Routes, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Chapter from "./pages/Chapter";
import KomaRedirect from "./pages/KomaRedirect";
import About from "./pages/About";
import { FIRST_CHAPTER_ID } from "./lib/corpus";
import { useLang } from "./lib/lang";
import { UI } from "./lib/i18n";

export default function App() {
  const { pathname } = useLocation();
  const { lang, setLang } = useLang();
  const ui = UI[lang];
  const other = lang === "ja" ? "en" : "ja";
  const inReader =
    pathname.startsWith("/chapter") || pathname.startsWith("/read");
  return (
    <div className="min-h-dvh flex flex-col">
      <header className="px-5 py-2 flex items-center justify-between gap-4 max-w-2xl w-full mx-auto">
        <Link to="/" className="font-maru font-bold text-yu-blue text-lg leading-none">
          {ui.logo}
        </Link>
        <nav className="flex items-center gap-5 text-sm text-ink-soft">
          <Link
            to={`/chapter/${FIRST_CHAPTER_ID}`}
            className="hover:text-yu-blue transition-colors"
          >
            {ui.navRead}
          </Link>
          <Link to="/about" className="hover:text-yu-blue transition-colors">
            {ui.navAbout}
          </Link>
          {/* 言語スイッチ。いまと反対の言語の名前を、その言語で書く（読めない人にも見つけられるように） */}
          <button
            type="button"
            lang={other}
            onClick={() => setLang(other)}
            aria-label={ui.switchToLabel}
            className="group inline-flex min-h-11 items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yu-blue"
          >
            <span className="inline-flex h-8 items-center rounded-full border border-yu-blue px-3 font-maru font-bold text-yu-blue group-hover:bg-yu-blue-soft transition-colors">
              {ui.switchTo}
            </span>
          </button>
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
            {ui.footerImages}{" "}
            <a
              href="https://dl.ndl.go.jp/pid/2539997"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-yu-blue transition-colors"
            >
              {ui.ndlTitle}
            </a>
            {ui.publicDomain}
          </p>
          <p className="mt-1">{ui.aiDraft}</p>
        </footer>
      )}
    </div>
  );
}
