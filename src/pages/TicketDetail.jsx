import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiFetch, apiUrl } from "../lib/api";
import {
  prettyTicketCategory,
  prettyTicketPriority,
  prettyTicketStatus,
  ticketCategoryOptions,
  ticketPriorityClasses,
  ticketPriorityOptions,
  ticketStatusClasses,
  ticketStatusOptions,
  toneClasses,
} from "../lib/domain";
import { EmptyState, HeaderChip, HeroStat, MiniInfo, MiniStat, Panel } from "../components/ui";
import { isAdmin, isClient } from "../lib/roles";
import { formatDate, formatDateTime } from "../lib/format";
import { useAutoDismiss } from "../hooks/useAutoDismiss";

function supportHealth(ticket) {
  if (!ticket) {
    return {
      label: "—",
      tone: "default",
      note: "No ticket loaded.",
    };
  }

  if (ticket.status === "closed") {
    return {
      label: "Closed",
      tone: "slate",
      note: "This ticket is closed and no longer active.",
    };
  }

  if (ticket.status === "resolved") {
    return {
      label: "Resolved",
      tone: "emerald",
      note: "The issue is resolved and awaiting closure if needed.",
    };
  }

  if (ticket.priority === "urgent") {
    return {
      label: "High attention",
      tone: "rose",
      note: "Urgent priority request that should be actively monitored.",
    };
  }

  if (ticket.status === "waiting_client") {
    return {
      label: "Waiting for your response",
      tone: "amber",
      note: "This request is currently waiting for your reply or confirmation.",
    };
  }

  if (ticket.status === "in_progress") {
    return {
      label: "In progress",
      tone: "sky",
      note: "Work is active and the request is currently being handled.",
    };
  }

  return {
    label: "Open",
    tone: "indigo",
    note: "This request is open and being tracked by support.",
  };
}

function buildTicketForm(data) {
  return {
    title: data.title || "",
    description: data.description || "",
    status: data.status || "new",
    priority: data.priority || "medium",
    category: data.category || "general",
    assignedTo: data.assignedTo || "",
    dueDate: data.dueDate
      ? new Date(data.dueDate).toISOString().slice(0, 10)
      : "",
    contactId: data.contact?.id ? String(data.contact.id) : "",
  };
}

function canManageAttachments(user) {
  return user?.role === "admin" || user?.role === "staff";
}

const inputClass =
  "h-9 w-full rounded-xl border border-white/8 bg-field px-3 text-[12px] text-white outline-none placeholder:text-muted transition focus:border-white/15 focus:bg-field-focus focus:ring-1 focus:ring-white/10";

const textareaClass =
  "w-full rounded-xl border border-white/8 bg-field px-3 py-2.5 text-[12px] text-white outline-none placeholder:text-muted transition focus:border-white/15 focus:bg-field-focus focus:ring-1 focus:ring-white/10";

const labelClass = "text-[11px] font-medium text-slate-300";

const POLL_INTERVAL_MS = 30000;

const initialEmailReplyForm = {
  authorName: "Admin",
  subject: "",
  message: "",
};

