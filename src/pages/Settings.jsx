import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api";
import { formatDate } from "../lib/format";
import { useAutoDismiss } from "../hooks/useAutoDismiss";
import ChangePasswordCard from "../components/ChangePasswordCard";
import InternalUsersCard from "../components/InternalUsersCard";
import { SectionCard, inputClass, labelClass } from "../components/ui";

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

const ticketCategoryOptions = [
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

const leadStatusOptions = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "proposal_sent", label: "Proposal sent" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

const leadSourceOptions = [
  { value: "website", label: "Website" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "referral", label: "Referral" },
  { value: "email", label: "Email" },
  { value: "other", label: "Other" },
];

const clientStatusOptions = [
  { value: "prospect", label: "Prospect" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "closed", label: "Closed" },
];

const primaryServiceOptions = [
  { value: "web-app-development", label: "Web & App Development" },
  { value: "help-desk-it-ops", label: "Help Desk & IT Ops" },
  { value: "crm-integrations", label: "CRM & Integrations" },
  { value: "ai-automation", label: "AI Automation" },
];

const initialAdminForm = {
  appName: "",
  supportEmail: "",
  timezone: "Europe/Belgrade",
  defaultTicketStatus: "new",
  defaultTicketPriority: "medium",
  defaultTicketCategory: "general",
  defaultLeadStatus: "new",
  defaultLeadSource: "website",
  defaultClientStatus: "prospect",
  defaultPrimaryService: "web-app-development",
  defaultPackageName: "",
  notifyOnAccessRequest: true,
  notifyOnNewTicket: false,
  notifyOnLeadCreated: false,
};

const initialClientForm = {
  name: "",
  email: "",
  contactName: "",
  clientEmail: "",
  phone: "",
  website: "",
  city: "",
  companyName: "",
  primaryService: "",
  packageName: "",
  clientPortalRole: "member",
};

const initialPasswordForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const initialInviteForm = {
  name: "",
  email: "",
};

function buildSettingsForm(data) {
  return {
    appName: data.appName || "",
    supportEmail: data.supportEmail || "",
    timezone: data.timezone || "Europe/Belgrade",
    defaultTicketStatus: data.defaultTicketStatus || "new",
    defaultTicketPriority: data.defaultTicketPriority || "medium",
    defaultTicketCategory: data.defaultTicketCategory || "general",
    defaultLeadStatus: data.defaultLeadStatus || "new",
    defaultLeadSource: data.defaultLeadSource || "website",
    defaultClientStatus: data.defaultClientStatus || "prospect",
    defaultPrimaryService: data.defaultPrimaryService || "web-app-development",
    defaultPackageName: data.defaultPackageName || "",
    notifyOnAccessRequest:
      data.notifyOnAccessRequest === undefined
        ? true
        : data.notifyOnAccessRequest,
    notifyOnNewTicket:
      data.notifyOnNewTicket === undefined ? false : data.notifyOnNewTicket,
    notifyOnLeadCreated:
      data.notifyOnLeadCreated === undefined ? false : data.notifyOnLeadCreated,
  };
}

function buildClientForm(data) {
  return {
    name: data?.user?.name || "",
    email: data?.user?.email || "",
    contactName: data?.client?.contactName || "",
    clientEmail: data?.client?.email || data?.user?.email || "",
    phone: data?.client?.phone || "",
    website: data?.client?.website || "",
    city: data?.client?.city || "",
    companyName: data?.client?.companyName || "",
    primaryService: data?.client?.primaryService || "",
    packageName: data?.client?.packageName || "",
    clientPortalRole: data?.user?.clientPortalRole || "member",
  };
}

function getOptionLabel(options, value) {
  return options.find((item) => item.value === value)?.label || value || "—";
}

export default function Settings({ user, onUserRefresh }) {
  const clientView = user?.role === "client";

  const [form, setForm] = useState(initialAdminForm);
  const [clientForm, setClientForm] = useState(initialClientForm);
  const [passwordForm, setPasswordForm] = useState(initialPasswordForm);
  const [inviteForm, setInviteForm] = useState(initialInviteForm);
  const [teamUsers, setTeamUsers] = useState([]);
  const [savingInvite, setSavingInvite] = useState(false);
  const [deletingTeamUserId, setDeletingTeamUserId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useAutoDismiss(notice, setNotice);

  const clientAdmin = clientForm.clientPortalRole === "admin";

  const loadSettings = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        setError("");

        if (clientView) {
          const [data, teamData] = await Promise.all([
            apiFetch("/api/settings/me"),
            apiFetch("/api/settings/team-users"),
          ]);

          setClientForm(buildClientForm(data));
          setTeamUsers(teamData.users || []);
        } else {
          const data = await apiFetch("/api/settings");
          setForm(buildSettingsForm(data));
        }
      } catch (err) {
        setError(err.message || "Failed to load settings");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [clientView]
  );

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  function clearMessages() {
    setError("");
    setNotice("");
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function handleClientChange(e) {
    const { name, value } = e.target;
    setClientForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handlePasswordChange(e) {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleInviteChange(e) {
    const { name, value } = e.target;
    setInviteForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    clearMessages();

    try {
      const result = await apiFetch("/api/settings", {
        method: "PATCH",
        body: JSON.stringify(form),
      });

      setForm(buildSettingsForm(result.settings || {}));
      setNotice("Settings saved successfully.");
    } catch (err) {
      setError(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  async function handleClientSubmit(e) {
    e.preventDefault();
    setSavingAccount(true);
    clearMessages();

    try {
      const result = await apiFetch("/api/settings/me", {
        method: "PATCH",
        body: JSON.stringify(clientForm),
      });

      setClientForm(buildClientForm(result.settings || {}));

      // Name and email live on the session too, so pull the fresh identity.
      if (onUserRefresh) {
        await onUserRefresh();
      }

      setNotice("Account settings updated successfully.");
    } catch (err) {
      setError(err.message || "Failed to update account settings");
    } finally {
      setSavingAccount(false);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setSavingPassword(true);
    clearMessages();

    try {
      await apiFetch("/api/settings/change-password", {
        method: "PATCH",
        body: JSON.stringify(passwordForm),
      });

      setPasswordForm(initialPasswordForm);
      setNotice("Password changed successfully.");
    } catch (err) {
      setError(err.message || "Failed to change password");
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleInviteSubmit(e) {
    e.preventDefault();
    setSavingInvite(true);
    clearMessages();

    try {
      const result = await apiFetch("/api/settings/team-users/invite", {
        method: "POST",
        body: JSON.stringify(inviteForm),
      });

      setTeamUsers((prev) => [...prev, result.user]);
      setInviteForm(initialInviteForm);
      setNotice("Invite sent successfully.");
    } catch (err) {
      setError(err.message || "Failed to send invite");
    } finally {
      setSavingInvite(false);
    }
  }

  async function handleDeleteTeamUser(userId) {
    const confirmed = window.confirm("Delete this team user?");
    if (!confirmed) return;

    setDeletingTeamUserId(userId);
    clearMessages();

    try {
      await apiFetch(`/api/settings/team-users/${userId}`, {
        method: "DELETE",
      });

      setTeamUsers((prev) => prev.filter((item) => item.id !== userId));
      setNotice("Team user deleted successfully.");
    } catch (err) {
      setError(err.message || "Failed to delete team user");
    } finally {
      setDeletingTeamUserId(null);
    }
  }

  const summaryItems = useMemo(
    () => [
      {
        label: "New ticket default",
        value: `${getOptionLabel(
          ticketStatusOptions,
          form.defaultTicketStatus
        )} • ${getOptionLabel(
          ticketPriorityOptions,
          form.defaultTicketPriority
        )} • ${getOptionLabel(
          ticketCategoryOptions,
          form.defaultTicketCategory
        )}`,
      },
      {
        label: "New lead default",
        value: `${getOptionLabel(
          leadStatusOptions,
          form.defaultLeadStatus
        )} • ${getOptionLabel(leadSourceOptions, form.defaultLeadSource)}`,
      },
      {
        label: "New client default",
        value: `${getOptionLabel(
          clientStatusOptions,
          form.defaultClientStatus
        )} • ${getOptionLabel(
          primaryServiceOptions,
          form.defaultPrimaryService
        )}${form.defaultPackageName ? ` • ${form.defaultPackageName}` : ""}`,
      },
      {
        label: "Notifications",
        value:
          [
            form.notifyOnAccessRequest ? "Access requests" : null,
            form.notifyOnNewTicket ? "New tickets" : null,
            form.notifyOnLeadCreated ? "New leads" : null,
          ]
            .filter(Boolean)
            .join(", ") || "All disabled",
      },
    ],
    [form]
  );

  return (
    <div className="w-full p-3 text-white sm:p-4 lg:p-5">
      <div className="mx-auto max-w-[1650px]">
        <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-4 shadow-[0_18px_50px_rgba(0,0,0,0.24)] sm:px-5 sm:py-5">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.07),transparent_30%)]" />

          <div className="relative z-10 flex flex-col gap-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="min-w-0">
                <div className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[9px] uppercase tracking-[0.16em] text-slate-300">
                  {clientView ? "My account" : "System configuration"}
                </div>

                <h1 className="mt-3 text-[24px] font-semibold tracking-[-0.05em] text-white sm:text-[26px]">
                  Settings
                </h1>

                <p className="mt-1.5 max-w-3xl text-[11px] leading-5 text-slate-400 sm:text-[12px]">
                  {clientView
                    ? "Update your account details and manage client portal access."
                    : "Configure global defaults for tickets, leads, clients and notifications so the rest of the console behaves consistently."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => loadSettings(true)}
                  disabled={
                    loading ||
                    refreshing ||
                    saving ||
                    savingAccount ||
                    savingPassword ||
                    savingInvite
                  }
                  className="inline-flex items-center justify-center rounded-[12px] border border-white/10 bg-white/[0.04] px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {refreshing ? "Refreshing..." : "Refresh"}
                </button>
              </div>
            </div>

            {!loading && !clientView ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {summaryItems.map((item) => (
                  <SummaryCard
                    key={item.label}
                    label={item.label}
                    value={item.value}
                  />
                ))}
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
            Loading settings...
          </div>
        ) : clientView ? (
          <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
            <div className="grid gap-4">
              <form onSubmit={handleClientSubmit}>
                <SectionCard
                  title="Account details"
                  description="Basic login and contact information for your client account."
                >
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="grid gap-1.5">
                      <label className={labelClass}>Your name</label>
                      <input
                        name="name"
                        value={clientForm.name}
                        onChange={handleClientChange}
                        className={inputClass}
                      />
                    </div>

                    <div className="grid gap-1.5">
                      <label className={labelClass}>Login email</label>
                      <input
                        name="email"
                        value={clientForm.email}
                        onChange={handleClientChange}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="grid gap-1.5">
                      <label className={labelClass}>Contact name</label>
                      <input
                        name="contactName"
                        value={clientForm.contactName}
                        onChange={handleClientChange}
                        className={inputClass}
                      />
                    </div>

                    <div className="grid gap-1.5">
                      <label className={labelClass}>Client contact email</label>
                      <input
                        name="clientEmail"
                        value={clientForm.clientEmail}
                        onChange={handleClientChange}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="grid gap-1.5">
                      <label className={labelClass}>Phone</label>
                      <input
                        name="phone"
                        value={clientForm.phone}
                        onChange={handleClientChange}
                        className={inputClass}
                      />
                    </div>

                    <div className="grid gap-1.5">
                      <label className={labelClass}>Website</label>
                      <input
                        name="website"
                        value={clientForm.website}
                        onChange={handleClientChange}
                        className={inputClass}
                      />
                    </div>

                    <div className="grid gap-1.5">
                      <label className={labelClass}>City</label>
                      <input
                        name="city"
                        value={clientForm.city}
                        onChange={handleClientChange}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={savingAccount}
                      className="inline-flex items-center justify-center rounded-[12px] border border-white/10 bg-white px-4 py-2 text-[12px] font-semibold text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {savingAccount ? "Saving..." : "Save account settings"}
                    </button>
                  </div>
                </SectionCard>
              </form>

              <SectionCard
                title="Team members"
                description="The main client admin can invite more users into this portal."
              >
                {clientAdmin ? (
                  <form onSubmit={handleInviteSubmit} className="grid gap-3">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="grid gap-1.5">
                        <label className={labelClass}>Full name</label>
                        <input
                          name="name"
                          value={inviteForm.name}
                          onChange={handleInviteChange}
                          className={inputClass}
                          placeholder="Marko Markovic"
                        />
                      </div>

                      <div className="grid gap-1.5">
                        <label className={labelClass}>Email</label>
                        <input
                          name="email"
                          value={inviteForm.email}
                          onChange={handleInviteChange}
                          className={inputClass}
                          placeholder="team@company.com"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={savingInvite}
                        className="inline-flex items-center justify-center rounded-[12px] border border-white/10 bg-white px-4 py-2 text-[12px] font-semibold text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {savingInvite ? "Sending..." : "Send invite"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-[12px] text-amber-200">
                    You have member access. Only the main client admin can invite
                    or remove users.
                  </div>
                )}

                <div className="mt-5 grid gap-3">
                  {teamUsers.length === 0 ? (
                    <div className="rounded-xl border border-white/8 bg-slate-950/40 px-4 py-4 text-[12px] text-slate-400">
                      No team users yet.
                    </div>
                  ) : (
                    teamUsers.map((teamUser) => {
                      const isMainAdmin =
                        (teamUser.clientPortalRole || "member") === "admin";
                      const isCurrent =
                        Number(teamUser.id) === Number(user?.id);

                      return (
                        <div
                          key={teamUser.id}
                          className="rounded-2xl border border-white/8 bg-slate-950/40 p-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-[13px] font-semibold text-white">
                                {teamUser.name}
                              </div>
                              <div className="mt-1 text-[11px] text-slate-400">
                                {teamUser.email}
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {isMainAdmin ? (
                                <span className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium text-emerald-200">
                                  Main admin
                                </span>
                              ) : null}

                              {isCurrent ? (
                                <span className="inline-flex rounded-full border border-sky-500/20 bg-sky-500/10 px-2.5 py-1 text-[10px] font-medium text-sky-200">
                                  Current user
                                </span>
                              ) : null}

                              {clientAdmin && !isMainAdmin ? (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTeamUser(teamUser.id)}
                                  disabled={deletingTeamUserId === teamUser.id}
                                  className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-[11px] font-medium text-red-200 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                  {deletingTeamUserId === teamUser.id
                                    ? "Deleting..."
                                    : "Delete"}
                                </button>
                              ) : null}
                            </div>
                          </div>

                          <div className="mt-3 grid gap-2 sm:grid-cols-3">
                            <SummaryCard
                              label="Portal role"
                              value={isMainAdmin ? "Admin" : "Member"}
                            />
                            <SummaryCard
                              label="Created"
                              value={formatDate(teamUser.createdAt)}
                            />
                            <SummaryCard
                              label="Updated"
                              value={formatDate(teamUser.updatedAt)}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </SectionCard>
            </div>

            <div className="grid gap-4">
              {clientAdmin ? (
                <ChangePasswordCard
                  description="Only the main client admin can change the portal password here."
                  form={passwordForm}
                  onChange={handlePasswordChange}
                  onSubmit={handlePasswordSubmit}
                  saving={savingPassword}
                />
              ) : (
                <SectionCard
                  title="Password access"
                  description="This portal password action is reserved for the main client admin."
                >
                  <div className="rounded-xl border border-white/8 bg-slate-950/40 px-4 py-4 text-[12px] text-slate-400">
                    Your account has member access. The main client admin manages
                    portal-level password changes.
                  </div>
                </SectionCard>
              )}

              <SectionCard
                title="Account summary"
                description="Reference information for your current client profile."
              >
                <div className="grid gap-3">
                  <SummaryCard
                    label="Company"
                    value={clientForm.companyName || "—"}
                  />
                  <SummaryCard
                    label="Primary service"
                    value={clientForm.primaryService || "—"}
                  />
                  <SummaryCard
                    label="Package"
                    value={clientForm.packageName || "—"}
                  />
                  <SummaryCard
                    label="Portal role"
                    value={clientAdmin ? "Admin" : "Member"}
                  />
                </div>
              </SectionCard>
            </div>
          </div>
        ) : (
          <>
          <form onSubmit={handleSubmit} className="mt-4 grid gap-4">
            <SectionCard
              title="General"
              description="Basic application and support contact details."
            >
              <div className="grid gap-3 md:grid-cols-3">
                <div className="grid gap-1.5">
                  <label className={labelClass}>App name</label>
                  <input
                    name="appName"
                    value={form.appName}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="APLISIM Business Console"
                  />
                </div>

                <div className="grid gap-1.5">
                  <label className={labelClass}>Support email</label>
                  <input
                    name="supportEmail"
                    value={form.supportEmail}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="support@aplisim.com"
                  />
                </div>

                <div className="grid gap-1.5">
                  <label className={labelClass}>Timezone</label>
                  <input
                    name="timezone"
                    value={form.timezone}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Europe/Belgrade"
                  />
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Ticket defaults"
              description="Default values applied when creating new tickets."
            >
              <div className="grid gap-3 md:grid-cols-3">
                <div className="grid gap-1.5">
                  <label className={labelClass}>Default status</label>
                  <select
                    name="defaultTicketStatus"
                    value={form.defaultTicketStatus}
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
                  <label className={labelClass}>Default priority</label>
                  <select
                    name="defaultTicketPriority"
                    value={form.defaultTicketPriority}
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
                  <label className={labelClass}>Default category</label>
                  <select
                    name="defaultTicketCategory"
                    value={form.defaultTicketCategory}
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
            </SectionCard>

            <SectionCard
              title="Lead defaults"
              description="Default source and stage for new sales opportunities."
            >
              <div className="grid gap-3 md:grid-cols-2">
                <div className="grid gap-1.5">
                  <label className={labelClass}>Default lead status</label>
                  <select
                    name="defaultLeadStatus"
                    value={form.defaultLeadStatus}
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

                <div className="grid gap-1.5">
                  <label className={labelClass}>Default lead source</label>
                  <select
                    name="defaultLeadSource"
                    value={form.defaultLeadSource}
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
              </div>
            </SectionCard>

            <SectionCard
              title="Client defaults"
              description="Default account state and service direction for new clients."
            >
              <div className="grid gap-3 md:grid-cols-3">
                <div className="grid gap-1.5">
                  <label className={labelClass}>Default client status</label>
                  <select
                    name="defaultClientStatus"
                    value={form.defaultClientStatus}
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
                  <label className={labelClass}>Default primary service</label>
                  <select
                    name="defaultPrimaryService"
                    value={form.defaultPrimaryService}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    {primaryServiceOptions.map((item) => (
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
                  <label className={labelClass}>Default package name</label>
                  <input
                    name="defaultPackageName"
                    value={form.defaultPackageName}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Scale / Managed IT / Growth"
                  />
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Notifications"
              description="Enable or disable basic system alerts and workflow triggers."
            >
              <div className="grid gap-3">
                <ToggleRow
                  name="notifyOnAccessRequest"
                  checked={form.notifyOnAccessRequest}
                  onChange={handleChange}
                  title="Notify on access request"
                  description="Used when a new request access form is submitted."
                />

                <ToggleRow
                  name="notifyOnNewTicket"
                  checked={form.notifyOnNewTicket}
                  onChange={handleChange}
                  title="Notify on new ticket"
                  description="Used when a new operational ticket is created."
                />

                <ToggleRow
                  name="notifyOnLeadCreated"
                  checked={form.notifyOnLeadCreated}
                  onChange={handleChange}
                  title="Notify on new lead"
                  description="Used when a new lead enters the pipeline."
                />
              </div>

              <div className="mt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center rounded-[12px] border border-white/10 bg-white px-4 py-2 text-[12px] font-semibold text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {saving ? "Saving..." : "Save settings"}
                </button>
              </div>
            </SectionCard>
          </form>

          <div className="mt-4 grid gap-4">
            <ChangePasswordCard
              description="Update the password for your own console account."
              form={passwordForm}
              onChange={handlePasswordChange}
              onSubmit={handlePasswordSubmit}
              saving={savingPassword}
            />

            <InternalUsersCard
              currentUser={user}
              onError={setError}
              onNotice={setNotice}
            />
          </div>
          </>
        )}
      </div>
    </div>
  );
}

function ToggleRow({ name, checked, onChange, title, description }) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-2xl border border-white/8 bg-slate-950/40 px-4 py-4">
      <div className="min-w-0">
        <div className="text-[12px] font-medium text-white">{title}</div>
        <div className="mt-1 text-[11px] leading-5 text-slate-400">
          {description}
        </div>
      </div>

      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        className="mt-1 h-4 w-4 shrink-0"
      />
    </label>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="text-[10px] uppercase tracking-[0.12em] text-slate-400">
        {label}
      </div>
      <div className="mt-2 text-[12px] leading-5 text-white">{value}</div>
    </div>
  );
}