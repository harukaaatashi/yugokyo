import { Navigate, useParams } from "react-router-dom";
import { chapterForKoma, komaAnchorId } from "../lib/corpus";

/**
 * 旧 /read/:koma（丁単位のページ）を、その丁を含む章の該当位置へ転送する。
 * 公開済みのリンクを切らないための互換ルート。
 */
export default function KomaRedirect() {
  const { koma } = useParams();
  const n = Number(koma);
  const chapter = Number.isInteger(n) ? chapterForKoma(n) : null;
  if (!chapter) return <Navigate to="/" replace />;
  return <Navigate to={`/chapter/${chapter.def.id}#${komaAnchorId(n)}`} replace />;
}
