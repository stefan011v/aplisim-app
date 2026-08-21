import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../lib/api";
import {
  prettyTicketPriority,
  prettyTicketStatus,
  ticketStatusClasses,
} from "../lib/domain";
import { CompactTotal, HeroStat, MiniInfo, SectionCard } from "../components/ui";
import { formatDateTime } from "../lib/format";

function priorityClasses(priority) {
  switch (priority) {
    case "urgent":
      return "border-rose-500/20 bg-rose-500/10 text-rose-200";
    case "high":
      return "border-orange-500/20 bg-orange-500/10 text-orange-200";
    case "low":
      return "border-slate-500/20 bg-slate-500/10 text-slate-300";
    default:
      return "border-indigo-500/20 bg-indigo-500/10 text-indigo-200";
  }
}

function getAccountState(client, tickets) {
  const openTickets = tickets.filter(
    (ticket) => !["resolved", "closed"].includes(ticket.status)
  ).length;

  const waitingForClient = tickets.filter(
    (ticket) => ticket.status === "waiting_client"
  ).length;

  if (waitingForClient > 0) {
    return {
      label: "Waiting on your feedback",
      tone: "border-amber-500/20 bg-amber-500/10 text-amber-200",
      description:
        "One or more requests are currently waiting for your reply or confirmation.",
    };
  }

  if (openTickets > 0) {
    return {
      label: "Active support",
      tone: "border-sky-500/20 bg-sky-500/10 text-sky-200",
      description:
        "You currently have active requests being tracked by the support team.",
    };
  }

  if (client?.status === "active") {
    return {
      label: "All clear",
      tone: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
      description:
        "No active support items at the moment. Your account is currently stable.",
    };
  }

  return {
    label: "Account overview",
    tone: "border-indigo-500/20 bg-indigo-500/10 text-indigo-200",
    description:
      "Your account is available and ready for new support or service requests.",
  };
}

const inputClass =
  "h-10 w-full rounded-xl border border-white/8 bg-[#0b1220] px-3 text-[12px] text-white outline-none placeholder:text-slate-500 transition focus:border-white/15 focus:bg-[#0d1526] focus:ring-1 focus:ring-white/10";

const textareaClass =
  "w-full rounded-xl border border-white/8 bg-[#0b1220] px-3 py-2.5 text-[12px] text-white outline-none placeholder:text-slate-500 transition focus:border-white/15 focus:bg-[#0d1526] focus:ring-1 focus:ring-white/10";

const labelClass = "text-[11px] font-medium text-slate-300";

