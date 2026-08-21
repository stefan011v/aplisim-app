import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";
import {
  leadSourceOptions,
  leadStageHealth,
  leadStatusClasses,
  leadStatusOptions,
  prettyLeadSource,
  prettyLeadStatus,
  toneClasses,
} from "../lib/domain";
import { isAdmin } from "../lib/roles";
import { formatCurrency } from "../lib/format";
import { useAutoDismiss } from "../hooks/useAutoDismiss";
import { downloadCsv, timestampedFilename } from "../lib/csv";
import { paginate, sortRows, useListControls } from "../hooks/useListControls";
import Pagination from "../components/Pagination";
import { HeroStat, ListSkeleton, MiniInfo, SortHeader, ghostButtonClass } from "../components/ui";

function buildInitialForm(settings = null) {
  return {
    title: "",
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    source: settings?.defaultLeadSource || "website",
    status: settings?.defaultLeadStatus || "new",
    estimatedValue: "",
    notes: "",
  };
}

const inputClass =
  "h-9 w-full rounded-xl border border-white/8 bg-[#0b1220] px-3 text-[12px] text-white outline-none placeholder:text-slate-500 transition focus:border-white/15 focus:bg-[#0d1526] focus:ring-1 focus:ring-white/10";

const textareaClass =
  "w-full rounded-xl border border-white/8 bg-[#0b1220] px-3 py-2.5 text-[12px] text-white outline-none placeholder:text-slate-500 transition focus:border-white/15 focus:bg-[#0d1526] focus:ring-1 focus:ring-white/10";

const labelClass = "text-[11px] font-medium text-slate-300";

function canCreateLead(user) {
  return user?.role === "admin" || user?.role === "staff";
}

