import { Link } from "react-router-dom";
import {
  ArrowLeftOnRectangleIcon,
  BellAlertIcon,
} from "@heroicons/react/24/outline";

export default function SidebarContent({
  sections,
  counts,
  displayName,
  user,
  onLogout,
  onNavigate,
  needsAttention = [],
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 border-b border-white/8 px-3 py-3">
        <div className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[9px] uppercase tracking-[0.16em] text-slate-300">
          APLISIM
        </div>

        <div className="mt-2 text-[15px] font-semibold tracking-[-0.03em] text-white">
          {user?.role === "client" ? "Client Portal" : "Business Console"}
        </div>

        <div className="mt-1 text-[10px] leading-4 text-slate-400">
          {user?.role === "client"
            ? "Support updates, requests and account overview."
            : "Sales, operations and admin workspace."}
        </div>

        <div className="mt-2.5 grid grid-cols-2 gap-1.5">
          {user?.role === "client" ? (
            <>
              <MiniShellStat label="My Tickets" value={counts.tickets} />
              <MiniShellStat label="Urgent" value={counts.urgentTickets} />
            </>
          ) : (
            <>
              <MiniShellStat label="Leads" value={counts.leads} />
              <MiniShellStat label="Tickets" value={counts.tickets} />
            </>
          )}
        </div>
      </div>

      <div className="shrink-0 px-2 py-2">
        <div className="rounded-xl border border-white/8 bg-slate-950/40 p-2.5">
          <div className="flex items-center gap-2">
            <BellAlertIcon className="h-3.5 w-3.5 text-amber-300" />
            <div className="text-[9px] font-medium uppercase tracking-[0.08em] text-slate-400">
              Needs attention now
            </div>
          </div>

          <div className="mt-2 space-y-1.5">
            {needsAttention.length > 0 ? (
              needsAttention.slice(0, 3).map((item) => (
                <Link
                  key={item.key}
                  to={item.to}
                  className="block rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1.5 text-[10px] leading-4 text-slate-200 transition hover:border-white/10 hover:bg-white/[0.06]"
                >
                  {item.label}
                </Link>
              ))
            ) : (
              <div className="rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1.5 text-[10px] leading-4 text-slate-400">
                No urgent operational items.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 px-2 py-1">
        {sections.map((section) => (
          <div key={section.title} className="mb-3 last:mb-0">
            <div className="px-2 text-[9px] uppercase tracking-[0.14em] text-muted">
              {section.title}
            </div>

            <div className="mt-1.5 space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={onNavigate}
                    className={`group flex items-center justify-between rounded-xl px-2 py-1.5 transition ${
                      item.isActive
                        ? "border border-white/10 bg-white/[0.08] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                        : "border border-transparent text-slate-300 hover:border-white/8 hover:bg-white/[0.04] hover:text-white"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-lg border ${
                          item.isActive
                            ? "border-white/10 bg-white/[0.08]"
                            : "border-white/8 bg-white/[0.03] group-hover:bg-white/[0.06]"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>

                      <div className="min-w-0 truncate text-[10.5px] font-medium">
                        {item.label}
                      </div>
                    </div>

                    {item.badge ? (
                      <span
                        className={`ml-2 inline-flex shrink-0 rounded-full border px-1.5 py-0.5 text-[8.5px] ${
                          item.badgeTone ||
                          "border-white/10 bg-white/[0.05] text-slate-300"
                        }`}
                      >
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="shrink-0 border-t border-white/8 p-2">
        <div className="rounded-xl border border-white/8 bg-white/[0.03] p-2.5">
          <div className="text-[9px] text-muted">Signed in as</div>
          <div className="mt-1 truncate text-[10.5px] font-medium text-white">
            {displayName}
          </div>
          <div className="mt-1 text-[9px] uppercase tracking-[0.08em] text-muted">
            {user?.role || "unknown role"}
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="mt-2.5 flex h-8 w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-[10.5px] text-white transition hover:bg-white/[0.08]"
          >
            <ArrowLeftOnRectangleIcon className="h-3.5 w-3.5" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

function MiniShellStat({ label, value }) {
  return (
    <div className="rounded-lg border border-white/8 bg-slate-950/40 px-2 py-1.5">
      <div className="text-[9px] uppercase tracking-[0.08em] text-muted">
        {label}
      </div>
      <div className="mt-1 text-[13px] font-semibold leading-none text-white">
        {value}
      </div>
    </div>
  );
}
