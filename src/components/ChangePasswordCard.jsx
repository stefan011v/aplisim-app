import {
  SectionCard,
  inputClass,
  labelClass,
  primaryButtonClass,
} from "./ui";

export default function ChangePasswordCard({
  description,
  form,
  onChange,
  onSubmit,
  saving,
}) {
  return (
    <SectionCard title="Change password" description={description}>
      <form onSubmit={onSubmit} className="grid gap-3">
        <div className="grid gap-1.5">
          <label className={labelClass} htmlFor="currentPassword">
            Current password
          </label>
          <input
            id="currentPassword"
            type="password"
            name="currentPassword"
            autoComplete="current-password"
            value={form.currentPassword}
            onChange={onChange}
            className={inputClass}
          />
        </div>

        <div className="grid gap-1.5">
          <label className={labelClass} htmlFor="newPassword">
            New password
          </label>
          <input
            id="newPassword"
            type="password"
            name="newPassword"
            autoComplete="new-password"
            value={form.newPassword}
            onChange={onChange}
            className={inputClass}
          />
          <p className="text-[10px] text-slate-500">
            At least 8 characters.
          </p>
        </div>

        <div className="grid gap-1.5">
          <label className={labelClass} htmlFor="confirmPassword">
            Confirm new password
          </label>
          <input
            id="confirmPassword"
            type="password"
            name="confirmPassword"
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={onChange}
            className={inputClass}
          />
        </div>

        <div className="pt-2">
          <button type="submit" disabled={saving} className={primaryButtonClass}>
            {saving ? "Saving..." : "Change password"}
          </button>
        </div>
      </form>
    </SectionCard>
  );
}
