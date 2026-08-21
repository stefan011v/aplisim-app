import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { CompactTotal, HeroStat, SectionCard } from "../components/ui";
import { formatDateTime } from "../lib/format";

function getLeadStatusTone(status) {
  switch (status) {
    case "won":
      return {
        label: "Won",
        tone: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
        color: "#34d399",
      };
    case "proposal_sent":
      return {
        label: "Proposal sent",
        tone: "border-amber-400/20 bg-amber-400/10 text-amber-200",
        color: "#f59e0b",
      };
    case "qualified":
      return {
        label: "Qualified",
        tone: "border-violet-400/20 bg-violet-400/10 text-violet-200",
        color: "#a78bfa",
      };
    case "contacted":
      return {
        label: "Contacted",
        tone: "border-sky-400/20 bg-sky-400/10 text-sky-200",
        color: "#38bdf8",
      };
    case "lost":
      return {
        label: "Lost",
        tone: "border-rose-400/20 bg-rose-400/10 text-rose-200",
        color: "#fb7185",
      };
    default:
      return {
        label: "New",
        tone: "border-slate-400/20 bg-slate-400/10 text-slate-200",
        color: "#94a3b8",
      };
  }
}

function getAccessStatusTone(status) {
  switch (status) {
    case "approved":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
    case "rejected":
      return "border-rose-500/20 bg-rose-500/10 text-rose-200";
    case "reviewing":
      return "border-amber-500/20 bg-amber-500/10 text-amber-200";
    default:
      return "border-indigo-500/20 bg-indigo-500/10 text-indigo-200";
  }
}

function prettyTicketStatus(status) {
  switch (status) {
    case "in_progress":
      return "In progress";
    case "waiting_client":
      return "Waiting client";
    case "resolved":
      return "Resolved";
    case "closed":
      return "Closed";
    default:
      return "New";
  }
}

function prettyTicketPriority(priority) {
  switch (priority) {
    case "urgent":
      return "Urgent";
    case "high":
      return "High";
    case "low":
      return "Low";
    default:
      return "Medium";
  }
}

