import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

/**
 * 表示言語。訳文（現代語訳 ⇄ 英訳）・注・章タイトル・UIの文言がまとめて切り替わる。
 * 原文翻刻と原本写真はどちらの言語でも同じもの（日本語）を出す。
 *
 * 選んだ言語は保存して、次に開いたときもそのまま。保存できない環境では日本語。
 */
export type Lang = "ja" | "en";

const KEY = "yugokyo:lang";

function load(): Lang {
  try {
    return localStorage.getItem(KEY) === "en" ? "en" : "ja";
  } catch {
    return "ja";
  }
}

const LangContext = createContext<{ lang: Lang; setLang: (next: Lang) => void }>({
  lang: "ja",
  setLang: () => {},
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(load);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* 保存できなくても表示は切り替える */
    }
  }, []);

  // 読み上げ・ハイフネーション・改行規則（index.css）が言語に合うように html[lang] を合わせる
  useEffect(() => {
    document.documentElement.lang = lang;
    document.title =
      lang === "en"
        ? "Yugokyō — An Edo-period bathhouse manual, in English"
        : "湯語教 — 江戸の銭湯経営手引書を現代語で読む";
  }, [lang]);

  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}
