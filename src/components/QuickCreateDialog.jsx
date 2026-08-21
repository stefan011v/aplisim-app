import { useEffect, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { apiFetch } from "../lib/api";
import { isAdmin } from "../lib/roles";
import { useModalBehavior } from "../hooks/useModalBehavior";

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

/**
 * Create a client, lead or ticket without leaving the current screen.
 * Owns its own form state so the shell only has to say when it is open.
 */
export default function QuickCreateDialog({ open, user, onClose, onCreated }) {
  const [quickCreateType, setQuickCreateType] = useState("client");
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickSaving, setQuickSaving] = useState(false);
  const [quickError, setQuickError] = useState("");
  const [quickData, setQuickData] = useState({
    settings: null,
    clients: [],
  });
  const [quickForms, setQuickForms] = useState(buildQuickForms());

  const dialogRef = useModalBehavior(open, handleClose);

  useEffect(() => {
    if (!open) return;

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
  }, [open, user]);

  function updateQuickForm(section, name, value) {
    setQuickForms((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [name]: value,
      },
    }));
  }

  function resetQuickCreate() {
    setQuickCreateType("client");
    setQuickError("");
    setQuickSaving(false);
  }

  function handleClose() {
    resetQuickCreate();
    onClose();
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

      resetQuickCreate();
      onCreated?.();
      onClose();
    } catch (error) {
      setQuickError(error.message || "Failed to create item");
    } finally {
      setQuickSaving(false);
    }
  }

  if (!open) return null;

  return (
  <div
    role="dialog"
    aria-modal="true"
    aria-label="Quick create"
    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
  >
    <div
      ref={dialogRef}
      className="w-full max-w-[820px] rounded-[28px] border border-white/10 bg-[#08101b] shadow-[0_30px_100px_rgba(0,0,0,0.45)]"
    >
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
          onClick={handleClose}
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
                  onClick={handleClose}
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
