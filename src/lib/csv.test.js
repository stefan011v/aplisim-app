import { describe, expect, it } from "vitest";
import { toCsv } from "./csv";

const columns = [
  { label: "Company", value: (row) => row.companyName },
  { label: "Notes", value: (row) => row.notes },
];

describe("toCsv", () => {
  it("writes a header row followed by one line per record", () => {
    const csv = toCsv(columns, [
      { companyName: "APLISIM", notes: "First" },
      { companyName: "Acme", notes: "Second" },
    ]);

    expect(csv.split("\r\n")).toEqual([
      '"Company","Notes"',
      '"APLISIM","First"',
      '"Acme","Second"',
    ]);
  });

  it("escapes embedded quotes by doubling them", () => {
    const csv = toCsv(columns, [{ companyName: 'He said "hi"', notes: "" }]);

    expect(csv).toContain('"He said ""hi"""');
  });

  it("keeps commas and newlines inside a single field", () => {
    const csv = toCsv(columns, [
      { companyName: "Acme, Inc.", notes: "line one\nline two" },
    ]);

    expect(csv).toContain('"Acme, Inc."');
    expect(csv).toContain('"line one\nline two"');
  });

  it("neutralises values a spreadsheet would treat as a formula", () => {
    const csv = toCsv(columns, [{ companyName: "=1+1", notes: "@sum" }]);

    expect(csv).toContain(`"'=1+1"`);
    expect(csv).toContain(`"'@sum"`);
  });

  it("renders missing values as empty cells", () => {
    const csv = toCsv(columns, [{ companyName: null, notes: undefined }]);

    expect(csv.split(String.fromCharCode(13, 10))[1]).toBe(",");
  });
});
