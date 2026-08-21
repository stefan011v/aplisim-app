import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { apiFetch } from "../lib/api";
import AuthShell from "../components/AuthShell";
import { inputClass, labelClass, primaryButtonClass } from "../components/ui";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token") || "";

  const [form, setForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (form.newPassword !== form.confirmPassword) {
      setError("New password and confirm password do not match");
      return;
    }

    setLoading(true);
    setError("");
    setNotice("");

    try {
      const data = await apiFetch("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, ...form }),
      });

      setNotice(data.message || "Password updated successfully.");
      setForm({ newPassword: "", confirmPassword: "" });

      window.setTimeout(() => navigate("/login", { replace: true }), 1800);
    } catch (err) {
      setError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <AuthShell
        title="Reset password"
        subtitle="This page needs a valid reset link."
      >
        <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2.5 text-[12px] text-red-200">
          The reset link is missing its token. Request a new link and try again.
        </div>

        <div className="mt-5 text-center text-[11px] text-slate-400">
          <Link
            to="/forgot-password"
            className="text-slate-300 transition hover:text-white"
          >
            Request a new link
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Choose a new password"
      subtitle="Set the password you will use to sign in to the APLISIM console."
    >
      {error ? (
        <div className="mb-4 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2.5 text-[12px] text-red-200">
          {error}
        </div>
      ) : null}

      {notice ? (
        <div className="mb-4 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2.5 text-[12px] text-emerald-200">
          {notice} Redirecting to sign in...
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="grid gap-3">
        <div className="grid gap-1.5">
          <label className={labelClass} htmlFor="newPassword">
            New password
          </label>
          <input
            id="newPassword"
            type="password"
            name="newPassword"
            autoComplete="new-password"
            required
            minLength={8}
            value={form.newPassword}
            onChange={handleChange}
            className={inputClass}
          />
          <p className="text-[10px] text-muted">At least 8 characters.</p>
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
            required
            minLength={8}
            value={form.confirmPassword}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        <button type="submit" disabled={loading} className={primaryButtonClass}>
          {loading ? "Saving..." : "Set password"}
        </button>
      </form>

      <div className="mt-5 text-center text-[11px] text-slate-400">
        <Link to="/login" className="text-slate-300 transition hover:text-white">
          Back to sign in
        </Link>
      </div>
    </AuthShell>
  );
}
