export const EMPTY = "—";

const DATE_OPTIONS = {
  day: "2-digit",
  month: "short",
  year: "numeric",
};

const TIME_OPTIONS = {
  hour: "2-digit",
  minute: "2-digit",
};

function toDate(value) {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** "09 Feb 2026" */
export function formatDate(value) {
  const date = toDate(value);
  return date ? date.toLocaleDateString("en-GB", DATE_OPTIONS) : EMPTY;
}

/** "09 Feb 2026, 14:35" */
export function formatDateTime(value) {
  const date = toDate(value);

  return date
    ? date.toLocaleString("en-GB", { ...DATE_OPTIONS, ...TIME_OPTIONS })
    : EMPTY;
}

export function formatCurrency(value) {
  if (value === null || value === undefined || value === "") return EMPTY;

  const amount = Number(value);
  if (Number.isNaN(amount)) return EMPTY;

  return `€${amount.toLocaleString("en-GB")}`;
}

/** Turns a stored value such as "waiting_client" into "Waiting client". */
export function humanize(value) {
  if (!value) return EMPTY;

  const text = String(value).replace(/[_-]+/g, " ").trim();
  if (!text) return EMPTY;

  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function labelFor(options, value, fallback = EMPTY) {
  return options.find((item) => item.value === value)?.label || value || fallback;
}
