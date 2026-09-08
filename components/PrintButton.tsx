"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print rounded-full border border-[var(--rule)] px-4 py-1.5 text-sm transition-colors hover:border-sakura-600 hover:text-sakura-600"
    >
      Print / Save PDF
    </button>
  );
}
