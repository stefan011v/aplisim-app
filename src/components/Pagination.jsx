export default function Pagination({ page, totalPages, from, to, total, onChange }) {
  if (total === 0) return null;

  const canPrev = page > 1;
  const canNext = page < totalPages;

  const buttonClass =
    "inline-flex h-8 items-center rounded-xl border border-white/10 bg-white/[0.03] px-3 text-[11px] text-white transition hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-between gap-3 border-t border-white/8 px-1 pt-3"
    >
      <div className="text-[11px] text-slate-400">
        Showing <span className="text-slate-200">{from}</span>–
        <span className="text-slate-200">{to}</span> of{" "}
        <span className="text-slate-200">{total}</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          disabled={!canPrev}
          className={buttonClass}
        >
          Previous
        </button>

        <span className="text-[11px] text-slate-400">
          Page {page} of {totalPages}
        </span>

        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={!canNext}
          className={buttonClass}
        >
          Next
        </button>
      </div>
    </nav>
  );
}
