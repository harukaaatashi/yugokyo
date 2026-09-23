import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  imageUrl,
  komaByNumber,
  komaList,
  ndlViewerUrl,
  saveLastKoma,
  type Section,
} from "../lib/corpus";

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

export default function Reader() {
  const { koma: komaParam } = useParams();
  const navigate = useNavigate();
  const komaNum = Number(komaParam);
  const koma = komaByNumber.get(komaNum);
  const [zoom, setZoom] = useState(false);

  useEffect(() => {
    if (koma) saveLastKoma(koma.koma);
    window.scrollTo(0, 0);
    setZoom(false);
  }, [koma]);

  useEffect(() => {
    document.body.style.overflow = zoom ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [zoom]);

  if (!koma) {
    return (
      <div className="max-w-2xl mx-auto px-5 py-16 text-center">
        <p className="text-ink-soft">この丁の翻刻はまだ準備中です。</p>
        <Link to="/" className="mt-4 inline-block text-yu-blue underline">
          目次にもどる
        </Link>
      </div>
    );
  }

  const idx = komaList.findIndex((k) => k.koma === koma.koma);
  const prev = idx > 0 ? komaList[idx - 1] : null;
  const next = idx < komaList.length - 1 ? komaList[idx + 1] : null;

  return (
    <div className="max-w-2xl mx-auto px-5">
      <div className="pt-2 pb-4">
        <p className="text-xs text-ink-soft tabular-nums">
          {koma.koma} / 38 丁 ・ AI翻刻（未校正）
        </p>
        <h1 className="font-maru font-bold text-2xl text-yu-blue mt-1">
          {koma.label}
        </h1>
        {koma.summary && (
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            {koma.summary}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={() => setZoom(true)}
        className="block w-full rounded-2xl overflow-hidden border border-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yu-blue focus-visible:ring-offset-2"
      >
        <img
          src={imageUrl(koma.image)}
          alt={`『湯語教』${koma.koma}丁目の原本画像`}
          className="w-full h-auto"
          loading="lazy"
        />
        <span className="block py-2 text-center text-xs text-ink-soft bg-white">
          タップで拡大
        </span>
      </button>

      <div className="mt-8 space-y-8">
        {koma.sections.map((s, i) => (
          <SectionBlock key={i} section={s} />
        ))}
      </div>

      <p className="mt-10 text-xs text-ink-soft leading-relaxed">
        原本:{" "}
        <a
          href={ndlViewerUrl(koma.koma)}
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-yu-blue transition-colors"
        >
          国立国会図書館デジタルコレクション（このコマを開く）
        </a>
      </p>

      {zoom && (
        <div
          className="fixed inset-0 z-50 bg-ink/90 overflow-auto"
          role="dialog"
          aria-label="原本画像の拡大表示"
          onClick={() => setZoom(false)}
        >
          <img
            src={imageUrl(koma.image)}
            alt={`『湯語教』${koma.koma}丁目の原本画像（拡大）`}
            className="max-w-none w-[1600px]"
          />
          <button
            type="button"
            onClick={() => setZoom(false)}
            className="fixed top-4 right-4 min-h-11 px-5 rounded-full bg-white font-maru font-bold text-ink"
          >
            閉じる
          </button>
        </div>
      )}

      <nav className="fixed bottom-0 inset-x-0 bg-paper/95 backdrop-blur border-t border-line">
        <div className="max-w-2xl mx-auto px-5 py-3 flex items-center justify-between gap-3">
          {prev ? (
            <button
              type="button"
              onClick={() => navigate(`/read/${prev.koma}`)}
              className="min-h-11 px-5 rounded-full border border-yu-blue text-yu-blue font-maru font-bold text-sm hover:bg-yu-blue-soft transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yu-blue"
            >
              ← 前の丁
            </button>
          ) : (
            <span />
          )}
          <span className="text-xs text-ink-soft tabular-nums">
            {koma.koma} / 38
          </span>
          {next ? (
            <button
              type="button"
              onClick={() => navigate(`/read/${next.koma}`)}
              className="min-h-11 px-5 rounded-full bg-yu-blue text-white font-maru font-bold text-sm hover:bg-yu-blue-deep transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yu-blue focus-visible:ring-offset-2"
            >
              次の丁 →
            </button>
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
