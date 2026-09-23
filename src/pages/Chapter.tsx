import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  chapterById,
  imageUrl,
  komaByNumber,
  ndlViewerUrl,
  saveProgress,
  TOTAL_CHAPTERS,
  type Chapter as ChapterData,
  type FlowItem,
  type Section,
} from "../lib/corpus";

/** 原本画像の実寸（全38枚で共通）。高さを先に確定させてアンカー着地をずらさない */
const KOMA_IMAGE_WIDTH = 1600;
const KOMA_IMAGE_HEIGHT = 1383;

/** ｛…｝（読み未確定）を強調表示に変換する */
function Genbun({ text }: { text: string }) {
  const parts = text.split(/(｛[^｝]*｝)/);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("｛") ? (
          <mark
            key={i}
            className="bg-transparent text-inherit underline decoration-kuchinashi decoration-2 underline-offset-4"
            title="読みが未確定の箇所（AI翻刻）"
          >
            {p.slice(1, -1)}
          </mark>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  );
}

function SectionBlock({ section }: { section: Section }) {
  if (section.kind === "illustration") {
    return (
      <div className="rounded-2xl bg-paper-warm px-5 py-4 text-sm text-ink-soft leading-relaxed">
        <span className="font-maru font-bold text-yu-blue mr-2">挿絵</span>
        {section.note}
      </div>
    );
  }
  if (section.kind === "heading") {
    return (
      <div>
        <h2 className="font-genbun text-xl leading-loose">
          {section.original && <Genbun text={section.original} />}
        </h2>
        {section.modern && (
          <p className="mt-1 text-sm text-yu-blue font-maru font-bold">
            {section.modern}
          </p>
        )}
      </div>
    );
  }
  return (
    <div>
      {section.original && (
        <p className="font-genbun leading-[2] text-[15px] whitespace-pre-line">
          <Genbun text={section.original} />
        </p>
      )}
      {section.modern && (
        <div className="mt-3 rounded-2xl bg-yu-blue-soft px-5 py-4">
          <p className="leading-[1.9] text-[15px] whitespace-pre-line">
            {section.modern}
          </p>
        </div>
      )}
      {section.note && (
        <p className="mt-2 px-1 text-[13px] leading-relaxed text-ink-soft">
          {section.note}
        </p>
      )}
    </div>
  );
}

