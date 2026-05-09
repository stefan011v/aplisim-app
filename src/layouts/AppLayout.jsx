import { Fragment, useEffect, useMemo, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  BellAlertIcon,
  BuildingOffice2Icon,
  ChevronDownIcon,
  Cog6ToothIcon,
  HomeIcon,
  RectangleStackIcon,
  SparklesIcon,
  TicketIcon,
  UserGroupIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { apiFetch } from "../lib/api";

function prettifyPath(pathname, user) {
  const isClientUser = user?.role === "client";

  const map = isClientUser
    ? {
        "/": "Dashboard",
        "/tickets": "My Tickets",
        "/settings": "Settings",
      }
    : {
        "/": "Dashboard",
        "/clients": "Clients",
        "/leads": "Leads",
        "/tickets": "Tickets",
        "/access-requests": "Access Requests",
        "/settings": "Settings",
      };

  if (map[pathname]) return map[pathname];
  if (pathname.startsWith("/clients/")) return "Client Detail";
  if (pathname.startsWith("/leads/")) return "Lead Detail";
  if (pathname.startsWith("/tickets/")) return "Ticket Detail";

  return "Workspace";
}

function buildBreadcrumbs(pathname, user) {
  const parts = pathname.split("/").filter(Boolean);
  const isClientUser = user?.role === "client";

  if (parts.length === 0) {
    return [{ label: "Dashboard", to: "/" }];
  }

  const crumbs = [];
  let current = "";

  for (const part of parts) {
    current += `/${part}`;

    if (part === "clients" && !isClientUser) {
      crumbs.push({ label: "Clients", to: "/clients" });
    } else if (part === "leads" && !isClientUser) {
      crumbs.push({ label: "Leads", to: "/leads" });
    } else if (part === "tickets") {
      crumbs.push({
        label: isClientUser ? "My Tickets" : "Tickets",
        to: "/tickets",
      });
    } else if (part === "access-requests" && !isClientUser) {
      crumbs.push({ label: "Access Requests", to: "/access-requests" });
    } else if (part === "settings") {
      crumbs.push({ label: "Settings", to: "/settings" });
    } else if (!Number.isNaN(Number(part))) {
      crumbs.push({ label: `#${part}`, to: current });
    } else {
      crumbs.push({ label: part, to: current });
    }
  }

  return crumbs;
}

function isAdmin(user) {
  return user?.role === "admin";
}

function canViewAdmin(user) {
  return user?.role === "admin";
}

function canQuickCreate(user) {
  return user?.role === "admin" || user?.role === "staff";
}

function isClient(user) {
  return user?.role === "client";
}

function isClientPortalAdmin(user) {
  return user?.role === "client" && user?.clientPortalRole === "admin";
}

function isAuthenticatedUser(user) {
  return Boolean(user?.id || user?.email);
}

function shellNav(locationPath, counts, user) {
  if (isClient(user)) {
    const sections = [
      {
        title: "Overview",
        items: [
          {
            label: "Dashboard",
            to: "/",
            icon: HomeIcon,
          },
        ],
      },
      {
        title: "Support",
        items: [
          {
            label: "My Tickets",
            to: "/tickets",
            icon: TicketIcon,
            badge:
              counts.urgentTickets > 0
                ? `${counts.urgentTickets}`
                : counts.tickets || null,
            badgeTone:
              counts.urgentTickets > 0
                ? "border-rose-500/20 bg-rose-500/10 text-rose-200"
                : undefined,
          },
        ],
      },
    ];

    if (isClientPortalAdmin(user)) {
      sections.push({
        title: "Account",
        items: [
          {
            label: "Settings",
            to: "/settings",
            icon: Cog6ToothIcon,
          },
        ],
      });
    }

    return sections.map((section) => ({
      ...section,
      items: section.items.map((item) => ({
        ...item,
        isActive:
          item.to === "/"
            ? locationPath === "/"
            : locationPath === item.to || locationPath.startsWith(`${item.to}/`),
      })),
    }));
  }

  const sections = [
    {
      title: "Overview",
      items: [
        {
          label: "Dashboard",
          to: "/",
          icon: HomeIcon,
        },
      ],
    },
    {
      title: "Sales",
      items: [
        {
          label: "Leads",
          to: "/leads",
          icon: RectangleStackIcon,
          badge: counts.leads > 0 ? counts.leads : null,
        },
        {
          label: "Clients",
          to: "/clients",
          icon: BuildingOffice2Icon,
          badge: counts.clients > 0 ? counts.clients : null,
        },
      ],
    },
    {
      title: "Operations",
      items: [
        {
          label: "Tickets",
          to: "/tickets",
          icon: TicketIcon,
          badge:
            counts.urgentTickets > 0
              ? `${counts.urgentTickets}`
              : counts.tickets || null,
          badgeTone:
            counts.urgentTickets > 0
              ? "border-rose-500/20 bg-rose-500/10 text-rose-200"
              : undefined,
        },
      ],
    },
  ];

  if (canViewAdmin(user)) {
    sections.push({
      title: "Admin",
      items: [
        {
          label: "Access Requests",
          to: "/access-requests",
          icon: UserGroupIcon,
          badge:
            counts.newAccessRequests > 0
              ? `${counts.newAccessRequests}`
              : counts.accessRequests || null,
          badgeTone:
            counts.newAccessRequests > 0
              ? "border-amber-500/20 bg-amber-500/10 text-amber-200"
              : undefined,
        },
        {
          label: "Settings",
          to: "/settings",
          icon: Cog6ToothIcon,
        },
      ],
    });
  }

  return sections.map((section) => ({
    ...section,
    items: section.items.map((item) => ({
      ...item,
      isActive:
        item.to === "/"
          ? locationPath === "/"
          : locationPath === item.to || locationPath.startsWith(`${item.to}/`),
    })),
  }));
}

function buildQuickForms(settings = null) {
  return {
    client: {
      companyName: "",
      contactName: "",
      email: "",
      phone: "",
      website: "",
      city: "",
      status: settings?.defaultClientStatus || "prospect",
      primaryService: settings?.defaultPrimaryService || "web-app-development",
      packageName: settings?.defaultPackageName || "",
      notes: "",
    },
    lead: {
      title: "",
      companyName: "",
      contactName: "",
      email: "",
      phone: "",
      source: settings?.defaultLeadSource || "website",
      status: settings?.defaultLeadStatus || "new",
      estimatedValue: "",
      notes: "",
    },
    ticket: {
      clientId: "",
      title: "",
      description: "",
      status: settings?.defaultTicketStatus || "new",
      priority: settings?.defaultTicketPriority || "medium",
      category: settings?.defaultTicketCategory || "general",
      assignedTo: "",
      dueDate: "",
    },
  };
}

const inputClass =
  "h-10 w-full rounded-xl border border-white/8 bg-[#0b1220] px-3 text-[12px] text-white outline-none placeholder:text-slate-500 transition focus:border-white/15 focus:bg-[#0d1526] focus:ring-1 focus:ring-white/10";

const textareaClass =
  "w-full rounded-xl border border-white/8 bg-[#0b1220] px-3 py-2.5 text-[12px] text-white outline-none placeholder:text-slate-500 transition focus:border-white/15 focus:bg-[#0d1526] focus:ring-1 focus:ring-white/10";

const labelClass = "text-[11px] font-medium text-slate-300";

export default function AppLayout({ user, onLogout }) {
  const location = useLocation();

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [quickCreateType, setQuickCreateType] = useState("client");
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickSaving, setQuickSaving] = useState(false);
  const [quickError, setQuickError] = useState("");
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
  const [quickData, setQuickData] = useState({
    settings: null,
    clients: [],
  });
  const [quickForms, setQuickForms] = useState(buildQuickForms());

  useEffect(() => {
    async function loadShellStats() {
      try {
        if (isClient(user)) {
          const tickets = await apiFetch("/api/tickets");

          const urgentTickets = tickets.filter(
            (ticket) =>
              ticket.priority === "urgent" &&
              !["resolved", "closed"].includes(ticket.status)
          ).length;

          const waitingClientTickets = tickets.filter(
            (ticket) => ticket.status === "waiting_client"
          ).length;

          setCounts({
            clients: user?.clientId ? 1 : 0,
            leads: 0,
            tickets: tickets.length || 0,
            accessRequests: 0,
            urgentTickets,
            newAccessRequests: 0,
            proposalLeads: 0,
            waitingClientTickets,
          });

          return;
        }

        const requests = [
          apiFetch("/api/clients"),
          apiFetch("/api/leads"),
          apiFetch("/api/tickets"),
        ];

        if (isAdmin(user)) {
          requests.push(apiFetch("/api/access-requests"));
        }

        const results = await Promise.all(requests);

        const clients = results[0] || [];
        const leads = results[1] || [];
        const tickets = results[2] || [];
        const accessRequests = isAdmin(user) ? results[3] : { accessRequests: [] };

        const urgentTickets = tickets.filter(
          (ticket) =>
            ticket.priority === "urgent" &&
            !["resolved", "closed"].includes(ticket.status)
        ).length;

        const waitingClientTickets = tickets.filter(
          (ticket) => ticket.status === "waiting_client"
        ).length;

        const proposalLeads = leads.filter(
          (lead) => lead.status === "proposal_sent"
        ).length;

        const newAccessRequests = (accessRequests?.accessRequests || []).filter(
          (request) => request.status === "new"
        ).length;

        setCounts({
          clients: clients.length || 0,
          leads: leads.length || 0,
          tickets: tickets.length || 0,
          accessRequests: accessRequests?.accessRequests?.length || 0,
          urgentTickets,
          newAccessRequests,
          proposalLeads,
          waitingClientTickets,
        });
      } catch (error) {
        console.error("APP_LAYOUT_COUNTS_ERROR:", error);
      }
    }

    if (isAuthenticatedUser(user)) {
      loadShellStats();
    }
  }, [location.pathname, user]);

  useEffect(() => {
    if (!quickCreateOpen || !canQuickCreate(user)) return;

    async function loadQuickData() {
      try {
        setQuickLoading(true);
        setQuickError("");

        const requests = [apiFetch("/api/clients")];

        if (isAdmin(user)) {
          requests.unshift(apiFetch("/api/settings"));
        }

        const results = await Promise.all(requests);

        const settings = isAdmin(user) ? results[0] : null;
        const clients = isAdmin(user) ? results[1] : results[0];

        setQuickData({
          settings,
          clients: clients || [],
        });

        setQuickForms(buildQuickForms(settings));
      } catch (error) {
        setQuickError(error.message || "Failed to load quick create data");
      } finally {
        setQuickLoading(false);
      }
    }

    loadQuickData();
  }, [quickCreateOpen, user]);

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
      items.push(
        `${counts.urgentTickets} urgent ticket${
          counts.urgentTickets > 1 ? "s" : ""
        }`
      );
    }

    if (counts.waitingClientTickets > 0) {
      items.push(
        `${counts.waitingClientTickets} waiting-client ticket${
          counts.waitingClientTickets > 1 ? "s" : ""
        }`
      );
    }

    if (!isClient(user) && counts.proposalLeads > 0) {
      items.push(
        `${counts.proposalLeads} proposal-stage lead${
          counts.proposalLeads > 1 ? "s" : ""
        }`
      );
    }

    if (isAdmin(user) && counts.newAccessRequests > 0) {
      items.push(
        `${counts.newAccessRequests} new access request${
          counts.newAccessRequests > 1 ? "s" : ""
        }`
      );
    }

    return items;
  }, [counts, user]);

  function updateQuickForm(section, name, value) {
    setQuickForms((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [name]: value,
      },
    }));
  }

  function closeQuickCreate() {
    setQuickCreateOpen(false);
    setQuickCreateType("client");
    setQuickError("");
    setQuickSaving(false);
  }

  async function handleQuickCreateSubmit(e) {
    e.preventDefault();

    try {
      setQuickSaving(true);
      setQuickError("");

      if (quickCreateType === "client") {
        await apiFetch("/api/clients", {
          method: "POST",
          body: JSON.stringify(quickForms.client),
        });
      }

      if (quickCreateType === "lead") {
        await apiFetch("/api/leads", {
          method: "POST",
          body: JSON.stringify({
            ...quickForms.lead,
            estimatedValue:
              quickForms.lead.estimatedValue === ""
                ? null
                : Number(quickForms.lead.estimatedValue),
          }),
        });
      }

      if (quickCreateType === "ticket") {
        await apiFetch("/api/tickets", {
          method: "POST",
          body: JSON.stringify(quickForms.ticket),
        });
      }

      closeQuickCreate();
    } catch (error) {
      setQuickError(error.message || "Failed to create item");
    } finally {
      setQuickSaving(false);
    }
  }

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
                {!isClient(user) ? (
                  <div className="hidden min-w-[220px] items-center gap-2 rounded-xl border border-white/8 bg-[#0b1220] px-3 py-2 lg:flex">
                    <SparklesIcon className="h-3.5 w-3.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search..."
                      className="w-full bg-transparent text-[11px] text-white outline-none placeholder:text-slate-500"
                    />
                  </div>
                ) : null}

                <div className="hidden items-center gap-2 rounded-xl border border-white/8 bg-white/[0.03] px-2.5 py-2 md:flex">
                  <BellAlertIcon className="h-3.5 w-3.5 text-amber-300" />
                  <div className="text-[10px] text-slate-300">
                    {needsAttention.length > 0
                      ? `${needsAttention.length} attention item${
                          needsAttention.length > 1 ? "s" : ""
                        }`
                      : "No urgent alerts"}
                  </div>
                </div>

                {canQuickCreate(user) ? (
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

      {mobileNavOpen ? (
        <div className="fixed inset-0 z-50 xl:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-[248px] border-r border-white/10 bg-[#08101b] shadow-[20px_0_60px_rgba(0,0,0,0.35)]">
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

      {quickCreateOpen && canQuickCreate(user) ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-[820px] rounded-[28px] border border-white/10 bg-[#08101b] shadow-[0_30px_100px_rgba(0,0,0,0.45)]">
            <div className="flex items-start justify-between gap-4 border-b border-white/8 px-5 py-5">
              <div>
                <div className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[9px] uppercase tracking-[0.16em] text-slate-300">
                  Quick create
                </div>
                <h3 className="mt-3 text-[24px] font-semibold tracking-[-0.04em] text-white">
                  Create without leaving this page
                </h3>
                <p className="mt-1 text-[12px] leading-5 text-slate-400">
                  Add a client, lead or ticket directly from the global topbar.
                </p>
              </div>

              <button
                type="button"
                onClick={closeQuickCreate}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white transition hover:bg-white/[0.08]"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="border-b border-white/8 px-5 py-4">
              <div className="flex flex-wrap gap-2">
                {[
                  { key: "client", label: "New client" },
                  { key: "lead", label: "New lead" },
                  { key: "ticket", label: "New ticket" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setQuickCreateType(tab.key)}
                    className={`rounded-2xl px-4 py-2 text-[12px] transition ${
                      quickCreateType === tab.key
                        ? "border border-white/10 bg-white text-slate-900"
                        : "border border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.06]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="px-5 py-5">
              {quickError ? (
                <div className="mb-4 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-[12px] text-red-200">
                  {quickError}
                </div>
              ) : null}

              {quickLoading ? (
                <div className="rounded-2xl border border-white/8 bg-slate-950/40 px-4 py-6 text-[12px] text-slate-300">
                  Loading quick create data...
                </div>
              ) : (
                <form onSubmit={handleQuickCreateSubmit} className="grid gap-4">
                  {quickCreateType === "client" ? (
                    <div className="grid gap-3">
                      <div className="grid gap-3 md:grid-cols-2">
                        <Field label="Company name">
                          <input
                            className={inputClass}
                            value={quickForms.client.companyName}
                            onChange={(e) =>
                              updateQuickForm(
                                "client",
                                "companyName",
                                e.target.value
                              )
                            }
                            placeholder="APLISIM d.o.o."
                          />
                        </Field>

                        <Field label="Contact name">
                          <input
                            className={inputClass}
                            value={quickForms.client.contactName}
                            onChange={(e) =>
                              updateQuickForm(
                                "client",
                                "contactName",
                                e.target.value
                              )
                            }
                            placeholder="Stefan Vasiljevic"
                          />
                        </Field>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <Field label="Email">
                          <input
                            className={inputClass}
                            value={quickForms.client.email}
                            onChange={(e) =>
                              updateQuickForm("client", "email", e.target.value)
                            }
                            placeholder="client@company.com"
                          />
                        </Field>

                        <Field label="Phone">
                          <input
                            className={inputClass}
                            value={quickForms.client.phone}
                            onChange={(e) =>
                              updateQuickForm("client", "phone", e.target.value)
                            }
                            placeholder="+381..."
                          />
                        </Field>
                      </div>

                      <div className="grid gap-3 md:grid-cols-3">
                        <Field label="City">
                          <input
                            className={inputClass}
                            value={quickForms.client.city}
                            onChange={(e) =>
                              updateQuickForm("client", "city", e.target.value)
                            }
                            placeholder="Belgrade"
                          />
                        </Field>

                        <Field label="Status">
                          <select
                            className={inputClass}
                            value={quickForms.client.status}
                            onChange={(e) =>
                              updateQuickForm("client", "status", e.target.value)
                            }
                          >
                            <option value="prospect" className="bg-slate-900">
                              Prospect
                            </option>
                            <option value="active" className="bg-slate-900">
                              Active
                            </option>
                            <option value="paused" className="bg-slate-900">
                              Paused
                            </option>
                            <option value="closed" className="bg-slate-900">
                              Closed
                            </option>
                          </select>
                        </Field>

                        <Field label="Primary service">
                          <select
                            className={inputClass}
                            value={quickForms.client.primaryService}
                            onChange={(e) =>
                              updateQuickForm(
                                "client",
                                "primaryService",
                                e.target.value
                              )
                            }
                          >
                            <option
                              value="web-app-development"
                              className="bg-slate-900"
                            >
                              Web & App Development
                            </option>
                            <option
                              value="help-desk-it-ops"
                              className="bg-slate-900"
                            >
                              Help Desk & IT Ops
                            </option>
                            <option
                              value="crm-integrations"
                              className="bg-slate-900"
                            >
                              CRM & Integrations
                            </option>
                            <option
                              value="ai-automation"
                              className="bg-slate-900"
                            >
                              AI Automation
                            </option>
                          </select>
                        </Field>
                      </div>

                      <Field label="Package / plan">
                        <input
                          className={inputClass}
                          value={quickForms.client.packageName}
                          onChange={(e) =>
                            updateQuickForm(
                              "client",
                              "packageName",
                              e.target.value
                            )
                          }
                          placeholder="Scale / Managed IT / Growth"
                        />
                      </Field>

                      <Field label="Notes">
                        <textarea
                          className={textareaClass}
                          rows={4}
                          value={quickForms.client.notes}
                          onChange={(e) =>
                            updateQuickForm("client", "notes", e.target.value)
                          }
                          placeholder="Project context, onboarding notes..."
                        />
                      </Field>
                    </div>
                  ) : null}

                  {quickCreateType === "lead" ? (
                    <div className="grid gap-3">
                      <Field label="Title">
                        <input
                          className={inputClass}
                          value={quickForms.lead.title}
                          onChange={(e) =>
                            updateQuickForm("lead", "title", e.target.value)
                          }
                          placeholder="Website redesign for restaurant"
                        />
                      </Field>

                      <div className="grid gap-3 md:grid-cols-2">
                        <Field label="Company name">
                          <input
                            className={inputClass}
                            value={quickForms.lead.companyName}
                            onChange={(e) =>
                              updateQuickForm(
                                "lead",
                                "companyName",
                                e.target.value
                              )
                            }
                            placeholder="Company name"
                          />
                        </Field>

                        <Field label="Contact name">
                          <input
                            className={inputClass}
                            value={quickForms.lead.contactName}
                            onChange={(e) =>
                              updateQuickForm(
                                "lead",
                                "contactName",
                                e.target.value
                              )
                            }
                            placeholder="Contact person"
                          />
                        </Field>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <Field label="Email">
                          <input
                            className={inputClass}
                            value={quickForms.lead.email}
                            onChange={(e) =>
                              updateQuickForm("lead", "email", e.target.value)
                            }
                            placeholder="lead@company.com"
                          />
                        </Field>

                        <Field label="Phone">
                          <input
                            className={inputClass}
                            value={quickForms.lead.phone}
                            onChange={(e) =>
                              updateQuickForm("lead", "phone", e.target.value)
                            }
                            placeholder="+381..."
                          />
                        </Field>
                      </div>

                      <div className="grid gap-3 md:grid-cols-3">
                        <Field label="Source">
                          <select
                            className={inputClass}
                            value={quickForms.lead.source}
                            onChange={(e) =>
                              updateQuickForm("lead", "source", e.target.value)
                            }
                          >
                            <option value="website" className="bg-slate-900">
                              Website
                            </option>
                            <option value="instagram" className="bg-slate-900">
                              Instagram
                            </option>
                            <option value="facebook" className="bg-slate-900">
                              Facebook
                            </option>
                            <option value="linkedin" className="bg-slate-900">
                              LinkedIn
                            </option>
                            <option value="referral" className="bg-slate-900">
                              Referral
                            </option>
                            <option value="email" className="bg-slate-900">
                              Email
                            </option>
                            <option value="other" className="bg-slate-900">
                              Other
                            </option>
                          </select>
                        </Field>

                        <Field label="Status">
                          <select
                            className={inputClass}
                            value={quickForms.lead.status}
                            onChange={(e) =>
                              updateQuickForm("lead", "status", e.target.value)
                            }
                          >
                            <option value="new" className="bg-slate-900">
                              New
                            </option>
                            <option value="contacted" className="bg-slate-900">
                              Contacted
                            </option>
                            <option value="qualified" className="bg-slate-900">
                              Qualified
                            </option>
                            <option
                              value="proposal_sent"
                              className="bg-slate-900"
                            >
                              Proposal sent
                            </option>
                            <option value="won" className="bg-slate-900">
                              Won
                            </option>
                            <option value="lost" className="bg-slate-900">
                              Lost
                            </option>
                          </select>
                        </Field>

                        <Field label="Estimated value (€)">
                          <input
                            type="number"
                            className={inputClass}
                            value={quickForms.lead.estimatedValue}
                            onChange={(e) =>
                              updateQuickForm(
                                "lead",
                                "estimatedValue",
                                e.target.value
                              )
                            }
                            placeholder="1200"
                          />
                        </Field>
                      </div>

                      <Field label="Notes">
                        <textarea
                          className={textareaClass}
                          rows={4}
                          value={quickForms.lead.notes}
                          onChange={(e) =>
                            updateQuickForm("lead", "notes", e.target.value)
                          }
                          placeholder="Scope, timing, client needs..."
                        />
                      </Field>
                    </div>
                  ) : null}

                  {quickCreateType === "ticket" ? (
                    <div className="grid gap-3">
                      <Field label="Client">
                        <select
                          className={inputClass}
                          value={quickForms.ticket.clientId}
                          onChange={(e) =>
                            updateQuickForm("ticket", "clientId", e.target.value)
                          }
                        >
                          <option value="" className="bg-slate-900">
                            Select client
                          </option>
                          {quickData.clients.map((client) => (
                            <option
                              key={client.id}
                              value={client.id}
                              className="bg-slate-900"
                            >
                              {client.companyName}
                            </option>
                          ))}
                        </select>
                      </Field>

                      <Field label="Title">
                        <input
                          className={inputClass}
                          value={quickForms.ticket.title}
                          onChange={(e) =>
                            updateQuickForm("ticket", "title", e.target.value)
                          }
                          placeholder="Homepage text change"
                        />
                      </Field>

                      <div className="grid gap-3 md:grid-cols-3">
                        <Field label="Status">
                          <select
                            className={inputClass}
                            value={quickForms.ticket.status}
                            onChange={(e) =>
                              updateQuickForm("ticket", "status", e.target.value)
                            }
                          >
                            <option value="new" className="bg-slate-900">
                              New
                            </option>
                            <option
                              value="in_progress"
                              className="bg-slate-900"
                            >
                              In progress
                            </option>
                            <option
                              value="waiting_client"
                              className="bg-slate-900"
                            >
                              Waiting client
                            </option>
                            <option value="resolved" className="bg-slate-900">
                              Resolved
                            </option>
                            <option value="closed" className="bg-slate-900">
                              Closed
                            </option>
                          </select>
                        </Field>

                        <Field label="Priority">
                          <select
                            className={inputClass}
                            value={quickForms.ticket.priority}
                            onChange={(e) =>
                              updateQuickForm(
                                "ticket",
                                "priority",
                                e.target.value
                              )
                            }
                          >
                            <option value="low" className="bg-slate-900">
                              Low
                            </option>
                            <option value="medium" className="bg-slate-900">
                              Medium
                            </option>
                            <option value="high" className="bg-slate-900">
                              High
                            </option>
                            <option value="urgent" className="bg-slate-900">
                              Urgent
                            </option>
                          </select>
                        </Field>

                        <Field label="Category">
                          <select
                            className={inputClass}
                            value={quickForms.ticket.category}
                            onChange={(e) =>
                              updateQuickForm(
                                "ticket",
                                "category",
                                e.target.value
                              )
                            }
                          >
                            <option value="general" className="bg-slate-900">
                              General
                            </option>
                            <option value="hardware" className="bg-slate-900">
                              Hardware
                            </option>
                            <option value="software" className="bg-slate-900">
                              Software
                            </option>
                            <option value="network" className="bg-slate-900">
                              Network
                            </option>
                            <option value="access" className="bg-slate-900">
                              Access / Login
                            </option>
                            <option value="email" className="bg-slate-900">
                              Email
                            </option>
                            <option value="backup" className="bg-slate-900">
                              Backup
                            </option>
                            <option value="website" className="bg-slate-900">
                              Website
                            </option>
                            <option value="crm" className="bg-slate-900">
                              CRM
                            </option>
                            <option value="server" className="bg-slate-900">
                              Server
                            </option>
                            <option value="security" className="bg-slate-900">
                              Security
                            </option>
                            <option value="other" className="bg-slate-900">
                              Other
                            </option>
                          </select>
                        </Field>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <Field label="Assigned to">
                          <input
                            className={inputClass}
                            value={quickForms.ticket.assignedTo}
                            onChange={(e) =>
                              updateQuickForm(
                                "ticket",
                                "assignedTo",
                                e.target.value
                              )
                            }
                            placeholder="Stefan / Help Desk / Tech Team"
                          />
                        </Field>

                        <Field label="Due date">
                          <input
                            type="date"
                            className={inputClass}
                            value={quickForms.ticket.dueDate}
                            onChange={(e) =>
                              updateQuickForm(
                                "ticket",
                                "dueDate",
                                e.target.value
                              )
                            }
                          />
                        </Field>
                      </div>

                      <Field label="Description">
                        <textarea
                          className={textareaClass}
                          rows={5}
                          value={quickForms.ticket.description}
                          onChange={(e) =>
                            updateQuickForm(
                              "ticket",
                              "description",
                              e.target.value
                            )
                          }
                          placeholder="Describe the request, task or issue..."
                        />
                      </Field>
                    </div>
                  ) : null}

                  <div className="flex flex-col-reverse gap-2 border-t border-white/8 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-[11px] leading-5 text-slate-500">
                      This creates the item directly through the same API used
                      by the main pages.
                    </p>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={closeQuickCreate}
                        className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-[12px] text-white transition hover:bg-white/[0.06]"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        disabled={quickSaving}
                        className="rounded-xl border border-white/10 bg-white px-4 py-2 text-[12px] font-semibold text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {quickSaving ? "Creating..." : "Create"}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SidebarContent({
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
        <div className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[8px] uppercase tracking-[0.16em] text-slate-300">
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
                <div
                  key={item}
                  className="rounded-lg border border-white/6 bg-white/[0.03] px-2 py-1.5 text-[10px] leading-4 text-slate-200"
                >
                  {item}
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-white/6 bg-white/[0.03] px-2 py-1.5 text-[10px] leading-4 text-slate-400">
                No urgent operational items.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 px-2 py-1">
        {sections.map((section) => (
          <div key={section.title} className="mb-3 last:mb-0">
            <div className="px-2 text-[9px] uppercase tracking-[0.14em] text-slate-500">
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
                            : "border-white/6 bg-white/[0.03] group-hover:bg-white/[0.06]"
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
          <div className="text-[9px] text-slate-500">Signed in as</div>
          <div className="mt-1 truncate text-[10.5px] font-medium text-white">
            {displayName}
          </div>
          <div className="mt-1 text-[9px] uppercase tracking-[0.08em] text-slate-500">
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
      <div className="text-[8px] uppercase tracking-[0.08em] text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-[13px] font-semibold leading-none text-white">
        {value}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="grid gap-1.5">
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}