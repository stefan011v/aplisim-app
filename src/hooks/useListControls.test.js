import { describe, expect, it } from "vitest";
import { paginate, sortRows } from "./useListControls";

const rows = [
  { id: 1, name: "Charlie", value: 30, createdAt: "2026-01-03" },
  { id: 2, name: "alpha", value: 100, createdAt: "2026-01-01" },
  { id: 3, name: "Bravo", value: null, createdAt: "2026-01-02" },
];

describe("sortRows", () => {
  it("sorts text case-insensitively in ascending order", () => {
    const sorted = sortRows(rows, "name", "asc");

    expect(sorted.map((row) => row.name)).toEqual([
      "alpha",
      "Bravo",
      "Charlie",
    ]);
  });

  it("sorts numbers numerically rather than lexicographically", () => {
    const sorted = sortRows(rows, "value", "asc");

    expect(sorted.map((row) => row.value)).toEqual([30, 100, null]);
  });

  it("pushes empty values to the end regardless of direction", () => {
    expect(sortRows(rows, "value", "asc").at(-1).value).toBeNull();
    expect(sortRows(rows, "value", "desc").at(-1).value).toBeNull();
  });

  it("does not mutate the input array", () => {
    const original = [...rows];
    sortRows(rows, "name", "desc");

    expect(rows).toEqual(original);
  });

  it("supports custom accessors for nested fields", () => {
    const nested = [{ client: { name: "B" } }, { client: { name: "A" } }];

    const sorted = sortRows(nested, "clientName", "asc", {
      clientName: (row) => row.client.name,
    });

    expect(sorted[0].client.name).toBe("A");
  });
});

describe("paginate", () => {
  it("returns the requested slice with human friendly bounds", () => {
    const result = paginate([1, 2, 3, 4, 5], 2, 2);

    expect(result.items).toEqual([3, 4]);
    expect(result.from).toBe(3);
    expect(result.to).toBe(4);
    expect(result.totalPages).toBe(3);
  });

  it("clamps a page beyond the end back to the last page", () => {
    const result = paginate([1, 2, 3], 9, 2);

    expect(result.page).toBe(2);
    expect(result.items).toEqual([3]);
  });

  it("reports an empty range for an empty list", () => {
    const result = paginate([], 1, 25);

    expect(result.items).toEqual([]);
    expect(result.from).toBe(0);
    expect(result.to).toBe(0);
    expect(result.totalPages).toBe(1);
  });
});
