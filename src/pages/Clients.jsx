import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";
import {
  clientHealth,
  clientServiceOptions,
  clientStatusClasses,
  clientStatusOptions,
  prettyClientService,
  prettyClientStatus,
  toneClasses,
} from "../lib/domain";
import { isAdmin, isClient } from "../lib/roles";
import { useAutoDismiss } from "../hooks/useAutoDismiss";
import { downloadCsv, timestampedFilename } from "../lib/csv";
import {
  paginate,
  sortRows,
  useListControls,
} from "../hooks/useListControls";
import Pagination from "../components/Pagination";
import { HeroStat, ListSkeleton, MiniInfo, SortHeader, ghostButtonClass } from "../components/ui";


function buildInitialForm(settings = null) {
  return {
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    website: "",
    city: "",
    status: settings?.defaultClientStatus || "prospect",
    primaryService:
      settings?.defaultPrimaryService || "web-app-development",
    packageName: settings?.defaultPackageName || "",
    notes: "",
  };
}

const inputClass =
  "h-9 w-full rounded-xl border border-white/8 bg-field px-3 text-[12px] text-white outline-none placeholder:text-muted transition focus:border-white/15 focus:bg-field-focus focus:ring-1 focus:ring-white/10";

const textareaClass =
  "w-full rounded-xl border border-white/8 bg-field px-3 py-2.5 text-[12px] text-white outline-none placeholder:text-muted transition focus:border-white/15 focus:bg-field-focus focus:ring-1 focus:ring-white/10";

const labelClass = "text-[11px] font-medium text-slate-300";