export default function ClientDashboard({ user }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [client, setClient] = useState(null);
  const [tickets, setTickets] = useState([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    category: "general",
    priority: "medium",
  });

  const clientId = user?.clientId;

  const loadDashboard = useCallback(
    async (isRefresh = false) => {
      if (!clientId) {
        setError("No client account is linked to this user.");
        setLoading(false);
        return;
      }

      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        setError("");

        const [clientData, ticketsData] = await Promise.all([
          apiFetch(`/api/clients/${clientId}`),
          apiFetch("/api/tickets"),
        ]);

        const ownTickets = (ticketsData || []).filter(
          (ticket) => Number(ticket.clientId) === Number(clientId)
        );

        setClient(clientData);
        setTickets(ownTickets);
      } catch (err) {
        setError(err.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [clientId]
  );

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  function handleCreateChange(e) {
    const { name, value } = e.target;
    setCreateForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function openCreateModal() {
    setCreateError("");
    setCreateOpen(true);
  }

  function closeCreateModal() {
    setCreateOpen(false);
    setCreateError("");
    setCreateForm({
      title: "",
      description: "",
      category: "general",
      priority: "medium",
    });
  }

  async function handleCreateTicket(e) {
    e.preventDefault();

    try {
      setCreating(true);
      setCreateError("");

      await apiFetch("/api/tickets", {
        method: "POST",
        body: JSON.stringify({
          title: createForm.title,
          description: createForm.description,
          category: createForm.category,
          priority: createForm.priority,
        }),
      });

      closeCreateModal();
      loadDashboard(true);
    } catch (err) {
      setCreateError(err.message || "Failed to create ticket");
    } finally {
      setCreating(false);
    }
  }

  const stats = useMemo(() => {
    const open = tickets.filter(
      (ticket) => !["resolved", "closed"].includes(ticket.status)
    ).length;

    const inProgress = tickets.filter(
      (ticket) => ticket.status === "in_progress"
    ).length;

    const waitingClient = tickets.filter(
      (ticket) => ticket.status === "waiting_client"
    ).length;

    const resolved = tickets.filter(
      (ticket) => ticket.status === "resolved" || ticket.status === "closed"
    ).length;

    return {
      total: tickets.length,
      open,
      inProgress,
      waitingClient,
      resolved,
    };
  }, [tickets]);

  const accountState = useMemo(
    () => getAccountState(client, tickets),
    [client, tickets]
  );

  const recentActivity = useMemo(() => {
    const items = [];

    for (const ticket of tickets) {
      items.push({
        id: `ticket-${ticket.id}`,
        type: "ticket",
        title: ticket.title || `Ticket #${ticket.id}`,
        subtitle: `${prettyTicketStatus(ticket.status)} - ${prettyTicketPriority(
          ticket.priority
        )}`,
        createdAt: ticket.updatedAt || ticket.createdAt,
        href: `/tickets/${ticket.id}`,
      });
    }

    return items
      .sort((a, b) => {
        const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return db - da;
      })
      .slice(0, 6);
  }, [tickets]);

  const openTickets = useMemo(() => {
    return tickets
      .filter((ticket) => !["resolved", "closed"].includes(ticket.status))
      .sort((a, b) => {
        const da = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const db = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return db - da;
      })
      .slice(0, 6);
  }, [tickets]);

  return (
    <div className="w-full p-3 text-white sm:p-4 lg:p-5">
      <div className="mx-auto max-w-[1700px]">
        <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-4 shadow-[0_18px_50px_rgba(0,0,0,0.24)] sm:px-5 sm:py-5">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.07),transparent_30%)]" />

          <div className="relative z-10 flex flex-col gap-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="min-w-0">
                <div className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[9px] uppercase tracking-[0.16em] text-slate-300">
                  Client workspace
                </div>

                <h1 className="mt-3 text-[24px] font-semibold tracking-[-0.05em] text-white sm:text-[26px]">
                  Welcome back{client?.companyName ? `, ${client.companyName}` : ""}
                </h1>

                <p className="mt-1.5 max-w-3xl text-[11px] leading-5 text-slate-400 sm:text-[12px]">
                  View your current support status, recent updates and open
                  requests from one place.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to="/tickets"
                  className="inline-flex h-9 items-center rounded-xl border border-white/10 bg-white/[0.04] px-4 text-[12px] font-medium text-white transition hover:bg-white/[0.08]"
                >
                  View all requests
                </Link>

                <button
                  type="button"
                  onClick={openCreateModal}
                  className="inline-flex h-9 items-center rounded-xl border border-sky-400/20 bg-sky-500/15 px-4 text-[12px] font-semibold text-sky-100 transition hover:bg-sky-500/20"
                >
                  Open new ticket
                </button>

                <button
                  type="button"
                  onClick={() => loadDashboard(true)}
                  disabled={refreshing}
                  className="inline-flex h-9 items-center rounded-xl border border-white/10 bg-white/[0.04] px-4 text-[12px] font-medium text-white transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {refreshing ? "Refreshing..." : "Refresh"}
                </button>
              </div>
            </div>

            {!loading ? (
              <>
                <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.12em] text-slate-400">
                        Current account status
                      </div>
                      <div className="mt-2 text-[18px] font-semibold text-white">
                        {accountState.label}
                      </div>
                      <div className="mt-1 text-[12px] leading-5 text-slate-400">
                        {accountState.description}
                      </div>
                    </div>

                    <span
                      className={`inline-flex self-start rounded-full border px-3 py-1 text-[10px] font-medium ${accountState.tone}`}
                    >
                      {accountState.label}
                    </span>
                  </div>
                </div>

                {stats.waitingClient > 0 ? (
                  <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="text-[10px] uppercase tracking-[0.12em] text-amber-300">
                          Action needed
                        </div>
                        <div className="mt-1 text-[16px] font-semibold text-white">
                          {stats.waitingClient} request{stats.waitingClient > 1 ? "s are" : " is"} waiting for your reply
                        </div>
                        <div className="mt-1 text-[12px] leading-5 text-amber-100/80">
                          Open the ticket and reply so the support team can continue.
                        </div>
                      </div>

                      <Link
                        to="/tickets"
                        className="inline-flex h-9 items-center rounded-xl border border-amber-400/20 bg-white/[0.06] px-4 text-[12px] font-medium text-white transition hover:bg-white/[0.1]"
                      >
                        Review requests
                      </Link>
                    </div>
                  </div>
                ) : null}

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <HeroStat
                    label="Open requests"
                    value={String(stats.open)}
                    hint="Currently active"
                  />
                  <HeroStat
                    label="In progress"
                    value={String(stats.inProgress)}
                    hint="Being handled"
                  />
                  <HeroStat
                    label="Waiting for you"
                    value={String(stats.waitingClient)}
                    hint="Reply needed"
                  />
                  <HeroStat
                    label="Resolved"
                    value={String(stats.resolved)}
                    hint="Completed items"
                  />
                </div>
              </>
            ) : null}
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-[12px] text-red-200">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="mt-4 rounded-[20px] border border-white/8 bg-slate-900/70 p-5 text-[12px] text-slate-300 shadow-[0_10px_32px_rgba(0,0,0,0.18)]">
            Loading your dashboard...
          </div>
        ) : (
          <div className="mt-4 grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
            <div className="grid gap-4">
              <SectionCard
                bodyClass=""
                title="My open requests"
                description="Your current support items that are still active."
              >
                {openTickets.length ? (
                  <div className="mt-4 grid gap-2.5">
                    {openTickets.map((ticket) => (
                      <Link
                        key={ticket.id}
                        to={`/tickets/${ticket.id}`}
                        className="block rounded-2xl border border-white/8 bg-slate-950/40 px-3.5 py-3 transition hover:bg-white/[0.04]"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-[12px] font-medium text-white">
                              {ticket.title}
                            </div>
                            <div className="mt-1 text-[11px] text-slate-400">
                              {ticket.description || "No description"}
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <span
                              className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${ticketStatusClasses(
                                ticket.status
                              )}`}
                            >
                              {prettyTicketStatus(ticket.status)}
                            </span>

                            <span
                              className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${priorityClasses(
                                ticket.priority
                              )}`}
                            >
                              {prettyTicketPriority(ticket.priority)}
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500">
                          <span>
                            Updated: {formatDateTime(ticket.updatedAt || ticket.createdAt)}
                          </span>
                          <span>Open request</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 rounded-xl border border-dashed border-white/8 bg-white/[0.02] px-3 py-4 text-[11px] text-slate-500">
                    You have no open requests right now.
                  </div>
                )}
              </SectionCard>

              <SectionCard
                bodyClass=""
                title="Recent activity"
                description="Latest changes across your support requests."
              >
                {recentActivity.length ? (
                  <div className="mt-4 grid gap-2.5">
                    {recentActivity.map((item, index) => (
                      <TimelineRow
                        key={item.id}
                        item={item}
                        isLast={index === recentActivity.length - 1}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 rounded-xl border border-dashed border-white/8 bg-white/[0.02] px-3 py-4 text-[11px] text-slate-500">
                    No recent activity yet.
                  </div>
                )}
              </SectionCard>
            </div>

            <div className="grid gap-4">
              <SectionCard
                bodyClass=""
                title="Account overview"
                description="Your main account and support details."
              >
                <div className="mt-4 grid gap-2.5">
                  <MiniInfo
                    label="Company"
                    value={client?.companyName || "—"}
                  />
                  <MiniInfo
                    label="Primary contact"
                    value={client?.contactName || user?.name || "—"}
                  />
                  <MiniInfo
                    label="Email"
                    value={client?.email || user?.email || "—"}
                  />
                  <MiniInfo
                    label="Phone"
                    value={client?.phone || "—"}
                  />
                  <MiniInfo
                    label="Primary service"
                    value={client?.primaryService || "—"}
                  />
                  <MiniInfo
                    label="Package"
                    value={client?.packageName || "—"}
                  />
                </div>
              </SectionCard>

              <SectionCard
                bodyClass=""
                title="Quick actions"
                description="Fast paths to common client actions."
              >
                <div className="mt-4 grid gap-2.5">
                  <QuickAction
                    onClick={openCreateModal}
                    title="Create a new ticket"
                    description="Open a new support or service request."
                  />
                  <QuickAction
                    to="/tickets"
                    title="View all requests"
                    description="See every request linked to your account."
                  />
                  <QuickAction
                    to="/tickets"
                    title="Reply to a request"
                    description="Continue an existing conversation with support."
                  />
                </div>
              </SectionCard>

              <SectionCard
                bodyClass=""
                title="Support summary"
                description="A quick read of your current support situation."
              >
                <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                  <CompactTotal
                    label="Total requests"
                    value={stats.total}
                  />
                  <CompactTotal
                    label="Waiting for you"
                    value={stats.waitingClient}
                    tone="border-amber-500/20 bg-amber-500/10 text-amber-200"
                  />
                  <CompactTotal
                    label="In progress"
                    value={stats.inProgress}
                    tone="border-sky-500/20 bg-sky-500/10 text-sky-200"
                  />
                  <CompactTotal
                    label="Resolved"
                    value={stats.resolved}
                    tone="border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                  />
                </div>
              </SectionCard>

              <SectionCard
                bodyClass=""
                title="Support info"
                description="How to reach support and what to expect."
              >
                <div className="mt-4 grid gap-2.5">
                  <MiniInfo
                    label="Support email"
                    value="support@aplisim.com"
                  />
                  <MiniInfo
                    label="Response window"
                    value="Business hours priority handling"
                  />
                  <MiniInfo
                    label="Urgent issues"
                    value="Marked urgent tickets are reviewed first"
                  />
                </div>
              </SectionCard>
            </div>
          </div>
        )}

        {createOpen ? (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
            <div className="w-full max-w-[640px] rounded-[28px] border border-white/10 bg-[#08101b] shadow-[0_30px_100px_rgba(0,0,0,0.45)]">
              <div className="flex items-start justify-between gap-4 border-b border-white/8 px-5 py-5">
                <div>
                  <div className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[9px] uppercase tracking-[0.16em] text-slate-300">
                    New ticket
                  </div>
                  <h3 className="mt-3 text-[22px] font-semibold tracking-[-0.04em] text-white">
                    Open a new support request
                  </h3>
                  <p className="mt-1 text-[12px] leading-5 text-slate-400">
                    Send a new issue or request directly to support.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white transition hover:bg-white/[0.08]"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleCreateTicket} className="px-5 py-5">
                {createError ? (
                  <div className="mb-4 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-[12px] text-red-200">
                    {createError}
                  </div>
                ) : null}

                <div className="grid gap-3">
                  <div className="grid gap-1.5">
                    <label className={labelClass}>Title</label>
                    <input
                      name="title"
                      value={createForm.title}
                      onChange={handleCreateChange}
                      className={inputClass}
                      placeholder="DNS issue, email problem, website update..."
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="grid gap-1.5">
                      <label className={labelClass}>Category</label>
                      <select
                        name="category"
                        value={createForm.category}
                        onChange={handleCreateChange}
                        className={inputClass}
                      >
                        <option value="general" className="bg-slate-900">General</option>
                        <option value="hardware" className="bg-slate-900">Hardware</option>
                        <option value="software" className="bg-slate-900">Software</option>
                        <option value="network" className="bg-slate-900">Network</option>
                        <option value="access" className="bg-slate-900">Access / Login</option>
                        <option value="email" className="bg-slate-900">Email</option>
                        <option value="backup" className="bg-slate-900">Backup</option>
                        <option value="website" className="bg-slate-900">Website</option>
                        <option value="crm" className="bg-slate-900">CRM</option>
                        <option value="server" className="bg-slate-900">Server</option>
                        <option value="security" className="bg-slate-900">Security</option>
                        <option value="other" className="bg-slate-900">Other</option>
                      </select>
                    </div>

                    <div className="grid gap-1.5">
                      <label className={labelClass}>Priority</label>
                      <select
                        name="priority"
                        value={createForm.priority}
                        onChange={handleCreateChange}
                        className={inputClass}
                      >
                        <option value="low" className="bg-slate-900">Low</option>
                        <option value="medium" className="bg-slate-900">Medium</option>
                        <option value="high" className="bg-slate-900">High</option>
                        <option value="urgent" className="bg-slate-900">Urgent</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-1.5">
                    <label className={labelClass}>Description</label>
                    <textarea
                      name="description"
                      value={createForm.description}
                      onChange={handleCreateChange}
                      rows={5}
                      className={textareaClass}
                      placeholder="Describe the issue or request..."
                    />
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeCreateModal}
                    className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-[12px] text-white transition hover:bg-white/[0.06]"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={creating}
                    className="rounded-xl border border-sky-400/20 bg-sky-500/15 px-4 py-2 text-[12px] font-semibold text-sky-100 transition hover:bg-sky-500/20 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {creating ? "Creating..." : "Create ticket"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function TimelineRow({ item, isLast }) {
  return (
    <div className="relative pl-8">
      {!isLast ? (
        <div className="absolute left-[11px] top-6 bottom-[-14px] w-px bg-white/10" />
      ) : null}

      <div className="absolute left-0 top-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-slate-950/90">
        <div className="h-2.5 w-2.5 rounded-full bg-sky-300" />
      </div>

      <Link
        to={item.href}
        className="block rounded-2xl border border-white/8 bg-slate-950/40 px-3.5 py-3 transition hover:bg-white/[0.04]"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-[12px] font-medium text-white">
              {item.title}
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              {item.subtitle}
            </div>
          </div>

          <div className="text-[10px] text-slate-500">
            {formatDateTime(item.createdAt)}
          </div>
        </div>
      </Link>
    </div>
  );
}

function QuickAction({ to, title, description, onClick }) {
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="block w-full rounded-2xl border border-white/8 bg-slate-950/40 px-4 py-3 text-left transition hover:bg-white/[0.04]"
      >
        <div className="text-[12px] font-medium text-white">{title}</div>
        <div className="mt-1 text-[11px] leading-5 text-slate-400">
          {description}
        </div>
      </button>
    );
  }

  return (
    <Link
      to={to}
      className="block rounded-2xl border border-white/8 bg-slate-950/40 px-4 py-3 transition hover:bg-white/[0.04]"
    >
      <div className="text-[12px] font-medium text-white">{title}</div>
      <div className="mt-1 text-[11px] leading-5 text-slate-400">
        {description}
      </div>
    </Link>
  );
}