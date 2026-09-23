import { useState } from "react";

/**
 * 注記の折りたたみ。
 * ネイティブの <details>/<summary> を使う — キーボード操作も状態通知もブラウザが持つし、
 * Chrome のページ内検索は閉じた <details> を自動で開いてヒットさせる。
 * 88セクション中75件に注記がある読み物では、それが実質的な機能になる。
 */
export default function NoteDisclosure({ children }: { children: string }) {
  const [open, setOpen] = useState(false);
  return (
    <details
      className="disclosure mt-3"
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary className="inline-flex items-center gap-2 min-h-11 cursor-pointer rounded-full text-caption text-ink-soft hover:text-yu-blue transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yu-blue focus-visible:ring-offset-2">
        <span className="inline-flex items-center h-6 px-3 rounded-full border border-line font-maru font-bold text-yu-blue">
          注
        </span>
        <span>{open ? "をとじる" : "をひらく"}</span>
      </summary>
      <p className="pl-1 pb-1 text-caption text-ink-soft">{children}</p>
    </details>
  );
}