export default function Clients({ user }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [clients, setClients] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useAutoDismiss(notice, setNotice);
  const [form, setForm] = useState(buildInitialForm());
  const [createOpen, setCreateOpen] = useState(false);

  const controls = useListControls({ defaultSort: "createdAt" });
  const { query, statusFilter, sort, order } = controls;

  const clientView = isClient(user);

  useEffect(() => {
    const incomingNotice = location.state?.notice;

    if (incomingNotice) {
      setNotice(incomingNotice);

      navigate(location.pathname, {
        replace: true,
        state: {},
      });
    }
  }, [location.pathname, location.state, navigate]);

  async function loadClients() {
    try {
      setLoading(true);
      setError("");

      const requests = [apiFetch("/api/clients")];

      if (isAdmin(user)) {
        requests.push(apiFetch("/api/settings"));
      }

      const results = await Promise.all(requests);

      const clientsData = results[0] || [];
      const settingsData = isAdmin(user) ? results[1] : null;

      setClients(clientsData);
      setSettings(settingsData);
      setForm(buildInitialForm(settingsData));
    } catch (err) {
      setError(err.message || "Failed to load clients");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (clientView) return;
    loadClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientView]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const newClient = await apiFetch("/api/clients", {
        method: "POST",
        body: JSON.stringify(form),
      });

      setClients((prev) => [newClient, ...prev]);
      setForm(buildInitialForm(settings));
      setNotice(`Client "${newClient.companyName}" created successfully.`);
    } catch (err) {
      setError(err.message || "Failed to create client");
    } finally {
      setSaving(false);
    }
  }

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const matchesQuery =
        !query.trim() ||
        [
          client.companyName,
          client.contactName,
          client.email,
          client.phone,
          client.city,
          client.packageName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ? true : client.status === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [clients, query, statusFilter]);

  const sortedClients = useMemo(
    () => sortRows(filteredClients, sort, order),
    [filteredClients, sort, order]
  );

  const pageData = useMemo(
    () => paginate(sortedClients, controls.page, controls.pageSize),
    [sortedClients, controls.page, controls.pageSize]
  );

  function handleExportCsv() {
    downloadCsv(
      timestampedFilename("clients"),
      [
        { label: "Company", value: (row) => row.companyName },
        { label: "Contact", value: (row) => row.contactName },
        { label: "Email", value: (row) => row.email },
        { label: "Phone", value: (row) => row.phone },
        { label: "City", value: (row) => row.city },
        { label: "Status", value: (row) => prettyClientStatus(row.status) },
        { label: "Primary service", value: (row) => prettyClientService(row.primaryService) },
        { label: "Package", value: (row) => row.packageName },
        { label: "Contacts", value: (row) => row.contacts?.length || 0 },
        { label: "Created", value: (row) => row.createdAt },
      ],
      sortedClients
    );
  }

  const stats = useMemo(() => {
    return clients.reduce(
      (acc, client) => {
        acc.total += 1;

        if (client.status === "prospect") acc.prospect += 1;
        if (client.status === "active") acc.active += 1;
        if (client.status === "paused") acc.paused += 1;
        if (client.status === "closed") acc.closed += 1;

        return acc;
      },
      {
        total: 0,
        prospect: 0,
        active: 0,
        paused: 0,
        closed: 0,
      }
    );
  }, [clients]);

  if (clientView && user?.clientId) {
    return <Navigate to={`/clients/${user.clientId}`} replace />;
  }

  if (clientView && !user?.clientId) {
    return (
      <div className="w-full p-3 text-white sm:p-4 lg:p-5">
        <div className="mx-auto max-w-[900px] rounded-card border border-red-500/25 bg-red-500/10 p-5 text-[13px] text-red-200">
          No client account is linked to this user.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-3 text-white sm:p-4 lg:p-5">
      <div className="mx-auto max-w-[1700px]">
        <div className="relative overflow-hidden rounded-shell border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-4 shadow-[0_18px_50px_rgba(0,0,0,0.24)] sm:px-5 sm:py-5">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.07),transparent_30%)]" />

          <div className="relative z-10 flex flex-col gap-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="min-w-0">
                <div className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[9px] uppercase tracking-[0.16em] text-slate-300">
                  Client accounts
                </div>

                <h1 className="mt-3 text-[24px] font-semibold tracking-[-0.05em] text-white sm:text-[26px]">
                  Clients
                </h1>

                <p className="mt-1.5 max-w-3xl text-[11px] leading-5 text-slate-400 sm:text-[12px]">
                  Manage company accounts, primary contacts, service direction
                  and delivery context for every APLISIM client.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={loadClients}
                  className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] font-semibold text-white transition hover:bg-white/[0.07]"
                >
                  Refresh
                </button>

                <button
                  type="button"
                  onClick={() => setCreateOpen((prev) => !prev)}
                  aria-expanded={createOpen}
                  className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white px-3 py-2 text-[11px] font-semibold text-slate-900 transition hover:bg-slate-100"
                >
                  {createOpen ? "Close form" : "Add client"}
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <HeroStat
                label="Total accounts"
                value={String(stats.total)}
                hint="All tracked clients"
              />
              <HeroStat
                label="Active"
                value={String(stats.active)}
                hint="Currently active delivery"
              />
              <HeroStat
                label="Prospects"
                value={String(stats.prospect)}
                hint="Early-stage accounts"
              />
              <HeroStat
                label="Paused / Closed"
                value={String(stats.paused + stats.closed)}
                hint="Accounts needing review"
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

        <div className="mt-4 grid gap-4">
          <div
            hidden={!createOpen}
            className="rounded-card border border-white/8 bg-slate-900/70 p-4 shadow-[0_10px_32px_rgba(0,0,0,0.18)] backdrop-blur-sm sm:p-5"
          >
            <div className="mb-4">
              <h2 className="text-[15px] font-semibold text-white sm:text-[16px]">
                Add client account
              </h2>
              <p className="mt-1 text-[11px] leading-5 text-slate-400 sm:text-[12px]">
                Create a new company profile with its main service context.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="grid max-w-[880px] gap-3">
              <div className="grid gap-1.5">
                <label className={labelClass}>Company name</label>
                <input
                  name="companyName"
                  value={form.companyName}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="APLISIM d.o.o."
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <label className={labelClass}>Contact name</label>
                  <input
                    name="contactName"
                    value={form.contactName}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Stefan Vasiljevic"
                  />
                </div>

                <div className="grid gap-1.5">
                  <label className={labelClass}>Phone</label>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="+381..."
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <label className={labelClass}>Email</label>
                  <input
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="client@company.com"
                  />
                </div>

                <div className="grid gap-1.5">
                  <label className={labelClass}>Website</label>
                  <input
                    name="website"
                    value={form.website}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="https://company.com"
                  />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="grid gap-1.5">
                  <label className={labelClass}>City</label>
                  <input
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Belgrade"
                  />
                </div>

                <div className="grid gap-1.5">
                  <label className={labelClass}>Status</label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    {clientStatusOptions.map((item) => (
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
                  <label className={labelClass}>Primary service</label>
                  <select
                    name="primaryService"
                    value={form.primaryService}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    {clientServiceOptions.map((item) => (
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
                <label className={labelClass}>Package / plan</label>
                <input
                  name="packageName"
                  value={form.packageName}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Scale / Managed IT / Growth"
                />
              </div>

              <div className="grid gap-1.5">
                <label className={labelClass}>Notes</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows={4}
                  className={textareaClass}
                  placeholder="Project context, business goals, onboarding notes..."
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="mt-1 h-9 rounded-xl border border-white/10 bg-white px-4 text-[12px] font-semibold text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? "Saving..." : "Create client"}
              </button>
            </form>
          </div>

          <div className="rounded-card border border-white/8 bg-slate-900/70 p-4 shadow-[0_10px_32px_rgba(0,0,0,0.18)] backdrop-blur-sm sm:p-5">
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-[15px] font-semibold text-white sm:text-[16px]">
                  Client board
                </h2>
                <p className="mt-1 text-[11px] text-slate-400 sm:text-[12px]">
                  Showing {pageData.from}-{pageData.to} of {pageData.total}
                  {pageData.total !== clients.length
                    ? " (filtered from " + clients.length + ")"
                    : ""}
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={query}
                  onChange={(e) => controls.setQuery(e.target.value)}
                  aria-label="Search clients"
                  placeholder="Search company, contact, email..."
                  className="h-9 w-full rounded-xl border border-white/8 bg-field px-3 text-[12px] text-white outline-none placeholder:text-muted transition focus:border-white/15 focus:bg-field-focus focus:ring-1 focus:ring-white/10 sm:w-[260px]"
                />

                <select
                  value={statusFilter}
                  onChange={(e) => controls.setStatusFilter(e.target.value)}
                  aria-label="Filter by status"
                  className="h-9 rounded-xl border border-white/8 bg-field px-3 text-[12px] text-white outline-none transition focus:border-white/15 focus:bg-field-focus focus:ring-1 focus:ring-white/10"
                >
                  <option value="all" className="bg-slate-900">
                    All statuses
                  </option>
                  {clientStatusOptions.map((item) => (
                    <option
                      key={item.value}
                      value={item.value}
                      className="bg-slate-900"
                    >
                      {item.label}
                    </option>
                  ))}
                </select>

                {controls.hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={controls.reset}
                    className={ghostButtonClass}
                  >
                    Clear filters
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={handleExportCsv}
                  disabled={!sortedClients.length}
                  className={ghostButtonClass}
                >
                  Export CSV
                </button>
              </div>
            </div>

            <div className="hidden overflow-hidden rounded-2xl border border-white/8 xl:block">
              <div className="grid grid-cols-[minmax(240px,1.4fr)_minmax(150px,0.95fr)_minmax(160px,0.95fr)_minmax(120px,0.7fr)_minmax(110px,0.7fr)_90px] gap-3 bg-white/[0.03] px-4 py-3 text-[10px] uppercase tracking-[0.08em] text-muted">
                <SortHeader
                  label="Company"
                  field="companyName"
                  sort={sort}
                  order={order}
                  onSort={controls.toggleSort}
                />
                <div>Primary service</div>
                <div>Contact</div>
                <SortHeader
                  label="Status"
                  field="status"
                  sort={sort}
                  order={order}
                  onSort={controls.toggleSort}
                />
                <SortHeader
                  label="Created"
                  field="createdAt"
                  sort={sort}
                  order={order}
                  onSort={controls.toggleSort}
                />
                <div className="text-right">Open</div>
              </div>

              {loading ? (
                <ListSkeleton />
              ) : pageData.items.length === 0 ? (
                <div className="px-4 py-6 text-[12px] text-slate-300">
                  No clients found.
                </div>
              ) : (
                <div className="divide-y divide-white/6">
                  {pageData.items.map((client) => {
                    const health = clientHealth(client);

                    return (
                      <Link
                        key={client.id}
                        to={`/clients/${client.id}`}
                        className="grid grid-cols-[minmax(240px,1.4fr)_minmax(150px,0.95fr)_minmax(160px,0.95fr)_minmax(120px,0.7fr)_minmax(110px,0.7fr)_90px] items-center gap-3 px-4 py-3 transition hover:bg-white/[0.04]"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-[13px] font-semibold text-white">
                            {client.companyName}
                          </div>
                          <div className="mt-1 truncate text-[11px] text-slate-400">
                            {client.city || "—"}
                            {client.packageName ? ` • ${client.packageName}` : ""}
                          </div>
                        </div>

                        <div className="min-w-0">
                          <div className="truncate text-[12px] text-slate-200">
                            {prettyClientService(client.primaryService)}
                          </div>
                          <div className="mt-1 truncate text-[11px] text-muted">
                            {client.website || "No website"}
                          </div>
                        </div>

                        <div className="min-w-0">
                          <div className="truncate text-[12px] text-slate-200">
                            {client.contactName || "No contact"}
                          </div>
                          <div className="mt-1 truncate text-[11px] text-muted">
                            {client.email || client.phone || "—"}
                          </div>
                        </div>

                        <div>
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${clientStatusClasses(
                              client.status
                            )}`}
                          >
                            {prettyClientStatus(client.status)}
                          </span>
                        </div>

                        <div>
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${toneClasses(
                              health.tone
                            )}`}
                          >
                            {health.label}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-[11px] font-medium text-slate-300">
                            View →
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="grid gap-3 xl:hidden">
              {loading ? (
                <ListSkeleton rows={3} variant="cards" />
              ) : pageData.items.length === 0 ? (
                <div className="rounded-2xl border border-white/8 bg-slate-950/40 px-4 py-6 text-[12px] text-slate-300">
                  No clients found.
                </div>
              ) : (
                pageData.items.map((client) => {
                  const health = clientHealth(client);

                  return (
                    <Link
                      key={client.id}
                      to={`/clients/${client.id}`}
                      className="rounded-2xl border border-white/8 bg-slate-950/40 p-4 transition hover:bg-white/[0.04]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-[13px] font-semibold text-white">
                            {client.companyName}
                          </div>
                          <div className="mt-1 truncate text-[11px] text-slate-400">
                            {client.city || "—"}
                            {client.packageName ? ` • ${client.packageName}` : ""}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-medium ${clientStatusClasses(
                              client.status
                            )}`}
                          >
                            {prettyClientStatus(client.status)}
                          </span>

                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-medium ${toneClasses(
                              health.tone
                            )}`}
                          >
                            {health.label}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <MiniInfo
                          label="Primary service"
                          value={prettyClientService(client.primaryService)}
                        />
                        <MiniInfo
                          label="Contact"
                          value={client.contactName || "No contact"}
                        />
                        <MiniInfo
                          label="Email / phone"
                          value={client.email || client.phone || "—"}
                        />
                        <MiniInfo
                          label="Website"
                          value={client.website || "No website"}
                        />
                      </div>

                      <div className="mt-3 flex items-center justify-between pt-1">
                        <div className="truncate text-[11px] text-muted">
                          {client.packageName || "No package"}
                        </div>
                        <div className="text-[11px] font-medium text-slate-300">
                          View →
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>

            <div className="mt-4">
              <Pagination
                page={pageData.page}
                totalPages={pageData.totalPages}
                from={pageData.from}
                to={pageData.to}
                total={pageData.total}
                onChange={controls.setPage}
              />
            </div>

            <div className="mt-3 text-[11px] text-muted">
              Click any row to open the full client profile and continue into
              contacts, tickets and commercial activity.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