export default function Leads({ user }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [leads, setLeads] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [convertingId, setConvertingId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useAutoDismiss(notice, setNotice);

  // Detail screens hand a confirmation back through router state.
  useEffect(() => {
    const incomingNotice = location.state?.notice;

    if (incomingNotice) {
      setNotice(incomingNotice);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate]);

  const controls = useListControls({ defaultSort: "createdAt" });
  const { query, statusFilter, sort, order } = controls;
  const [form, setForm] = useState(buildInitialForm());

  const loadLeads = useCallback(async (showRefreshState = false) => {
    try {
      if (showRefreshState) setRefreshing(true);
      else setLoading(true);

      setError("");

      const requests = [apiFetch("/api/leads")];

      if (isAdmin(user)) {
        requests.push(apiFetch("/api/settings"));
      }

      const results = await Promise.all(requests);

      const leadsData = results[0];
      const settingsData = isAdmin(user) ? results[1] : null;

      setLeads(leadsData || []);
      setSettings(settingsData);

      setForm((prev) => {
        const isDirty =
          prev.title ||
          prev.companyName ||
          prev.contactName ||
          prev.email ||
          prev.phone ||
          prev.estimatedValue ||
          prev.notes;

        return isDirty ? prev : buildInitialForm(settingsData);
      });
    } catch (err) {
      setError(err.message || "Failed to load leads");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  function clearMessages() {
    setError("");
    setNotice("");
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!canCreateLead(user)) return;

    setSaving(true);
    clearMessages();

    try {
      const payload = {
        ...form,
        estimatedValue:
          form.estimatedValue === "" ? null : Number(form.estimatedValue),
      };

      const newLead = await apiFetch("/api/leads", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setLeads((prev) => [newLead, ...prev]);
      setForm(buildInitialForm(settings));
      setNotice("Lead created successfully.");
    } catch (err) {
      setError(err.message || "Failed to create lead");
    } finally {
      setSaving(false);
    }
  }

  async function handleConvert(e, leadId) {
    e.stopPropagation();

    if (!isAdmin(user)) return;

    try {
      setConvertingId(leadId);
      clearMessages();

      const result = await apiFetch(`/api/leads/${leadId}/convert`, {
        method: "POST",
      });

      setLeads((prev) =>
        prev.map((lead) => (lead.id === leadId ? result.lead : lead))
      );

      setNotice("Lead converted to client successfully.");
    } catch (err) {
      if (err.status === 409 && err.data?.client?.id) {
        const companyName =
          err.data.client.companyName || `Client #${err.data.client.id}`;
        setError(`${err.message} Existing client: ${companyName}.`);
      } else if (err.status === 409 && err.data?.lead?.client?.id) {
        setError("Lead is already linked to a client.");
      } else {
        setError(err.message || "Failed to convert lead");
      }
    } finally {
      setConvertingId(null);
    }
  }

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesQuery =
        !query.trim() ||
        [
          lead.title,
          lead.companyName,
          lead.contactName,
          lead.email,
          lead.phone,
          lead.source,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ? true : lead.status === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [leads, query, statusFilter]);

  const sortedLeads = useMemo(
    () => sortRows(filteredLeads, sort, order),
    [filteredLeads, sort, order]
  );

  const pageData = useMemo(
    () => paginate(sortedLeads, controls.page, controls.pageSize),
    [sortedLeads, controls.page, controls.pageSize]
  );

  function handleExportCsv() {
    downloadCsv(
      timestampedFilename("leads"),
      [
        { label: "Title", value: (row) => row.title },
        { label: "Company", value: (row) => row.companyName },
        { label: "Contact", value: (row) => row.contactName },
        { label: "Email", value: (row) => row.email },
        { label: "Phone", value: (row) => row.phone },
        { label: "Source", value: (row) => row.source },
        { label: "Status", value: (row) => prettyLeadStatus(row.status) },
        { label: "Estimated value", value: (row) => row.estimatedValue ?? "" },
        { label: "Proposal status", value: (row) => row.proposalStatus },
        { label: "Converted client", value: (row) => row.client?.companyName },
        { label: "Created", value: (row) => row.createdAt },
      ],
      sortedLeads
    );
  }

  const stats = useMemo(() => {
    return leads.reduce(
      (acc, lead) => {
        acc.total += 1;
        if (lead.status === "new") acc.new += 1;
        if (lead.status === "qualified") acc.qualified += 1;
        if (lead.status === "proposal_sent") acc.proposalSent += 1;
        if (lead.status === "won") acc.won += 1;
        if (lead.clientId) acc.converted += 1;
        acc.pipeline += Number(lead.estimatedValue || 0);
        return acc;
      },
      {
        total: 0,
        new: 0,
        qualified: 0,
        proposalSent: 0,
        won: 0,
        converted: 0,
        pipeline: 0,
      }
    );
  }, [leads]);

  return (
    <div className="w-full p-3 text-white sm:p-4 lg:p-5">
      <div className="mx-auto max-w-[1700px]">
        <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-4 shadow-[0_18px_50px_rgba(0,0,0,0.24)] sm:px-5 sm:py-5">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.07),transparent_30%)]" />

          <div className="relative z-10 flex flex-col gap-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="min-w-0">
                <div className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[9px] uppercase tracking-[0.16em] text-slate-300">
                  Sales pipeline
                </div>

                <h1 className="mt-3 text-[24px] font-semibold tracking-[-0.05em] text-white sm:text-[26px]">
                  Leads
                </h1>

                <p className="mt-1.5 max-w-3xl text-[11px] leading-5 text-slate-400 sm:text-[12px]">
                  Capture incoming opportunities, track sales stages and convert
                  won opportunities into active clients.
                </p>
              </div>

              <button
                type="button"
                onClick={() => loadLeads(true)}
                disabled={refreshing}
                className="inline-flex items-center justify-center rounded-[12px] border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] font-semibold text-white transition hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <HeroStat
                label="Total leads"
                value={String(stats.total)}
                hint="All tracked opportunities"
              />
              <HeroStat
                label="New"
                value={String(stats.new)}
                hint="Fresh pipeline entries"
              />
              <HeroStat
                label="Qualified"
                value={String(stats.qualified)}
                hint="Promising opportunities"
              />
              <HeroStat
                label="Won"
                value={String(stats.won)}
                hint={`${stats.converted} converted`}
              />
              <HeroStat
                label="Pipeline value"
                value={formatCurrency(stats.pipeline)}
                hint="Estimated total value"
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
            canCreateLead(user)
              ? "xl:grid-cols-[360px_minmax(0,1fr)]"
              : "xl:grid-cols-1"
          }`}
        >
          {canCreateLead(user) ? (
            <div className="rounded-[20px] border border-white/8 bg-slate-900/70 p-4 shadow-[0_10px_32px_rgba(0,0,0,0.18)] backdrop-blur-sm sm:p-5">
              <div className="mb-4">
                <h2 className="text-[15px] font-semibold text-white sm:text-[16px]">
                  Add lead
                </h2>
                <p className="mt-1 text-[11px] leading-5 text-slate-400 sm:text-[12px]">
                  Create a new sales opportunity and place it into the pipeline.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="grid gap-3">
                <div className="grid gap-1.5">
                  <label className={labelClass}>Title</label>
                  <input
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Website redesign for restaurant"
                  />
                </div>

                <div className="grid gap-1.5">
                  <label className={labelClass}>Company name</label>
                  <input
                    name="companyName"
                    value={form.companyName}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Company name"
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
                      placeholder="Contact person"
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
                      placeholder="lead@company.com"
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <label className={labelClass}>Estimated value (€)</label>
                    <input
                      name="estimatedValue"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.estimatedValue}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="1200"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-1.5">
                    <label className={labelClass}>Source</label>
                    <select
                      name="source"
                      value={form.source}
                      onChange={handleChange}
                      className={inputClass}
                    >
                      {leadSourceOptions.map((item) => (
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
                    <label className={labelClass}>Status</label>
                    <select
                      name="status"
                      value={form.status}
                      onChange={handleChange}
                      className={inputClass}
                    >
                      {leadStatusOptions.map((item) => (
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
                  <label className={labelClass}>Notes</label>
                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    rows={4}
                    className={textareaClass}
                    placeholder="Project scope, timing, client needs..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="mt-1 h-9 rounded-xl border border-white/10 bg-white px-4 text-[12px] font-semibold text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {saving ? "Saving..." : "Create lead"}
                </button>
              </form>
            </div>
          ) : null}

          <div className="rounded-[20px] border border-white/8 bg-slate-900/70 p-4 shadow-[0_10px_32px_rgba(0,0,0,0.18)] backdrop-blur-sm sm:p-5">
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-[15px] font-semibold text-white sm:text-[16px]">
                  Lead board
                </h2>
                <p className="mt-1 text-[11px] text-slate-400 sm:text-[12px]">
                  Showing {pageData.from}-{pageData.to} of {pageData.total}
                  {pageData.total !== leads.length
                    ? " (filtered from " + leads.length + ")"
                    : ""}
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={query}
                  onChange={(e) => controls.setQuery(e.target.value)}
                  aria-label="Search leads"
                  placeholder="Search title, company, contact..."
                  className="h-9 w-full rounded-xl border border-white/8 bg-[#0b1220] px-3 text-[12px] text-white outline-none placeholder:text-slate-500 transition focus:border-white/15 focus:bg-[#0d1526] focus:ring-1 focus:ring-white/10 sm:w-[260px]"
                />

                <select
                  value={statusFilter}
                  onChange={(e) => controls.setStatusFilter(e.target.value)}
                  aria-label="Filter by status"
                  className="h-9 rounded-xl border border-white/8 bg-[#0b1220] px-3 text-[12px] text-white outline-none transition focus:border-white/15 focus:bg-[#0d1526] focus:ring-1 focus:ring-white/10"
                >
                  <option value="all" className="bg-slate-900">
                    All statuses
                  </option>
                  {leadStatusOptions.map((item) => (
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
                  disabled={!sortedLeads.length}
                  className={ghostButtonClass}
                >
                  Export CSV
                </button>
              </div>
            </div>

            <div className="hidden overflow-hidden rounded-2xl border border-white/8 xl:block">
              <div className="grid grid-cols-[minmax(240px,1.35fr)_minmax(120px,0.8fr)_minmax(160px,0.95fr)_minmax(120px,0.75fr)_minmax(110px,0.7fr)_150px_120px] gap-3 bg-white/[0.03] px-4 py-3 text-[10px] uppercase tracking-[0.08em] text-slate-500">
                <SortHeader
                  label="Lead"
                  field="title"
                  sort={sort}
                  order={order}
                  onSort={controls.toggleSort}
                />
                <div>Source</div>
                <div>Contact</div>
                <SortHeader
                  label="Status"
                  field="status"
                  sort={sort}
                  order={order}
                  onSort={controls.toggleSort}
                />
                <SortHeader
                  label="Value"
                  field="estimatedValue"
                  sort={sort}
                  order={order}
                  onSort={controls.toggleSort}
                />
                <div>Client</div>
                <div className="text-right">Action</div>
              </div>

              {loading ? (
                <ListSkeleton />
              ) : pageData.items.length === 0 ? (
                <div className="px-4 py-6 text-[12px] text-slate-300">
                  No leads found.
                </div>
              ) : (
                <div className="divide-y divide-white/6">
                  {pageData.items.map((lead) => {
                    const health = leadStageHealth(lead.status);

                    return (
                      <div
                        key={lead.id}
                        onClick={() => navigate(`/leads/${lead.id}`)}
                        className="grid cursor-pointer grid-cols-[minmax(240px,1.35fr)_minmax(120px,0.8fr)_minmax(160px,0.95fr)_minmax(120px,0.75fr)_minmax(110px,0.7fr)_150px_120px] items-center gap-3 px-4 py-3 transition hover:bg-white/[0.04]"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-[13px] font-semibold text-white">
                            {lead.title}
                          </div>
                          <div className="mt-1 truncate text-[11px] text-slate-400">
                            {lead.companyName || "No company"}
                            {lead.estimatedValue != null
                              ? ` • ${formatCurrency(lead.estimatedValue)}`
                              : ""}
                          </div>
                        </div>

                        <div className="min-w-0">
                          <div className="truncate text-[12px] text-slate-200">
                            {prettyLeadSource(lead.source)}
                          </div>
                        </div>

                        <div className="min-w-0">
                          <div className="truncate text-[12px] text-slate-200">
                            {lead.contactName || "No contact"}
                          </div>
                          <div className="mt-1 truncate text-[11px] text-slate-500">
                            {lead.email || lead.phone || "—"}
                          </div>
                        </div>

                        <div>
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${leadStatusClasses(
                              lead.status
                            )}`}
                          >
                            {prettyLeadStatus(lead.status)}
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

                        <div className="min-w-0">
                          {lead.client ? (
                            <Link
                              to={`/clients/${lead.client.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="truncate text-[12px] text-slate-300 transition hover:text-white"
                            >
                              {lead.client.companyName}
                            </Link>
                          ) : (
                            <span className="text-[11px] text-slate-500">
                              Not converted
                            </span>
                          )}
                        </div>

                        <div className="text-right">
                          {lead.clientId ? (
                            <span className="text-[11px] text-emerald-300">
                              Converted
                            </span>
                          ) : isAdmin(user) ? (
                            <button
                              onClick={(e) => handleConvert(e, lead.id)}
                              disabled={convertingId === lead.id}
                              className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium text-white transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {convertingId === lead.id
                                ? "Converting..."
                                : "Convert"}
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-500">
                              Admin only
                            </span>
                          )}
                        </div>
                      </div>
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
                  No leads found.
                </div>
              ) : (
                pageData.items.map((lead) => {
                  const health = leadStageHealth(lead.status);

                  return (
                    <div
                      key={lead.id}
                      onClick={() => navigate(`/leads/${lead.id}`)}
                      className="cursor-pointer rounded-2xl border border-white/8 bg-slate-950/40 p-4 transition hover:bg-white/[0.04]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-[13px] font-semibold text-white">
                            {lead.title}
                          </div>
                          <div className="mt-1 truncate text-[11px] text-slate-400">
                            {lead.companyName || "No company"}
                            {lead.estimatedValue != null
                              ? ` • ${formatCurrency(lead.estimatedValue)}`
                              : ""}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-medium ${leadStatusClasses(
                              lead.status
                            )}`}
                          >
                            {prettyLeadStatus(lead.status)}
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
                        <MiniInfo label="Source" value={prettyLeadSource(lead.source)} />
                        <MiniInfo
                          label="Contact"
                          value={lead.contactName || "No contact"}
                        />
                        <MiniInfo
                          label="Email / phone"
                          value={lead.email || lead.phone || "—"}
                        />
                        <MiniInfo
                          label="Value"
                          value={formatCurrency(lead.estimatedValue)}
                        />
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/6 pt-3">
                        <div className="min-w-0">
                          {lead.client ? (
                            <Link
                              to={`/clients/${lead.client.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="truncate text-[12px] text-slate-300 transition hover:text-white"
                            >
                              {lead.client.companyName}
                            </Link>
                          ) : (
                            <span className="text-[11px] text-slate-500">
                              Not converted
                            </span>
                          )}
                        </div>

                        <div className="shrink-0">
                          {lead.clientId ? (
                            <span className="text-[11px] text-emerald-300">
                              Converted
                            </span>
                          ) : isAdmin(user) ? (
                            <button
                              onClick={(e) => handleConvert(e, lead.id)}
                              disabled={convertingId === lead.id}
                              className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium text-white transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {convertingId === lead.id
                                ? "Converting..."
                                : "Convert"}
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-500">
                              Admin only
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
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

            <div className="mt-3 text-[11px] text-slate-500">
              Click any row to open the full lead detail. Convert a won lead
              into a real client account without losing sales history.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

