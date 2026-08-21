import { useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../lib/api";
import AuthShell from "../components/AuthShell";
import { inputClass, labelClass, primaryButtonClass } from "../components/ui";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const data = await apiFetch("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      setNotice(data.message || "Check your inbox for the reset link.");
      setEmail("");
    } catch (err) {
      setError(err.message || "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Forgot password"
      subtitle="Enter the email address linked to your APLISIM account and we will send you a reset link."
    >
      {error ? (
        <div className="mb-4 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2.5 text-[12px] text-red-200">
          {error}
        </div>
      ) : null}

      {notice ? (
        <div className="mb-4 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2.5 text-[12px] text-emerald-200">
          {notice}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="grid gap-3">
        <div className="grid gap-1.5">
          <label className={labelClass} htmlFor="email">
            Email address
          </label>
          <input
            id="email"
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className={inputClass}
          />
        </div>

        <button type="submit" disabled={loading} className={primaryButtonClass}>
          {loading ? "Sending..." : "Send reset link"}
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
