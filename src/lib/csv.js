function escapeCell(value) {
  if (value === null || value === undefined) return "";

  const text = String(value);

  // A leading =, +, - or @ makes spreadsheet software treat the cell as a
  // formula, so those are prefixed with a quote before quoting the field.
  const guarded = /^[=+\-@]/.test(text) ? `'${text}` : text;

  return `"${guarded.replace(/"/g, '""')}"`;
}

export function toCsv(columns, rows) {
  const header = columns.map((column) => escapeCell(column.label)).join(",");

  const body = rows.map((row) =>
    columns.map((column) => escapeCell(column.value(row))).join(",")
  );

  return [header, ...body].join("\r\n");
}

export function downloadCsv(filename, columns, rows) {
  // The BOM keeps Excel from mangling non-ASCII characters.
  const blob = new Blob(["﻿", toCsv(columns, rows)], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

export function timestampedFilename(prefix) {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");

  return `${prefix}-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(
    now.getDate()
  )}-${pad(now.getHours())}${pad(now.getMinutes())}.csv`;
}
