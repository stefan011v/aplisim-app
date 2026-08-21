export default function AuthShell({ title, subtitle, children }) {
  const currentYear = new Date().getFullYear();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07111f] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-10%] top-[-8%] h-[360px] w-[360px] rounded-full bg-indigo-500/18 blur-3xl" />
        <div className="absolute right-[-8%] top-[12%] h-[320px] w-[320px] rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:72px_72px] opacity-[0.14]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.16),transparent_34%)]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-md items-center px-6 py-10">
        <div className="w-full">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(74,222,128,0.9)]" />
            APLISIM Business Console
          </div>

          <div className="mt-5 rounded-[22px] border border-white/10 bg-slate-900/70 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur-sm sm:p-6">
            <h1 className="text-[20px] font-semibold tracking-[-0.03em] text-white">
              {title}
            </h1>
            <p className="mt-1.5 text-[12px] leading-5 text-slate-400">
              {subtitle}
            </p>

            <div className="mt-5">{children}</div>
          </div>

          <div className="mt-5 text-center text-[10px] text-slate-500">
            &copy; {currentYear} APLISIM
          </div>
        </div>
      </div>
    </div>
  );
}
