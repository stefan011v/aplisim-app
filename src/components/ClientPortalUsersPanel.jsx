import { EmptyState, MiniInfo, Panel, inputClass, labelClass } from "./ui";
import { formatDate } from "../lib/format";

function prettyPortalRole(value) {
  if (value === "admin") return "Admin";
  if (value === "member") return "Member";
  return value || "—";
}

/** Portal accounts that can sign in on behalf of this client. */
export default function ClientPortalUsersPanel({
  addingPortalUser,
  changingPortalUserId,
  clearMessages,
  client,
  handleAddPortalUser,
  handlePortalRoleChange,
  handlePortalUserChange,
  metrics,
  portalUserForm,
  resetPortalUserForm,
  savingPortalUser,
  setAddingContact,
  setAddingOpportunity,
  setAddingPortalUser,
  setAddingTicket,
}) {
  return (
  <Panel>
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
  </Panel>
  );
}
