import { useEffect, useRef } from "react";


const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/**
 * Gives an overlay the behaviour keyboard and screen reader users expect:
 * Escape closes it, Tab stays inside it, the page behind stops scrolling, and
 * focus returns to whatever opened it.
 */
export function useModalBehavior(open, onClose, { autoFocus = true } = {}) {
  const containerRef = useRef(null);
  const previouslyFocusedRef = useRef(null);

  // Callers usually pass an inline handler, so the latest one is kept in a ref
  // instead of the dependency list: otherwise the overlay would re-mount its
  // listeners and steal focus back on every render.
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return undefined;

    previouslyFocusedRef.current = document.activeElement;

    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = "hidden";

    function focusableItems() {
      if (!containerRef.current) return [];

      return Array.from(
        containerRef.current.querySelectorAll(FOCUSABLE_SELECTOR)
      ).filter((node) => node.offsetParent !== null);
    }

    if (autoFocus) {
      const first = focusableItems()[0];
      if (first) first.focus();
    }

    function handleKeyDown(e) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (e.key !== "Tab") return;

      const items = focusableItems();
      if (!items.length) return;

      const first = items[0];
      const last = items[items.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      body.style.overflow = previousOverflow;

      const previous = previouslyFocusedRef.current;
      if (previous && typeof previous.focus === "function") {
        previous.focus();
      }
    };
  }, [open, autoFocus]);

  return containerRef;
}
