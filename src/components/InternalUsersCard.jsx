import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import {
  SectionCard,
  dangerButtonClass,
  ghostButtonClass,
  inputClass,
  labelClass,
  primaryButtonClass,
} from "./ui";

const roleOptions = [
  { value: "admin", label: "Admin" },
  { value: "staff", label: "Staff" },
  { value: "viewer", label: "Viewer" },
];

const roleTone = {
  admin: "border-indigo-500/20 bg-indigo-500/10 text-indigo-200",
  staff: "border-sky-500/20 bg-sky-500/10 text-sky-200",
  viewer: "border-slate-500/20 bg-slate-500/10 text-slate-300",
};

const emptyInviteForm = {
  name: "",
  email: "",
  password: "",
  role: "staff",
};

function roleLabel(value) {
  return roleOptions.find((item) => item.value === value)?.label || value;
}

export default function InternalUsersCard({ currentUser, onError, onNotice }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyInviteForm);
  const [busyUserId, setBusyUserId] = useState(null);
  const [resetUserId, setResetUserId] = useState(null);
  const [resetPassword, setResetPassword] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiFetch("/api/users");
      setUsers(data || []);
    } catch (err) {
      onError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    load();
  }, [load]);

  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setCreating(true);

    try {
      const created = await apiFetch("/api/users", {
        method: "POST",
        body: JSON.stringify(form),
      });

      setUsers((prev) => [...prev, created]);
      setForm(emptyInviteForm);
      onNotice(`User "${created.name}" created successfully.`);
    } catch (err) {
      onError(err.message || "Failed to create user");
    } finally {
      setCreating(false);
    }
  }

  async function handleRoleChange(user, role) {
    if (role === user.role) return;

    setBusyUserId(user.id);

    try {
      const updated = await apiFetch(`/api/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      });

      setUsers((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
      onNotice(`${updated.name} is now ${roleLabel(updated.role)}.`);
    } catch (err) {
      onError(err.message || "Failed to update role");
    } finally {
      setBusyUserId(null);
    }
  }

  async function handleResetPassword(e, user) {
    e.preventDefault();
    setBusyUserId(user.id);

    try {
      await apiFetch(`/api/users/${user.id}/password`, {
        method: "PATCH",
        body: JSON.stringify({ newPassword: resetPassword }),
      });

      setResetUserId(null);
      setResetPassword("");
      onNotice(`Password reset for ${user.name}.`);
    } catch (err) {
      onError(err.message || "Failed to reset password");
    } finally {
      setBusyUserId(null);
    }
  }

  async function handleDelete(user) {
    const confirmed = window.confirm(
      `Delete ${user.name}? They will lose access immediately.`
    );

    if (!confirmed) return;

    setBusyUserId(user.id);

    try {
      await apiFetch(`/api/users/${user.id}`, { method: "DELETE" });
      setUsers((prev) => prev.filter((item) => item.id !== user.id));
      onNotice(`User "${user.name}" deleted.`);
    } catch (err) {
      onError(err.message || "Failed to delete user");
    } finally {
      setBusyUserId(null);
    }
  }

  return (
    <SectionCard
      title="Internal users"
      description="Console accounts for your own team. Client portal users are managed on each client record."
    >
      <div className="grid gap-4">
        <div className="grid gap-2">
          {loading ? (
            <div className="rounded-2xl border border-white/8 bg-slate-950/40 px-4 py-4 text-[12px] text-slate-400">
              Loading users...
            </div>
          ) : null}

          {!loading && !users.length ? (
            <div className="rounded-2xl border border-white/8 bg-slate-950/40 px-4 py-4 text-[12px] text-slate-400">
              No internal users yet.
            </div>
          ) : null}

          {users.map((user) => {
            const isSelf = user.id === currentUser?.id;
            const busy = busyUserId === user.id;

            return (
              <div
                key={user.id}
                className="rounded-2xl border border-white/8 bg-slate-950/40 px-4 py-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[12px] font-medium text-white">
                        {user.name}
                      </span>

                      <span
                        className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.08em] ${
                          roleTone[user.role] || roleTone.viewer
                        }`}
                      >
                        {roleLabel(user.role)}
                      </span>

                      {isSelf ? (
                        <span className="shrink-0 text-[9px] uppercase tracking-[0.08em] text-muted">
                          You
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-1 truncate text-[11px] text-muted">
                      {user.email}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={user.role}
                      disabled={isSelf || busy}
                      onChange={(e) => handleRoleChange(user, e.target.value)}
                      aria-label={`Role for ${user.name}`}
                      className="h-8 rounded-xl border border-white/8 bg-field px-2 text-[11px] text-white outline-none disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {roleOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        setResetUserId((prev) =>
                          prev === user.id ? null : user.id
                        );
                        setResetPassword("");
                      }}
                      className={ghostButtonClass}
                    >
                      Reset password
                    </button>

                    <button
                      type="button"
                      disabled={isSelf || busy}
                      onClick={() => handleDelete(user)}
                      className={dangerButtonClass}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {resetUserId === user.id ? (
                  <form
                    onSubmit={(e) => handleResetPassword(e, user)}
                    className="mt-3 flex flex-wrap items-end gap-2 border-t border-white/8 pt-3"
                  >
                    <div className="grid min-w-[220px] flex-1 gap-1.5">
                      <label className={labelClass}>
                        New password for {user.name}
                      </label>
                      <input
                        type="text"
                        value={resetPassword}
                        onChange={(e) => setResetPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        className={inputClass}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={busy || resetPassword.length < 8}
                      className={ghostButtonClass}
                    >
                      {busy ? "Saving..." : "Set password"}
                    </button>
                  </form>
                ) : null}
              </div>
            );
          })}
        </div>

        <form
          onSubmit={handleCreate}
          className="grid gap-3 border-t border-white/8 pt-4"
        >
          <div className="text-[11px] font-medium text-slate-300">
            Add internal user
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <label className={labelClass}>Full name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleFormChange}
                placeholder="Stefan Vasiljevic"
                className={inputClass}
              />
            </div>

            <div className="grid gap-1.5">
              <label className={labelClass}>Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleFormChange}
                placeholder="stefan@aplisim.com"
                className={inputClass}
              />
            </div>

            <div className="grid gap-1.5">
              <label className={labelClass}>Temporary password</label>
              <input
                type="text"
                name="password"
                value={form.password}
                onChange={handleFormChange}
                placeholder="At least 8 characters"
                className={inputClass}
              />
            </div>

            <div className="grid gap-1.5">
              <label className={labelClass}>Role</label>
              <select
                name="role"
                value={form.role}
                onChange={handleFormChange}
                className={inputClass}
              >
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={creating}
              className={primaryButtonClass}
            >
              {creating ? "Creating..." : "Create user"}
            </button>
          </div>
        </form>
      </div>
    </SectionCard>
  );
}