function prettyAccessStatus(status) {
  switch (status) {
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "reviewing":
      return "Reviewing";
    default:
      return "New";
  }
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [allData, setAllData] = useState({
    clients: [],
    leads: [],
    tickets: [],
    accessRequests: [],
  });

  async function loadDashboard(isRefresh = false) {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      setError("");

      const [clientsResult, leadsResult, ticketsResult, accessRequestsResult] =
        await Promise.allSettled([
          apiFetch("/api/clients"),
          apiFetch("/api/leads"),
          apiFetch("/api/tickets"),
          apiFetch("/api/access-requests"),
        ]);

      const clients =
        clientsResult.status === "fulfilled" ? clientsResult.value || [] : [];
      const leads =
        leadsResult.status === "fulfilled" ? leadsResult.value || [] : [];
      const tickets =
        ticketsResult.status === "fulfilled" ? ticketsResult.value || [] : [];
      const accessRequests =
        accessRequestsResult.status === "fulfilled"
          ? accessRequestsResult.value?.accessRequests || []
          : [];

      if (
        clientsResult.status === "rejected" &&
        leadsResult.status === "rejected" &&
        ticketsResult.status === "rejected"
      ) {
        throw new Error("Failed to load dashboard data");
      }

      setAllData({
        clients,
        leads,
        tickets,
        accessRequests,
      });
    } catch (err) {
      setError(err.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const counts = useMemo(() => {
    const totalContacts = (allData.clients || []).reduce((sum, client) => {
      return sum + (client.contacts?.length || 0);
    }, 0);

    return {
      clients: allData.clients.length,
      leads: allData.leads.length,
      tickets: allData.tickets.length,
      contacts: totalContacts,
      accessRequests: allData.accessRequests.length,
    };
  }, [allData]);

  const leadBreakdown = useMemo(() => {
    const baseItems = [
      { key: "new" },
      { key: "contacted" },
      { key: "qualified" },
      { key: "proposal_sent" },
      { key: "won" },
      { key: "lost" },
    ].map((item) => ({
      key: item.key,
      value: 0,
      ...getLeadStatusTone(item.key),
    }));

    const map = Object.fromEntries(baseItems.map((item) => [item.key, { ...item }]));

    for (const lead of allData.leads || []) {
      if (map[lead.status]) {
        map[lead.status].value += 1;
      }
    }

    const items = baseItems.map((item) => map[item.key]);
    const total = items.reduce((sum, item) => sum + item.value, 0);

    return {
      total,
      items: items.map((item) => ({
        ...item,
        percent: total ? (item.value / total) * 100 : 0,
      })),
    };
  }, [allData.leads]);

  const ticketStats = useMemo(() => {
    const tickets = allData.tickets || [];

    return tickets.reduce(
      (acc, ticket) => {
        if (ticket.status === "new") acc.new += 1;
        if (ticket.status === "in_progress") acc.inProgress += 1;
        if (ticket.status === "waiting_client") acc.waitingClient += 1;
        if (ticket.priority === "urgent" && !["resolved", "closed"].includes(ticket.status)) {
          acc.urgent += 1;
        }
        if (!["resolved", "closed"].includes(ticket.status)) acc.open += 1;
        return acc;
      },
      {
        new: 0,
        inProgress: 0,
        waitingClient: 0,
        urgent: 0,
        open: 0,
      }
    );
  }, [allData.tickets]);

  const clientStats = useMemo(() => {
    const clients = allData.clients || [];

    return clients.reduce(
      (acc, client) => {
        if (client.status === "active") acc.active += 1;
        if (client.status === "prospect") acc.prospect += 1;
        if (client.status === "paused") acc.paused += 1;
        if (client.status === "closed") acc.closed += 1;
        return acc;
      },
      {
        active: 0,
        prospect: 0,
        paused: 0,
        closed: 0,
      }
    );
  }, [allData.clients]);

  const accessRequestStats = useMemo(() => {
    return (allData.accessRequests || []).reduce(
      (acc, item) => {
        acc.total += 1;
        if (item.status === "approved") acc.approved += 1;
        else if (item.status === "rejected") acc.rejected += 1;
        else if (item.status === "reviewing") acc.reviewing += 1;
        else acc.new += 1;

        if (!item.clientId && ["new", "reviewing"].includes(item.status)) {
          acc.open += 1;
        }

        return acc;
      },
      {
        total: 0,
        open: 0,
        new: 0,
        reviewing: 0,
        approved: 0,
        rejected: 0,
      }
    );
  }, [allData.accessRequests]);

  const commercialStats = useMemo(() => {
    const leads = allData.leads || [];

    return leads.reduce(
      (acc, lead) => {
        if (lead.status === "qualified") acc.qualified += 1;
        if (lead.status === "proposal_sent") acc.proposalSent += 1;
        if (lead.status === "won") acc.won += 1;
        if (lead.clientId) acc.converted += 1;

        acc.pipelineValue += Number(lead.estimatedValue || 0);
        acc.proposalValue += Number(lead.proposalAmount || 0);

        return acc;
      },
      {
        qualified: 0,
        proposalSent: 0,
        won: 0,
        converted: 0,
        pipelineValue: 0,
        proposalValue: 0,
      }
    );
  }, [allData.leads]);

  const recentActivity = useMemo(() => {
    const clients = (allData.clients || []).slice(0, 8).map((item) => ({
      id: `client-${item.id}`,
      type: "client",
      title: item.companyName || "New client",
      subtitle: item.contactName || item.email || "Client profile added",
      createdAt: item.createdAt || null,
      href: `/clients/${item.id}`,
    }));

    const leads = (allData.leads || []).slice(0, 8).map((item) => ({
      id: `lead-${item.id}`,
      type: "lead",
      title: item.title || "New lead",
      subtitle:
        item.companyName || item.contactName || "Sales opportunity added",
      createdAt: item.createdAt || null,
      href: `/leads/${item.id}`,
    }));

    const tickets = (allData.tickets || []).slice(0, 8).map((item) => ({
      id: `ticket-${item.id}`,
      type: "ticket",
      title: item.title || "New ticket",
      subtitle: item.client?.companyName || "Operational request added",
      createdAt: item.createdAt || null,
      href: `/tickets/${item.id}`,
    }));

    const accessRequests = (allData.accessRequests || []).slice(0, 8).map((item) => ({
      id: `access-${item.id}`,
      type: "access",
      title: item.fullName || "Access request",
      subtitle: item.company || item.email || "Access request submitted",
      createdAt: item.createdAt || null,
      href: "/access-requests",
    }));

    return [...clients, ...leads, ...tickets, ...accessRequests]
      .sort((a, b) => {
        const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return db - da;
      })
      .slice(0, 10);
  }, [allData]);

  const needsAttention = useMemo(() => {
    const items = [];

    for (const ticket of allData.tickets || []) {
      if (ticket.priority === "urgent" && !["resolved", "closed"].includes(ticket.status)) {
        items.push({
          id: `urgent-ticket-${ticket.id}`,
          title: ticket.title || `Ticket #${ticket.id}`,
          subtitle: ticket.client?.companyName || "Urgent support item",
          meta: `${prettyTicketPriority(ticket.priority)} • ${prettyTicketStatus(ticket.status)}`,
          href: `/tickets/${ticket.id}`,
          tone: "border-rose-500/20 bg-rose-500/10 text-rose-200",
        });
      }
    }

    for (const ticket of allData.tickets || []) {
      if (ticket.status === "waiting_client") {
        items.push({
          id: `waiting-ticket-${ticket.id}`,
          title: ticket.title || `Ticket #${ticket.id}`,
          subtitle: ticket.client?.companyName || "Waiting on client",
          meta: "Waiting client",
          href: `/tickets/${ticket.id}`,
          tone: "border-amber-500/20 bg-amber-500/10 text-amber-200",
        });
      }
    }

    for (const lead of allData.leads || []) {
      if (lead.status === "proposal_sent") {
        items.push({
          id: `proposal-lead-${lead.id}`,
          title: lead.title || `Lead #${lead.id}`,
          subtitle: lead.companyName || lead.contactName || "Proposal sent",
          meta: "Needs commercial follow-up",
          href: `/leads/${lead.id}`,
          tone: "border-violet-500/20 bg-violet-500/10 text-violet-200",
        });
      }
    }

    for (const request of allData.accessRequests || []) {
      if (!request.clientId && ["new", "reviewing"].includes(request.status)) {
        items.push({
          id: `access-request-${request.id}`,
          title: request.fullName || "Access request",
          subtitle: request.company || request.email || "Pending review",
          meta: prettyAccessStatus(request.status),
          href: "/access-requests",
          tone: "border-indigo-500/20 bg-indigo-500/10 text-indigo-200",
        });
      }
    }

    return items.slice(0, 8);
  }, [allData]);

  const topAccessRequests = useMemo(() => {
    return (allData.accessRequests || []).slice(0, 5);
  }, [allData.accessRequests]);

  return (
    <div className="w-full p-3 text-white sm:p-4 lg:p-5">
      <div className="mx-auto max-w-[1700px]">
        <div className="relative overflow-hidden rounded-shell border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-4 shadow-[0_18px_50px_rgba(0,0,0,0.24)] sm:px-5 sm:py-5">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.07),transparent_30%)]" />

          <div className="relative z-10 flex flex-col gap-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="min-w-0">
                <div className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[9px] uppercase tracking-[0.16em] text-slate-300">
                  Business overview
                </div>

                <h1 className="mt-3 text-[24px] font-semibold tracking-[-0.05em] text-white sm:text-[26px]">
                  Dashboard
                </h1>

                <p className="mt-1.5 max-w-3xl text-[11px] leading-5 text-slate-400 sm:text-[12px]">
                  Central overview of pipeline, active clients, access requests
                  and operational workload across the APLISIM business console.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
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

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <HeroStat
                to="/clients"
                label="Clients"
                value={counts.clients}
                hint={`${clientStats.active} active accounts`}
              />
              <HeroStat
                to="/leads"
                label="Leads"
                value={counts.leads}
                hint={`${commercialStats.qualified} qualified`}
              />
              <HeroStat
                to="/tickets"
                label="Tickets"
                value={counts.tickets}
                hint={`${ticketStats.open} open`}
                accent={ticketStats.urgent > 0}
              />
              <HeroStat
                to="/clients"
                label="Contacts"
                value={counts.contacts}
                hint="Across all client accounts"
              />
              <HeroStat
                to="/access-requests"
                label="Access requests"
                value={counts.accessRequests}
                hint={`${accessRequestStats.open} open`}
                accent={accessRequestStats.open > 0}
              />
            </div>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-[12px] text-red-200">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="mt-4 rounded-card border border-white/8 bg-slate-900/70 p-5 text-[12px] text-slate-300 shadow-[0_10px_32px_rgba(0,0,0,0.18)]">
            Loading dashboard...
          </div>
        ) : (
          <div className="mt-4 grid items-start gap-4 xl:grid-cols-[1.08fr_0.92fr]">
            <div className="grid content-start gap-4">
              <SectionCard
                bodyClass=""
                accent={needsAttention.length > 0}
                title="Needs attention now"
                description="High-signal items that likely need an action soon."
              >
                {needsAttention.length ? (
                  <div className="mt-4 grid gap-2.5">
                    {needsAttention.map((item) => (
                      <AttentionRow key={item.id} item={item} />
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 rounded-xl border border-dashed border-white/8 bg-white/[0.02] px-3 py-4 text-[10px] text-muted sm:text-[11px]">
                    No urgent items right now.
                  </div>
                )}
              </SectionCard>

              <SectionCard
                bodyClass=""
                title="Recent activity"
                description="Latest movement across clients, leads, tickets and access requests."
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
                  <div className="mt-4 rounded-xl border border-dashed border-white/8 bg-white/[0.02] px-3 py-4 text-[10px] text-muted sm:text-[11px]">
                    No recent activity yet.
                  </div>
                )}
              </SectionCard>

              <SectionCard
                bodyClass=""
                title="Lead breakdown"
                description="Visual distribution of current lead statuses."
              >
                <div className="mt-4 grid gap-5 lg:grid-cols-[150px_minmax(0,1fr)] lg:items-center">
                  <div className="flex items-center justify-center">
                    <BreakdownDonut
                      items={leadBreakdown.items}
                      total={leadBreakdown.total}
                    />
                  </div>

                  <div className="grid gap-2.5">
                    {leadBreakdown.items.map((item) => (
                      <BreakdownRow
                        key={item.key}
                        label={item.label}
                        value={item.value}
                        percent={item.percent}
                        tone={item.tone}
                        color={item.color}
                      />
                    ))}
                  </div>
                </div>
              </SectionCard>
            </div>

            <div className="grid content-start gap-4">
              <SectionCard
                bodyClass=""
                title="Operational snapshot"
                description="Compact signal for what needs attention in support."
              >
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <SnapshotCard
                    label="New tickets"
                    value={ticketStats.new}
                    hint="Fresh requests"
                    tone="indigo"
                  />
                  <SnapshotCard
                    label="In progress"
                    value={ticketStats.inProgress}
                    hint="Active operational work"
                    tone="sky"
                  />
                  <SnapshotCard
                    label="Waiting client"
                    value={ticketStats.waitingClient}
                    hint="Blocked externally"
                    tone="amber"
                  />
                  <SnapshotCard
                    label="Urgent"
                    value={ticketStats.urgent}
                    hint="High-priority queue"
                    tone={ticketStats.urgent > 0 ? "rose" : "slate"}
                  />
                </div>
              </SectionCard>

              <SectionCard
                bodyClass=""
                title="Commercial pulse"
                description="Quick commercial state across the pipeline."
              >
                <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                  <CompactTotal
                    label="Qualified"
                    value={commercialStats.qualified}
                    tone="border-sky-500/20 bg-sky-500/10 text-sky-200"
                  />
                  <CompactTotal
                    label="Proposal sent"
                    value={commercialStats.proposalSent}
                    tone="border-violet-500/20 bg-violet-500/10 text-violet-200"
                  />
                  <CompactTotal
                    label="Won"
                    value={commercialStats.won}
                    tone="border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                  />
                  <CompactTotal
                    label="Converted"
                    value={commercialStats.converted}
                    tone="border-indigo-500/20 bg-indigo-500/10 text-indigo-200"
                  />
                </div>

                <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                  <CompactTotal
                    label="Pipeline value"
                    value={`€${commercialStats.pipelineValue.toLocaleString("en-GB")}`}
                  />
                  <CompactTotal
                    label="Proposal value"
                    value={`€${commercialStats.proposalValue.toLocaleString("en-GB")}`}
                  />
                </div>
              </SectionCard>

              <SectionCard
                bodyClass=""
                title="Latest access requests"
                description={`${accessRequestStats.open} open of ${accessRequestStats.total} total.`}
              >
                {topAccessRequests.length ? (
                  <div className="mt-4 grid gap-2.5">
                    {topAccessRequests.map((item) => (
                      <Link
                        key={item.id}
                        to="/access-requests"
                        className="rounded-xl border border-white/8 bg-slate-950/50 px-3 py-3 transition hover:bg-white/[0.04]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-[12px] font-medium text-white">
                              {item.fullName || "Access request"}
                            </div>
                            <div className="mt-1 text-[11px] text-slate-400">
                              {item.company || item.email || "No company"}
                            </div>
                          </div>
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${getAccessStatusTone(
                              item.status
                            )}`}
                          >
                            {prettyAccessStatus(item.status)}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 rounded-xl border border-dashed border-white/8 bg-white/[0.02] px-3 py-4 text-[10px] text-muted sm:text-[11px]">
                    No access requests yet.
                  </div>
                )}
              </SectionCard>

              <SectionCard
                bodyClass=""
                title="Client health mix"
                description="Quick read of current account state."
              >
                <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                  <CompactTotal
                    label="Active"
                    value={clientStats.active}
                    tone="border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                  />
                  <CompactTotal
                    label="Prospects"
                    value={clientStats.prospect}
                    tone="border-indigo-500/20 bg-indigo-500/10 text-indigo-200"
                  />
                  <CompactTotal
                    label="Paused"
                    value={clientStats.paused}
                    tone="border-amber-500/20 bg-amber-500/10 text-amber-200"
                  />
                  <CompactTotal
                    label="Closed"
                    value={clientStats.closed}
                    tone="border-slate-500/20 bg-slate-500/10 text-slate-300"
                  />
                </div>
              </SectionCard>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TimelineRow({ item, isLast }) {
  const tone = {
    client: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
    lead: "border-violet-500/20 bg-violet-500/10 text-violet-200",
    ticket: "border-sky-500/20 bg-sky-500/10 text-sky-200",
    access: "border-indigo-500/20 bg-indigo-500/10 text-indigo-200",
  };

  const dot = {
    client: "bg-emerald-300",
    lead: "bg-violet-300",
    ticket: "bg-sky-300",
    access: "bg-indigo-300",
  };

  const label = {
    client: "Client",
    lead: "Lead",
    ticket: "Ticket",
    access: "Access",
  };

  return (
    <div className="relative pl-8">
      {!isLast ? (
        <div className="absolute left-[11px] top-6 bottom-[-14px] w-px bg-white/10" />
      ) : null}

      <div className="absolute left-0 top-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-slate-950/90">
        <div className={`h-2.5 w-2.5 rounded-full ${dot[item.type]}`} />
      </div>

      <Link
        to={item.href}
        className="block rounded-2xl border border-white/8 bg-slate-950/40 px-3.5 py-3 transition hover:bg-white/[0.04]"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <div className="truncate text-[11px] font-semibold text-white sm:text-[12px]">
              {item.title}
            </div>
            <span
              className={`rounded-full border px-2 py-0.5 text-[9px] sm:text-[10px] ${tone[item.type]}`}
            >
              {label[item.type]}
            </span>
          </div>

          <div className="text-[9px] text-muted sm:text-[10px]">
            {formatDateTime(item.createdAt)}
          </div>
        </div>

        <div className="mt-1.5 text-[10px] leading-5 text-slate-400 sm:text-[11px]">
          {item.subtitle}
        </div>
      </Link>
    </div>
  );
}

function AttentionRow({ item }) {
  return (
    <Link
      to={item.href}
      className="block rounded-2xl border border-white/8 bg-slate-950/40 px-3.5 py-3 transition hover:bg-white/[0.04]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-[12px] font-medium text-white">
            {item.title}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {item.subtitle}
          </div>
        </div>
        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${item.tone}`}>
          {item.meta}
        </span>
      </div>
    </Link>
  );
}

const SNAPSHOT_TONE = {
  indigo: "border-indigo-500/20 bg-indigo-500/[0.07]",
  sky: "border-sky-500/20 bg-sky-500/[0.07]",
  amber: "border-amber-500/20 bg-amber-500/[0.07]",
  rose: "border-rose-500/25 bg-rose-500/[0.09]",
  slate: "border-white/8 bg-slate-950/50",
};

function SnapshotCard({ label, value, hint, tone = "slate" }) {
  return (
    <div className={`rounded-xl border p-3 ${SNAPSHOT_TONE[tone] || SNAPSHOT_TONE.slate}`}>
      <div className="text-[10px] uppercase tracking-[0.08em] text-muted">
        {label}
      </div>
      <div className="mt-2 text-[22px] font-semibold leading-none text-white">
        {value}
      </div>
      <div className="mt-1 text-[10px] text-muted">{hint}</div>
    </div>
  );
}

function BreakdownRow({ label, value, percent, tone, color }) {
  return (
    <div className={`rounded-xl border px-3 py-2.5 ${tone}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-medium">{label}</div>
          <div className="mt-0.5 text-[10px] opacity-80">
            {percent.toFixed(0)}%
          </div>
        </div>
        <div className="text-[16px] font-semibold">{value}</div>
      </div>

      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/15">
        <div
          className="h-full rounded-full"
          style={{
            width: `${percent}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}

function BreakdownDonut({ items, total }) {
  const size = 124;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  let offsetAccumulator = 0;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="1.8" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
        />

        {total > 0 &&
          items
            .filter((item) => item.value > 0)
            .map((item) => {
              const segmentLength = (item.value / total) * circumference;
              const dashArray = `${segmentLength} ${circumference - segmentLength}`;
              const dashOffset = -offsetAccumulator;
              offsetAccumulator += segmentLength;

              return (
                <circle
                  key={item.key}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke={item.color}
                  strokeWidth={stroke}
                  strokeDasharray={dashArray}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                  filter="url(#glow)"
                />
              );
            })}
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-[24px] font-semibold leading-none text-white">
          {total}
        </div>
        <div className="mt-1 text-[10px] uppercase tracking-[0.08em] text-muted">
          Total leads
        </div>
      </div>
    </div>
  );
}