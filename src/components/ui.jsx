export const inputClass =
  "h-9 w-full rounded-xl border border-white/8 bg-field px-3 text-[12px] text-white outline-none placeholder:text-muted transition focus:border-white/15 focus:bg-field-focus focus:ring-1 focus:ring-white/10";

export const textareaClass =
  "w-full rounded-xl border border-white/8 bg-field px-3 py-2.5 text-[12px] text-white outline-none placeholder:text-muted transition focus:border-white/15 focus:bg-field-focus focus:ring-1 focus:ring-white/10";

export const labelClass = "text-[11px] font-medium text-slate-300";

export const primaryButtonClass =
  "inline-flex items-center justify-center rounded-xl border border-white/10 bg-white px-4 py-2 text-[12px] font-semibold text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70";

export const ghostButtonClass =
  "inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium text-white transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60";

export const dangerButtonClass =
  "inline-flex items-center justify-center rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-1.5 text-[11px] font-medium text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60";

export function HeroStat({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="text-[10px] uppercase tracking-[0.12em] text-slate-400">
        {label}
      </div>
      <div className="mt-2 text-[24px] font-semibold tracking-[-0.04em] text-white">
        {value}
      </div>
      <div className="mt-1 text-[11px] text-muted">{hint}</div>
    </div>
  );
}

export function MiniStat({ label, value, hint }) {
  return (
    <div className="rounded-xl border border-white/8 bg-slate-950/40 p-3">
      <div className="text-[11px] text-slate-400">{label}</div>
      <div className="mt-1 text-[18px] font-semibold leading-none text-white">
        {value}
      </div>
      <div className="mt-1 text-[10px] text-muted">{hint}</div>
    </div>
  );
}

export function CompactTotal({ label, value, tone = "" }) {
  return (
    <div
      className={`rounded-xl border px-3 py-3 ${
        tone || "border-white/8 bg-slate-950/50"
      }`}
    >
      <div className="text-[10px] uppercase tracking-[0.08em] text-muted">
        {label}
      </div>
      <div className="mt-1 text-[18px] font-semibold text-white">{value}</div>
    </div>
  );
}

/** Label + value tile. Previously duplicated as both MiniInfo and InfoCard. */
export function MiniInfo({ label, value }) {
  return (
    <div className="rounded-xl border border-white/8 bg-slate-950/40 p-3">
      <div className="text-[10px] uppercase tracking-[0.08em] text-muted">
        {label}
      </div>
      <div className="mt-1 break-words text-[12px] text-slate-200">{value}</div>
    </div>
  );
}

export function HeaderChip({ label, value }) {
  return (
    <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] text-slate-300">
      <span className="text-muted">{label}:</span>{" "}
      <span className="text-white">{value}</span>
    </div>
  );
}

export function EmptyState({ text }) {
  return (
    <div className="mt-4 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-4 text-[12px] text-slate-400">
      {text}
    </div>
  );
}

/** Untitled surface used by the detail screens. */
export function Panel({ children, compact = false }) {
  return (
    <div
      className={`rounded-card border border-white/8 bg-slate-900/70 shadow-[0_10px_32px_rgba(0,0,0,0.18)] backdrop-blur-sm ${
        compact ? "p-3.5 sm:p-4" : "p-4 sm:p-5"
      }`}
    >
      {children}
    </div>
  );
}

export function ListSkeleton({ rows = 6, variant = "table" }) {
  const items = Array.from({ length: rows }, (_, index) => index);

  if (variant === "cards") {
    return (
      <div role="status" aria-live="polite" className="grid gap-3">
        {items.map((key) => (
          <div
            key={key}
            className="h-[132px] animate-pulse rounded-2xl border border-white/8 bg-slate-950/40"
          />
        ))}
        <span className="sr-only">Loading records</span>
      </div>
    );
  }

  return (
    <div role="status" aria-live="polite" className="divide-y divide-white/6">
      {items.map((key) => (
        <div key={key} className="flex items-center gap-3 px-4 py-3.5">
          <div className="h-3 w-3 animate-pulse rounded bg-white/8" />
          <div className="h-3 flex-[1.4] animate-pulse rounded bg-white/8" />
          <div className="h-3 flex-1 animate-pulse rounded bg-white/6" />
          <div className="h-3 flex-1 animate-pulse rounded bg-white/6" />
          <div className="h-3 w-[70px] animate-pulse rounded-full bg-white/8" />
          <div className="h-3 w-[70px] animate-pulse rounded-full bg-white/6" />
        </div>
      ))}
      <span className="sr-only">Loading records</span>
    </div>
  );
}

export function SortHeader({ label, field, sort, order, onSort, align = "left" }) {
  const isActive = sort === field;

  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      aria-sort={isActive ? (order === "asc" ? "ascending" : "descending") : "none"}
      className={`flex items-center gap-1 text-[10px] uppercase tracking-[0.08em] transition hover:text-slate-300 ${
        isActive ? "text-slate-200" : "text-muted"
      } ${align === "right" ? "justify-end" : ""}`}
    >
      {label}
      <span aria-hidden="true" className="text-[9px]">
        {isActive ? (order === "asc" ? "▲" : "▼") : "⇅"}
      </span>
    </button>
  );
}

/**
 * bodyClass defaults to the settings-style gap; screens whose children already
 * carry their own top margin pass an empty string to avoid double spacing.
 */
export function SectionCard({ title, description, children, bodyClass = "mt-4" }) {
  return (
    <div className="rounded-card border border-white/8 bg-slate-900/70 p-4 shadow-[0_10px_32px_rgba(0,0,0,0.18)] backdrop-blur-sm sm:p-5">
      <div>
        <h2 className="text-[14px] font-semibold tracking-[-0.02em] text-white sm:text-[15px]">
          {title}
        </h2>
        <p className="mt-1 text-[11px] leading-5 text-slate-400 sm:text-[12px]">
          {description}
        </p>
      </div>
      <div className={bodyClass}>{children}</div>
    </div>
  );
}
