export default function About() {
  return (
    <div className="max-w-2xl mx-auto px-5">
      <section className="pt-10 pb-8">
        <h1 className="font-maru font-bold text-3xl text-yu-blue">
          この本について
        </h1>
      </section>

      <section className="pb-10 space-y-4 leading-loose text-[15px]">
        <h2 className="font-maru font-bold text-xl text-yu-blue">
          『湯語教』と『洗湯手引草』
        </h2>
        <p>
          『湯語教（ゆごきょう）』は嘉永4年（1851）に刊行された、
          江戸の湯屋（銭湯）経営の手引書です。正式には
          「湯語教 一名 銭湯手引草（せんとうてびきぐさ）」といい、
          ふたつの書名はどちらも同じ本を指します。
          著者は向晦亭等琳（こうかいてい とうりん）。
        </p>
        <p>
          国立国会図書館の所蔵本は外題（表紙の題）から『洗湯手引草』、
          東書文庫の所蔵本は『湯語教』の名で登録されており、
          「日本最古の銭湯経営の教科書」として知られています。
        </p>
      </section>

      <section className="pb-10 space-y-4 leading-loose text-[15px] border-t border-line pt-8">
        <h2 className="font-maru font-bold text-xl text-yu-blue">凡例</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            翻刻は変体仮名を通行の字体に改め、適宜濁点・句読点を補っています。
          </li>
          <li>
            <span className="underline decoration-kuchinashi decoration-2 underline-offset-4">
              黄色の下線
            </span>
            は読みが未確定の箇所、〓 は判読できなかった字です。
          </li>
          <li>現代語訳は逐語訳ではなく、意味が通ることを優先した意訳です。</li>
          <li>
            本文は原本の章立てにそって区切っています。原本の丁（見開き）の
            切れ目は、本文中の原本画像と「◯丁」の目印で示しています。
          </li>
        </ul>
        <div className="rounded-2xl bg-paper-warm px-5 py-4 text-sm leading-relaxed">
          <p className="font-maru font-bold text-yu-blue">
            翻刻・現代語訳はAIによる下訳です（未校正）
          </p>
          <p className="mt-2">
            くずし字の判読・訳文にはAI（Claude）を使っており、誤読が含まれる
            可能性があります。研究・引用の際は必ず原本画像をご確認ください。
            誤りに気づいた方はぜひ教えてください。
          </p>
        </div>
      </section>

      <section className="pb-10 space-y-4 leading-loose text-[15px] border-t border-line pt-8">
        <h2 className="font-maru font-bold text-xl text-yu-blue">出典</h2>
        <ul className="space-y-3 text-sm">
          <li>
            原本画像:{" "}
            <a
              href="https://dl.ndl.go.jp/pid/2539997"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-yu-blue transition-colors"
            >
              『洗湯手引草』国立国会図書館デジタルコレクション
            </a>
            （保護期間満了・パブリックドメイン）
          </li>
          <li>
            読み比べの参照:{" "}
            <a
              href="https://kokusho.nijl.ac.jp/biblio/100266100/"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-yu-blue transition-colors"
            >
              『湯語教／一名銭湯手引草』国書データベース（東書文庫蔵）
            </a>
          </li>
        </ul>
      </section>

      <section className="pb-14 space-y-4 leading-loose text-[15px] border-t border-line pt-8">
        <h2 className="font-maru font-bold text-xl text-yu-blue">利用条件</h2>
        <ul className="space-y-3 text-sm">
          <li>
            <span className="font-bold">原本画像</span> — パブリックドメイン
            （国立国会図書館の公開範囲表示: PDM）。自由に使えます。
            出典として「国立国会図書館デジタルコレクション」を明記してください。
          </li>
          <li>
            <span className="font-bold">翻刻・現代語訳・解説文</span> —{" "}
            <a
              href="https://creativecommons.org/licenses/by/4.0/deed.ja"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-yu-blue transition-colors"
            >
              CC BY 4.0
            </a>
            。出典を示せば複製・改変・再配布ができます。
            ただし前述のとおりAIによる未校正の下訳です。
          </li>
          <li>
            <span className="font-bold">サイトのコード</span> — MIT License
          </li>
        </ul>
      </section>
    </div>
  );
}
