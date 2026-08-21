import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";

const benefits = [
  {
    title: "Secure access",
    text: "Centralized login for your internal business console with protected session flow.",
  },
  {
    title: "Client operations",
    text: "Access dashboards, clients, leads and ticket workflows from one place.",
  },
  {
    title: "Built to scale",
    text: "A clean admin layer prepared for future account management and approvals.",
  },
];

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo = location.state?.from?.pathname
    ? `${location.state.from.pathname}${location.state.from.search || ""}`
    : "/";

  const [view, setView] = useState("login");

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [requestForm, setRequestForm] = useState({
    fullName: "",
    email: "",
    company: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [requestLoading, setRequestLoading] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [requestSuccess, setRequestSuccess] = useState("");

  const currentYear = useMemo(() => new Date().getFullYear(), []);

  function handleChange(e) {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  function handleRequestChange(e) {
    setRequestForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  function switchToRequestAccess() {
    setView("request");
    setError("");
  }

  function switchToLogin() {
    setView("login");
    setError("");
    setRequestError("");
    setRequestSuccess("");
    setForm({
      email: "",
      password: "",
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(form),
      });

      onLogin(data.user);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestAccessSubmit(e) {
    e.preventDefault();
    setRequestLoading(true);
    setRequestError("");
    setRequestSuccess("");

    try {
      await apiFetch("/api/access-requests", {
        method: "POST",
        body: JSON.stringify(requestForm),
      });

      setRequestSuccess("Your access request has been submitted.");
      setRequestForm({
        fullName: "",
        email: "",
        company: "",
        message: "",
      });
    } catch (err) {
      setRequestError(err.message || "Failed to submit request");
    } finally {
      setRequestLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-auth text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-10%] top-[-8%] h-[360px] w-[360px] rounded-full bg-indigo-500/18 blur-3xl" />
        <div className="absolute right-[-8%] top-[12%] h-[320px] w-[320px] rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute bottom-[-10%] left-[20%] h-[280px] w-[280px] rounded-full bg-sky-400/8 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:72px_72px] opacity-[0.14]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.16),transparent_34%)]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl items-center px-6 py-10 lg:px-10">
        <div className="grid w-full gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
          <section className="hidden lg:block">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(74,222,128,0.9)]" />
                APLISIM Business Console
              </div>

              <h1 className="mt-6 text-5xl font-semibold leading-[1.02] tracking-[-0.04em] text-white">
                Reliable operations.
                <br />
                Structured client work.
              </h1>

              <p className="mt-5 max-w-lg text-[15px] leading-7 text-slate-300">
                Internal access to your APLISIM business workspace for account
                visibility, lead handling, ticket coordination and operational
                workflows.
              </p>

              <div className="mt-10 grid gap-4">
                {benefits.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-shell border border-white/8 bg-white/[0.045] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-sm"
                  >
                    <div className="mb-2 text-sm font-semibold text-white">
                      {item.title}
                    </div>
                    <p className="m-0 text-sm leading-6 text-slate-400">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-3 text-xs text-slate-400">
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                  Protected sessions
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                  Role-based growth
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                  Approval-ready access flow
                </span>
              </div>
            </div>
          </section>

          <section className="w-full">
            <div className="mx-auto w-full max-w-[500px] rounded-shell border border-white/10 bg-[rgba(8,15,30,0.82)] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.42)] backdrop-blur-xl sm:p-8">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex rounded-full border border-indigo-400/20 bg-indigo-400/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-200">
                    APLISIM
                  </div>

                  <h2 className="mt-4 text-[28px] font-semibold leading-[1.08] tracking-[-0.03em] text-white">
                    {view === "login" ? "Sign in" : "Request access"}
                  </h2>

                  <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">
                    {view === "login"
                      ? "Access your dashboard, clients, leads and support workflows from a single secure console."
                      : "Submit your request for internal workspace access and it can be reviewed from the admin panel."}
                  </p>
                </div>

                <div className="hidden rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-right sm:block">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-muted">
                    Status
                  </div>
                  <div className="mt-1 text-sm font-semibold text-emerald-300">
                    Operational
                  </div>
                </div>
              </div>

              {view === "login" ? (
                <>
                  <form onSubmit={handleSubmit} className="grid gap-4" autoComplete="on">
                    <div className="grid gap-2">
                      <label className="text-[13px] font-medium text-slate-300">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="name@company.com"
                        autoComplete="username"
                        className="w-full rounded-2xl border border-white/10 bg-field px-4 py-[14px] text-sm text-white outline-none transition placeholder:text-muted focus:border-indigo-400/50 focus:bg-field-focus"
                      />
                    </div>

                    <div className="grid gap-2">
                      <div className="flex items-center justify-between gap-3">
                        <label className="text-[13px] font-medium text-slate-300">
                          Password
                        </label>
                        <span className="text-[12px] text-muted">
                          Secure access only
                        </span>
                      </div>

                      <input
                        type="password"
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        placeholder="Enter password"
                        autoComplete="current-password"
                        className="w-full rounded-2xl border border-white/10 bg-field px-4 py-[14px] text-sm text-white outline-none transition placeholder:text-muted focus:border-indigo-400/50 focus:bg-field-focus"
                      />
                    </div>

                    {error ? (
                      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                        {error}
                      </div>
                    ) : null}

                    <button
                      type="submit"
                      disabled={loading}
                      className="mt-1 inline-flex items-center justify-center rounded-2xl bg-white px-4 py-[14px] text-sm font-bold text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {loading ? "Signing in..." : "Login"}
                    </button>

                    <Link
                      to="/forgot-password"
                      className="text-center text-sm text-slate-400 transition hover:text-white"
                    >
                      Forgot your password?
                    </Link>
                  </form>

                  <div className="mt-6 rounded-2xl border border-white/8 bg-white/[0.035] p-4">
                    <div className="text-sm font-semibold text-white">
                      Need access to the console?
                    </div>
                    <p className="mt-1 text-sm leading-6 text-slate-400">
                      New users can submit an access request for admin review.
                    </p>

                    <button
                      type="button"
                      onClick={switchToRequestAccess}
                      className="mt-4 inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.07]"
                    >
                      Request access
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={switchToLogin}
                    className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-white"
                  >
                    <span>←</span>
                    <span>Back to sign in</span>
                  </button>

                  <form
                    onSubmit={handleRequestAccessSubmit}
                    className="grid gap-4"
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="grid gap-2">
                        <label className="text-[13px] font-medium text-slate-300">
                          Full name
                        </label>
                        <input
                          type="text"
                          name="fullName"
                          value={requestForm.fullName}
                          onChange={handleRequestChange}
                          placeholder="Name"
                          className="w-full rounded-2xl border border-white/10 bg-field px-4 py-[14px] text-sm text-white outline-none transition placeholder:text-muted focus:border-indigo-400/50 focus:bg-field-focus"
                        />
                      </div>

                      <div className="grid gap-2">
                        <label className="text-[13px] font-medium text-slate-300">
                          Work email
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={requestForm.email}
                          onChange={handleRequestChange}
                          placeholder="name@company.com"
                          className="w-full rounded-2xl border border-white/10 bg-field px-4 py-[14px] text-sm text-white outline-none transition placeholder:text-muted focus:border-indigo-400/50 focus:bg-field-focus"
                        />
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <label className="text-[13px] font-medium text-slate-300">
                        Company
                      </label>
                      <input
                        type="text"
                        name="company"
                        value={requestForm.company}
                        onChange={handleRequestChange}
                        placeholder="Company name"
                        className="w-full rounded-2xl border border-white/10 bg-field px-4 py-[14px] text-sm text-white outline-none transition placeholder:text-muted focus:border-indigo-400/50 focus:bg-field-focus"
                      />
                    </div>

                    <div className="grid gap-2">
                      <label className="text-[13px] font-medium text-slate-300">
                        Message
                      </label>
                      <textarea
                        name="message"
                        value={requestForm.message}
                        onChange={handleRequestChange}
                        placeholder="Tell us why you need access."
                        rows={4}
                        className="w-full resize-none rounded-2xl border border-white/10 bg-field px-4 py-[14px] text-sm text-white outline-none transition placeholder:text-muted focus:border-indigo-400/50 focus:bg-field-focus"
                      />
                    </div>

                    {requestError ? (
                      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                        {requestError}
                      </div>
                    ) : null}

                    {requestSuccess ? (
                      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                        {requestSuccess}
                      </div>
                    ) : null}

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="m-0 text-xs leading-5 text-muted">
                        Requests are saved to the database and available for
                        admin review.
                      </p>

                      <button
                        type="submit"
                        disabled={requestLoading}
                        className="inline-flex items-center justify-center rounded-2xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {requestLoading ? "Sending..." : "Send request"}
                      </button>
                    </div>
                  </form>
                </>
              )}

              <div className="mt-6 flex flex-col gap-2 border-t border-white/8 pt-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
                <span>APLISIM Internal Workspace</span>
                <span>© {currentYear} APLISIM</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}