import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  chapterById,
  chapterSummary,
  chapterTitle,
  komaFromAnchor,
  loadProgress,
  ndlViewerUrl,
  saveProgress,
  localized,
  sectionAnchorId,
  TOTAL_CHAPTERS,
  type Chapter as ChapterData,
} from "../lib/corpus";
import { useActiveKoma } from "../lib/useActiveKoma";
import { useShowGenbun } from "../lib/useShowGenbun";
import { useLang } from "../lib/lang";
import { UI, type UiText } from "../lib/i18n";
import { viewerMode } from "../lib/viewerMode";
import type { Term } from "../lib/terms";
import SectionBlock from "../components/reader/SectionBlock";
import KomaRule from "../components/reader/KomaRule";
import KomaPane from "../components/reader/KomaPane";
import KomaZoom from "../components/reader/KomaZoom";
import ExhibitCover from "../components/reader/ExhibitCover";
import { GenponStrip, GenponView } from "../components/reader/GenponStrip";
import { TermSheet } from "../components/reader/TermSheet";
import type { Rect } from "../lib/pages";

const WIDE = "(min-width: 1024px)";

/** このページを開いて最初の着地か。開き直し・再読み込みのときだけ、しおりへ戻すために使う */
let firstLanding = true;

function isReload(): boolean {
  const nav = performance.getEntriesByType?.("navigation")[0] as
    | PerformanceNavigationTiming
    | undefined;
  return nav?.type === "reload";
}

/** 着地からこれ以上動いたら「読者が自分で読み進めた」とみなす */
const ARM_DISTANCE = 64;

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
function positionLabel(chapter: ChapterData, ui: UiText): string {
  if (chapter.number === null) return chapter.def.kind === "front" ? ui.front : ui.back;
  return ui.position(chapter.number, TOTAL_CHAPTERS);
}

