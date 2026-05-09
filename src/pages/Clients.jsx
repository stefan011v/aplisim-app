import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";

const serviceOptions = [
  { value: "web-app-development", label: "Web & App Development" },
  { value: "help-desk-it-ops", label: "Help Desk & IT Ops" },
  { value: "crm-integrations", label: "CRM & Integrations" },
  { value: "ai-automation", label: "AI Automation" },
];

const statusOptions = [
  { value: "prospect", label: "Prospect" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "closed", label: "Closed" },
];

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

function prettyService(value) {
  return (
    serviceOptions.find((item) => item.value === value)?.label || value || "—"
  );
}

function prettyStatus(value) {
  return (
    statusOptions.find((item) => item.value === value)?.label || value || "—"
  );
}

function statusClasses(status) {
  switch (status) {
    case "active":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
    case "paused":
      return "border-amber-500/20 bg-amber-500/10 text-amber-200";
    case "closed":
      return "border-slate-500/20 bg-slate-500/10 text-slate-300";
    default:
      return "border-indigo-500/20 bg-indigo-500/10 text-indigo-200";
  }
}

const inputClass =
  "h-9 w-full rounded-xl border border-white/8 bg-[#0b1220] px-3 text-[12px] text-white outline-none placeholder:text-slate-500 transition focus:border-white/15 focus:bg-[#0d1526] focus:ring-1 focus:ring-white/10";

const textareaClass =
  "w-full rounded-xl border border-white/8 bg-[#0b1220] px-3 py-2.5 text-[12px] text-white outline-none placeholder:text-slate-500 transition focus:border-white/15 focus:bg-[#0d1526] focus:ring-1 focus:ring-white/10";

const labelClass = "text-[11px] font-medium text-slate-300";

function getHealth(client) {
  if (!client) return { label: "—", tone: "default" };

  switch (client.status) {
    case "active":
      return { label: "Healthy", tone: "emerald" };
    case "paused":
      return { label: "Review", tone: "amber" };
    case "closed":
      return { label: "Closed", tone: "slate" };
    default:
      return { label: "Early stage", tone: "indigo" };
  }
}

function healthClasses(tone) {
  switch (tone) {
    case "emerald":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
    case "amber":
      return "border-amber-500/20 bg-amber-500/10 text-amber-200";
    case "slate":
      return "border-slate-500/20 bg-slate-500/10 text-slate-300";
    default:
      return "border-indigo-500/20 bg-indigo-500/10 text-indigo-200";
  }
}

function isClient(user) {
  return user?.role === "client";
}

export default function Clients({ user }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [clients, setClients] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [form, setForm] = useState(buildInitialForm());

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

  if (clientView && user?.clientId) {
    return <Navigate to={`/clients/${user.clientId}`} replace />;
  }

  if (clientView && !user?.clientId) {
    return (
      <div className="w-full p-3 text-white sm:p-4 lg:p-5">
        <div className="mx-auto max-w-[900px] rounded-[20px] border border-red-500/25 bg-red-500/10 p-5 text-[13px] text-red-200">
          No client account is linked to this user.
        </div>
      </div>
    );
  }

  async function loadClients() {
    try {
      setLoading(true);
      setError("");

      const [clientsData, settingsData] = await Promise.all([
        apiFetch("/api/clients"),
        apiFetch("/api/settings"),
      ]);

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
    loadClients();
  }, []);

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

  return (
    <div className="w-full p-3 text-white sm:p-4 lg:p-5">
      <div className="mx-auto max-w-[1700px]">
        <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-4 shadow-[0_18px_50px_rgba(0,0,0,0.24)] sm:px-5 sm:py-5">
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

              <button
                type="button"
                onClick={loadClients}
                className="inline-flex items-center justify-center rounded-[12px] border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] font-semibold text-white transition hover:bg-white/[0.07]"
              >
                Refresh
              </button>
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

        <div className="mt-4 grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
          <div className="rounded-[20px] border border-white/8 bg-slate-900/70 p-4 shadow-[0_10px_32px_rgba(0,0,0,0.18)] backdrop-blur-sm sm:p-5">
            <div className="mb-4">
              <h2 className="text-[15px] font-semibold text-white sm:text-[16px]">
                Add client account
              </h2>
              <p className="mt-1 text-[11px] leading-5 text-slate-400 sm:text-[12px]">
                Create a new company profile with its main service context.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-3">
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
                  <label className={labelClass}>Primary service</label>
                  <select
                    name="primaryService"
                    value={form.primaryService}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    {serviceOptions.map((item) => (
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

          <div className="rounded-[20px] border border-white/8 bg-slate-900/70 p-4 shadow-[0_10px_32px_rgba(0,0,0,0.18)] backdrop-blur-sm sm:p-5">
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-[15px] font-semibold text-white sm:text-[16px]">
                  Client board
                </h2>
                <p className="mt-1 text-[11px] text-slate-400 sm:text-[12px]">
                  Showing {filteredClients.length} of {clients.length}
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search company, contact, email..."
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
              <div className="grid grid-cols-[minmax(240px,1.4fr)_minmax(150px,0.95fr)_minmax(160px,0.95fr)_minmax(120px,0.7fr)_minmax(110px,0.7fr)_90px] gap-3 bg-white/[0.03] px-4 py-3 text-[10px] uppercase tracking-[0.08em] text-slate-500">
                <div>Company</div>
                <div>Primary service</div>
                <div>Contact</div>
                <div>Status</div>
                <div>Health</div>
                <div className="text-right">Open</div>
              </div>

              {loading ? (
                <div className="px-4 py-6 text-[12px] text-slate-300">
                  Loading clients...
                </div>
              ) : filteredClients.length === 0 ? (
                <div className="px-4 py-6 text-[12px] text-slate-300">
                  No clients found.
                </div>
              ) : (
                <div className="divide-y divide-white/6">
                  {filteredClients.map((client) => {
                    const health = getHealth(client);

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
                            {prettyService(client.primaryService)}
                          </div>
                          <div className="mt-1 truncate text-[11px] text-slate-500">
                            {client.website || "No website"}
                          </div>
                        </div>

                        <div className="min-w-0">
                          <div className="truncate text-[12px] text-slate-200">
                            {client.contactName || "No contact"}
                          </div>
                          <div className="mt-1 truncate text-[11px] text-slate-500">
                            {client.email || client.phone || "—"}
                          </div>
                        </div>

                        <div>
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusClasses(
                              client.status
                            )}`}
                          >
                            {prettyStatus(client.status)}
                          </span>
                        </div>

                        <div>
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${healthClasses(
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
                <div className="rounded-2xl border border-white/8 bg-slate-950/40 px-4 py-6 text-[12px] text-slate-300">
                  Loading clients...
                </div>
              ) : filteredClients.length === 0 ? (
                <div className="rounded-2xl border border-white/8 bg-slate-950/40 px-4 py-6 text-[12px] text-slate-300">
                  No clients found.
                </div>
              ) : (
                filteredClients.map((client) => {
                  const health = getHealth(client);

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
                            className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-medium ${statusClasses(
                              client.status
                            )}`}
                          >
                            {prettyStatus(client.status)}
                          </span>

                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-medium ${healthClasses(
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
                          value={prettyService(client.primaryService)}
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
                        <div className="truncate text-[11px] text-slate-500">
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

            <div className="mt-3 text-[11px] text-slate-500">
              Click any row to open the full client profile and continue into
              contacts, tickets and commercial activity.
            </div>
          </div>
        </div>
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