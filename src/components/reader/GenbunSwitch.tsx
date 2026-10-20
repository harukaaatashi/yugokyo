import { useUi } from "../../lib/i18n";

/**
 * 原文翻刻を本文に出すかのスイッチ。
 * 章扉の見出しの下（展示レイアウト）と、写真パネルの帯（以前のレイアウト）で使う。
 */
export default function GenbunSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  const ui = useUi();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="group shrink-0 inline-flex min-h-11 items-center gap-2 rounded-full text-caption focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yu-blue"
    >
      <span
        className={`transition-colors ${
          checked
            ? "font-maru font-bold text-yu-blue"
            : "text-ink-soft group-hover:text-yu-blue"
        }`}
      >
        {ui.genbunSwitch}
      </span>
      <span
        aria-hidden="true"
        className={`relative h-5 w-9 rounded-full border transition-colors ${
          checked ? "border-yu-blue bg-yu-blue" : "border-ink-soft bg-paper"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-3.5 w-3.5 rounded-full motion-safe:transition-transform ${
            checked ? "translate-x-4 bg-white" : "bg-ink-soft"
          }`}
        />
      </span>
    </button>
  );
}
