import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  Bars3Icon,
  BellAlertIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { apiFetch } from "../lib/api";
import {
  canWrite,
  isAdmin,
  isAuthenticatedUser,
  isClient,
} from "../lib/roles";
import GlobalSearch from "../components/GlobalSearch";
import QuickCreateDialog from "../components/QuickCreateDialog";
import SidebarContent from "./SidebarContent";
import { buildBreadcrumbs, prettifyPath, shellNav } from "./navigation";
import { useModalBehavior } from "../hooks/useModalBehavior";

const SHELL_STATS_INTERVAL_MS = 60000;

export default function AppLayout({ user, onLogout }) {
  const location = useLocation();

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [attentionOpen, setAttentionOpen] = useState(false);
  const [counts, setCounts] = useState({
    clients: 0,
    leads: 0,
    tickets: 0,
    accessRequests: 0,
    urgentTickets: 0,
    newAccessRequests: 0,
    proposalLeads: 0,
    waitingClientTickets: 0,
  });

  const [quickCreateOpen, setQuickCreateOpen] = useState(false);

  const refreshShellStats = useCallback(async () => {
    if (!isAuthenticatedUser(user)) return;

    try {
      const stats = await apiFetch("/api/stats/shell");
      setCounts(stats);
    } catch (error) {
      console.error("APP_LAYOUT_COUNTS_ERROR:", error);
    }
  }, [user]);

  useEffect(() => {
    if (!isAuthenticatedUser(user)) return undefined;

    let cancelled = false;

    async function load() {
      try {
        const stats = await apiFetch("/api/stats/shell");
        if (!cancelled) setCounts(stats);
      } catch (error) {
        console.error("APP_LAYOUT_COUNTS_ERROR:", error);
      }
    }

    load();

    // Badges stay fresh without re-fetching on every single navigation.
    const interval = window.setInterval(load, SHELL_STATS_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [user]);

  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);

  const mobileNavRef = useModalBehavior(mobileNavOpen, closeMobileNav);

  const sections = useMemo(
    () => shellNav(location.pathname, counts, user),
    [location.pathname, counts, user]
  );

  const breadcrumbs = useMemo(
    () => buildBreadcrumbs(location.pathname, user),
    [location.pathname, user]
  );

  const pageTitle = useMemo(
    () => prettifyPath(location.pathname, user),
    [location.pathname, user]
  );

  const displayName =
    user?.name || user?.fullName || user?.email || "Workspace User";

  const needsAttention = useMemo(() => {
    const items = [];

    if (counts.urgentTickets > 0) {
      items.push({
        key: "urgent-tickets",
        label: `${counts.urgentTickets} urgent ticket${
          counts.urgentTickets > 1 ? "s" : ""
        }`,
        to: "/tickets",
      });
    }

    if (counts.waitingClientTickets > 0) {
      items.push({
        key: "waiting-client-tickets",
        label: `${counts.waitingClientTickets} waiting-client ticket${
          counts.waitingClientTickets > 1 ? "s" : ""
        }`,
        to: "/tickets",
      });
    }

    if (!isClient(user) && counts.proposalLeads > 0) {
      items.push({
        key: "proposal-leads",
        label: `${counts.proposalLeads} proposal-stage lead${
          counts.proposalLeads > 1 ? "s" : ""
        }`,
        to: "/leads",
      });
    }

    if (isAdmin(user) && counts.newAccessRequests > 0) {
      items.push({
        key: "new-access-requests",
        label: `${counts.newAccessRequests} new access request${
          counts.newAccessRequests > 1 ? "s" : ""
        }`,
        to: "/access-requests",
      });
    }

    return items;
  }, [counts, user]);

  // Ctrl/Cmd+K opens the palette from anywhere in the shell.
  useEffect(() => {
    function handleShortcut(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    }

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  return (
    <div className="min-h-screen bg-[#060b14] text-white">
      <div className="flex min-h-screen">
        <aside className="fixed left-0 top-0 hidden h-screen w-[248px] border-r border-white/8 bg-[#08101b] xl:flex xl:flex-col">
          <SidebarContent
            sections={sections}
            counts={counts}
            displayName={displayName}
            user={user}
            onLogout={onLogout}
            needsAttention={needsAttention}
          />
        </aside>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col xl:pl-[248px]">
          <header className="sticky top-0 z-30 border-b border-white/8 bg-[#060b14]/92 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3 px-3 py-2.5 sm:px-4 lg:px-5">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileNavOpen(true)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white transition hover:bg-white/[0.08] xl:hidden"
                >
                  <Bars3Icon className="h-4.5 w-4.5" />
                </button>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 text-[9px] uppercase tracking-[0.14em] text-slate-500">
                    {breadcrumbs.map((crumb, index) => (
                      <Fragment key={crumb.to}>
                        {index > 0 ? <span>/</span> : null}
                        <Link
                          to={crumb.to}
                          className="transition hover:text-slate-300"
                        >
                          {crumb.label}
                        </Link>
                      </Fragment>
                    ))}
                  </div>

                  <div className="mt-0.5 text-[17px] font-semibold tracking-[-0.03em] text-white sm:text-[18px]">
                    {pageTitle}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  aria-label="Search workspace"
                  className="hidden min-w-[220px] items-center gap-2 rounded-xl border border-white/8 bg-[#0b1220] px-3 py-2 text-left transition hover:border-white/15 lg:flex"
                >
                  <MagnifyingGlassIcon className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                  <span className="flex-1 text-[11px] text-slate-500">
                    Search...
                  </span>
                  <kbd className="rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[9px] text-slate-400">
                    Ctrl K
                  </kbd>
                </button>

                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  aria-label="Search workspace"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white transition hover:bg-white/[0.08] lg:hidden"
                >
                  <MagnifyingGlassIcon className="h-4 w-4" />
                </button>

                <div className="relative hidden md:block">
                  <button
                    type="button"
                    onClick={() => setAttentionOpen((prev) => !prev)}
                    aria-haspopup="true"
                    aria-expanded={attentionOpen}
                    className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.03] px-2.5 py-2 transition hover:bg-white/[0.06]"
                  >
                    <BellAlertIcon className="h-3.5 w-3.5 text-amber-300" />
                    <span className="text-[10px] text-slate-300">
                      {needsAttention.length > 0
                        ? `${needsAttention.length} attention item${
                            needsAttention.length > 1 ? "s" : ""
                          }`
                        : "No urgent alerts"}
                    </span>
                  </button>

                  {attentionOpen ? (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setAttentionOpen(false)}
                      />

                      <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[260px] overflow-hidden rounded-2xl border border-white/10 bg-[#0b1220] shadow-[0_18px_50px_rgba(0,0,0,0.45)]">
                        <div className="border-b border-white/8 px-3 py-2 text-[9px] uppercase tracking-[0.14em] text-slate-500">
                          Needs attention now
                        </div>

                        <div className="p-2">
                          {needsAttention.length > 0 ? (
                            needsAttention.map((item) => (
                              <Link
                                key={item.key}
                                to={item.to}
                                onClick={() => setAttentionOpen(false)}
                                className="block rounded-xl px-2.5 py-2 text-[11px] text-slate-200 transition hover:bg-white/[0.05]"
                              >
                                {item.label}
                              </Link>
                            ))
                          ) : (
                            <div className="px-2.5 py-2 text-[11px] text-slate-400">
                              Nothing needs attention right now.
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>

                {canWrite(user) ? (
                  <button
                    type="button"
                    onClick={() => setQuickCreateOpen(true)}
                    className="flex h-9 items-center gap-1.5 rounded-xl border border-white/8 bg-white/[0.03] px-3 text-[11px] text-white transition hover:bg-white/[0.06]"
                  >
                    Quick create
                    <ChevronDownIcon className="h-3.5 w-3.5 text-slate-400" />
                  </button>
                ) : null}

                <div className="hidden items-center gap-2 rounded-xl border border-white/8 bg-white/[0.03] px-2.5 py-1.5 md:flex">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.08] text-[10px] font-semibold text-white">
                    {String(displayName).slice(0, 1).toUpperCase()}
                  </div>
                  <div className="max-w-[140px] truncate text-[11px] text-slate-300">
                    {displayName}
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="min-w-0 flex-1">
            <Outlet />
          </main>
        </div>
      </div>

      <GlobalSearch
        user={user}
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
      />

      {mobileNavOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
          className="fixed inset-0 z-50 xl:hidden"
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeMobileNav}
          />
          <div
            ref={mobileNavRef}
            className="absolute left-0 top-0 h-full w-[248px] border-r border-white/10 bg-[#08101b] shadow-[20px_0_60px_rgba(0,0,0,0.35)]"
          >
            <div className="flex items-center justify-between px-4 py-4">
              <div className="text-[13px] font-semibold text-white">
                APLISIM Console
              </div>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <SidebarContent
              sections={sections}
              counts={counts}
              displayName={displayName}
              user={user}
              onLogout={onLogout}
              mobile
              onNavigate={() => setMobileNavOpen(false)}
              needsAttention={needsAttention}
            />
          </div>
        </div>
      ) : null}

      <QuickCreateDialog
        open={quickCreateOpen && canWrite(user)}
        user={user}
        onClose={() => setQuickCreateOpen(false)}
        onCreated={refreshShellStats}
      />
    </div>
  );
}