export default function TicketDetail({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const clientView = isClient(user);

  const [ticket, setTicket] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [form, setForm] = useState(null);
  const [messageForm, setMessageForm] = useState({
    authorName: clientView ? user?.name || "Client" : "Admin",
    message: "",
    isInternal: clientView ? false : true,
  });
  const [emailReplyForm, setEmailReplyForm] = useState(initialEmailReplyForm);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [sendingEmailReply, setSendingEmailReply] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useAutoDismiss(notice, setNotice);
  const [newActivity, setNewActivity] = useState(0);
  const [deletingTicket, setDeletingTicket] = useState(false);
  const [deletingAttachmentId, setDeletingAttachmentId] = useState(null);
  const messageCountRef = useRef(null);

  const loadTicket = useCallback(
    async (showRefreshState = false) => {
      try {
        if (showRefreshState) setRefreshing(true);
        else setLoading(true);

        setError("");

        const data = await apiFetch(`/api/tickets/${id}`);
        messageCountRef.current = data?.messages?.length || 0;
        setTicket(data);
        setForm(buildTicketForm(data));

        setEmailReplyForm((prev) => ({
          authorName: prev.authorName || "Admin",
          subject: `Re: Ticket #${data.id} - ${data.title}`,
          message: "",
        }));

        if (!clientView && data.client?.id) {
          const client = await apiFetch(`/api/clients/${data.client.id}`);
          setContacts(client.contacts || []);
        } else {
          setContacts([]);
        }
      } catch (err) {
        setError(err.message || "Failed to load ticket");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id, clientView]
  );

  useEffect(() => {
    loadTicket();
  }, [loadTicket]);

  const syncTicket = useCallback(async () => {
    try {
      const data = await apiFetch(`/api/tickets/${id}`);
      const nextCount = data?.messages?.length || 0;
      const previousCount = messageCountRef.current;

      messageCountRef.current = nextCount;

      if (previousCount !== null && nextCount > previousCount) {
        setNewActivity((prev) => prev + (nextCount - previousCount));
      }

      setTicket(data);
    } catch {
      // A failed background poll must not disturb the open ticket view.
    }
  }, [id]);

  useEffect(() => {
    function syncIfVisible() {
      if (document.visibilityState === "visible") {
        syncTicket();
      }
    }

    const interval = window.setInterval(syncIfVisible, POLL_INTERVAL_MS);
    window.addEventListener("focus", syncIfVisible);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", syncIfVisible);
    };
  }, [syncTicket]);

  useEffect(() => {
    setMessageForm((prev) => ({
      ...prev,
      authorName: clientView ? user?.name || "Client" : prev.authorName || "Admin",
      isInternal: clientView ? false : prev.isInternal,
    }));
  }, [clientView, user]);

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

  function handleMessageChange(e) {
    const { name, value, type, checked } = e.target;
    setMessageForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function handleEmailReplyChange(e) {
    const { name, value } = e.target;
    setEmailReplyForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleCancel() {
    if (!ticket) return;

    setForm(buildTicketForm(ticket));
    setEditing(false);
    clearMessages();
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    clearMessages();

    try {
      const updated = await apiFetch(`/api/tickets/${id}`, {
        method: "PATCH",
        body: JSON.stringify(form),
      });

      setTicket(updated);
      setForm(buildTicketForm(updated));
      setEditing(false);
      setNotice("Ticket updated successfully.");
    } catch (err) {
      setError(err.message || "Failed to update ticket");
    } finally {
      setSaving(false);
    }
  }

  async function handleSendMessage(e) {
    e.preventDefault();
    setSendingMessage(true);
    clearMessages();

    try {
      const payload = {
        authorName: clientView
          ? user?.name || user?.email || "Client"
          : messageForm.authorName,
        message: messageForm.message,
        isInternal: clientView ? false : messageForm.isInternal,
      };

      setNewActivity(0);

      const createdMessage = await apiFetch(`/api/tickets/${id}/messages`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setTicket((prev) => ({
        ...prev,
        messages: [...(prev.messages || []), createdMessage],
        firstResponseAt:
          !prev.firstResponseAt && !payload.isInternal
            ? new Date().toISOString()
            : prev.firstResponseAt,
      }));

      setMessageForm((prev) => ({
        ...prev,
        message: "",
        isInternal: clientView ? false : prev.isInternal,
      }));

      setNotice(
        clientView
          ? "Reply sent successfully."
          : payload.isInternal
          ? "Internal note added."
          : "Client-visible message added."
      );
    } catch (err) {
      setError(err.message || "Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  }

  async function handleSendEmailReply(e) {
    e.preventDefault();
    setSendingEmailReply(true);
    clearMessages();

    try {
      const result = await apiFetch(`/api/tickets/${id}/email-reply`, {
        method: "POST",
        body: JSON.stringify(emailReplyForm),
      });

      setTicket((prev) => ({
        ...prev,
        messages: [...(prev.messages || []), result.ticketMessage],
        firstResponseAt: prev.firstResponseAt || new Date().toISOString(),
      }));

      setEmailReplyForm((prev) => ({
        ...prev,
        message: "",
      }));

      setNotice("Email reply sent successfully.");
    } catch (err) {
      setError(err.message || "Failed to send ticket email reply");
    } finally {
      setSendingEmailReply(false);
    }
  }

  async function handleUploadAttachment(e) {
    e.preventDefault();

    if (!attachmentFile) {
      setError("Please select a file first");
      return;
    }

    setUploadingAttachment(true);
    clearMessages();

    try {
      const formData = new FormData();
      formData.append("file", attachmentFile);

      const data = await apiFetch(`/api/tickets/${id}/attachments`, {
        method: "POST",
        body: formData,
      });

      setTicket((prev) => ({
        ...prev,
        attachments: [data, ...(prev.attachments || [])],
      }));

      setAttachmentFile(null);
      setNotice("Attachment uploaded successfully.");
    } catch (err) {
      setError(err.message || "Failed to upload attachment");
    } finally {
      setUploadingAttachment(false);
    }
  }

  async function handleDeleteTicket() {
    const confirmed = window.confirm(
      `Delete ticket #${ticket.id}? Messages and attachments are removed permanently.`
    );

    if (!confirmed) return;

    setDeletingTicket(true);
    clearMessages();

    try {
      await apiFetch(`/api/tickets/${id}`, { method: "DELETE" });

      navigate("/tickets", {
        state: { notice: `Ticket #${ticket.id} deleted successfully.` },
      });
    } catch (err) {
      setError(err.message || "Failed to delete ticket");
      setDeletingTicket(false);
    }
  }

  async function handleDeleteAttachment(attachment) {
    const confirmed = window.confirm(`Delete "${attachment.originalName}"?`);

    if (!confirmed) return;

    setDeletingAttachmentId(attachment.id);
    clearMessages();

    try {
      await apiFetch(`/api/tickets/${id}/attachments/${attachment.id}`, {
        method: "DELETE",
      });

      setTicket((prev) => ({
        ...prev,
        attachments: (prev.attachments || []).filter(
          (item) => item.id !== attachment.id
        ),
      }));

      setNotice("Attachment deleted successfully.");
    } catch (err) {
      setError(err.message || "Failed to delete attachment");
    } finally {
      setDeletingAttachmentId(null);
    }
  }

  const visibleMessages = useMemo(() => {
    if (!ticket?.messages) return [];
    return clientView
      ? ticket.messages.filter((message) => !message.isInternal)
      : ticket.messages;
  }, [ticket, clientView]);

  const health = useMemo(() => supportHealth(ticket), [ticket]);
  const totalMessages = visibleMessages.length;
  const internalMessages =
    ticket?.messages?.filter((message) => message.isInternal).length || 0;
  const clientVisibleMessages =
    ticket?.messages?.filter((message) => !message.isInternal).length || 0;
  const attachmentCount = ticket?.attachments?.length || 0;

  return (
    <div className="w-full p-3 text-white sm:p-4 lg:p-5">
      <div className="mx-auto max-w-[1650px]">
        <div className="relative overflow-hidden rounded-shell border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-4 shadow-[0_18px_50px_rgba(0,0,0,0.24)] sm:px-5 sm:py-5">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.07),transparent_30%)]" />

          <div className="relative z-10 flex flex-col gap-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                <div className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[9px] uppercase tracking-[0.16em] text-slate-300">
                  {clientView ? "My support request" : "Support ticket"}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-[24px] font-semibold tracking-[-0.05em] text-white sm:text-[28px]">
                    {loading ? "Loading..." : ticket?.title || "Ticket"}
                  </h1>

                  {!loading && ticket ? (
                    <>
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
                    </>
                  ) : null}
                </div>

                <p className="mt-2 max-w-3xl text-[11px] leading-5 text-slate-400 sm:text-[12px]">
                  {clientView
                    ? "Follow ticket progress, reply to support and upload any related files from one place."
                    : "Track progress, update status, coordinate support work and manage client communication from one place."}
                </p>

                {!loading && ticket ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <HeaderChip
                      label="Client"
                      value={ticket.client?.companyName || "No client linked"}
                    />
                    <HeaderChip
                      label="Category"
                      value={prettyTicketCategory(ticket.category)}
                    />
                    {!clientView ? (
                      <HeaderChip
                        label="Assigned to"
                        value={ticket.assignedTo || "Unassigned"}
                      />
                    ) : null}
                    <HeaderChip
                      label="Contact"
                      value={ticket.contact?.fullName || "No contact"}
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
                  to="/tickets"
                  className="h-9 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-[12px] leading-9 text-white transition hover:bg-white/[0.06]"
                >
                  {clientView ? "My tickets" : "All tickets"}
                </Link>

                {!loading && ticket ? (
                  <button
                    onClick={() => {
                      setNewActivity(0);
                      loadTicket(true);
                    }}
                    disabled={refreshing}
                    className="relative h-9 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-[12px] text-white transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {refreshing ? "Refreshing..." : "Refresh"}

                    {newActivity > 0 ? (
                      <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-400 px-1 text-[9px] font-semibold text-slate-900">
                        {newActivity}
                      </span>
                    ) : null}
                  </button>
                ) : null}

                {!clientView && !loading && ticket && !editing ? (
                  <button
                    onClick={() => {
                      clearMessages();
                      setEditing(true);
                    }}
                    className="h-9 rounded-xl border border-white/10 bg-white px-4 text-[12px] font-semibold text-slate-900 transition hover:bg-slate-100"
                  >
                    Edit ticket
                  </button>
                ) : null}

                {isAdmin(user) && !loading && ticket ? (
                  <button
                    onClick={handleDeleteTicket}
                    disabled={deletingTicket}
                    className="h-9 rounded-xl border border-red-500/25 bg-red-500/10 px-4 text-[12px] font-medium text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deletingTicket ? "Deleting..." : "Delete ticket"}
                  </button>
                ) : null}
              </div>
            </div>

            {!loading && ticket ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <HeroStat
                  label="Category"
                  value={prettyTicketCategory(ticket.category)}
                  hint="Operational classification"
                />
                <HeroStat
                  label="Due date"
                  value={formatDate(ticket.dueDate)}
                  hint="Planned target date"
                />
                <HeroStat
                  label="First response"
                  value={formatDate(ticket.firstResponseAt)}
                  hint="Initial external reply"
                />
                <HeroStat
                  label="Messages"
                  value={String(totalMessages)}
                  hint={
                    clientView
                      ? "Visible conversation"
                      : `${clientVisibleMessages} client visible`
                  }
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
            Loading ticket data...
          </div>
        ) : ticket && form ? (
          <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="grid gap-4">
              <Panel>
                {!editing || clientView ? (
                  <>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h2 className="text-[16px] font-semibold text-white sm:text-[18px]">
                          Ticket overview
                        </h2>
                        <p className="mt-1 text-[11px] leading-5 text-slate-400 sm:text-[12px]">
                          {clientView
                            ? "Current request status, timeline and linked account details."
                            : "Core status, linked account and lifecycle details for this support request."}
                        </p>
                      </div>

                      <div className="text-[11px] text-muted">
                        Ticket #{ticket.id}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      <MiniInfo
                        label="Client"
                        value={ticket.client?.companyName || "—"}
                      />
                      <MiniInfo
                        label="Contact"
                        value={ticket.contact?.fullName || "No contact"}
                      />
                      <MiniInfo
                        label="Category"
                        value={prettyTicketCategory(ticket.category)}
                      />
                      {!clientView ? (
                        <MiniInfo
                          label="Assigned to"
                          value={ticket.assignedTo || "Unassigned"}
                        />
                      ) : null}
                      <MiniInfo
                        label="Due date"
                        value={formatDate(ticket.dueDate)}
                      />
                      <MiniInfo
                        label="First response"
                        value={formatDate(ticket.firstResponseAt)}
                      />
                      <MiniInfo
                        label="Resolved at"
                        value={formatDate(ticket.resolvedAt)}
                      />
                      <MiniInfo
                        label="Created"
                        value={formatDate(ticket.createdAt)}
                      />
                      <MiniInfo
                        label="Updated"
                        value={formatDate(ticket.updatedAt)}
                      />
                    </div>

                    <div className="mt-4 rounded-2xl border border-white/8 bg-slate-950/40 p-4">
                      <div className="text-[10px] uppercase tracking-[0.08em] text-muted">
                        Description
                      </div>
                      <div className="mt-2 whitespace-pre-wrap text-[12px] leading-6 text-slate-300">
                        {ticket.description || "No description provided."}
                      </div>
                    </div>
                  </>
                ) : (
                  <form onSubmit={handleSave} className="grid gap-3">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h2 className="text-[16px] font-semibold text-white sm:text-[18px]">
                          Edit ticket
                        </h2>
                        <p className="mt-1 text-[11px] leading-5 text-slate-400 sm:text-[12px]">
                          Update ownership, status, priority and execution
                          details.
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

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="grid gap-1.5">
                        <label className={labelClass}>Contact</label>
                        <select
                          name="contactId"
                          value={form.contactId}
                          onChange={handleChange}
                          className={inputClass}
                        >
                          <option value="" className="bg-slate-900">
                            No contact
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
                        <label className={labelClass}>Assigned to</label>
                        <input
                          name="assignedTo"
                          value={form.assignedTo}
                          onChange={handleChange}
                          className={inputClass}
                          placeholder="Stefan / Help Desk / Tech Team"
                        />
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="grid gap-1.5">
                        <label className={labelClass}>Status</label>
                        <select
                          name="status"
                          value={form.status}
                          onChange={handleChange}
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
                          value={form.priority}
                          onChange={handleChange}
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

                      <div className="grid gap-1.5">
                        <label className={labelClass}>Category</label>
                        <select
                          name="category"
                          value={form.category}
                          onChange={handleChange}
                          className={inputClass}
                        >
                          {ticketCategoryOptions.map((item) => (
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
                      <label className={labelClass}>Due date</label>
                      <input
                        name="dueDate"
                        type="date"
                        value={form.dueDate}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>

                    <div className="grid gap-1.5">
                      <label className={labelClass}>Description</label>
                      <textarea
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        rows={6}
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

              <Panel>
                <div>
                  <h3 className="text-[15px] font-semibold sm:text-[16px]">
                    {clientView ? "Conversation" : "Communication workspace"}
                  </h3>
                  <p className="mt-1 text-[11px] leading-5 text-slate-400 sm:text-[12px]">
                    {clientView
                      ? "View visible updates and send your reply to the support team."
                      : "Manage external email replies and internal support notes in one operating area."}
                  </p>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <MiniInfo label="All messages" value={String(totalMessages)} />
                  {!clientView ? (
                    <MiniInfo
                      label="Internal notes"
                      value={String(internalMessages)}
                    />
                  ) : null}
                  <MiniInfo
                    label={clientView ? "Visible messages" : "Client visible"}
                    value={String(clientVisibleMessages)}
                  />
                  <MiniInfo
                    label="Attachments"
                    value={String(attachmentCount)}
                  />
                </div>

                {!clientView ? (
                  <div className="mt-4 grid gap-4 xl:grid-cols-2">
                    <div className="rounded-2xl border border-white/8 bg-slate-950/40 p-4">
                      <div>
                        <h4 className="text-[14px] font-semibold text-white">
                          Email reply
                        </h4>
                        <p className="mt-1 text-[11px] text-slate-400">
                          Send a client-visible reply directly to the linked
                          contact email.
                        </p>
                      </div>

                      <form
                        onSubmit={handleSendEmailReply}
                        className="mt-4 grid gap-3"
                      >
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="grid gap-1.5">
                            <label className={labelClass}>To</label>
                            <input
                              value={ticket.contact?.email || ""}
                              disabled
                              className={inputClass}
                            />
                          </div>

                          <div className="grid gap-1.5">
                            <label className={labelClass}>Author</label>
                            <input
                              name="authorName"
                              value={emailReplyForm.authorName}
                              onChange={handleEmailReplyChange}
                              className={inputClass}
                            />
                          </div>
                        </div>

                        <div className="grid gap-1.5">
                          <label className={labelClass}>Subject</label>
                          <input
                            name="subject"
                            value={emailReplyForm.subject}
                            onChange={handleEmailReplyChange}
                            className={inputClass}
                          />
                        </div>

                        <div className="grid gap-1.5">
                          <label className={labelClass}>Message</label>
                          <textarea
                            name="message"
                            value={emailReplyForm.message}
                            onChange={handleEmailReplyChange}
                            rows={5}
                            className={textareaClass}
                            placeholder="Write the email reply to the client..."
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={sendingEmailReply || !ticket.contact?.email}
                          className="h-8 w-full rounded-xl border border-white/10 bg-white px-3 text-[11px] font-semibold text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70 sm:w-fit sm:min-w-[160px]"
                        >
                          {sendingEmailReply ? "Sending..." : "Send email reply"}
                        </button>
                      </form>
                    </div>

                    <div className="rounded-2xl border border-white/8 bg-slate-950/40 p-4">
                      <div>
                        <h4 className="text-[14px] font-semibold text-white">
                          Activity / conversation
                        </h4>
                        <p className="mt-1 text-[11px] text-slate-400">
                          Add internal notes and client-visible replies to the
                          ticket timeline.
                        </p>
                      </div>

                      <form
                        onSubmit={handleSendMessage}
                        className="mt-4 grid gap-3"
                      >
                        <div className="grid gap-3 md:grid-cols-[180px_minmax(0,1fr)]">
                          <div className="grid gap-1.5">
                            <label className={labelClass}>Author</label>
                            <input
                              name="authorName"
                              value={messageForm.authorName}
                              onChange={handleMessageChange}
                              className={inputClass}
                            />
                          </div>

                          <div className="flex items-end">
                            <label className="inline-flex items-center gap-2 text-[12px] text-slate-300">
                              <input
                                type="checkbox"
                                name="isInternal"
                                checked={messageForm.isInternal}
                                onChange={handleMessageChange}
                              />
                              Internal note
                            </label>
                          </div>
                        </div>

                        <div className="grid gap-1.5">
                          <label className={labelClass}>Message</label>
                          <textarea
                            name="message"
                            value={messageForm.message}
                            onChange={handleMessageChange}
                            rows={5}
                            className={textareaClass}
                            placeholder="Add update, troubleshooting note or reply..."
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={sendingMessage}
                          className="h-8 w-full rounded-xl border border-white/10 bg-white px-3 text-[11px] font-semibold text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70 sm:w-fit sm:min-w-[140px]"
                        >
                          {sendingMessage ? "Sending..." : "Add message"}
                        </button>
                      </form>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-white/8 bg-slate-950/40 p-4">
                    <div>
                      <h4 className="text-[14px] font-semibold text-white">
                        Send reply
                      </h4>
                      <p className="mt-1 text-[11px] text-slate-400">
                        Reply directly to support from this ticket.
                      </p>
                    </div>

                    <form onSubmit={handleSendMessage} className="mt-4 grid gap-3">
                      <div className="grid gap-1.5">
                        <label className={labelClass}>Author</label>
                        <input
                          name="authorName"
                          value={messageForm.authorName}
                          onChange={handleMessageChange}
                          className={inputClass}
                        />
                      </div>

                      <div className="grid gap-1.5">
                        <label className={labelClass}>Message</label>
                        <textarea
                          name="message"
                          value={messageForm.message}
                          onChange={handleMessageChange}
                          rows={5}
                          className={textareaClass}
                          placeholder="Write your reply or update..."
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={sendingMessage}
                        className="h-8 w-full rounded-xl border border-white/10 bg-white px-3 text-[11px] font-semibold text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70 sm:w-fit sm:min-w-[140px]"
                      >
                        {sendingMessage ? "Sending..." : "Send reply"}
                      </button>
                    </form>
                  </div>
                )}

                {visibleMessages.length ? (
                  <div className="mt-4 grid gap-2.5">
                    {visibleMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`rounded-2xl border border-white/8 bg-slate-950/40 p-3.5 ${
                          message.isInternal
                            ? "border-l-[2px] border-l-amber-400/40"
                            : "border-l-[2px] border-l-sky-400/40"
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-2">
                            <div className="text-[12px] font-semibold text-white">
                              {message.authorName}
                            </div>
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[10px] ${
                                message.isInternal
                                  ? "border-amber-500/20 bg-amber-500/10 text-amber-200"
                                  : "border-sky-500/20 bg-sky-500/10 text-sky-200"
                              }`}
                            >
                              {message.isInternal ? "Internal" : "Visible"}
                            </span>
                          </div>

                          <div className="text-[10px] text-muted">
                            {formatDateTime(message.createdAt)}
                          </div>
                        </div>

                        <div className="mt-2 whitespace-pre-wrap text-[12px] leading-5 text-slate-300">
                          {message.message}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState text="No activity yet." />
                )}
              </Panel>
            </div>

            <div className="grid gap-4">
              <Panel compact>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-[14px] font-semibold sm:text-[15px]">
                      Support health
                    </h3>
                    <p className="mt-1 text-[11px] leading-5 text-slate-400">
                      Current ticket state based on status and priority.
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

                <div className="mt-4 grid gap-2">
                  <MiniStat
                    label="Priority"
                    value={prettyTicketPriority(ticket.priority)}
                    hint="Request urgency"
                  />
                  <MiniStat
                    label="Status"
                    value={prettyTicketStatus(ticket.status)}
                    hint="Current workflow state"
                  />
                </div>
              </Panel>

              <Panel compact>
                <h3 className="text-[14px] font-semibold sm:text-[15px]">
                  Linked account
                </h3>

                <div className="mt-3 grid gap-2">
                  <MiniInfo
                    label="Client"
                    value={ticket.client?.companyName || "—"}
                  />
                  <MiniInfo
                    label="Contact"
                    value={ticket.contact?.fullName || "No contact"}
                  />
                  <MiniInfo
                    label="Contact email"
                    value={ticket.contact?.email || "—"}
                  />
                </div>

                {ticket.client?.id ? (
                  <Link
                    to={`/clients/${ticket.client.id}`}
                    className="mt-3 inline-flex rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] text-white transition hover:bg-white/[0.06]"
                  >
                    Open client
                  </Link>
                ) : null}
              </Panel>

              <Panel compact>
                <h3 className="text-[14px] font-semibold sm:text-[15px]">
                  Ticket metrics
                </h3>

                <div className="mt-3 grid gap-2">
                  <MiniInfo
                    label="Due date"
                    value={formatDate(ticket.dueDate)}
                  />
                  <MiniInfo
                    label="First response"
                    value={formatDate(ticket.firstResponseAt)}
                  />
                  <MiniInfo
                    label="Resolved at"
                    value={formatDate(ticket.resolvedAt)}
                  />
                  <MiniInfo
                    label="Updated"
                    value={formatDate(ticket.updatedAt)}
                  />
                </div>
              </Panel>

              <Panel compact>
                <div>
                  <h3 className="text-[14px] font-semibold sm:text-[15px]">
                    Attachments
                  </h3>
                  <p className="mt-1 text-[10px] leading-4 text-slate-400">
                    Upload and access related files for this ticket.
                  </p>
                </div>

                <form
                  onSubmit={handleUploadAttachment}
                  className="mt-3 grid gap-2.5 rounded-2xl border border-white/8 bg-slate-950/40 p-3"
                >
                  <div className="grid gap-1.5">
                    <label className={labelClass}>Select file</label>
                    <input
                      type="file"
                      onChange={(e) =>
                        setAttachmentFile(e.target.files?.[0] || null)
                      }
                      className="block w-full text-[11px] text-slate-300 file:mr-3 file:rounded-xl file:border-0 file:bg-white file:px-3 file:py-2 file:text-[11px] file:font-semibold file:text-slate-900"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={uploadingAttachment}
                    className="h-8 w-full rounded-xl border border-white/10 bg-white px-3 text-[11px] font-semibold text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {uploadingAttachment ? "Uploading..." : "Upload attachment"}
                  </button>
                </form>

                {ticket.attachments?.length ? (
                  <div className="mt-3 grid gap-2">
                    {ticket.attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="rounded-2xl border border-white/8 bg-slate-950/40 p-3"
                      >
                        <div className="truncate text-[11px] font-medium text-white">
                          {attachment.originalName}
                        </div>
                        <div className="mt-1 text-[10px] leading-4 text-muted">
                          {(attachment.sizeBytes / 1024).toFixed(1)} KB ·{" "}
                          {formatDateTime(attachment.createdAt)}
                        </div>

                        <div className="mt-2.5 flex flex-wrap items-center gap-2">
                          <a
                            href={apiUrl(
                              `/api/tickets/${ticket.id}/attachments/${attachment.id}/download`
                            )}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[10px] text-white transition hover:bg-white/[0.06]"
                          >
                            Open / download
                          </a>

                          {canManageAttachments(user) ? (
                            <button
                              type="button"
                              onClick={() => handleDeleteAttachment(attachment)}
                              disabled={deletingAttachmentId === attachment.id}
                              className="inline-flex rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-1.5 text-[10px] text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {deletingAttachmentId === attachment.id
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-3 text-[11px] text-slate-400">
                    No attachments uploaded yet.
                  </div>
                )}
              </Panel>

              <Panel compact>
                <h3 className="text-[14px] font-semibold sm:text-[15px]">
                  Next action
                </h3>

                <div className="mt-3 rounded-xl border border-white/8 bg-slate-950/40 p-3">
                  <div className="text-[10px] uppercase tracking-[0.08em] text-muted">
                    Suggested move
                  </div>
                  <div className="mt-2 text-[12px] leading-6 text-slate-300">
                    {ticket.status === "waiting_client"
                      ? clientView
                        ? "Reply to this ticket with the requested information so support can continue."
                        : "Follow up with the client or wait for their reply before progressing the ticket."
                      : ticket.status === "resolved"
                      ? "Confirm outcome and review the final update if needed."
                      : ticket.priority === "urgent"
                      ? "Keep this ticket under active attention and review the newest updates first."
                      : "Continue tracking progress and keep the conversation updated as needed."}
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

