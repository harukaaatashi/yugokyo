import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  chapterById,
  ndlViewerUrl,
  saveProgress,
  TOTAL_CHAPTERS,
  type Chapter as ChapterData,
} from "../lib/corpus";
import { useActiveKoma } from "../lib/useActiveKoma";
import SectionBlock from "../components/reader/SectionBlock";
import KomaRule from "../components/reader/KomaRule";
import KomaPane from "../components/reader/KomaPane";
import KomaZoom from "../components/reader/KomaZoom";

const WIDE = "(min-width: 1024px)";

function useIsWide(): boolean {
  const [wide, setWide] = useState(
    () => typeof window !== "undefined" && window.matchMedia(WIDE).matches
  );
  useEffect(() => {
    const mql = window.matchMedia(WIDE);
    const onChange = () => setWide(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return wide;
}

/** ヘッダ・フッターに出す現在位置（扉と巻末には番号を振らない） */
function positionLabel(chapter: ChapterData): string {
  if (chapter.number === null) return chapter.def.kind === "front" ? "扉" : "巻末";
  return `第${chapter.number}章 / 全${TOTAL_CHAPTERS}章`;
}

function komaRangeLabel(chapter: ChapterData): string {
  return chapter.komaFrom === chapter.komaTo
    ? `${chapter.komaFrom}丁`
    : `${chapter.komaFrom}〜${chapter.komaTo}丁`;
}

export default function Chapter() {
  const { id } = useParams();
  const { hash } = useLocation();
  const chapter = id ? chapterById.get(id) : undefined;

  const rootRef = useRef<HTMLDivElement>(null);
  const paneRef = useRef<HTMLElement>(null);
  const landedRef = useRef<string>("");
  const [paneHeight, setPaneHeight] = useState(0);
  const [zoomKoma, setZoomKoma] = useState<number | null>(null);
  const wide = useIsWide();

  const komas = useMemo(
    () =>
      chapter
        ? chapter.items.flatMap((it) => (it.type === "koma" ? [it.koma.koma] : []))
        : [],
    [chapter]
  );

  // ハッシュで指定された丁があれば、パネルの初期表示もそこに合わせる
  const anchoredKoma = Number(hash.replace(/^#koma-/, ""));
  const initialKoma =
    chapter && komas.includes(anchoredKoma) ? anchoredKoma : (chapter?.komaFrom ?? 0);
  const initialSpot = useMemo(
    () => ({ koma: initialKoma, side: "r" as const }),
    [initialKoma]
  );

  const active = useActiveKoma(
    rootRef,
    initialSpot,
    wide ? 0 : paneHeight,
    chapter?.def.id ?? ""
  );

  // 固定パネルの高さを測って CSS 変数に流す。アンカーがパネルの下に潜らないようにするため
  useLayoutEffect(() => {
    const pane = paneRef.current;
    const root = rootRef.current;
    if (!pane || !root) return;
    const observer = new ResizeObserver(([entry]) => {
      const h = Math.round(entry?.contentRect.height ?? 0);
      setPaneHeight(h);
      root.style.setProperty("--koma-pane-h", wide ? "0px" : `${h}px`);
    });
    observer.observe(pane);
    return () => observer.disconnect();
  }, [wide, chapter?.def.id]);

  // 章やハッシュが変わったときの着地。パネルの高さが確定してから動かす
  useEffect(() => {
    if (!chapter) return;
    const key = `${chapter.def.id}${hash}`;
    if (landedRef.current === key) return;
    if (!wide && paneHeight === 0) return;
    landedRef.current = key;
    setZoomKoma(null);

    // HashRouter では #/chapter/gokyo#koma-20 のアンカーをブラウザが解釈しないので自前で動かす
    const anchorId = hash.startsWith("#") ? hash.slice(1) : "";
    const target = anchorId ? document.getElementById(anchorId) : null;
    let expected = 0;
    const land = () => {
      if (target) target.scrollIntoView({ block: "start" });
      else window.scrollTo(0, 0);
      expected = window.scrollY;
    };
    land();

    // 書体が差し替わると行数が変わって着地がずれる。
    // 読者がまだ自分でスクロールしていないときだけ着地し直す
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (cancelled) return;
      if (Math.abs(window.scrollY - expected) < 4) land();
    });
    return () => {
      cancelled = true;
    };
  }, [chapter, hash, wide, paneHeight]);

  useEffect(() => {
    if (chapter && active.koma) {
      saveProgress({ chapterId: chapter.def.id, koma: active.koma });
    }
  }, [chapter, active.koma]);

  if (!chapter) {
    return (
      <div className="max-w-2xl mx-auto px-5 py-16 text-center">
        <p className="text-ink-soft">その章は見つかりませんでした。</p>
        <Link to="/" className="mt-4 inline-block text-yu-blue underline">
          目次にもどる
        </Link>
      </div>
    );
  }

  const prev = chapter.prevId ? chapterById.get(chapter.prevId) : undefined;
  const next = chapter.nextId ? chapterById.get(chapter.nextId) : undefined;
  const continuesToNext = chapter.items.some(
    (it) => it.type === "koma" && it.continues.to
  );

  return (
    <div
      ref={rootRef}
      className="lg:mx-auto lg:flex lg:max-w-5xl lg:items-start lg:gap-10 lg:px-5"
    >
      {/* DOM 上はパネルが先。狭い画面で上に固定するためにこの順序が要る */}
      <aside
        ref={paneRef}
        aria-label="原本の写真"
        className="sticky top-0 z-30 border-b border-line bg-paper lg:top-6 lg:order-2 lg:w-5/12 lg:shrink-0 lg:self-start lg:border-b-0"
      >
        <KomaPane komas={komas} active={active} wide={wide} onZoom={setZoomKoma} />
      </aside>

      <div className="min-w-0 px-5 lg:order-1 lg:w-7/12 lg:px-0">
        <div className="pt-4 pb-2">
          <p className="text-caption text-ink-soft tabular-nums">
            {positionLabel(chapter)} ・ {komaRangeLabel(chapter)} ・ AI翻刻（未校正）
          </p>
          <h1 className="mt-1 font-maru text-2xl font-bold text-yu-blue text-balance">
            {chapter.def.title}
          </h1>
          {chapter.def.summary && (
            <p className="mt-2 text-caption text-ink-soft">{chapter.def.summary}</p>
          )}
        </div>

        <div className="mt-4 space-y-10">
          {chapter.items.map((item) =>
            item.type === "koma" ? (
              <KomaRule key={item.key} item={item} />
            ) : (
              <SectionBlock
                key={item.key}
                section={item.section}
                koma={item.koma}
                index={item.index}
                onOpenKoma={setZoomKoma}
              />
            )
          )}
        </div>

        <div className="mt-10 space-y-2 text-caption text-ink-soft">
          {continuesToNext && <p>この丁の続きは次の章にあります。</p>}
          <p>
            原本:{" "}
            <a
              href={ndlViewerUrl(chapter.komaFrom)}
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-yu-blue transition-colors"
            >
              国立国会図書館デジタルコレクション『洗湯手引草』
            </a>
            （保護期間満了）／翻刻・現代語訳はAIによる下訳（未校正）です。
          </p>
        </div>
      </div>

      {zoomKoma !== null && (
        <KomaZoom koma={zoomKoma} onClose={() => setZoomKoma(null)} />
      )}

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 py-3">
          {prev ? (
            <Link
              to={`/chapter/${prev.def.id}`}
              className="inline-flex min-h-11 items-center rounded-full border border-yu-blue px-5 font-maru text-sm font-bold text-yu-blue hover:bg-yu-blue-soft transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yu-blue"
            >
              ← 前の章
            </Link>
          ) : (
            <span />
          )}
          <span className="text-caption text-ink-soft tabular-nums">
            {positionLabel(chapter)}
          </span>
          {next ? (
            <Link
              to={`/chapter/${next.def.id}`}
              className="inline-flex min-h-11 items-center rounded-full bg-yu-blue px-5 font-maru text-sm font-bold text-white hover:bg-yu-blue-deep transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yu-blue focus-visible:ring-offset-2"
            >
              次の章 →
            </Link>
          ) : (
            <Link
              to="/about"
              className="inline-flex min-h-11 items-center rounded-full bg-yu-blue px-5 font-maru text-sm font-bold text-white hover:bg-yu-blue-deep transition-colors"
            >
              読了 →
            </Link>
          )}
        </div>
      </nav>
    </div>
  );
}