export default function Chapter() {
  const { id } = useParams();
  const { hash } = useLocation();
  const chapter = id ? chapterById.get(id) : undefined;
  // 展示レイアウト（既定）。本文の横に写真パネルを置かず、章扉と下の帯で原本を見せる
  const exhibit = viewerMode === "exhibit";

  const rootRef = useRef<HTMLDivElement>(null);
  const paneRef = useRef<HTMLElement>(null);
  const landedRef = useRef<string>("");
  const [paneHeight, setPaneHeight] = useState(0);
  const [zoomKoma, setZoomKoma] = useState<number | null>(null);
  const [openTerm, setOpenTerm] = useState<Term | null>(null);
  const [genponOpen, setGenponOpen] = useState(false);
  // 開いている札・見開きの effect が、スクロールのたびの再描画で張り直されないよう関数を固定する
  const closeTerm = useCallback(() => setOpenTerm(null), []);
  const closeGenpon = useCallback(() => setGenponOpen(false), []);
  const zoomFromGenpon = useCallback((koma: number) => {
    setGenponOpen(false);
    setZoomKoma(koma);
  }, []);
  const wide = useIsWide();
  const { lang } = useLang();
  const ui = UI[lang];
  const [showGenbun, setShowGenbun] = useShowGenbun();
  // 原文の出し入れで本文の長さが変わっても、読んでいた段落が同じ高さに残るようにする
  const keepRef = useRef<{ el: HTMLElement; top: number } | null>(null);
  // しおりは読者が自分でスクロールしてから動かす。
  // 章を開いた瞬間に記録すると、目次からのぞいただけ・再読み込みしただけで章の頭に巻き戻るため
  const landedYRef = useRef(0);
  // 読み進めたと判定された章の id。章を移った直後に前の章の位置を書かないよう、章ごとに持つ
  const armedRef = useRef<string | null>(null);
  const [armed, setArmed] = useState<string | null>(null);

  const toggleGenbun = (next: boolean) => {
    const root = rootRef.current;
    if (root) {
      const paneBottom =
        wide || exhibit ? 0 : (paneRef.current?.getBoundingClientRect().bottom ?? 0);
      // パネルの真下で読んでいる段落（パネルに隠れていない最初のもの）を目印にする
      const el = Array.from(
        root.querySelectorAll<HTMLElement>("article[data-koma], h2[data-koma], figure[data-koma]")
      ).find((node) => node.getBoundingClientRect().bottom > paneBottom + 8);
      keepRef.current = el ? { el, top: el.getBoundingClientRect().top } : null;
    }
    setShowGenbun(next);
  };

  useLayoutEffect(() => {
    const keep = keepRef.current;
    keepRef.current = null;
    if (!keep || !keep.el.isConnected) return;
    const delta = keep.el.getBoundingClientRect().top - keep.top;
    if (delta !== 0) {
      window.scrollBy(0, delta);
      // 位置を保つための移動は「読み進めた」に数えない
      if (!armedRef.current) landedYRef.current += delta;
    }
  }, [showGenbun]);

  const komas = useMemo(
    () =>
      chapter
        ? chapter.items.flatMap((it) => (it.type === "koma" ? [it.koma.koma] : []))
        : [],
    [chapter]
  );

  // ハッシュで指定された丁があれば、パネルの初期表示もそこに合わせる
  const anchoredKoma = komaFromAnchor(hash) ?? 0;
  const initialKoma =
    chapter && komas.includes(anchoredKoma) ? anchoredKoma : (chapter?.komaFrom ?? 0);
  const initialSpot = useMemo(
    () => ({ koma: initialKoma, side: "r" as const, anchor: "" }),
    [initialKoma]
  );

  const active = useActiveKoma(
    rootRef,
    initialSpot,
    // 展示レイアウトの狭い画面は、画面の上から2割の所を「読んでいる行」とみなす。
    // 画面の最上端で判定すると、下の帯の朱の枠が読んでいる段落より1つ前を指してしまう
    wide ? 0 : exhibit ? Math.round(window.innerHeight * 0.2) : paneHeight,
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
  }, [wide, exhibit, chapter?.def.id]);

  // 章やハッシュが変わったときの着地。パネルの高さが確定してから動かす
  useEffect(() => {
    if (!chapter) return;
    const key = `${chapter.def.id}${hash}`;
    if (landedRef.current === key) return;
    // 写真パネルがあるレイアウトでは、パネルの高さが測れるまで待つ
    if (!exhibit && !wide && paneHeight === 0) return;
    landedRef.current = key;
    setZoomKoma(null);
    setOpenTerm(null);
    armedRef.current = null;
    setArmed(null);

    // HashRouter では #/chapter/gokyo#koma-20 のアンカーをブラウザが解釈しないので自前で動かす
    let anchorId = hash.startsWith("#") ? hash.slice(1) : "";
    // 開き直し・再読み込みでは、URL に残った古いアンカーや章の頭ではなく、しおりへ戻す
    if (firstLanding && (!anchorId || isReload())) {
      const progress = loadProgress();
      if (progress?.chapterId === chapter.def.id && progress.anchor) anchorId = progress.anchor;
    }
    firstLanding = false;
    const target = anchorId ? document.getElementById(anchorId) : null;
    const land = () => {
      if (target) target.scrollIntoView({ block: "start" });
      else window.scrollTo(0, 0);
      landedYRef.current = window.scrollY;
    };
    land();

    // 書体が差し替わると行数が変わって着地がずれる。
    // 読者がまだ自分でスクロールしていないときだけ着地し直す
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (cancelled || armedRef.current) return;
      if (Math.abs(window.scrollY - landedYRef.current) < 4) land();
    });
    return () => {
      cancelled = true;
    };
  }, [chapter, hash, wide, paneHeight, exhibit]);

  // 文の途中で段落が分かれている所（原本の丁の境目などで、前の段落が読点や助詞で終わる）。
  // 訳だけを読むときは間をあけずにつなげ、ひと続きの文として読めるようにする
  const joinsPrev = useMemo(() => {
    const keys = new Set<string>();
    let prev: string | undefined;
    for (const item of chapter?.items ?? []) {
      if (item.type !== "section") continue;
      const { text } = localized(item.section, lang);
      if (item.section.kind === "text" && text && prev && /[、,をにがはもで]$/.test(prev)) keys.add(item.key);
      prev = item.section.kind === "text" ? text?.trimEnd() : undefined;
    }
    return keys;
  }, [chapter, lang]);

  // 段落が原本のどこに書かれているか（段落の id → 原寸の矩形）。下の帯の朱の枠に使う
  const regionsOf = useMemo(() => {
    const map = new Map<string, readonly Rect[]>();
    for (const item of chapter?.items ?? []) {
      if (item.type === "section" && item.section.regions?.length) {
        map.set(sectionAnchorId(item.koma, item.index), item.section.regions);
      }
    }
    return map;
  }, [chapter]);

  // 着地点から読者が自分で動いたら、その章でしおりの記録を始める
  const chapterId = chapter?.def.id ?? null;
  useEffect(() => {
    if (!chapterId) return;
    const onScroll = () => {
      if (armedRef.current === chapterId || landedRef.current === "") return;
      if (Math.abs(window.scrollY - landedYRef.current) > ARM_DISTANCE) {
        armedRef.current = chapterId;
        setArmed(chapterId);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [chapterId]);

  useEffect(() => {
    if (
      chapter &&
      armed === chapter.def.id &&
      komas.includes(active.koma) &&
      active.anchor
    ) {
      saveProgress({ chapterId: chapter.def.id, koma: active.koma, anchor: active.anchor });
    }
  }, [chapter, komas, armed, active.koma, active.anchor]);

  if (!chapter) {
    return (
      <div className="max-w-2xl mx-auto px-5 py-16 text-center">
        <p className="text-ink-soft">{ui.notFound}</p>
        <Link to="/" className="mt-4 inline-block text-yu-blue underline">
          {ui.backToIndex}
        </Link>
      </div>
    );
  }

  const prev = chapter.prevId ? chapterById.get(chapter.prevId) : undefined;
  const next = chapter.nextId ? chapterById.get(chapter.nextId) : undefined;
  const continuesToNext = chapter.items.some(
    (it) => it.type === "koma" && it.continues.to
  );

  const sourceNote = (
    <div className="mt-10 space-y-2 text-caption text-ink-soft">
      {/* 展示レイアウトは丁を見せないので、丁が次の章へ続くことも言わない */}
      {continuesToNext && !exhibit && <p>{ui.continuesTo}</p>}
      <p>
        {ui.sourceLabel}{" "}
        <a
          href={ndlViewerUrl(chapter.komaFrom)}
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-yu-blue transition-colors"
        >
          {ui.ndlTitle}
        </a>
        {ui.sourceTail}
      </p>
    </div>
  );

  const zoom = (
    <>
      {zoomKoma !== null && (
        <KomaZoom koma={zoomKoma} onClose={() => setZoomKoma(null)} />
      )}
      {openTerm && <TermSheet term={openTerm} onClose={closeTerm} />}
      {exhibit && genponOpen && (
        <GenponView
          koma={active.koma}
          regions={regionsOf.get(active.anchor)}
          onClose={closeGenpon}
          onZoom={zoomFromGenpon}
        />
      )}
    </>
  );

  // 本文の段落まで読み進めたら出す（章扉を見ているあいだは出さない）
  const strip = exhibit && active.anchor !== "" && komas.includes(active.koma) && (
    <GenponStrip
      koma={active.koma}
      regions={regionsOf.get(active.anchor)}
      onOpen={() => setGenponOpen(true)}
    />
  );

  const nav = (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 backdrop-blur">
      {strip}
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 py-3">
        {prev ? (
          <Link
            to={`/chapter/${prev.def.id}`}
            className="inline-flex min-h-11 items-center rounded-full border border-yu-blue px-5 font-maru text-sm font-bold text-yu-blue hover:bg-yu-blue-soft transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yu-blue"
          >
            {ui.prev}
          </Link>
        ) : (
          <span />
        )}
        <span className="text-caption text-ink-soft tabular-nums">
          {positionLabel(chapter, ui)}
        </span>
        {next ? (
          <Link
            to={`/chapter/${next.def.id}`}
            className="inline-flex min-h-11 items-center rounded-full bg-yu-blue px-5 font-maru text-sm font-bold text-white hover:bg-yu-blue-deep transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yu-blue focus-visible:ring-offset-2"
          >
            {ui.next}
          </Link>
        ) : (
          <Link
            to="/about"
            className="inline-flex min-h-11 items-center rounded-full bg-yu-blue px-5 font-maru text-sm font-bold text-white hover:bg-yu-blue-deep transition-colors"
          >
            {ui.finish}
          </Link>
        )}
      </div>
    </nav>
  );

  if (exhibit) {
    return (
      <div ref={rootRef}>
        <ExhibitCover
          chapter={chapter}
          lang={lang}
          position={positionLabel(chapter, ui)}
          showGenbun={showGenbun}
          onToggleGenbun={toggleGenbun}
        />
        <div className={`mx-auto max-w-2xl px-5 pt-12 ${showGenbun ? "space-y-10" : "space-y-6"}`}>
          {chapter.items.map((item) =>
            item.type === "koma" ? (
              <KomaRule key={item.key} item={item} quiet />
            ) : (
              <SectionBlock
                key={item.key}
                section={item.section}
                koma={item.koma}
                index={item.index}
                showGenbun={showGenbun}
                lang={lang}
                onOpenKoma={setZoomKoma}
                onOpenTerm={setOpenTerm}
                quietNotes
                joinPrev={!showGenbun && joinsPrev.has(item.key)}
              />
            )
          )}
        </div>
        <div className="mx-auto max-w-2xl px-5">{sourceNote}</div>
        {/* 下の帯のぶん、最後の段落が帯に隠れないよう余白を足す */}
        <div aria-hidden="true" className="h-24" />
        {zoom}
        {nav}
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className="lg:mx-auto lg:flex lg:max-w-5xl lg:items-start lg:gap-10 lg:px-5"
    >
      {/* DOM 上はパネルが先。狭い画面で上に固定するためにこの順序が要る */}
      <aside
        ref={paneRef}
        aria-label={ui.paneLabel}
        className="sticky top-0 z-30 border-b border-line bg-paper lg:top-6 lg:order-2 lg:w-5/12 lg:shrink-0 lg:self-start lg:border-b-0"
      >
        <KomaPane
          komas={komas}
          active={active}
          wide={wide}
          onZoom={setZoomKoma}
          showGenbun={showGenbun}
          onToggleGenbun={toggleGenbun}
        />
      </aside>

      <div className="min-w-0 px-5 lg:order-1 lg:w-7/12 lg:px-0">
        <div className="pt-4 pb-2">
          <p className="text-caption text-ink-soft tabular-nums">
            {positionLabel(chapter, ui)} ・ {ui.komaRange(chapter.komaFrom, chapter.komaTo)} ・{" "}
            {ui.aiBadge}
          </p>
          <h1 className="mt-1 font-maru text-2xl font-bold text-yu-blue text-balance">
            {chapterTitle(chapter.def, lang)}
          </h1>
          <p className="mt-2 text-caption text-ink-soft">{chapterSummary(chapter.def, lang)}</p>
        </div>

        {/* 訳だけのときは段落の間を詰め、ひと続きの文章として読めるようにする */}
        <div className={`mt-4 ${showGenbun ? "space-y-10" : "space-y-6"}`}>
          {chapter.items.map((item) =>
            item.type === "koma" ? (
              <KomaRule key={item.key} item={item} />
            ) : (
              <SectionBlock
                key={item.key}
                section={item.section}
                koma={item.koma}
                index={item.index}
                showGenbun={showGenbun}
                lang={lang}
                onOpenKoma={setZoomKoma}
              />
            )
          )}
        </div>

        {sourceNote}
      </div>

      {zoom}
      {nav}
    </div>
  );
}
