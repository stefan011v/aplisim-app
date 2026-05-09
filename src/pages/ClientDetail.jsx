import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
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

const opportunityStatusLabels = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  proposal_sent: "Proposal sent",
  won: "Won",
  lost: "Lost",
};

const opportunitySourceOptions = [
  { value: "website", label: "Website" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "referral", label: "Referral" },
  { value: "email", label: "Email" },
  { value: "other", label: "Other" },
];

const proposalStatusOptions = [
  { value: "", label: "No proposal" },
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
];

const ticketStatusOptions = [
  { value: "new", label: "New" },
  { value: "in_progress", label: "In progress" },
  { value: "waiting_client", label: "Waiting client" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const ticketPriorityOptions = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

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

function prettyOpportunityStatus(value) {
  return opportunityStatusLabels[value] || value || "—";
}

function prettySource(value) {
  return (
    opportunitySourceOptions.find((item) => item.value === value)?.label ||
    value ||
    "—"
  );
}

function prettyProposalStatus(value) {
  return (
    proposalStatusOptions.find((item) => item.value === value)?.label ||
    value ||
    "—"
  );
}

function prettyTicketStatus(value) {
  return (
    ticketStatusOptions.find((item) => item.value === value)?.label ||
    value ||
    "—"
  );
}

function prettyTicketPriority(value) {
  return (
    ticketPriorityOptions.find((item) => item.value === value)?.label ||
    value ||
    "—"
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

function opportunityStatusClasses(status) {
  switch (status) {
    case "won":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
    case "qualified":
      return "border-sky-500/20 bg-sky-500/10 text-sky-200";
    case "proposal_sent":
      return "border-violet-500/20 bg-violet-500/10 text-violet-200";
    case "contacted":
      return "border-amber-500/20 bg-amber-500/10 text-amber-200";
    case "lost":
      return "border-rose-500/20 bg-rose-500/10 text-rose-200";
    default:
      return "border-indigo-500/20 bg-indigo-500/10 text-indigo-200";
  }
}

function ticketStatusClasses(status) {
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

function ticketPriorityClasses(priority) {
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

const inputClass =
  "h-9 w-full rounded-xl border border-white/8 bg-[#0b1220] px-3 text-[12px] text-white outline-none placeholder:text-slate-500 transition focus:border-white/15 focus:bg-[#0d1526] focus:ring-1 focus:ring-white/10";

const textareaClass =
  "w-full rounded-xl border border-white/8 bg-[#0b1220] px-3 py-2.5 text-[12px] text-white outline-none placeholder:text-slate-500 transition focus:border-white/15 focus:bg-[#0d1526] focus:ring-1 focus:ring-white/10";

const labelClass = "text-[11px] font-medium text-slate-300";

const initialOpportunityForm = {
  title: "",
  source: "website",
  status: "new",
  estimatedValue: "",
  notes: "",
  proposalStatus: "",
  proposalSentAt: "",
  proposalAmount: "",
  proposalNotes: "",
};

const initialContactForm = {
  fullName: "",
  email: "",
  phone: "",
  role: "",
  notes: "",
};

const initialTicketForm = {
  contactId: "",
  title: "",
  description: "",
  status: "new",
  priority: "medium",
};

function buildClientForm(data) {
  return {
    companyName: data.companyName || "",
    contactName: data.contactName || "",
    email: data.email || "",
    phone: data.phone || "",
    website: data.website || "",
    city: data.city || "",
    status: data.status || "prospect",
    primaryService: data.primaryService || "web-app-development",
    packageName: data.packageName || "",
    notes: data.notes || "",
  };
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString();
}

function formatDateTime(value) {
  if (!value) return "—";

  try {
    return new Date(value).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function formatCurrency(value) {
  if (value == null || value === "") return "—";
  return `€${Number(value).toLocaleString("en-GB")}`;
}

function getOpportunityDisplayValue(lead) {
  if (lead?.proposalAmount != null) return Number(lead.proposalAmount);
  if (lead?.estimatedValue != null) return Number(lead.estimatedValue);
  return 0;
}

function getAccountHealth(client) {
  if (!client) {
    return { label: "—", tone: "default", note: "No client loaded." };
  }

  const openTickets = (client.tickets || []).filter(
    (ticket) => !["resolved", "closed"].includes(ticket.status)
  ).length;

  if (client.status === "closed") {
    return {
      label: "Closed",
      tone: "slate",
      note: "This account is closed and not currently active.",
    };
  }

  if (client.status === "paused") {
    return {
      label: "Needs follow-up",
      tone: "amber",
      note: "Account is paused and should be reviewed before reactivation.",
    };
  }

  if (openTickets >= 3) {
    return {
      label: "Attention needed",
      tone: "rose",
      note: "There are multiple open tickets that may require coordination.",
    };
  }

  if (client?.status === "active") {
    return {
      label: "Healthy",
      tone: "emerald",
      note: "Active client with a stable operational profile.",
    };
  }

  return {
    label: "Early stage",
    tone: "indigo",
    note: "Prospect or early account that still needs structuring.",
  };
}

function healthClasses(tone) {
  switch (tone) {
    case "emerald":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
    case "amber":
      return "border-amber-500/20 bg-amber-500/10 text-amber-200";
    case "rose":
      return "border-rose-500/20 bg-rose-500/10 text-rose-200";
    case "slate":
      return "border-slate-500/20 bg-slate-500/10 text-slate-300";
    default:
      return "border-indigo-500/20 bg-indigo-500/10 text-indigo-200";
  }
}

function isClient(user) {
  return user?.role === "client";
}

function prettyPortalRole(value) {
  if (value === "admin") return "Admin";
  if (value === "member") return "Member";
  return value || "—";
}

export default function ClientDetail({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const clientView = isClient(user);

  const [client, setClient] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deletingClient, setDeletingClient] = useState(false);

  const [addingOpportunity, setAddingOpportunity] = useState(false);
  const [savingOpportunity, setSavingOpportunity] = useState(false);
  const [opportunityForm, setOpportunityForm] = useState(initialOpportunityForm);

  const [addingContact, setAddingContact] = useState(false);
  const [savingContact, setSavingContact] = useState(false);
  const [contactForm, setContactForm] = useState(initialContactForm);

  const [editingContactId, setEditingContactId] = useState(null);
  const [editingContactForm, setEditingContactForm] =
    useState(initialContactForm);
  const [deletingContactId, setDeletingContactId] = useState(null);

  const [addingTicket, setAddingTicket] = useState(false);
  const [savingTicket, setSavingTicket] = useState(false);
  const [ticketForm, setTicketForm] = useState(initialTicketForm);
  const [changingPortalUserId, setChangingPortalUserId] = useState(null);

  const [addingPortalUser, setAddingPortalUser] = useState(false);
const [savingPortalUser, setSavingPortalUser] = useState(false);
const [portalUserForm, setPortalUserForm] = useState({
  name: "",
  email: "",
  password: "",
  clientPortalRole: "member",
});

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadClient = useCallback(
    async (showRefreshState = false) => {
      try {
        if (showRefreshState) setRefreshing(true);
        else setLoading(true);

        setError("");

        const data = await apiFetch(`/api/clients/${id}`);
        setClient(data);
        setForm(buildClientForm(data));
      } catch (err) {
        setError(err.message || "Failed to load client");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id]
  );

  useEffect(() => {
    loadClient();
  }, [loadClient]);

  function clearMessages() {
    setError("");
    setNotice("");
  }

  function resetContactAddForm() {
    setContactForm(initialContactForm);
    setAddingContact(false);
  }

  function resetContactEditForm() {
    setEditingContactId(null);
    setEditingContactForm(initialContactForm);
  }

  function resetOpportunityForm() {
    setOpportunityForm(initialOpportunityForm);
    setAddingOpportunity(false);
  }

  function resetTicketForm() {
    setTicketForm(initialTicketForm);
    setAddingTicket(false);
  }

  function resetPortalUserForm() {
  setPortalUserForm({
    name: "",
    email: "",
    password: "",
    clientPortalRole: "member",
  });
  setAddingPortalUser(false);
}

function handlePortalUserChange(e) {
  const { name, value } = e.target;
  setPortalUserForm((prev) => ({
    ...prev,
    [name]: value,
  }));
}

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleOpportunityChange(e) {
    const { name, value } = e.target;
    setOpportunityForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleContactChange(e) {
    const { name, value } = e.target;
    setContactForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleEditingContactChange(e) {
    const { name, value } = e.target;
    setEditingContactForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleTicketChange(e) {
    const { name, value } = e.target;
    setTicketForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleCancel() {
    if (!client) return;

    setForm(buildClientForm(client));
    setEditing(false);
    clearMessages();
  }

  function startEditContact(contact) {
    clearMessages();
    setEditingContactId(contact.id);
    setEditingContactForm({
      fullName: contact.fullName || "",
      email: contact.email || "",
      phone: contact.phone || "",
      role: contact.role || "",
      notes: contact.notes || "",
    });
    setAddingContact(false);
  }

  function cancelEditContact() {
    resetContactEditForm();
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    clearMessages();

    try {
      const updated = await apiFetch(`/api/clients/${id}`, {
        method: "PATCH",
        body: JSON.stringify(form),
      });

      setClient((prev) => ({
        ...prev,
        ...updated,
      }));

      setForm(buildClientForm(updated));
      setEditing(false);
      setNotice("Client profile updated successfully.");
    } catch (err) {
      setError(err.message || "Failed to update client");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddOpportunity(e) {
    e.preventDefault();
    setSavingOpportunity(true);
    clearMessages();

    try {
      const payload = {
        title: opportunityForm.title,
        companyName: client.companyName,
        contactName: client.contactName,
        email: client.email,
        phone: client.phone,
        source: opportunityForm.source,
        status: opportunityForm.status,
        notes: opportunityForm.notes,
        clientId: client.id,
        estimatedValue:
          opportunityForm.estimatedValue === ""
            ? null
            : Number(opportunityForm.estimatedValue),
        proposalStatus: opportunityForm.proposalStatus || null,
        proposalSentAt: opportunityForm.proposalSentAt || null,
        proposalAmount:
          opportunityForm.proposalAmount === ""
            ? null
            : Number(opportunityForm.proposalAmount),
        proposalNotes: opportunityForm.proposalNotes || null,
      };

      const newOpportunity = await apiFetch("/api/leads", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setClient((prev) => ({
        ...prev,
        leads: [newOpportunity, ...(prev.leads || [])],
      }));

      resetOpportunityForm();
      setNotice("Opportunity created successfully.");
    } catch (err) {
      setError(err.message || "Failed to add opportunity");
    } finally {
      setSavingOpportunity(false);
    }
  }

 async function handleDeleteClient() {
  if (!client?.id) return;

  const confirmed = window.confirm(
    `Delete client "${client.companyName}"?\n\nThis will permanently remove the client and all related records from the database.`
  );

  if (!confirmed) return;

  try {
    setDeletingClient(true);
    clearMessages();

    await apiFetch(`/api/clients/${client.id}`, {
      method: "DELETE",
    });

    navigate("/clients", {
      replace: true,
      state: {
        notice: `Client "${client.companyName}" deleted successfully.`,
      },
    });
  } catch (err) {
    setError(err.message || "Failed to delete client");
  } finally {
    setDeletingClient(false);
  }
}

  async function handleAddContact(e) {
    e.preventDefault();
    setSavingContact(true);
    clearMessages();

    try {
      const newContact = await apiFetch(`/api/clients/${client.id}/contacts`, {
        method: "POST",
        body: JSON.stringify(contactForm),
      });

      setClient((prev) => ({
        ...prev,
        contacts: [newContact, ...(prev.contacts || [])],
      }));

      resetContactAddForm();
      setNotice("Contact created successfully.");
    } catch (err) {
      setError(err.message || "Failed to add contact");
    } finally {
      setSavingContact(false);
    }
  }

  async function handleUpdateContact(e, contactId) {
    e.preventDefault();
    setSavingContact(true);
    clearMessages();

    try {
      const updatedContact = await apiFetch(
        `/api/clients/${client.id}/contacts/${contactId}`,
        {
          method: "PATCH",
          body: JSON.stringify(editingContactForm),
        }
      );

      setClient((prev) => ({
        ...prev,
        contacts: (prev.contacts || []).map((contact) =>
          contact.id === contactId ? updatedContact : contact
        ),
      }));

      resetContactEditForm();
      setNotice("Contact updated successfully.");
    } catch (err) {
      setError(err.message || "Failed to update contact");
    } finally {
      setSavingContact(false);
    }
  }

  async function handleDeleteContact(contactId) {
    const confirmed = window.confirm("Delete this contact?");
    if (!confirmed) return;

    setDeletingContactId(contactId);
    clearMessages();

    try {
      await apiFetch(`/api/clients/${client.id}/contacts/${contactId}`, {
        method: "DELETE",
      });

      setClient((prev) => ({
        ...prev,
        contacts: (prev.contacts || []).filter(
          (contact) => contact.id !== contactId
        ),
      }));

      if (editingContactId === contactId) {
        resetContactEditForm();
      }

      setNotice("Contact deleted successfully.");
    } catch (err) {
      setError(err.message || "Failed to delete contact");
    } finally {
      setDeletingContactId(null);
    }
  }

  async function handleAddTicket(e) {
    e.preventDefault();
    setSavingTicket(true);
    clearMessages();

    try {
      const payload = {
        clientId: client.id,
        contactId: ticketForm.contactId || null,
        title: ticketForm.title,
        description: ticketForm.description,
        status: ticketForm.status,
        priority: ticketForm.priority,
      };

      const newTicket = await apiFetch("/api/tickets", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setClient((prev) => ({
        ...prev,
        tickets: [newTicket, ...(prev.tickets || [])],
      }));

      resetTicketForm();
      setNotice("Ticket created successfully.");
    } catch (err) {
      setError(err.message || "Failed to add ticket");
    } finally {
      setSavingTicket(false);
    }
  }

  async function handleAddPortalUser(e) {
  e.preventDefault();
  if (!client?.id) return;

  setSavingPortalUser(true);
  clearMessages();

  try {
    const newPortalUser = await apiFetch(`/api/clients/${client.id}/portal-users`, {
      method: "POST",
      body: JSON.stringify({
        name: portalUserForm.name,
        email: portalUserForm.email,
        password: portalUserForm.password,
        clientPortalRole: portalUserForm.clientPortalRole,
      }),
    });

    setClient((prev) => ({
      ...prev,
      users: [newPortalUser, ...(prev.users || [])],
    }));

    resetPortalUserForm();
    setNotice("Portal user created successfully.");
  } catch (err) {
    setError(err.message || "Failed to create portal user");
  } finally {
    setSavingPortalUser(false);
  }
}

  async function handlePortalRoleChange(userId, nextRole) {
    if (!client?.id || !userId) return;

    setChangingPortalUserId(userId);
    clearMessages();

    try {
      const updatedUser = await apiFetch(
        `/api/clients/${client.id}/portal-users/${userId}/role`,
        {
          method: "PATCH",
          body: JSON.stringify({
            clientPortalRole: nextRole,
          }),
        }
      );

      setClient((prev) => ({
        ...prev,
        users: (prev.users || []).map((portalUser) =>
          portalUser.id === userId ? updatedUser : portalUser
        ),
      }));

      setNotice("Portal user role updated successfully.");
    } catch (err) {
      setError(err.message || "Failed to update portal user role");
    } finally {
      setChangingPortalUserId(null);
    }
  }

  const metrics = useMemo(() => {
    const contacts = client?.contacts || [];
    const leads = client?.leads || [];
    const tickets = client?.tickets || [];
    const portalUsers = client?.users || [];

    const openTickets = tickets.filter(
      (ticket) => !["resolved", "closed"].includes(ticket.status)
    ).length;

    const urgentTickets = tickets.filter(
      (ticket) =>
        ticket.priority === "urgent" &&
        !["resolved", "closed"].includes(ticket.status)
    ).length;

    const wonOpportunities = leads.filter((lead) => lead.status === "won").length;

    const pipelineValue = leads.reduce(
      (sum, lead) => sum + getOpportunityDisplayValue(lead),
      0
    );

    const proposalSentCount = leads.filter(
      (lead) => lead.proposalStatus === "sent" || lead.status === "proposal_sent"
    ).length;

    const portalAdmins = portalUsers.filter(
      (portalUser) => portalUser.clientPortalRole === "admin"
    ).length;

    return {
      contacts: contacts.length,
      opportunities: leads.length,
      tickets: tickets.length,
      portalUsers: portalUsers.length,
      portalAdmins,
      openTickets,
      urgentTickets,
      wonOpportunities,
      pipelineValue,
      proposalSentCount,
    };
  }, [client]);

  const health = useMemo(() => getAccountHealth(client), [client]);

  const recentActivity = useMemo(() => {
    if (!client) return [];

    const items = [];

    for (const ticket of client.tickets || []) {
      items.push({
        id: `ticket-${ticket.id}`,
        type: "Ticket",
        title: ticket.title || `Ticket #${ticket.id}`,
        meta: `${prettyTicketStatus(ticket.status)} • ${prettyTicketPriority(
          ticket.priority
        )}`,
        date: ticket.createdAt,
        href: `/tickets/${ticket.id}`,
      });
    }

    if (!clientView) {
      for (const contact of client.contacts || []) {
        items.push({
          id: `contact-${contact.id}`,
          type: "Contact added",
          title: contact.fullName || "Contact",
          meta: contact.role || contact.email || "Client contact",
          date: contact.createdAt,
          href: null,
        });
      }

      for (const lead of client.leads || []) {
        items.push({
          id: `lead-${lead.id}`,
          type: "Opportunity",
          title: lead.title || `Lead #${lead.id}`,
          meta: `${prettyOpportunityStatus(lead.status)} • ${prettySource(
            lead.source
          )}`,
          date: lead.createdAt,
          href: `/leads/${lead.id}`,
        });
      }
    }

    return items
      .filter((item) => item.date)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 8);
  }, [client, clientView]);

  return (
    <div className="w-full p-3 text-white sm:p-4 lg:p-5">
      <div className="mx-auto max-w-[1650px]">
        <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-4 shadow-[0_18px_50px_rgba(0,0,0,0.24)] sm:px-5 sm:py-5">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.07),transparent_30%)]" />

          <div className="relative z-10 flex flex-col gap-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                <div className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[9px] uppercase tracking-[0.16em] text-slate-300">
                  {clientView ? "My account" : "Client account"}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-[24px] font-semibold tracking-[-0.05em] text-white sm:text-[28px]">
                    {loading ? "Loading..." : client?.companyName || "Client"}
                  </h1>

                  {!loading && client ? (
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-medium ${statusClasses(
                        client.status
                      )}`}
                    >
                      {prettyStatus(client.status)}
                    </span>
                  ) : null}
                </div>

                <p className="mt-2 max-w-3xl text-[11px] leading-5 text-slate-400 sm:text-[12px]">
                  {clientView
                    ? "View your account summary, current service details and support activity."
                    : "Account profile, delivery context, commercial activity and operational workload for a single client."}
                </p>

                {!loading && client ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <HeaderChip
                      label="Primary service"
                      value={prettyService(client.primaryService)}
                    />
                    <HeaderChip
                      label="Package"
                      value={client.packageName || "Not assigned"}
                    />
                    <HeaderChip
                      label="Primary contact"
                      value={client.contactName || "Not assigned"}
                    />
                    <HeaderChip
                      label="City"
                      value={client.city || "Not set"}
                    />
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => navigate(-1)}
                  className="h-9 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-[12px] text-white transition hover:bg-white/[0.06]"
                >
                  Back
                </button>

                <Link
                  to={clientView ? "/" : "/clients"}
                  className="h-9 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-[12px] leading-9 text-white transition hover:bg-white/[0.06]"
                >
                  {clientView ? "Dashboard" : "All clients"}
                </Link>

                {!loading && client ? (
                  <>
                    <button
                      onClick={() => loadClient(true)}
                      disabled={refreshing}
                      className="h-9 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-[12px] text-white transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {refreshing ? "Refreshing..." : "Refresh"}
                    </button>

                    {!clientView ? (
                      <>
                        <button
                          onClick={() => {
                            clearMessages();
                            setAddingContact(false);
                            setAddingOpportunity(false);
                            setAddingTicket((prev) => !prev);
                          }}
                          className="h-9 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-[12px] text-white transition hover:bg-white/[0.06]"
                        >
                          {addingTicket ? "Close ticket form" : "Add ticket"}
                        </button>

                         <button
                          onClick={handleDeleteClient}
                          disabled={deletingClient}
                          className="h-9 rounded-xl border border-red-500/20 bg-red-500/10 px-4 text-[12px] font-medium text-red-200 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-70"
                         >
                          {deletingClient ? "Deleting..." : "Delete client"}
                         </button>

                        {!editing ? (
                          <button
                            onClick={() => {
                              clearMessages();
                              setEditing(true);
                            }}
                            className="h-9 rounded-xl border border-white/10 bg-white px-4 text-[12px] font-semibold text-slate-900 transition hover:bg-slate-100"
                          >
                            Edit client
                          </button>
                        ) : null}
                      </>
                    ) : null}
                  </>
                ) : null}
              </div>
            </div>

            {!loading && client ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {clientView ? (
                  <>
                    <HeroStat
                      label="Open tickets"
                      value={String(metrics.openTickets)}
                      hint={
                        metrics.urgentTickets > 0
                          ? `${metrics.urgentTickets} urgent`
                          : "Current support workload"
                      }
                    />
                    <HeroStat
                      label="Total tickets"
                      value={String(metrics.tickets)}
                      hint="All support requests"
                    />
                    <HeroStat
                      label="Primary service"
                      value={prettyService(client.primaryService)}
                      hint="Current delivery scope"
                    />
                    <HeroStat
                      label="Package"
                      value={client.packageName || "—"}
                      hint="Current service plan"
                    />
                  </>
                ) : (
                  <>
                    <HeroStat
                      label="Portal users"
                      value={String(metrics.portalUsers)}
                      hint={`${metrics.portalAdmins} admin`}
                    />
                    <HeroStat
                      label="Open tickets"
                      value={String(metrics.openTickets)}
                      hint={
                        metrics.urgentTickets > 0
                          ? `${metrics.urgentTickets} urgent`
                          : "Operational workload"
                      }
                    />
                    <HeroStat
                      label="Opportunities"
                      value={String(metrics.opportunities)}
                      hint={`${metrics.wonOpportunities} won`}
                    />
                    <HeroStat
                      label="Pipeline value"
                      value={formatCurrency(metrics.pipelineValue)}
                      hint="Estimated / proposal value"
                    />
                  </>
                )}
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
          <div className="mt-4 rounded-[20px] border border-white/8 bg-slate-900/70 p-5 text-[12px] text-slate-300 shadow-[0_10px_32px_rgba(0,0,0,0.18)]">
            Loading client data...
          </div>
        ) : client && form ? (
          <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="grid gap-4">
              <SectionCard>
                {!editing || clientView ? (
                  <>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h2 className="text-[16px] font-semibold text-white sm:text-[18px]">
                          {clientView ? "Account overview" : "Account profile"}
                        </h2>
                        <p className="mt-1 text-[11px] leading-5 text-slate-400 sm:text-[12px]">
                          {clientView
                            ? "Main company, contact and delivery details for your account."
                            : "Core company, contact and service information used across the account."}
                        </p>
                      </div>

                      <div className="text-[11px] text-slate-500">
                        Client #{client.id}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      <InfoCard
                        label="Primary service"
                        value={prettyService(client.primaryService)}
                      />
                      <InfoCard label="Package" value={client.packageName || "—"} />
                      <InfoCard label="City" value={client.city || "—"} />
                      <InfoCard label="Email" value={client.email || "—"} />
                      <InfoCard label="Phone" value={client.phone || "—"} />
                      <InfoCard label="Website" value={client.website || "—"} />
                    </div>
                  </>
                ) : (
                  <form onSubmit={handleSave} className="grid gap-3">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h2 className="text-[16px] font-semibold text-white sm:text-[18px]">
                          Edit account profile
                        </h2>
                        <p className="mt-1 text-[11px] leading-5 text-slate-400 sm:text-[12px]">
                          Update primary company and delivery information.
                        </p>
                      </div>
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
                        <label className={labelClass}>Website</label>
                        <input
                          name="website"
                          value={form.website}
                          onChange={handleChange}
                          className={inputClass}
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
                      />
                    </div>

                    <div className="grid gap-1.5">
                      <label className={labelClass}>Notes</label>
                      <textarea
                        name="notes"
                        value={form.notes}
                        onChange={handleChange}
                        rows={5}
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
              </SectionCard>

              {!clientView ? (
                <SectionCard>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-[15px] font-semibold sm:text-[16px]">
                        Contacts
                      </h3>
                      <p className="mt-1 text-[11px] leading-5 text-slate-400 sm:text-[12px]">
                        People inside the client organization: owner, billing,
                        operations and technical contacts.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        clearMessages();
                        setAddingContact((prev) => !prev);
                        setEditingContactId(null);
                      }}
                      className="h-9 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-[12px] text-white transition hover:bg-white/[0.06]"
                    >
                      {addingContact ? "Close" : "Add contact"}
                    </button>
                  </div>

                  {addingContact ? (
                    <form
                      onSubmit={handleAddContact}
                      className="mt-4 grid gap-3 rounded-2xl border border-white/8 bg-slate-950/40 p-4"
                    >
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="grid gap-1.5">
                          <label className={labelClass}>Full name</label>
                          <input
                            name="fullName"
                            value={contactForm.fullName}
                            onChange={handleContactChange}
                            className={inputClass}
                            placeholder="Marko Markovic"
                          />
                        </div>

                        <div className="grid gap-1.5">
                          <label className={labelClass}>Role</label>
                          <input
                            name="role"
                            value={contactForm.role}
                            onChange={handleContactChange}
                            className={inputClass}
                            placeholder="Owner / Billing / Technical"
                          />
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="grid gap-1.5">
                          <label className={labelClass}>Email</label>
                          <input
                            name="email"
                            value={contactForm.email}
                            onChange={handleContactChange}
                            className={inputClass}
                            placeholder="contact@company.com"
                          />
                        </div>

                        <div className="grid gap-1.5">
                          <label className={labelClass}>Phone</label>
                          <input
                            name="phone"
                            value={contactForm.phone}
                            onChange={handleContactChange}
                            className={inputClass}
                            placeholder="+381..."
                          />
                        </div>
                      </div>

                      <div className="grid gap-1.5">
                        <label className={labelClass}>Notes</label>
                        <textarea
                          name="notes"
                          value={contactForm.notes}
                          onChange={handleContactChange}
                          rows={3}
                          className={textareaClass}
                          placeholder="Best time to call, communication preference, responsibility..."
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="submit"
                          disabled={savingContact}
                          className="h-9 rounded-xl border border-white/10 bg-white px-4 text-[12px] font-semibold text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {savingContact ? "Saving..." : "Create contact"}
                        </button>

                        <button
                          type="button"
                          onClick={resetContactAddForm}
                          className="h-9 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-[12px] text-white transition hover:bg-white/[0.06]"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : null}

                  {client.contacts?.length ? (
                    <div className="mt-4 grid gap-3">
                      {client.contacts.map((contact) => (
                        <div
                          key={contact.id}
                          className="rounded-2xl border border-white/8 bg-slate-950/40 p-4"
                        >
                          {editingContactId === contact.id ? (
                            <form
                              onSubmit={(e) => handleUpdateContact(e, contact.id)}
                              className="grid gap-3"
                            >
                              <div className="grid gap-3 md:grid-cols-2">
                                <div className="grid gap-1.5">
                                  <label className={labelClass}>Full name</label>
                                  <input
                                    name="fullName"
                                    value={editingContactForm.fullName}
                                    onChange={handleEditingContactChange}
                                    className={inputClass}
                                  />
                                </div>

                                <div className="grid gap-1.5">
                                  <label className={labelClass}>Role</label>
                                  <input
                                    name="role"
                                    value={editingContactForm.role}
                                    onChange={handleEditingContactChange}
                                    className={inputClass}
                                  />
                                </div>
                              </div>

                              <div className="grid gap-3 md:grid-cols-2">
                                <div className="grid gap-1.5">
                                  <label className={labelClass}>Email</label>
                                  <input
                                    name="email"
                                    value={editingContactForm.email}
                                    onChange={handleEditingContactChange}
                                    className={inputClass}
                                  />
                                </div>

                                <div className="grid gap-1.5">
                                  <label className={labelClass}>Phone</label>
                                  <input
                                    name="phone"
                                    value={editingContactForm.phone}
                                    onChange={handleEditingContactChange}
                                    className={inputClass}
                                  />
                                </div>
                              </div>

                              <div className="grid gap-1.5">
                                <label className={labelClass}>Notes</label>
                                <textarea
                                  name="notes"
                                  value={editingContactForm.notes}
                                  onChange={handleEditingContactChange}
                                  rows={3}
                                  className={textareaClass}
                                />
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="submit"
                                  disabled={savingContact}
                                  className="h-9 rounded-xl border border-white/10 bg-white px-4 text-[12px] font-semibold text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                  {savingContact ? "Saving..." : "Save contact"}
                                </button>

                                <button
                                  type="button"
                                  onClick={cancelEditContact}
                                  className="h-9 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-[12px] text-white transition hover:bg-white/[0.06]"
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          ) : (
                            <>
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="truncate text-[14px] font-semibold text-white">
                                    {contact.fullName}
                                  </div>
                                  <div className="mt-1 text-[11px] text-slate-400">
                                    {contact.role || "No role"}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => startEditContact(contact)}
                                    className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium text-white transition hover:bg-white/[0.08]"
                                  >
                                    Edit
                                  </button>

                                  <button
                                    onClick={() => handleDeleteContact(contact.id)}
                                    disabled={deletingContactId === contact.id}
                                    className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-[11px] font-medium text-red-200 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    {deletingContactId === contact.id
                                      ? "Deleting..."
                                      : "Delete"}
                                  </button>
                                </div>
                              </div>

                              <div className="mt-3 grid gap-2 md:grid-cols-3">
                                <MiniInfo label="Email" value={contact.email || "—"} />
                                <MiniInfo label="Phone" value={contact.phone || "—"} />
                                <MiniInfo
                                  label="Created"
                                  value={formatDate(contact.createdAt)}
                                />
                              </div>

                              <div className="mt-3 rounded-xl border border-white/6 bg-black/10 p-3">
                                <div className="text-[10px] uppercase tracking-[0.08em] text-slate-500">
                                  Notes
                                </div>
                                <div className="mt-1 text-[12px] leading-6 text-slate-300">
                                  {contact.notes || "No notes"}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState text="No contacts added yet." />
                  )}
                </SectionCard>
              ) : null}

              {!clientView ? (
                <SectionCard>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-[15px] font-semibold sm:text-[16px]">
                        Portal users
                      </h3>
                      <p className="mt-1 text-[11px] leading-5 text-slate-400 sm:text-[12px]">
                        Users linked to this client account. As a system admin, you can define
                        who is a client portal admin and who is a member.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        clearMessages();
                        setAddingPortalUser((prev) => !prev);
                        setAddingContact(false);
                        setAddingOpportunity(false);
                        setAddingTicket(false);
                      }}
                      className="h-9 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-[12px] text-white transition hover:bg-white/[0.06]"
                    >
                      {addingPortalUser ? "Close" : "Add portal user"}
                    </button>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <MiniInfo label="Total users" value={String(metrics.portalUsers)} />
                    <MiniInfo label="Portal admins" value={String(metrics.portalAdmins)} />
                    <MiniInfo
                      label="Members"
                      value={String(Math.max(metrics.portalUsers - metrics.portalAdmins, 0))}
                    />
                    <MiniInfo
                      label="Primary admin"
                      value={
                        (client.users || []).find(
                          (portalUser) => portalUser.clientPortalRole === "admin"
                        )?.name || "Not assigned"
                      }
                    />
                  </div>

                  {addingPortalUser ? (
                    <form
                      onSubmit={handleAddPortalUser}
                      className="mt-4 grid gap-3 rounded-2xl border border-white/8 bg-slate-950/40 p-4"
                    >
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="grid gap-1.5">
                          <label className={labelClass}>Full name</label>
                          <input
                            name="name"
                            value={portalUserForm.name}
                            onChange={handlePortalUserChange}
                            className={inputClass}
                            placeholder="Marko Markovic"
                          />
                        </div>

                        <div className="grid gap-1.5">
                          <label className={labelClass}>Email</label>
                          <input
                            name="email"
                            type="email"
                            value={portalUserForm.email}
                            onChange={handlePortalUserChange}
                            className={inputClass}
                            placeholder="marko@client.com"
                          />
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="grid gap-1.5">
                          <label className={labelClass}>Temporary password</label>
                          <input
                            name="password"
                            type="text"
                            value={portalUserForm.password}
                            onChange={handlePortalUserChange}
                            className={inputClass}
                            placeholder="Temp1234!"
                          />
                        </div>

                        <div className="grid gap-1.5">
                          <label className={labelClass}>Portal role</label>
                          <select
                            name="clientPortalRole"
                            value={portalUserForm.clientPortalRole}
                            onChange={handlePortalUserChange}
                            className={inputClass}
                          >
                            <option value="member" className="bg-slate-900">
                              Member
                            </option>
                            <option value="admin" className="bg-slate-900">
                              Admin
                            </option>
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="submit"
                          disabled={savingPortalUser}
                          className="h-9 rounded-xl border border-white/10 bg-white px-4 text-[12px] font-semibold text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {savingPortalUser ? "Saving..." : "Create portal user"}
                        </button>

                        <button
                          type="button"
                          onClick={resetPortalUserForm}
                          className="h-9 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-[12px] text-white transition hover:bg-white/[0.06]"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : null}

                  {client.users?.length ? (
                    <>
                      <div className="mt-4 hidden overflow-hidden rounded-2xl border border-white/8 xl:block">
                        <div className="grid grid-cols-[minmax(200px,1fr)_minmax(220px,1fr)_110px_120px_150px_160px] gap-3 bg-white/[0.03] px-4 py-3 text-[10px] uppercase tracking-[0.08em] text-slate-500">
                          <div>Name</div>
                          <div>Email</div>
                          <div>Role</div>
                          <div>Portal role</div>
                          <div>Created</div>
                          <div>Actions</div>
                        </div>

                        <div className="divide-y divide-white/6">
                          {(client.users || []).map((portalUser) => {
                            const isBusy = changingPortalUserId === portalUser.id;

                            return (
                              <div
                                key={portalUser.id}
                                className="grid grid-cols-[minmax(200px,1fr)_minmax(220px,1fr)_110px_120px_150px_160px] gap-3 px-4 py-3"
                              >
                                <div className="min-w-0">
                                  <div className="truncate text-[12px] font-medium text-white">
                                    {portalUser.name || "Unnamed user"}
                                  </div>
                                </div>

                                <div className="min-w-0 text-[12px] text-slate-300">
                                  {portalUser.email || "—"}
                                </div>

                                <div className="text-[12px] text-slate-300">
                                  {portalUser.role || "—"}
                                </div>

                                <div>
                                  <span
                                    className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                                      portalUser.clientPortalRole === "admin"
                                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                                        : "border-slate-500/20 bg-slate-500/10 text-slate-300"
                                    }`}
                                  >
                                    {prettyPortalRole(portalUser.clientPortalRole)}
                                  </span>
                                </div>

                                <div className="text-[12px] text-slate-300">
                                  {formatDate(portalUser.createdAt)}
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() =>
                                      handlePortalRoleChange(
                                        portalUser.id,
                                        portalUser.clientPortalRole === "admin" ? "member" : "admin"
                                      )
                                    }
                                    disabled={isBusy}
                                    className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium text-white transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    {isBusy
                                      ? "Saving..."
                                      : portalUser.clientPortalRole === "admin"
                                      ? "Set member"
                                      : "Set admin"}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 xl:hidden">
                        {(client.users || []).map((portalUser) => {
                          const isBusy = changingPortalUserId === portalUser.id;

                          return (
                            <div
                              key={portalUser.id}
                              className="rounded-2xl border border-white/8 bg-slate-950/40 p-4"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="truncate text-[13px] font-semibold text-white">
                                    {portalUser.name || "Unnamed user"}
                                  </div>
                                  <div className="mt-1 text-[11px] text-slate-500">
                                    {portalUser.email || "—"}
                                  </div>
                                </div>

                                <span
                                  className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-medium ${
                                    portalUser.clientPortalRole === "admin"
                                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                                      : "border-slate-500/20 bg-slate-500/10 text-slate-300"
                                  }`}
                                >
                                  {prettyPortalRole(portalUser.clientPortalRole)}
                                </span>
                              </div>

                              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                                <MiniInfo label="System role" value={portalUser.role || "—"} />
                                <MiniInfo
                                  label="Portal role"
                                  value={prettyPortalRole(portalUser.clientPortalRole)}
                                />
                                <MiniInfo label="Created" value={formatDate(portalUser.createdAt)} />
                              </div>

                              <div className="mt-3 flex items-center gap-2">
                                <button
                                  onClick={() =>
                                    handlePortalRoleChange(
                                      portalUser.id,
                                      portalUser.clientPortalRole === "admin" ? "member" : "admin"
                                    )
                                  }
                                  disabled={isBusy}
                                  className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium text-white transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {isBusy
                                    ? "Saving..."
                                    : portalUser.clientPortalRole === "admin"
                                    ? "Set member"
                                    : "Set admin"}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <EmptyState text="No portal users linked to this client yet." />
                  )}
                </SectionCard>
              ) : null}


              <SectionCard>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-[15px] font-semibold sm:text-[16px]">
                      {clientView ? "My tickets" : "Tickets"}
                    </h3>
                    <p className="mt-1 text-[11px] leading-5 text-slate-400 sm:text-[12px]">
                      {clientView
                        ? "Support requests and current delivery activity linked to your account."
                        : "Operational requests, support tasks and delivery work linked to this client."}
                    </p>
                  </div>

                  {!clientView ? (
                    <button
                      onClick={() => {
                        clearMessages();
                        setAddingTicket((prev) => !prev);
                      }}
                      className="h-9 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-[12px] text-white transition hover:bg-white/[0.06]"
                    >
                      {addingTicket ? "Close" : "Add ticket"}
                    </button>
                  ) : null}
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <MiniInfo label="Total tickets" value={String(metrics.tickets)} />
                  <MiniInfo label="Open" value={String(metrics.openTickets)} />
                  <MiniInfo label="Urgent" value={String(metrics.urgentTickets)} />
                  <MiniInfo
                    label="Service state"
                    value={
                      metrics.openTickets > 0
                        ? "Active workload"
                        : "No open workload"
                    }
                  />
                </div>

                {!clientView && addingTicket ? (
                  <form
                    onSubmit={handleAddTicket}
                    className="mt-4 grid gap-3 rounded-2xl border border-white/8 bg-slate-950/40 p-4"
                  >
                    <div className="grid gap-1.5">
                      <label className={labelClass}>Contact</label>
                      <select
                        name="contactId"
                        value={ticketForm.contactId}
                        onChange={handleTicketChange}
                        className={inputClass}
                      >
                        <option value="" className="bg-slate-900">
                          Optional contact
                        </option>
                        {(client.contacts || []).map((contact) => (
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
                        value={ticketForm.title}
                        onChange={handleTicketChange}
                        className={inputClass}
                        placeholder="Homepage content update"
                      />
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="grid gap-1.5">
                        <label className={labelClass}>Status</label>
                        <select
                          name="status"
                          value={ticketForm.status}
                          onChange={handleTicketChange}
                          className={inputClass}
                        >
                          {ticketStatusOptions.map((item) => (
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
                          value={ticketForm.priority}
                          onChange={handleTicketChange}
                          className={inputClass}
                        >
                          {ticketPriorityOptions.map((item) => (
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
                        value={ticketForm.description}
                        onChange={handleTicketChange}
                        rows={4}
                        className={textareaClass}
                        placeholder="Describe the request, issue or task..."
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="submit"
                        disabled={savingTicket}
                        className="h-9 rounded-xl border border-white/10 bg-white px-4 text-[12px] font-semibold text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {savingTicket ? "Saving..." : "Create ticket"}
                      </button>

                      <button
                        type="button"
                        onClick={resetTicketForm}
                        className="h-9 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-[12px] text-white transition hover:bg-white/[0.06]"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : null}

                {client.tickets?.length ? (
                  <>
                    <div className="mt-4 hidden overflow-hidden rounded-2xl border border-white/8 xl:block">
                      <div className="grid grid-cols-[minmax(220px,1.25fr)_minmax(150px,0.9fr)_minmax(120px,0.7fr)_minmax(120px,0.7fr)_120px_120px] gap-3 bg-white/[0.03] px-4 py-3 text-[10px] uppercase tracking-[0.08em] text-slate-500">
                        <div>Ticket</div>
                        <div>Contact</div>
                        <div>Status</div>
                        <div>Priority</div>
                        <div>Created</div>
                        <div>Open</div>
                      </div>

                      <div className="divide-y divide-white/6">
                        {client.tickets.map((ticket) => (
                          <div
                            key={ticket.id}
                            className="grid grid-cols-[minmax(220px,1.25fr)_minmax(150px,0.9fr)_minmax(120px,0.7fr)_minmax(120px,0.7fr)_120px_120px] gap-3 px-4 py-3"
                          >
                            <div className="min-w-0">
                              <Link
                                to={`/tickets/${ticket.id}`}
                                className="truncate text-[12px] font-medium text-white transition hover:text-indigo-300 hover:underline"
                              >
                                {ticket.title}
                              </Link>
                              <div className="mt-1 truncate text-[10px] text-slate-500">
                                {ticket.description || "No description"}
                              </div>
                            </div>

                            <div className="min-w-0 text-[12px] text-slate-300">
                              {ticket.contact?.fullName || "No contact"}
                            </div>

                            <div>
                              <span
                                className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${ticketStatusClasses(
                                  ticket.status
                                )}`}
                              >
                                {prettyTicketStatus(ticket.status)}
                              </span>
                            </div>

                            <div>
                              <span
                                className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${ticketPriorityClasses(
                                  ticket.priority
                                )}`}
                              >
                                {prettyTicketPriority(ticket.priority)}
                              </span>
                            </div>

                            <div className="text-[12px] text-slate-300">
                              {formatDate(ticket.createdAt)}
                            </div>

                            <div className="text-[12px] text-slate-300">
                              {ticket.status === "resolved" || ticket.status === "closed"
                                ? "No"
                                : "Yes"}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 xl:hidden">
                      {client.tickets.map((ticket) => (
                        <div
                          key={ticket.id}
                          className="rounded-2xl border border-white/8 bg-slate-950/40 p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <Link
                                to={`/tickets/${ticket.id}`}
                                className="truncate text-[13px] font-semibold text-white transition hover:text-indigo-300 hover:underline"
                              >
                                {ticket.title}
                              </Link>
                              <div className="mt-1 text-[11px] text-slate-500">
                                {ticket.contact?.fullName || "No contact"}
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                              <span
                                className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-medium ${ticketStatusClasses(
                                  ticket.status
                                )}`}
                              >
                                {prettyTicketStatus(ticket.status)}
                              </span>
                              <span
                                className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-medium ${ticketPriorityClasses(
                                  ticket.priority
                                )}`}
                              >
                                {prettyTicketPriority(ticket.priority)}
                              </span>
                            </div>
                          </div>

                          <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            <MiniInfo label="Created" value={formatDate(ticket.createdAt)} />
                            <MiniInfo
                              label="Contact"
                              value={ticket.contact?.fullName || "No contact"}
                            />
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
                      ))}
                    </div>
                  </>
                ) : (
                  <EmptyState text="No tickets linked yet." />
                )}
              </SectionCard>

              {!clientView ? (
                <SectionCard>
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
                            {opportunitySourceOptions.map((item) => (
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
                        <div className="grid grid-cols-[minmax(220px,1.2fr)_120px_120px_1fr_120px] gap-3 bg-white/[0.03] px-4 py-3 text-[10px] uppercase tracking-[0.08em] text-slate-500">
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
                                    className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${opportunityStatusClasses(
                                      lead.status
                                    )}`}
                                  >
                                    {prettyOpportunityStatus(lead.status)}
                                  </span>
                                  <span className="text-[10px] text-slate-500">
                                    {lead.contactName || "—"}
                                  </span>
                                </div>
                              </div>

                              <div className="text-[12px] text-slate-300">
                                {prettySource(lead.source)}
                              </div>

                              <div className="text-[12px] text-slate-300">
                                {formatDate(lead.convertedAt)}
                              </div>

                              <div className="min-w-0">
                                <div className="text-[12px] text-slate-200">
                                  {prettyProposalStatus(lead.proposalStatus)}
                                </div>
                                <div className="mt-1 truncate text-[10px] text-slate-500">
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
                                <div className="mt-1 text-[11px] text-slate-500">
                                  {lead.contactName || "—"}
                                </div>
                              </div>

                              <span
                                className={`shrink-0 inline-flex rounded-full border px-2.5 py-1 text-[10px] font-medium ${opportunityStatusClasses(
                                  lead.status
                                )}`}
                              >
                                {prettyOpportunityStatus(lead.status)}
                              </span>
                            </div>

                            <div className="mt-3 grid gap-2 sm:grid-cols-2">
                              <MiniInfo label="Source" value={prettySource(lead.source)} />
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

                            <div className="mt-3 rounded-xl border border-white/6 bg-black/10 p-3">
                              <div className="text-[10px] uppercase tracking-[0.08em] text-slate-500">
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
                </SectionCard>
              ) : null}
            </div>

            <div className="grid gap-4">
              <SectionCard compact>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-[14px] font-semibold sm:text-[15px]">
                      Account health
                    </h3>
                    <p className="mt-1 text-[11px] leading-5 text-slate-400">
                      Quick account-readiness signal based on status and open
                      operational work.
                    </p>
                  </div>

                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-medium ${healthClasses(
                      health.tone
                    )}`}
                  >
                    {health.label}
                  </span>
                </div>

                <p className="mt-4 text-[12px] leading-6 text-slate-300">
                  {health.note}
                </p>

                <div className="mt-4 grid gap-2">
                  <MiniStat
                    label="Open tickets"
                    value={String(metrics.openTickets)}
                    hint="Operational queue"
                  />
                  <MiniStat
                    label="Urgent tickets"
                    value={String(metrics.urgentTickets)}
                    hint="Immediate attention"
                  />
                </div>
              </SectionCard>

              <SectionCard compact>
                <h3 className="text-[14px] font-semibold sm:text-[15px]">
                  Delivery summary
                </h3>

                <div className="mt-3 grid gap-2">
                  <MiniInfo
                    label="Primary service"
                    value={prettyService(client.primaryService)}
                  />
                  <MiniInfo
                    label="Package"
                    value={client.packageName || "Not defined"}
                  />
                  <MiniInfo
                    label="Status"
                    value={prettyStatus(client.status)}
                  />
                  <MiniInfo
                    label="Primary contact"
                    value={client.contactName || "Not assigned"}
                  />
                </div>

                <div className="mt-4 rounded-xl border border-white/6 bg-slate-950/40 p-3">
                  <div className="text-[10px] uppercase tracking-[0.08em] text-slate-500">
                    Current account summary
                  </div>
                  <div className="mt-2 text-[12px] leading-6 text-slate-300">
                    {client.primaryService ? (
                      <>
                        This account is currently tracked under{" "}
                        <span className="font-medium text-white">
                          {prettyService(client.primaryService)}
                        </span>
                        {client.packageName ? (
                          <>
                            {" "}
                            with the{" "}
                            <span className="font-medium text-white">
                              {client.packageName}
                            </span>{" "}
                            package.
                          </>
                        ) : (
                          <> with no package assigned yet.</>
                        )}
                      </>
                    ) : (
                      "No primary service has been assigned yet."
                    )}
                  </div>
                </div>
              </SectionCard>

              <SectionCard compact>
                <h3 className="text-[14px] font-semibold sm:text-[15px]">
                  Recent activity
                </h3>

                {recentActivity.length ? (
                  <div className="mt-3 space-y-2">
                    {recentActivity.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-white/6 bg-slate-950/40 p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-[10px] uppercase tracking-[0.08em] text-slate-500">
                              {item.type}
                            </div>

                            {item.href ? (
                              <Link
                                to={item.href}
                                className="mt-1 block truncate text-[12px] font-medium text-white transition hover:text-indigo-300 hover:underline"
                              >
                                {item.title}
                              </Link>
                            ) : (
                              <div className="mt-1 truncate text-[12px] font-medium text-white">
                                {item.title}
                              </div>
                            )}

                            <div className="mt-1 text-[11px] text-slate-400">
                              {item.meta}
                            </div>
                          </div>

                          <div className="shrink-0 text-[10px] text-slate-500">
                            {formatDate(item.date)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 rounded-xl border border-white/6 bg-slate-950/40 p-3 text-[12px] text-slate-400">
                    No recent activity yet.
                  </div>
                )}
              </SectionCard>

              <SectionCard compact>
                <h3 className="text-[14px] font-semibold sm:text-[15px]">
                  Account notes
                </h3>

                <div className="mt-3 rounded-xl border border-white/6 bg-slate-950/40 p-3">
                  <div className="text-[10px] uppercase tracking-[0.08em] text-slate-500">
                    {clientView ? "Account notes" : "Internal notes"}
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-[12px] leading-6 text-slate-300">
                    {client.notes || "No notes added yet."}
                  </p>
                </div>
              </SectionCard>

              <SectionCard compact>
                <h3 className="text-[14px] font-semibold sm:text-[15px]">
                  Quick overview
                </h3>

                <div className="mt-3 grid gap-2">
                  {!clientView ? (
                    <>
                      <MiniStat
                        label="Contacts"
                        value={String(metrics.contacts)}
                        hint="People in this client account"
                      />
                      <MiniStat
                        label="Opportunities"
                        value={String(metrics.opportunities)}
                        hint="Linked commercial items"
                      />
                    </>
                  ) : null}
                  <MiniStat
                    label="Tickets"
                    value={String(metrics.tickets)}
                    hint="Operational requests"
                  />
                  <MiniStat
                    label="Open tickets"
                    value={String(metrics.openTickets)}
                    hint="Current support workload"
                  />
                </div>
              </SectionCard>

              {!clientView ? (
                <SectionCard compact>
                  <h3 className="text-[14px] font-semibold sm:text-[15px]">
                    Commercial pulse
                  </h3>

                  <div className="mt-3 grid gap-2">
                    <MiniStat
                      label="Won opportunities"
                      value={String(metrics.wonOpportunities)}
                      hint="Converted commercial items"
                    />
                    <MiniStat
                      label="Proposals sent"
                      value={String(metrics.proposalSentCount)}
                      hint="Awaiting response / follow-up"
                    />
                    <MiniStat
                      label="Pipeline"
                      value={formatCurrency(metrics.pipelineValue)}
                      hint="Tracked estimated value"
                    />
                  </div>
                </SectionCard>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SectionCard({ children, compact = false }) {
  return (
    <div
      className={`rounded-[20px] border border-white/8 bg-slate-900/70 shadow-[0_10px_32px_rgba(0,0,0,0.18)] backdrop-blur-sm ${
        compact ? "p-4" : "p-4 sm:p-5"
      }`}
    >
      {children}
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="mt-4 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-4 text-[12px] text-slate-400">
      {text}
    </div>
  );
}

function InfoCard({ label, value }) {
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

function HeaderChip({ label, value }) {
  return (
    <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] text-slate-300">
      <span className="text-slate-500">{label}:</span>{" "}
      <span className="text-white">{value}</span>
    </div>
  );
}

function MiniInfo({ label, value }) {
  return (
    <div className="rounded-xl border border-white/6 bg-slate-950/40 p-3">
      <div className="text-[10px] uppercase tracking-[0.08em] text-slate-500">
        {label}
      </div>
      <div className="mt-1 break-words text-[12px] text-slate-200">{value}</div>
    </div>
  );
}

function MiniStat({ label, value, hint }) {
  return (
    <div className="rounded-xl border border-white/6 bg-slate-950/40 p-3">
      <div className="text-[11px] text-slate-400">{label}</div>
      <div className="mt-1 text-[18px] font-semibold leading-none text-white">
        {value}
      </div>
      <div className="mt-1 text-[10px] text-slate-500">{hint}</div>
    </div>
  );
}