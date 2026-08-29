import { Link } from "react-router-dom";
import { komaList, loadLastKoma } from "../lib/corpus";

export default function Home() {
  const last = loadLastKoma();
  const ready = komaList.length > 0;
  const firstReadable = komaList[0]?.koma ?? 1;

  return (
    <div className="max-w-2xl mx-auto px-5">
      <section className="pt-14 pb-12">
        <p className="font-maru text-yu-blue text-sm font-bold">
          嘉永四年（1851）・江戸
        </p>
        <h1 className="font-maru font-bold text-4xl leading-snug mt-3">
          ゆごきょう
          <span className="block text-yu-blue">『湯語教』</span>
        </h1>
        <p className="mt-6 leading-loose text-[15px]">
          日本最古の「銭湯経営の教科書」と言われる本があります。
          江戸の湯屋の親方・向晦亭等琳（こうかいてい とうりん）が書いた
          『湯語教（一名 銭湯手引草）』。
          お湯の沸かし方から客あしらい、湯屋の心得まで——
          170年前の銭湯のリアルが詰まっています。
        </p>
        <p className="mt-3 leading-loose text-[15px]">
          このサイトでは、原本の画像・翻刻・現代語訳を並べて、
          くずし字が読めなくても最初から最後まで読み通せます。
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {ready ? (
            <>
              <Link
                to={`/read/${last ?? firstReadable}`}
                className="inline-flex items-center justify-center min-h-11 px-7 rounded-full bg-yu-blue text-white font-maru font-bold hover:bg-yu-blue-deep transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yu-blue focus-visible:ring-offset-2"
              >
                {last ? "続きから読む" : "読みはじめる"}
              </Link>
              {last && (
                <Link
                  to={`/read/${firstReadable}`}
                  className="inline-flex items-center justify-center min-h-11 px-7 rounded-full border border-yu-blue text-yu-blue font-maru font-bold hover:bg-yu-blue-soft transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yu-blue focus-visible:ring-offset-2"
                >
                  最初から
                </Link>
              )}
            </>
          ) : (
            <p className="text-ink-soft text-sm">翻刻データを準備中です。</p>
          )}
        </div>
      </section>

      <section className="py-12 border-t border-line">
        <h2 className="font-maru font-bold text-xl text-yu-blue">
          『湯語教』ってどんな本？
        </h2>
        <div className="mt-5 space-y-4 leading-loose text-[15px]">
          <p>
            江戸時代、銭湯は庶民の暮らしの中心でした。武士も職人も長屋の住人も、
            みんな同じ湯に浸かる。そんな湯屋を切り盛りする経営者のために、
            湯屋仲間の間で読まれたのがこの本です。
          </p>
          <p>
            題名は、当時の寺子屋の定番教科書『実語教（じつごきょう）』のパロディ。
            「山高きが故に貴からず」という有名な一節を
            「湯屋磨かざれば光沢なし」ともじって、
            リズムのよい対句で経営の心得を説きます。
          </p>
          <p>
            道徳の教科書の型を借りて銭湯経営を語る——
            江戸っ子らしいユーモアと、商売への真剣さが同居した一冊です。
          </p>
        </div>
      </section>

      {ready && (
        <section className="py-12 border-t border-line">
          <h2 className="font-maru font-bold text-xl text-yu-blue">目次</h2>
          <ul className="mt-5 divide-y divide-line">
            {komaList.map((k) => (
              <li key={k.koma}>
                <Link
                  to={`/read/${k.koma}`}
                  className="flex items-baseline gap-4 py-3 hover:text-yu-blue transition-colors"
                >
                  <span className="text-xs text-ink-soft tabular-nums shrink-0 w-12">
                    {k.koma} 丁
                  </span>
                  <span className="text-[15px]">{k.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
