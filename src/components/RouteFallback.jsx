export default function RouteFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="grid min-h-[60vh] w-full place-items-center px-6 py-10"
    >
      <div className="w-full max-w-[900px]">
        <div className="h-[92px] animate-pulse rounded-card border border-white/8 bg-slate-900/60" />

        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((key) => (
            <div
              key={key}
              className="h-[86px] animate-pulse rounded-2xl border border-white/8 bg-slate-900/50"
            />
          ))}
        </div>

        <div className="mt-3 h-[220px] animate-pulse rounded-card border border-white/8 bg-slate-900/50" />

        <span className="sr-only">Loading screen</span>
      </div>
    </div>
  );
}
