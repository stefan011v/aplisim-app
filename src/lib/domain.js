import { labelFor } from "./format";

const TONE = {
  emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
  sky: "border-sky-500/20 bg-sky-500/10 text-sky-200",
  violet: "border-violet-500/20 bg-violet-500/10 text-violet-200",
  amber: "border-amber-500/20 bg-amber-500/10 text-amber-200",
  rose: "border-rose-500/20 bg-rose-500/10 text-rose-200",
  orange: "border-orange-500/20 bg-orange-500/10 text-orange-200",
  slate: "border-slate-500/20 bg-slate-500/10 text-slate-300",
  indigo: "border-indigo-500/20 bg-indigo-500/10 text-indigo-200",
};

export const toneClasses = (tone) => TONE[tone] || TONE.indigo;

/* ------------------------------------------------------------------ clients */

export const clientStatusOptions = [
  { value: "prospect", label: "Prospect" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "closed", label: "Closed" },
];

export const clientServiceOptions = [
  { value: "web-app-development", label: "Web & App Development" },
  { value: "help-desk-it-ops", label: "Help Desk & IT Ops" },
  { value: "crm-integrations", label: "CRM & Integrations" },
  { value: "ai-automation", label: "AI Automation" },
];

const CLIENT_STATUS_TONE = {
  active: "emerald",
  paused: "amber",
  closed: "slate",
};

export const prettyClientStatus = (value) =>
  labelFor(clientStatusOptions, value);

export const prettyClientService = (value) =>
  labelFor(clientServiceOptions, value);

export const clientStatusClasses = (status) =>
  toneClasses(CLIENT_STATUS_TONE[status]);

export function clientHealth(client) {
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

/* -------------------------------------------------------------------- leads */

export const leadStatusOptions = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "proposal_sent", label: "Proposal sent" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

export const leadSourceOptions = [
  { value: "website", label: "Website" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "referral", label: "Referral" },
  { value: "email", label: "Email" },
  { value: "other", label: "Other" },
];

export const proposalStatusOptions = [
  { value: "", label: "No proposal" },
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
];

const LEAD_STATUS_TONE = {
  won: "emerald",
  qualified: "sky",
  proposal_sent: "violet",
  contacted: "amber",
  lost: "rose",
};

export const prettyLeadStatus = (value) => labelFor(leadStatusOptions, value);
export const prettyLeadSource = (value) => labelFor(leadSourceOptions, value);
export const prettyProposalStatus = (value) =>
  labelFor(proposalStatusOptions, value);

export const leadStatusClasses = (status) =>
  toneClasses(LEAD_STATUS_TONE[status]);

export function leadStageHealth(status) {
  switch (status) {
    case "won":
      return { label: "Converted", tone: "emerald" };
    case "proposal_sent":
      return { label: "Hot", tone: "violet" };
    case "qualified":
      return { label: "Strong", tone: "sky" };
    case "contacted":
      return { label: "Warming", tone: "amber" };
    case "lost":
      return { label: "Closed lost", tone: "rose" };
    default:
      return { label: "Early", tone: "indigo" };
  }
}

/* ------------------------------------------------------------------ tickets */

export const ticketStatusOptions = [
  { value: "new", label: "New" },
  { value: "in_progress", label: "In progress" },
  { value: "waiting_client", label: "Waiting client" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

export const ticketPriorityOptions = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export const ticketCategoryOptions = [
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

const TICKET_STATUS_TONE = {
  resolved: "emerald",
  closed: "slate",
  in_progress: "sky",
  waiting_client: "amber",
};

const TICKET_PRIORITY_TONE = {
  urgent: "rose",
  high: "orange",
  low: "slate",
};

export const prettyTicketStatus = (value) =>
  labelFor(ticketStatusOptions, value);

export const prettyTicketPriority = (value) =>
  labelFor(ticketPriorityOptions, value);

export const prettyTicketCategory = (value) =>
  labelFor(ticketCategoryOptions, value);

export const ticketStatusClasses = (status) =>
  toneClasses(TICKET_STATUS_TONE[status]);

export const ticketPriorityClasses = (priority) =>
  toneClasses(TICKET_PRIORITY_TONE[priority]);

/* ---------------------------------------------------------- access requests */

export const accessRequestStatusOptions = [
  { value: "new", label: "New" },
  { value: "reviewing", label: "Reviewing" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const ACCESS_STATUS_TONE = {
  approved: "emerald",
  rejected: "rose",
  reviewing: "amber",
};

export const prettyAccessStatus = (value) =>
  labelFor(accessRequestStatusOptions, value);

export const accessStatusClasses = (status) =>
  toneClasses(ACCESS_STATUS_TONE[status]);
