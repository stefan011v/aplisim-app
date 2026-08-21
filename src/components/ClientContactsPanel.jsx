import {
  EmptyState,
  MiniInfo,
  Panel,
  inputClass,
  labelClass,
  textareaClass,
} from "./ui";
import { formatDate } from "../lib/format";

/** Contacts list and editor for a single client. */
export default function ClientContactsPanel({
  addingContact,
  cancelEditContact,
  clearMessages,
  client,
  contactForm,
  deletingContactId,
  editingContactForm,
  editingContactId,
  handleAddContact,
  handleContactChange,
  handleDeleteContact,
  handleEditingContactChange,
  handleUpdateContact,
  resetContactAddForm,
  savingContact,
  setAddingContact,
  setEditingContactId,
  startEditContact,
}) {
  return (
  <Panel>
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
  </Panel>
  );
}
