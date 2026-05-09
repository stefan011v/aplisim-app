import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";

const statusOptions = [
  { value: "new", label: "New" },
  { value: "in_progress", label: "In progress" },
  { value: "waiting_client", label: "Waiting client" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const priorityOptions = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const categoryOptions = [
  { value: "general", label: "General" },
  { value: "hardware", label: "Hardware" },
  { value: "software", label: "Software" },
  { value: "network", label: "Network" },
  { value: "access", label: "Access / Login" },
  { value: "email", label: "Email" },
  { value: "backup", label: "Backup" },
  { value: "website", label: "Website" },
  { value: "crm", label: "CRM" },
  { value: "server", label: "Server" },
  { value: "security", label: "Security" },
  { value: "other", label: "Other" },
];

function buildInitialForm(settings = null) {
  return {
    clientId: "",
    contactId: "",
    title: "",
    description: "",
    status: settings?.defaultTicketStatus || "new",
    priority: settings?.defaultTicketPriority || "medium",
    category: settings?.defaultTicketCategory || "general",
    assignedTo: "",
    dueDate: "",
  };
}

function buildClientTicketForm() {
  return {
    title: "",
    description: "",
    category: "general",
    priority: "medium",
  };
}

function prettyStatus(value) {
  return (
    statusOptions.find((item) => item.value === value)?.label || value || "—"
  );
}

function prettyPriority(value) {
  return (
    priorityOptions.find((item) => item.value === value)?.label || value || "—"
  );
}

function prettyCategory(value) {
  return (
    categoryOptions.find((item) => item.value === value)?.label || value || "—"
  );
}

function statusClasses(status) {
  switch (status) {
    case "resolved":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
    case "closed":
      return "border-slate-500/20 bg-slate-500/10 text-slate-300";
    case "in_progress":
      return "border-sky-500/20 bg-sky-500/10 text-sky-200";
    case "waiting_client":
      return "border-amber-500/20 bg-amber-500/10 text-amber-200";
    default:
      return "border-indigo-500/20 bg-indigo-500/10 text-indigo-200";
  }
}

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

function canCreateTicket(user) {
  return user?.role === "admin" || user?.role === "staff";
}

function isAdmin(user) {
  return user?.role === "admin";
}

function isClient(user) {
  return user?.role === "client";
}

const inputClass =
  "h-9 w-full rounded-xl border border-white/8 bg-[#0b1220] px-3 text-[12px] text-white outline-none placeholder:text-slate-500 transition focus:border-white/15 focus:bg-[#0d1526] focus:ring-1 focus:ring-white/10";

const textareaClass =
  "w-full rounded-xl border border-white/8 bg-[#0b1220] px-3 py-2.5 text-[12px] text-white outline-none placeholder:text-slate-500 transition focus:border-white/15 focus:bg-[#0d1526] focus:ring-1 focus:ring-white/10";

const labelClass = "text-[11px] font-medium text-slate-300";

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString();
}

function getHealthLabel(ticket) {
  if (ticket.status === "resolved" || ticket.status === "closed") {
    return {
      label: "Stable",
      tone: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
    };
  }

  if (ticket.priority === "urgent") {
    return {
      label: "Critical",
      tone: "border-rose-500/20 bg-rose-500/10 text-rose-200",
    };
  }

  if (ticket.status === "waiting_client") {
    return {
      label: "Blocked",
      tone: "border-amber-500/20 bg-amber-500/10 text-amber-200",
    };
  }

  if (ticket.status === "in_progress") {
    return {
      label: "Active",
      tone: "border-sky-500/20 bg-sky-500/10 text-sky-200",
    };
  }

  return {
    label: "Open",
    tone: "border-indigo-500/20 bg-indigo-500/10 text-indigo-200",
  };
}

export default function Tickets({ user }) {
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [clients, setClients] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [creatingClientTicket, setCreatingClientTicket] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [form, setForm] = useState(buildInitialForm());
  const [clientTicketForm, setClientTicketForm] = useState(buildClientTicketForm());

  async function loadData(isRefresh = false) {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      setError("");

      if (isClient(user)) {
        const ticketsData = await apiFetch("/api/tickets");

        setTickets(ticketsData || []);
        setClients([]);
        setContacts([]);
        setSettings(null);
        setForm(buildInitialForm());
        setClientTicketForm(buildClientTicketForm());

        return;
      }

      const requests = [apiFetch("/api/tickets"), apiFetch("/api/clients")];

      if (isAdmin(user)) {
        requests.push(apiFetch("/api/settings"));
      }

      const results = await Promise.all(requests);

      const ticketsData = results[0] || [];
      const clientsData = results[1] || [];
      const settingsData = isAdmin(user) ? results[2] : null;

      setTickets(ticketsData);
      setClients(clientsData);
      setSettings(settingsData);

      setForm((prev) => {
        const isDirty =
          prev.clientId ||
          prev.contactId ||
          prev.title ||
          prev.description ||
          prev.assignedTo ||
          prev.dueDate;

        return isDirty ? prev : buildInitialForm(settingsData);
      });
    } catch (err) {
      setError(err.message || "Failed to load tickets");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    async function loadContactsForClient() {
      if (!form.clientId || isClient(user)) {
        setContacts([]);
        return;
      }

      try {
        const client = await apiFetch(`/api/clients/${form.clientId}`);
        setContacts(client.contacts || []);
      } catch {
        setContacts([]);
      }
    }

    if (canCreateTicket(user) && !isClient(user)) {
      loadContactsForClient();
    }
  }, [form.clientId, user]);

  function clearMessages() {
    setError("");
    setNotice("");
  }

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "clientId" ? { contactId: "" } : {}),
    }));
  }

  function handleClientTicketChange(e) {
    const { name, value } = e.target;
    setClientTicketForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function openCreateModal() {
    clearMessages();
    setCreateOpen(true);
  }

  function closeCreateModal() {
    setCreateOpen(false);
    setClientTicketForm(buildClientTicketForm());
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!canCreateTicket(user)) return;

    setSaving(true);
    clearMessages();

    try {
      const newTicket = await apiFetch("/api/tickets", {
        method: "POST",
        body: JSON.stringify(form),
      });

      setTickets((prev) => [newTicket, ...prev]);
      setForm(buildInitialForm(settings));
      setContacts([]);
      setNotice("Ticket created successfully.");
    } catch (err) {
      setError(err.message || "Failed to create ticket");
    } finally {
      setSaving(false);
    }
  }

  async function handleClientCreateTicket(e) {
    e.preventDefault();

    if (!isClient(user)) return;

    setCreatingClientTicket(true);
    clearMessages();

    try {
      const newTicket = await apiFetch("/api/tickets", {
        method: "POST",
        body: JSON.stringify({
          title: clientTicketForm.title,
          description: clientTicketForm.description,
          category: clientTicketForm.category,
          priority: clientTicketForm.priority,
        }),
      });

      setTickets((prev) => [newTicket, ...prev]);
      closeCreateModal();
      setNotice("Ticket created successfully.");
    } catch (err) {
      setError(err.message || "Failed to create ticket");
    } finally {
      setCreatingClientTicket(false);
    }
  }

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const matchesQuery =
        !query.trim() ||
        [
          ticket.title,
          ticket.description,
          ticket.client?.companyName,
          ticket.contact?.fullName,
          ticket.category,
          ticket.assignedTo,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ? true : ticket.status === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [tickets, query, statusFilter]);

  const stats = useMemo(() => {
    return tickets.reduce(
      (acc, ticket) => {
        acc.total += 1;

        if (ticket.status === "new") acc.new += 1;
        if (ticket.status === "in_progress") acc.inProgress += 1;
        if (ticket.status === "waiting_client") acc.waitingClient += 1;
        if (ticket.priority === "urgent") acc.urgent += 1;
        if (!["resolved", "closed"].includes(ticket.status)) acc.open += 1;

        return acc;
      },
      {
        total: 0,
        new: 0,
        inProgress: 0,
        waitingClient: 0,
        urgent: 0,
        open: 0,
      }
    );
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
                  {isClient(user) ? "My tickets" : "Operations"}
                </div>

                <h1 className="mt-3 text-[24px] font-semibold tracking-[-0.05em] text-white sm:text-[26px]">
                  {isClient(user) ? "My Tickets" : "Tickets"}
                </h1>

                <p className="mt-1.5 max-w-3xl text-[11px] leading-5 text-slate-400 sm:text-[12px]">
                  {isClient(user)
                    ? "View your support requests, follow updates and open each ticket for more details."
                    : "Track support requests, client changes, onboarding work and ongoing delivery tasks from one operational board."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {isClient(user) ? (
                  <button
                    type="button"
                    onClick={openCreateModal}
                    className="inline-flex items-center justify-center rounded-[12px] border border-sky-400/20 bg-sky-500/15 px-3 py-2 text-[11px] font-semibold text-sky-100 transition hover:bg-sky-500/20"
                  >
                    Open new ticket
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={() => loadData(true)}
                  disabled={refreshing}
                  className="inline-flex items-center justify-center rounded-[12px] border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] font-semibold text-white transition hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {refreshing ? "Refreshing..." : "Refresh"}
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <HeroStat
                label="Total tickets"
                value={String(stats.total)}
                hint="All tracked requests"
              />
              <HeroStat
                label="Open"
                value={String(stats.open)}
                hint="Currently active"
              />
              <HeroStat
                label="New"
                value={String(stats.new)}
                hint="Freshly created"
              />
              <HeroStat
                label="In progress"
                value={String(stats.inProgress)}
                hint="Actively handled"
              />
              <HeroStat
                label="Urgent"
                value={String(stats.urgent)}
                hint="Highest priority workload"
              />
            </div>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-[12px] text-red-200">
            {error}
          </div>
        ) : null}

        {!error && notice ? (
          <div className="mt-4 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-[12px] text-emerald-200">
            {notice}
          </div>
        ) : null}

        <div
          className={`mt-4 grid gap-4 ${
            canCreateTicket(user)
              ? "xl:grid-cols-[380px_minmax(0,1fr)]"
              : "xl:grid-cols-1"
          }`}
        >
          {canCreateTicket(user) ? (
            <div className="rounded-[20px] border border-white/8 bg-slate-900/70 p-4 shadow-[0_10px_32px_rgba(0,0,0,0.18)] backdrop-blur-sm sm:p-5">
              <div className="mb-4">
                <h2 className="text-[15px] font-semibold text-white sm:text-[16px]">
                  Create ticket
                </h2>
                <p className="mt-1 text-[11px] leading-5 text-slate-400 sm:text-[12px]">
                  Open a new ticket for a client and define ownership, category
                  and due date.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="grid gap-3">
                <div className="grid gap-1.5">
                  <label className={labelClass}>Client</label>
                  <select
                    name="clientId"
                    value={form.clientId}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    <option value="" className="bg-slate-900">
                      Select client
                    </option>
                    {clients.map((client) => (
                      <option
                        key={client.id}
                        value={client.id}
                        className="bg-slate-900"
                      >
                        {client.companyName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-1.5">
                  <label className={labelClass}>Contact</label>
                  <select
                    name="contactId"
                    value={form.contactId}
                    onChange={handleChange}
                    className={inputClass}
                    disabled={!form.clientId}
                  >
                    <option value="" className="bg-slate-900">
                      Optional contact
                    </option>
                    {contacts.map((contact) => (
                      <option
                        key={contact.id}
                        value={contact.id}
                        className="bg-slate-900"
                      >
                        {contact.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-1.5">
                  <label className={labelClass}>Title</label>
                  <input
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Homepage text change"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-1.5">
                    <label className={labelClass}>Status</label>
                    <select
                      name="status"
                      value={form.status}
                      onChange={handleChange}
                      className={inputClass}
                    >
                      {statusOptions.map((item) => (
                        <option
                          key={item.value}
                          value={item.value}
                          className="bg-slate-900"
                        >
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-1.5">
                    <label className={labelClass}>Priority</label>
                    <select
                      name="priority"
                      value={form.priority}
                      onChange={handleChange}
                      className={inputClass}
                    >
                      {priorityOptions.map((item) => (
                        <option
                          key={item.value}
                          value={item.value}
                          className="bg-slate-900"
                        >
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-1.5">
                    <label className={labelClass}>Category</label>
                    <select
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                      className={inputClass}
                    >
                      {categoryOptions.map((item) => (
                        <option
                          key={item.value}
                          value={item.value}
                          className="bg-slate-900"
                        >
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-1.5">
                    <label className={labelClass}>Due date</label>
                    <input
                      name="dueDate"
                      type="date"
                      value={form.dueDate}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <label className={labelClass}>Assigned to</label>
                  <input
                    name="assignedTo"
                    value={form.assignedTo}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Stefan / Help Desk / Tech Team"
                  />
                </div>

                <div className="grid gap-1.5">
                  <label className={labelClass}>Description</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={5}
                    className={textareaClass}
                    placeholder="Describe the request, bug, task or onboarding step..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="mt-1 h-9 rounded-xl border border-white/10 bg-white px-4 text-[12px] font-semibold text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {saving ? "Saving..." : "Create ticket"}
                </button>
              </form>
            </div>
          ) : null}

          <div className="rounded-[20px] border border-white/8 bg-slate-900/70 p-4 shadow-[0_10px_32px_rgba(0,0,0,0.18)] backdrop-blur-sm sm:p-5">
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-[15px] font-semibold text-white sm:text-[16px]">
                  {isClient(user) ? "My ticket board" : "Ticket board"}
                </h2>
                <p className="mt-1 text-[11px] text-slate-400 sm:text-[12px]">
                  Showing {filteredTickets.length} of {tickets.length}
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={
                    isClient(user)
                      ? "Search title or request..."
                      : "Search title, client, contact..."
                  }
                  className="h-9 w-full rounded-xl border border-white/8 bg-[#0b1220] px-3 text-[12px] text-white outline-none placeholder:text-slate-500 transition focus:border-white/15 focus:bg-[#0d1526] focus:ring-1 focus:ring-white/10 sm:w-[260px]"
                />

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-9 rounded-xl border border-white/8 bg-[#0b1220] px-3 text-[12px] text-white outline-none transition focus:border-white/15 focus:bg-[#0d1526] focus:ring-1 focus:ring-white/10"
                >
                  <option value="all" className="bg-slate-900">
                    All statuses
                  </option>
                  {statusOptions.map((item) => (
                    <option
                      key={item.value}
                      value={item.value}
                      className="bg-slate-900"
                    >
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="hidden overflow-hidden rounded-2xl border border-white/8 xl:block">
              <div className="grid grid-cols-[minmax(240px,1.25fr)_minmax(160px,0.95fr)_minmax(150px,0.95fr)_minmax(120px,0.7fr)_minmax(120px,0.7fr)_minmax(110px,0.7fr)_120px] gap-3 bg-white/[0.03] px-4 py-3 text-[10px] uppercase tracking-[0.08em] text-slate-500">
                <div>Ticket</div>
                <div>Client / Contact</div>
                <div>Category / Assignee</div>
                <div>Status</div>
                <div>Priority</div>
                <div>Health</div>
                <div>Due</div>
              </div>

              {loading ? (
                <div className="px-4 py-6 text-[12px] text-slate-300">
                  Loading tickets...
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="px-4 py-6 text-[12px] text-slate-300">
                  No tickets found.
                </div>
              ) : (
                <div className="divide-y divide-white/6">
                  {filteredTickets.map((ticket) => {
                    const health = getHealthLabel(ticket);

                    return (
                      <div
                        key={ticket.id}
                        onClick={() => navigate(`/tickets/${ticket.id}`)}
                        className="grid cursor-pointer grid-cols-[minmax(240px,1.25fr)_minmax(160px,0.95fr)_minmax(150px,0.95fr)_minmax(120px,0.7fr)_minmax(120px,0.7fr)_minmax(110px,0.7fr)_120px] items-center gap-3 px-4 py-3 transition hover:bg-white/[0.04]"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-[13px] font-semibold text-white">
                            {ticket.title}
                          </div>
                          <div className="mt-1 truncate text-[11px] text-slate-400">
                            {ticket.description || "No description"}
                          </div>
                        </div>

                        <div className="min-w-0">
                          <div className="truncate text-[12px] text-slate-200">
                            {ticket.client?.companyName || "—"}
                          </div>
                          <div className="mt-1 truncate text-[11px] text-slate-500">
                            {ticket.contact?.fullName || "No contact"}
                          </div>
                        </div>

                        <div className="min-w-0">
                          <div className="truncate text-[12px] text-slate-200">
                            {prettyCategory(ticket.category)}
                          </div>
                          <div className="mt-1 truncate text-[11px] text-slate-500">
                            {ticket.assignedTo || "Unassigned"}
                          </div>
                        </div>

                        <div>
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusClasses(
                              ticket.status
                            )}`}
                          >
                            {prettyStatus(ticket.status)}
                          </span>
                        </div>

                        <div>
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${priorityClasses(
                              ticket.priority
                            )}`}
                          >
                            {prettyPriority(ticket.priority)}
                          </span>
                        </div>

                        <div>
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${health.tone}`}
                          >
                            {health.label}
                          </span>
                        </div>

                        <div className="text-[12px] text-slate-300">
                          {formatDate(ticket.dueDate)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="grid gap-3 xl:hidden">
              {loading ? (
                <div className="rounded-2xl border border-white/8 bg-slate-950/40 px-4 py-6 text-[12px] text-slate-300">
                  Loading tickets...
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="rounded-2xl border border-white/8 bg-slate-950/40 px-4 py-6 text-[12px] text-slate-300">
                  No tickets found.
                </div>
              ) : (
                filteredTickets.map((ticket) => {
                  const health = getHealthLabel(ticket);

                  return (
                    <div
                      key={ticket.id}
                      onClick={() => navigate(`/tickets/${ticket.id}`)}
                      className="cursor-pointer rounded-2xl border border-white/8 bg-slate-950/40 p-4 transition hover:bg-white/[0.04]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-[13px] font-semibold text-white">
                            {ticket.title}
                          </div>
                          <div className="mt-1 truncate text-[11px] text-slate-400">
                            {ticket.client?.companyName || "—"}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-medium ${statusClasses(
                              ticket.status
                            )}`}
                          >
                            {prettyStatus(ticket.status)}
                          </span>
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-medium ${priorityClasses(
                              ticket.priority
                            )}`}
                          >
                            {prettyPriority(ticket.priority)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <MiniInfo
                          label="Contact"
                          value={ticket.contact?.fullName || "No contact"}
                        />
                        <MiniInfo
                          label="Category"
                          value={prettyCategory(ticket.category)}
                        />
                        <MiniInfo
                          label="Assigned to"
                          value={ticket.assignedTo || "Unassigned"}
                        />
                        <MiniInfo
                          label="Due"
                          value={formatDate(ticket.dueDate)}
                        />
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/6 pt-3">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-medium ${health.tone}`}
                        >
                          {health.label}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {ticket.priority === "urgent"
                            ? "Urgent item"
                            : ticket.status === "waiting_client"
                            ? "Waiting on client"
                            : "Open detail"}
                        </span>
                      </div>

                      <div className="mt-3 rounded-xl border border-white/6 bg-black/10 p-3">
                        <div className="text-[10px] uppercase tracking-[0.08em] text-slate-500">
                          Description
                        </div>
                        <div className="mt-1 text-[12px] leading-6 text-slate-300">
                          {ticket.description || "No description"}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-3 text-[11px] text-slate-500">
              {isClient(user)
                ? "Click any row to open the full ticket detail and follow the latest updates."
                : "Click any row to open the full ticket detail, manage assignment, update communication and track the full support flow."}
            </div>
          </div>
        </div>

        {createOpen && isClient(user) ? (
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

              <form onSubmit={handleClientCreateTicket} className="px-5 py-5">
                <div className="grid gap-3">
                  <div className="grid gap-1.5">
                    <label className={labelClass}>Title</label>
                    <input
                      name="title"
                      value={clientTicketForm.title}
                      onChange={handleClientTicketChange}
                      className={inputClass}
                      placeholder="DNS issue, email problem, website update..."
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="grid gap-1.5">
                      <label className={labelClass}>Category</label>
                      <select
                        name="category"
                        value={clientTicketForm.category}
                        onChange={handleClientTicketChange}
                        className={inputClass}
                      >
                        {categoryOptions.map((item) => (
                          <option
                            key={item.value}
                            value={item.value}
                            className="bg-slate-900"
                          >
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid gap-1.5">
                      <label className={labelClass}>Priority</label>
                      <select
                        name="priority"
                        value={clientTicketForm.priority}
                        onChange={handleClientTicketChange}
                        className={inputClass}
                      >
                        {priorityOptions.map((item) => (
                          <option
                            key={item.value}
                            value={item.value}
                            className="bg-slate-900"
                          >
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-1.5">
                    <label className={labelClass}>Description</label>
                    <textarea
                      name="description"
                      value={clientTicketForm.description}
                      onChange={handleClientTicketChange}
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
                    disabled={creatingClientTicket}
                    className="rounded-xl border border-sky-400/20 bg-sky-500/15 px-4 py-2 text-[12px] font-semibold text-sky-100 transition hover:bg-sky-500/20 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {creatingClientTicket ? "Creating..." : "Create ticket"}
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

function HeroStat({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="text-[10px] uppercase tracking-[0.12em] text-slate-400">
        {label}
      </div>
      <div className="mt-2 text-[24px] font-semibold tracking-[-0.04em] text-white">
        {value}
      </div>
      <div className="mt-1 text-[11px] text-slate-500">{hint}</div>
    </div>
  );
}

function MiniInfo({ label, value }) {
  return (
    <div className="rounded-xl border border-white/6 bg-slate-950/40 p-3">
      <div className="text-[10px] uppercase tracking-[0.08em] text-slate-500">
        {label}
      </div>
      <div className="mt-1 break-words text-[12px] text-slate-200">
        {value}
      </div>
    </div>
  );
}