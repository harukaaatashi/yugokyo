import { Link } from "react-router-dom";
import {
  chapterCoverKoma,
  chapters,
  FIRST_CHAPTER_ID,
  HERO_KOMA,
  komaImageUrl,
  loadProgress,
  TOTAL_CHAPTERS,
  TOTAL_KOMA,
} from "../lib/corpus";

function komaRange(from: number, to: number): string {
  return from === to ? `${from}丁` : `${from}〜${to}丁`;
}

export default function Home() {
  const progress = loadProgress();
  const resumeTo = progress
    ? `/chapter/${progress.chapterId}#koma-${progress.koma}`
    : `/chapter/${FIRST_CHAPTER_ID}`;

  const front = chapters.find((c) => c.def.kind === "front");
  const back = chapters.find((c) => c.def.kind === "back");
  const main = chapters.filter((c) => c.def.kind === "chapter");

  return (
    <div className="max-w-2xl mx-auto px-5">
      <section className="pt-14 pb-12">
        <p className="font-maru text-yu-blue text-sm font-bold">
          嘉永四年（1851）・江戸
        </p>
        <h1 className="font-maru font-bold text-4xl leading-snug mt-3 text-balance">
          ゆごきょう
          <span className="block text-yu-blue">『湯語教』</span>
        </h1>
        <p className="mt-6 leading-loose text-lede">
          日本最古の「銭湯経営の教科書」と言われる本があります。
          江戸の湯屋の親方・向晦亭等琳（こうかいてい とうりん）が書いた
          『湯語教（一名 銭湯手引草）』。
          お湯の沸かし方から客あしらい、湯屋の心得まで——
          170年前の銭湯のリアルが詰まっています。
        </p>
        <p className="mt-3 leading-loose text-lede">
          このサイトでは、原本の画像・翻刻・現代語訳を並べて、
          くずし字が読めなくても最初から最後まで読み通せます。
          原本の章立てにそって{TOTAL_CHAPTERS}章に分けてあります。
        </p>
        <figure className="mt-8">
          <img
            src={komaImageUrl(HERO_KOMA, "w960")}
            alt={`『湯語教』${HERO_KOMA}丁の挿絵。湯屋で人々に湯を施す光明皇后を描いた見開き`}
            width={960}
            height={830}
            decoding="async"
            className="w-full aspect-koma object-cover object-top rounded-2xl border border-line bg-paper-warm"
          />
          <figcaption className="mt-2 text-caption text-ink-soft">
            {HERO_KOMA}丁の挿絵「光明皇后の施浴」／国立国会図書館デジタルコレクション
          </figcaption>
        </figure>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to={resumeTo}
            className="inline-flex items-center justify-center min-h-11 px-7 rounded-full bg-yu-blue text-white font-maru font-bold hover:bg-yu-blue-deep transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yu-blue focus-visible:ring-offset-2"
          >
            {progress ? "続きから読む" : "読みはじめる"}
          </Link>
          {progress && (
            <Link
              to={`/chapter/${FIRST_CHAPTER_ID}`}
              className="inline-flex items-center justify-center min-h-11 px-7 rounded-full border border-yu-blue text-yu-blue font-maru font-bold hover:bg-yu-blue-soft transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yu-blue focus-visible:ring-offset-2"
            >
              最初から
            </Link>
          )}
        </div>
      </section>

      <section className="py-12 border-t border-line">
        <h2 className="font-maru font-bold text-xl text-yu-blue">
          『湯語教』ってどんな本？
        </h2>
        <div className="mt-5 space-y-4 leading-loose text-lede">
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

      <section className="py-12 border-t border-line">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-maru font-bold text-xl text-yu-blue">目次</h2>
          <p className="text-xs text-ink-soft tabular-nums">
            全{TOTAL_CHAPTERS}章・{TOTAL_KOMA}丁
          </p>
        </div>

        {front && (
          <Link
            to={`/chapter/${front.def.id}`}
            className="mt-5 flex items-center min-h-11 gap-4 text-xs text-ink-soft hover:text-yu-blue transition-colors rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yu-blue focus-visible:ring-offset-2"
          >
            <span className="shrink-0 w-12">扉</span>
            <span>
              {front.def.title}（{komaRange(front.komaFrom, front.komaTo)}）
            </span>
          </Link>
        )}

        <ul className="mt-3 divide-y divide-line border-t border-line">
          {main.map((c) => (
            <li key={c.def.id}>
              <Link
                to={`/chapter/${c.def.id}`}
                className="group flex gap-4 py-4 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yu-blue focus-visible:ring-offset-2"
              >
                <img
                  src={komaImageUrl(chapterCoverKoma(c), "w320")}
                  alt=""
                  width={320}
                  height={277}
                  loading="lazy"
                  decoding="async"
                  className="w-20 shrink-0 aspect-koma object-cover object-top rounded-xl border border-line bg-paper-warm"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-caption text-ink-soft tabular-nums">
                    第{c.number}章 ・ {komaRange(c.komaFrom, c.komaTo)}
                  </span>
                  <span className="mt-1 block font-maru font-bold group-hover:text-yu-blue transition-colors">
                    {c.def.title}
                  </span>
                  <span className="mt-2 block text-caption text-ink-soft">
                    {c.def.summary}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>

        {back && (
          <Link
            to={`/chapter/${back.def.id}`}
            className="mt-2 flex items-center min-h-11 gap-4 text-xs text-ink-soft hover:text-yu-blue transition-colors rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yu-blue focus-visible:ring-offset-2"
          >
            <span className="shrink-0 w-12">巻末</span>
            <span>
              {back.def.title}（{komaRange(back.komaFrom, back.komaTo)}）
            </span>
          </Link>
        )}
      </section>
    </div>
  );
}
