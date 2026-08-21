import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("APP_RENDER_ERROR:", error, info?.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;

    if (!error) return this.props.children;

    return (
      <div className="grid min-h-screen place-items-center bg-auth px-6 text-white">
        <div className="w-full max-w-[520px] rounded-card border border-white/10 bg-slate-900/70 p-6 shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted">
            Unexpected error
          </div>

          <h1 className="mt-2 text-[20px] font-semibold tracking-[-0.03em]">
            Something went wrong
          </h1>

          <p className="mt-2 text-[12px] leading-5 text-slate-400">
            The screen failed to render. Your data is untouched — reloading
            usually clears it. If it keeps happening, share the message below
            with support.
          </p>

          <pre className="mt-4 max-h-[160px] overflow-auto rounded-xl border border-white/8 bg-field p-3 text-[11px] leading-5 text-slate-300">
            {String(error?.message || error)}
          </pre>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={this.handleReload}
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white px-4 py-2 text-[12px] font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              Reload console
            </button>

            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-[12px] font-medium text-white transition hover:bg-white/[0.08]"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }
}
