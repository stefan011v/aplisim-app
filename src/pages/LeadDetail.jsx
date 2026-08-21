import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { isAdmin } from "../lib/roles";
import {
  leadSourceOptions,
  leadStageHealth,
  leadStatusClasses,
  leadStatusOptions,
  prettyLeadSource,
  prettyLeadStatus,
  prettyProposalStatus,
  proposalStatusOptions,
  toneClasses,
} from "../lib/domain";
import { HeaderChip, HeroStat, MiniInfo, Panel } from "../components/ui";
import { formatCurrency, formatDate } from "../lib/format";
import { useAutoDismiss } from "../hooks/useAutoDismiss";

function canEditLead(user) {
  return user?.role === "admin" || user?.role === "staff";
}

function canDeleteLead(user) {
  return user?.role === "admin";
}

function buildLeadForm(data) {
  return {
    title: data.title || "",
    companyName: data.companyName || "",
    contactName: data.contactName || "",
    email: data.email || "",
    phone: data.phone || "",
    source: data.source || "website",
    status: data.status || "new",
    estimatedValue:
      data.estimatedValue === null || data.estimatedValue === undefined
        ? ""
        : String(data.estimatedValue),
    notes: data.notes || "",
    proposalStatus: data.proposalStatus || "",
    proposalSentAt: data.proposalSentAt
      ? new Date(data.proposalSentAt).toISOString().slice(0, 10)
      : "",
    proposalAmount:
      data.proposalAmount === null || data.proposalAmount === undefined
        ? ""
        : String(data.proposalAmount),
    proposalNotes: data.proposalNotes || "",
  };
}

const inputClass =
  "h-9 w-full rounded-xl border border-white/8 bg-field px-3 text-[12px] text-white outline-none placeholder:text-muted transition focus:border-white/15 focus:bg-field-focus focus:ring-1 focus:ring-white/10";

const textareaClass =
  "w-full rounded-xl border border-white/8 bg-field px-3 py-2.5 text-[12px] text-white outline-none placeholder:text-muted transition focus:border-white/15 focus:bg-field-focus focus:ring-1 focus:ring-white/10";

const labelClass = "text-[11px] font-medium text-slate-300";

