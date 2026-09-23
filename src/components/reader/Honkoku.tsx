import { useMemo } from "react";
import { parseGenbun, type GenbunLine, type RubyToken } from "../../lib/ruby";

/**
 * 原文翻刻のレンダラ。
 * corpus の `漢字（かな）` を本物の <ruby> に、`｛…｝` を「読み未確定」の点線下線にする。
 * 行（\n）は <span className="block"> で構造として持つ（whitespace-pre-line は使わない。
 * pre-line と <ruby> と overflow-wrap の組み合わせは折り返しが読めなくなる）。
 */

function Token({ token }: { token: RubyToken }) {
  if (token.t === "text") return <>{token.s}</>;
  return (
    <ruby>
      {token.base}
      <rt>{token.rt}</rt>
    </ruby>
  );
}

function Line({ line }: { line: GenbunLine }) {
  return (
    <span className="block">
      {line.map((run, i) =>
        run.uncertain ? (
          <span
            key={i}
            className="underline decoration-kuchinashi-deep decoration-dotted decoration-2 underline-offset-4"
            title="読みが未確定の箇所（AI翻刻）"
          >
            {run.tokens.map((t, j) => (
              <Token key={j} token={t} />
            ))}
          </span>
        ) : (
          run.tokens.map((t, j) => <Token key={`${i}-${j}`} token={t} />)
        )
      )}
    </span>
  );
}

export default function Honkoku({ text }: { text: string }) {
  const lines = useMemo(() => parseGenbun(text), [text]);
  return (
    <>
      {lines.map((line, i) => (
        <Line key={i} line={line} />
      ))}
    </>
  );
}
