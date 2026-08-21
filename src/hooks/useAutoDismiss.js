import { useEffect } from "react";

export const DEFAULT_DISMISS_MS = 6000;

/**
 * Clears a transient success message after a delay so confirmation banners do
 * not linger on the screen until the next action happens to overwrite them.
 * Errors are intentionally left to the caller: those should stay until the
 * user acts on them.
 */
export function useAutoDismiss(value, clear, delay = DEFAULT_DISMISS_MS) {
  useEffect(() => {
    if (!value) return undefined;

    const timer = window.setTimeout(() => clear(""), delay);
    return () => window.clearTimeout(timer);
    // `clear` is a state setter, which React keeps stable across renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, delay]);
}
