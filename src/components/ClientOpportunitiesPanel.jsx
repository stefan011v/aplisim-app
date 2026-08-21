import {
  EmptyState,
  MiniInfo,
  Panel,
  inputClass,
  labelClass,
  textareaClass,
} from "./ui";
import { Link } from "react-router-dom";
import { formatCurrency, formatDate } from "../lib/format";
import {
  leadSourceOptions,
  leadStatusClasses,
  prettyLeadSource,
  prettyLeadStatus,
  prettyProposalStatus,
  proposalStatusOptions,
} from "../lib/domain";

/** Sales pipeline attached to a client: opportunities and their proposals. */
export default function ClientOpportunitiesPanel({
  addingOpportunity,
  clearMessages,
  client,
  handleAddOpportunity,
  handleOpportunityChange,
  metrics,
  opportunityForm,
  resetOpportunityForm,
  savingOpportunity,
  setAddingOpportunity,
}) {
  return (
  <Panel>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h3 className="text-[15px] font-semibold sm:text-[16px]">
          Commercial / Opportunities
        </h3>
        <p className="mt-1 text-[11px] leading-5 text-slate-400 sm:text-[12px]">
          Sales origin, converted opportunities and additional
          commercial scope.
        </p>
      </div>

      <button
        onClick={() => {
          clearMessages();
          setAddingOpportunity((prev) => !prev);
        }}
        className="h-9 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-[12px] text-white transition hover:bg-white/[0.06]"
      >
        {addingOpportunity ? "Close" : "Add opportunity"}
      </button>
    </div>

    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <MiniInfo
        label="Total opportunities"
        value={String(metrics.opportunities)}
      />
      <MiniInfo
        label="Won"
        value={String(metrics.wonOpportunities)}
      />
      <MiniInfo
        label="Pipeline value"
        value={formatCurrency(metrics.pipelineValue)}
      />
      <MiniInfo
        label="Proposals sent"
        value={String(metrics.proposalSentCount)}
      />
    </div>

    {addingOpportunity ? (
      <form
        onSubmit={handleAddOpportunity}
        className="mt-4 grid gap-3 rounded-2xl border border-white/8 bg-slate-950/40 p-4"
      >
        <div className="grid gap-1.5">
          <label className={labelClass}>Opportunity title</label>
          <input
            name="title"
            value={opportunityForm.title}
            onChange={handleOpportunityChange}
            className={inputClass}
            placeholder="AI automation expansion"
          />
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="grid gap-1.5">
            <label className={labelClass}>Source</label>
            <select
              name="source"
              value={opportunityForm.source}
              onChange={handleOpportunityChange}
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
              value={opportunityForm.status}
              onChange={handleOpportunityChange}
              className={inputClass}
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
              <option value="proposal_sent" className="bg-slate-900">
                Proposal sent
              </option>
              <option value="won" className="bg-slate-900">
                Won
              </option>
              <option value="lost" className="bg-slate-900">
                Lost
              </option>
            </select>
          </div>

          <div className="grid gap-1.5">
            <label className={labelClass}>Estimated value (€)</label>
            <input
              name="estimatedValue"
              type="number"
              value={opportunityForm.estimatedValue}
              onChange={handleOpportunityChange}
              className={inputClass}
              placeholder="2500"
            />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="grid gap-1.5">
            <label className={labelClass}>Proposal status</label>
            <select
              name="proposalStatus"
              value={opportunityForm.proposalStatus}
              onChange={handleOpportunityChange}
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
              value={opportunityForm.proposalSentAt}
              onChange={handleOpportunityChange}
              className={inputClass}
            />
          </div>

          <div className="grid gap-1.5">
            <label className={labelClass}>Proposal amount (€)</label>
            <input
              name="proposalAmount"
              type="number"
              value={opportunityForm.proposalAmount}
              onChange={handleOpportunityChange}
              className={inputClass}
              placeholder="2200"
            />
          </div>
        </div>

        <div className="grid gap-1.5">
          <label className={labelClass}>Opportunity notes</label>
          <textarea
            name="notes"
            value={opportunityForm.notes}
            onChange={handleOpportunityChange}
            rows={3}
            className={textareaClass}
            placeholder="Scope, timing, sales notes..."
          />
        </div>

        <div className="grid gap-1.5">
          <label className={labelClass}>Proposal notes</label>
          <textarea
            name="proposalNotes"
            value={opportunityForm.proposalNotes}
            onChange={handleOpportunityChange}
            rows={3}
            className={textareaClass}
            placeholder="Proposal remarks, revision notes, offer comments..."
          />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="submit"
            disabled={savingOpportunity}
            className="h-9 rounded-xl border border-white/10 bg-white px-4 text-[12px] font-semibold text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {savingOpportunity ? "Saving..." : "Create opportunity"}
          </button>

          <button
            type="button"
            onClick={resetOpportunityForm}
            className="h-9 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-[12px] text-white transition hover:bg-white/[0.06]"
          >
            Cancel
          </button>
        </div>
      </form>
    ) : null}

    {client.leads?.length ? (
      <>
        <div className="mt-4 hidden overflow-hidden rounded-2xl border border-white/8 xl:block">
          <div className="grid grid-cols-[minmax(220px,1.2fr)_120px_120px_1fr_120px] gap-3 bg-white/[0.03] px-4 py-3 text-[10px] uppercase tracking-[0.08em] text-muted">
            <div>Opportunity</div>
            <div>Source</div>
            <div>Converted</div>
            <div>Proposal</div>
            <div className="text-right">Value</div>
          </div>

          <div className="divide-y divide-white/6">
            {client.leads.map((lead) => (
              <div
                key={lead.id}
                className="grid grid-cols-[minmax(220px,1.2fr)_120px_120px_1fr_120px] gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <Link
                    to={`/leads/${lead.id}`}
                    className="truncate text-[12px] font-medium text-white transition hover:text-indigo-300 hover:underline"
                  >
                    {lead.title}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${leadStatusClasses(
                        lead.status
                      )}`}
                    >
                      {prettyLeadStatus(lead.status)}
                    </span>
                    <span className="text-[10px] text-muted">
                      {lead.contactName || "—"}
                    </span>
                  </div>
                </div>

                <div className="text-[12px] text-slate-300">
                  {prettyLeadSource(lead.source)}
                </div>

                <div className="text-[12px] text-slate-300">
                  {formatDate(lead.convertedAt)}
                </div>

                <div className="min-w-0">
                  <div className="text-[12px] text-slate-200">
                    {prettyProposalStatus(lead.proposalStatus)}
                  </div>
                  <div className="mt-1 truncate text-[10px] text-muted">
                    {lead.proposalSentAt
                      ? `Sent: ${formatDate(lead.proposalSentAt)}`
                      : lead.proposalNotes || "No proposal notes"}
                  </div>
                </div>

                <div className="text-right text-[12px] text-slate-200">
                  {lead.proposalAmount != null
                    ? `€${lead.proposalAmount}`
                    : lead.estimatedValue != null
                    ? `€${lead.estimatedValue}`
                    : "—"}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-3 xl:hidden">
          {client.leads.map((lead) => (
            <div
              key={lead.id}
              className="rounded-2xl border border-white/8 bg-slate-950/40 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    to={`/leads/${lead.id}`}
                    className="truncate text-[13px] font-semibold text-white transition hover:text-indigo-300 hover:underline"
                  >
                    {lead.title}
                  </Link>
                  <div className="mt-1 text-[11px] text-muted">
                    {lead.contactName || "—"}
                  </div>
                </div>

                <span
                  className={`shrink-0 inline-flex rounded-full border px-2.5 py-1 text-[10px] font-medium ${leadStatusClasses(
                    lead.status
                  )}`}
                >
                  {prettyLeadStatus(lead.status)}
                </span>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <MiniInfo label="Source" value={prettyLeadSource(lead.source)} />
                <MiniInfo label="Converted" value={formatDate(lead.convertedAt)} />
                <MiniInfo
                  label="Proposal"
                  value={prettyProposalStatus(lead.proposalStatus)}
                />
                <MiniInfo
                  label="Value"
                  value={
                    lead.proposalAmount != null
                      ? `€${lead.proposalAmount}`
                      : lead.estimatedValue != null
                      ? `€${lead.estimatedValue}`
                      : "—"
                  }
                />
              </div>

              <div className="mt-3 rounded-xl border border-white/8 bg-black/10 p-3">
                <div className="text-[10px] uppercase tracking-[0.08em] text-muted">
                  Proposal details
                </div>
                <div className="mt-1 text-[12px] leading-6 text-slate-300">
                  {lead.proposalSentAt
                    ? `Sent: ${formatDate(lead.proposalSentAt)}`
                    : lead.proposalNotes || "No proposal notes"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </>
    ) : (
      <EmptyState text="No commercial history linked yet." />
    )}
  </Panel>
  );
}