export default function LeadDetail({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [lead, setLead] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useAutoDismiss(notice, setNotice);
  const [deleting, setDeleting] = useState(false);

  const loadLead = useCallback(
    async (showRefreshState = false) => {
      try {
        if (showRefreshState) setRefreshing(true);
        else setLoading(true);

        setError("");

        const data = await apiFetch(`/api/leads/${id}`);
        setLead(data);
        setForm(buildLeadForm(data));
      } catch (err) {
        setError(err.message || "Failed to load lead");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id]
  );

  useEffect(() => {
    loadLead();
  }, [loadLead]);

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

  function handleCancel() {
    if (!lead) return;

    setForm(buildLeadForm(lead));
    setEditing(false);
    clearMessages();
  }

  async function handleSave(e) {
    e.preventDefault();

    if (!canEditLead(user)) return;

    setSaving(true);
    clearMessages();

    try {
      const payload = {
        ...form,
        estimatedValue:
          form.estimatedValue === "" ? null : Number(form.estimatedValue),
        proposalAmount:
          form.proposalAmount === "" ? null : Number(form.proposalAmount),
        proposalSentAt: form.proposalSentAt || null,
      };

      const updated = await apiFetch(`/api/leads/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      setLead(updated);
      setForm(buildLeadForm(updated));
      setEditing(false);
      setNotice("Lead updated successfully.");
    } catch (err) {
      setError(err.message || "Failed to update lead");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteLead() {
    const confirmed = window.confirm(
      `Delete lead "${lead.title}"? This cannot be undone.`
    );

    if (!confirmed) return;

    setDeleting(true);
    clearMessages();

    try {
      await apiFetch(`/api/leads/${id}`, { method: "DELETE" });

      navigate("/leads", {
        state: { notice: `Lead "${lead.title}" deleted successfully.` },
      });
    } catch (err) {
      setError(err.message || "Failed to delete lead");
      setDeleting(false);
    }
  }

  async function handleConvert() {
    if (!isAdmin(user)) return;

    try {
      setConverting(true);
      clearMessages();

      const result = await apiFetch(`/api/leads/${id}/convert`, {
        method: "POST",
      });

      setLead(result.lead);
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
      setConverting(false);
    }
  }

  const health = useMemo(() => leadStageHealth(lead?.status), [lead?.status]);

  return (
    <div className="w-full p-3 text-white sm:p-4 lg:p-5">
      <div className="mx-auto max-w-[1650px]">
        <div className="relative overflow-hidden rounded-shell border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-4 shadow-[0_18px_50px_rgba(0,0,0,0.24)] sm:px-5 sm:py-5">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.07),transparent_30%)]" />

          <div className="relative z-10 flex flex-col gap-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                <div className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[9px] uppercase tracking-[0.16em] text-slate-300">
                  Lead detail
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-[24px] font-semibold tracking-[-0.05em] text-white sm:text-[28px]">
                    {loading ? "Loading..." : lead?.title || "Lead"}
                  </h1>

                  {!loading && lead ? (
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-medium ${leadStatusClasses(
                        lead.status
                      )}`}
                    >
                      {prettyLeadStatus(lead.status)}
                    </span>
                  ) : null}
                </div>

                <p className="mt-2 max-w-3xl text-[11px] leading-5 text-slate-400 sm:text-[12px]">
                  Sales opportunity overview, proposal tracking and conversion flow.
                </p>

                {!loading && lead ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <HeaderChip
                      label="Company"
                      value={lead.companyName || "No company"}
                    />
                    <HeaderChip
                      label="Source"
                      value={prettyLeadSource(lead.source)}
                    />
                    <HeaderChip
                      label="Contact"
                      value={lead.contactName || "No contact"}
                    />
                    <HeaderChip
                      label="Value"
                      value={formatCurrency(lead.estimatedValue)}
                    />
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                <button
                  onClick={() => navigate(-1)}
                  className="h-9 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-[12px] text-white transition hover:bg-white/[0.06]"
                >
                  Back
                </button>

                <Link
                  to="/leads"
                  className="h-9 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-[12px] leading-9 text-white transition hover:bg-white/[0.06]"
                >
                  All leads
                </Link>

                {!loading && lead ? (
                  <button
                    onClick={() => loadLead(true)}
                    disabled={refreshing}
                    className="h-9 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-[12px] text-white transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {refreshing ? "Refreshing..." : "Refresh"}
                  </button>
                ) : null}

                {!loading && lead && !editing && canEditLead(user) ? (
                  <button
                    onClick={() => {
                      clearMessages();
                      setEditing(true);
                    }}
                    className="h-9 rounded-xl border border-white/10 bg-white px-4 text-[12px] font-semibold text-slate-900 transition hover:bg-slate-100"
                  >
                    Edit lead
                  </button>
                ) : null}

                {!loading && lead && canDeleteLead(user) ? (
                  <button
                    onClick={handleDeleteLead}
                    disabled={deleting}
                    className="h-9 rounded-xl border border-red-500/25 bg-red-500/10 px-4 text-[12px] font-medium text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deleting ? "Deleting..." : "Delete lead"}
                  </button>
                ) : null}
              </div>
            </div>

            {!loading && lead ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <HeroStat
                  label="Estimated value"
                  value={formatCurrency(lead.estimatedValue)}
                  hint="Commercial estimate"
                />
                <HeroStat
                  label="Proposal amount"
                  value={formatCurrency(lead.proposalAmount)}
                  hint="Formal offer value"
                />
                <HeroStat
                  label="Proposal status"
                  value={prettyProposalStatus(lead.proposalStatus)}
                  hint="Offer progression"
                />
                <HeroStat
                  label="Converted"
                  value={lead.clientId ? "Yes" : "No"}
                  hint={lead.convertedAt ? formatDate(lead.convertedAt) : "Not converted yet"}
                />
              </div>
            ) : null}
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

        {loading ? (
          <div className="mt-4 rounded-card border border-white/8 bg-slate-900/70 p-5 text-[12px] text-slate-300 shadow-[0_10px_32px_rgba(0,0,0,0.18)]">
            Loading lead data...
          </div>
        ) : lead && form ? (
          <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="grid gap-4">
              <Panel>
                {!editing ? (
                  <>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h2 className="text-[16px] font-semibold text-white sm:text-[18px]">
                          Lead overview
                        </h2>
                        <p className="mt-1 text-[11px] leading-5 text-slate-400 sm:text-[12px]">
                          Core company, contact and qualification context for this opportunity.
                        </p>
                      </div>

                      <div className="text-[11px] text-muted">
                        Lead #{lead.id}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      <MiniInfo label="Company" value={lead.companyName || "—"} />
                      <MiniInfo label="Contact" value={lead.contactName || "—"} />
                      <MiniInfo label="Email" value={lead.email || "—"} />
                      <MiniInfo label="Phone" value={lead.phone || "—"} />
                      <MiniInfo label="Source" value={prettyLeadSource(lead.source)} />
                      <MiniInfo
                        label="Converted at"
                        value={formatDate(lead.convertedAt)}
                      />
                    </div>

                    <div className="mt-4 rounded-2xl border border-white/8 bg-slate-950/40 p-4">
                      <div className="text-[10px] uppercase tracking-[0.08em] text-muted">
                        Opportunity notes
                      </div>
                      <div className="mt-2 whitespace-pre-wrap text-[12px] leading-6 text-slate-300">
                        {lead.notes || "No notes added yet."}
                      </div>
                    </div>
                  </>
                ) : (
                  <form onSubmit={handleSave} className="grid gap-3">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h2 className="text-[16px] font-semibold text-white sm:text-[18px]">
                          Edit lead
                        </h2>
                        <p className="mt-1 text-[11px] leading-5 text-slate-400 sm:text-[12px]">
                          Update commercial and qualification details without losing history.
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-1.5">
                      <label className={labelClass}>Title</label>
                      <input
                        name="title"
                        value={form.title}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>

                    <div className="grid gap-1.5">
                      <label className={labelClass}>Company name</label>
                      <input
                        name="companyName"
                        value={form.companyName}
                        onChange={handleChange}
                        className={inputClass}
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
                        />
                      </div>

                      <div className="grid gap-1.5">
                        <label className={labelClass}>Phone</label>
                        <input
                          name="phone"
                          value={form.phone}
                          onChange={handleChange}
                          className={inputClass}
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
                        />
                      </div>

                      <div className="grid gap-1.5">
                        <label className={labelClass}>Estimated value (€)</label>
                        <input
                          name="estimatedValue"
                          type="number"
                          value={form.estimatedValue}
                          onChange={handleChange}
                          className={inputClass}
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
                      />
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="grid gap-1.5">
                        <label className={labelClass}>Proposal status</label>
                        <select
                          name="proposalStatus"
                          value={form.proposalStatus}
                          onChange={handleChange}
                          className={inputClass}
                        >
                          {proposalStatusOptions.map((item) => (
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
                        <label className={labelClass}>Proposal sent date</label>
                        <input
                          name="proposalSentAt"
                          type="date"
                          value={form.proposalSentAt}
                          onChange={handleChange}
                          className={inputClass}
                        />
                      </div>

                      <div className="grid gap-1.5">
                        <label className={labelClass}>Proposal amount (€)</label>
                        <input
                          name="proposalAmount"
                          type="number"
                          value={form.proposalAmount}
                          onChange={handleChange}
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div className="grid gap-1.5">
                      <label className={labelClass}>Proposal notes</label>
                      <textarea
                        name="proposalNotes"
                        value={form.proposalNotes}
                        onChange={handleChange}
                        rows={4}
                        className={textareaClass}
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="submit"
                        disabled={saving}
                        className="h-9 rounded-xl border border-white/10 bg-white px-4 text-[12px] font-semibold text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {saving ? "Saving..." : "Save changes"}
                      </button>

                      <button
                        type="button"
                        onClick={handleCancel}
                        className="h-9 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-[12px] text-white transition hover:bg-white/[0.06]"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </Panel>

              {!editing ? (
                <Panel>
                  <h3 className="text-[15px] font-semibold sm:text-[16px]">
                    Proposal / commercial details
                  </h3>
                  <p className="mt-1 text-[11px] leading-5 text-slate-400 sm:text-[12px]">
                    Proposal stage, sent date and offer value linked to this opportunity.
                  </p>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    <MiniInfo
                      label="Proposal status"
                      value={prettyProposalStatus(lead.proposalStatus)}
                    />
                    <MiniInfo
                      label="Proposal sent"
                      value={formatDate(lead.proposalSentAt)}
                    />
                    <MiniInfo
                      label="Proposal amount"
                      value={formatCurrency(lead.proposalAmount)}
                    />
                  </div>

                  <div className="mt-4 rounded-2xl border border-white/8 bg-slate-950/40 p-4">
                    <div className="text-[10px] uppercase tracking-[0.08em] text-muted">
                      Proposal notes
                    </div>
                    <div className="mt-2 whitespace-pre-wrap text-[12px] leading-6 text-slate-300">
                      {lead.proposalNotes || "No proposal notes yet."}
                    </div>
                  </div>
                </Panel>
              ) : null}
            </div>

            <div className="grid gap-4">
              <Panel compact>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-[14px] font-semibold sm:text-[15px]">
                      Lead health
                    </h3>
                    <p className="mt-1 text-[11px] leading-5 text-slate-400">
                      Quick signal of where this opportunity currently stands.
                    </p>
                  </div>

                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-medium ${toneClasses(
                      health.tone
                    )}`}
                  >
                    {health.label}
                  </span>
                </div>

                <p className="mt-4 text-[12px] leading-6 text-slate-300">
                  {health.note}
                </p>
              </Panel>

              <Panel compact>
                <h3 className="text-[14px] font-semibold sm:text-[15px]">
                  Conversion
                </h3>

                <div className="mt-3 grid gap-2">
                  <MiniInfo
                    label="Client link"
                    value={
                      lead.client ? (
                        <Link
                          to={`/clients/${lead.client.id}`}
                          className="text-slate-300 transition hover:text-white"
                        >
                          {lead.client.companyName}
                        </Link>
                      ) : (
                        "Not converted yet"
                      )
                    }
                  />
                  <MiniInfo
                    label="Converted at"
                    value={formatDate(lead.convertedAt)}
                  />
                </div>

                {!lead.clientId ? (
                  isAdmin(user) ? (
                    <button
                      onClick={handleConvert}
                      disabled={converting}
                      className="mt-3 h-9 w-full rounded-xl border border-white/10 bg-white px-4 text-[12px] font-semibold text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {converting ? "Converting..." : "Convert to client"}
                    </button>
                  ) : (
                    <div className="mt-3 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-[11px] text-slate-400">
                      Only admin users can convert a lead to a client.
                    </div>
                  )
                ) : (
                  <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-200">
                    Lead already converted to client.
                  </div>
                )}
              </Panel>

              <Panel compact>
                <h3 className="text-[14px] font-semibold sm:text-[15px]">
                  Commercial snapshot
                </h3>

                <div className="mt-3 grid gap-2">
                  <MiniInfo
                    label="Source"
                    value={prettyLeadSource(lead.source)}
                  />
                  <MiniInfo
                    label="Estimated value"
                    value={formatCurrency(lead.estimatedValue)}
                  />
                  <MiniInfo
                    label="Proposal value"
                    value={formatCurrency(lead.proposalAmount)}
                  />
                </div>
              </Panel>

              <Panel compact>
                <h3 className="text-[14px] font-semibold sm:text-[15px]">
                  Recommended next step
                </h3>

                <div className="mt-3 rounded-xl border border-white/8 bg-slate-950/40 p-3">
                  <div className="text-[12px] leading-6 text-slate-300">
                    {lead.clientId
                      ? "This lead is already converted. Continue commercial and operational work from the client account."
                      : lead.status === "won"
                      ? "Convert this opportunity into a client account and continue onboarding from the client workspace."
                      : lead.status === "proposal_sent"
                      ? "Follow up on the sent proposal and push toward a commercial decision."
                      : lead.status === "qualified"
                      ? "Prepare a concrete offer and move this lead into proposal stage."
                      : lead.status === "contacted"
                      ? "Deepen discovery, validate requirements and qualify the opportunity further."
                      : lead.status === "lost"
                      ? "Keep this record as commercial history and only reopen if the opportunity returns."
                      : "Gather more discovery details and confirm whether this is a real qualified opportunity."}
                  </div>
                </div>
              </Panel>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