/** 章のなかで丁が変わる位置に置く目印。原本のどこを読んでいるかを示す */
function KomaMarker({
  item,
  eager,
  onZoom,
}: {
  item: Extract<FlowItem, { type: "koma" }>;
  eager: boolean;
  onZoom: () => void;
}) {
  const n = item.koma.koma;
  return (
    <div id={item.anchorId} className="scroll-mt-4">
      <div className="flex items-baseline gap-3">
        <span className="text-xs text-ink-soft tabular-nums shrink-0">{n} 丁</span>
        <span className="h-px flex-1 bg-line" aria-hidden="true" />
        <a
          href={ndlViewerUrl(n)}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-ink-soft underline hover:text-yu-blue transition-colors"
        >
          NDLで見る
        </a>
      </div>
      {item.continues.from && (
        <p className="mt-2 text-xs text-ink-soft leading-relaxed">
          この丁は前の章の続きから始まります。
        </p>
      )}
      <button
        type="button"
        onClick={onZoom}
        className="mt-3 block w-full rounded-2xl overflow-hidden border border-line hover:border-yu-blue transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yu-blue focus-visible:ring-offset-2"
      >
        <img
          src={imageUrl(item.koma.image)}
          alt={`『湯語教』${n}丁目の原本画像`}
          width={KOMA_IMAGE_WIDTH}
          height={KOMA_IMAGE_HEIGHT}
          className="w-full h-auto"
          loading={eager ? "eager" : "lazy"}
          fetchPriority={eager ? "high" : "auto"}
          decoding="async"
        />
        <span className="block py-2 text-center text-xs text-ink-soft bg-white">
          タップで拡大
        </span>
      </button>
    </div>
  );
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
  const [zoomKoma, setZoomKoma] = useState<number | null>(null);
  const closeZoomRef = useRef<HTMLButtonElement>(null);
  const zoomOpenerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!chapter) return;
    setZoomKoma(null);
    // HashRouter では #/chapter/gokyo#koma-20 のアンカーがブラウザに解釈されないため、
    // スクロールは自前で行う（react-router は内側の hash を正しく返す）
    const anchorId = hash.startsWith("#") ? hash.slice(1) : "";
    const target = anchorId ? document.getElementById(anchorId) : null;
    if (target) {
      target.scrollIntoView({ block: "start" });
    } else {
      window.scrollTo(0, 0);
    }
    const anchoredKoma = Number(anchorId.replace(/^koma-/, ""));
    saveProgress({
      chapterId: chapter.def.id,
      koma:
        target && komaByNumber.has(anchoredKoma) ? anchoredKoma : chapter.komaFrom,
    });
  }, [chapter, hash]);

  useEffect(() => {
    document.body.style.overflow = zoomKoma === null ? "" : "hidden";
    if (zoomKoma === null) return;
    // 開いたときは「閉じる」へフォーカスを移し、閉じたら元のボタンへ戻す
    zoomOpenerRef.current = document.activeElement as HTMLElement | null;
    closeZoomRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoomKoma(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      zoomOpenerRef.current?.focus();
    };
  }, [zoomKoma]);

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
  const zoomed = zoomKoma === null ? undefined : komaByNumber.get(zoomKoma);
  const firstKomaKey = chapter.items.find((it) => it.type === "koma")?.key;

  return (
    <div className="max-w-2xl mx-auto px-5">
      <div className="pt-2 pb-4">
        <p className="text-xs text-ink-soft tabular-nums">
          {positionLabel(chapter)} ・ {komaRangeLabel(chapter)} ・ AI翻刻（未校正）
        </p>
        <h1 className="font-maru font-bold text-2xl text-yu-blue mt-1 text-balance">
          {chapter.def.title}
        </h1>
        {chapter.def.summary && (
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            {chapter.def.summary}
          </p>
        )}
      </div>

      <div className="mt-4 space-y-8">
        {chapter.items.map((item) =>
          item.type === "koma" ? (
            <KomaMarker
              key={item.key}
              item={item}
              eager={item.key === firstKomaKey}
              onZoom={() => setZoomKoma(item.koma.koma)}
            />
          ) : (
            <SectionBlock key={item.key} section={item.section} />
          )
        )}
      </div>

      <div className="mt-10 space-y-2 text-xs text-ink-soft leading-relaxed">
        {chapter.items.some((it) => it.type === "koma" && it.continues.to) && (
          <p>この丁の続きは次の章にあります。</p>
        )}
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

      {zoomed && (
        <div
          className="fixed inset-0 z-50 bg-ink/90 overflow-auto overscroll-contain"
          role="dialog"
          aria-label={`『湯語教』${zoomed.koma}丁目の原本画像の拡大表示`}
          onClick={() => setZoomKoma(null)}
        >
          <img
            src={imageUrl(zoomed.image)}
            alt={`『湯語教』${zoomed.koma}丁目の原本画像（拡大）`}
            width={KOMA_IMAGE_WIDTH}
            height={KOMA_IMAGE_HEIGHT}
            className="max-w-none w-koma h-auto"
          />
          <button
            type="button"
            ref={closeZoomRef}
            onClick={() => setZoomKoma(null)}
            className="fixed top-4 right-4 min-h-11 px-5 rounded-full bg-white font-maru font-bold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
          >
            閉じる
          </button>
        </div>
      )}

      <nav className="fixed bottom-0 inset-x-0 bg-paper/95 backdrop-blur border-t border-line">
        <div className="max-w-2xl mx-auto px-5 py-3 flex items-center justify-between gap-3">
          {prev ? (
            <Link
              to={`/chapter/${prev.def.id}`}
              className="min-h-11 px-5 inline-flex items-center rounded-full border border-yu-blue text-yu-blue font-maru font-bold text-sm hover:bg-yu-blue-soft transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yu-blue"
            >
              ← 前の章
            </Link>
          ) : (
            <span />
          )}
          <span className="text-xs text-ink-soft tabular-nums">
            {positionLabel(chapter)}
          </span>
          {next ? (
            <Link
              to={`/chapter/${next.def.id}`}
              className="min-h-11 px-5 inline-flex items-center rounded-full bg-yu-blue text-white font-maru font-bold text-sm hover:bg-yu-blue-deep transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yu-blue focus-visible:ring-offset-2"
            >
              次の章 →
            </Link>
          ) : (
            <Link
              to="/about"
              className="min-h-11 px-5 inline-flex items-center rounded-full bg-yu-blue text-white font-maru font-bold text-sm hover:bg-yu-blue-deep transition-colors"
            >
              読了 →
            </Link>
          )}
        </div>
      </nav>
    </div>
  );
}
