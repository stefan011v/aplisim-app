import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

export const DEFAULT_PAGE_SIZE = 25;

/**
 * Keeps list filters in the URL so a filtered view can be bookmarked, shared
 * and restored by the browser back button.
 */
export function useListControls({
  defaultSort = "createdAt",
  defaultOrder = "desc",
  pageSize = DEFAULT_PAGE_SIZE,
  extraFilters = [],
} = {}) {
  const [searchParams, setSearchParams] = useSearchParams();

  const query = searchParams.get("q") || "";
  const statusFilter = searchParams.get("status") || "all";
  const sort = searchParams.get("sort") || defaultSort;
  const order = searchParams.get("order") === "asc" ? "asc" : "desc";

  const parsedPage = Number(searchParams.get("page"));
  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const filters = useMemo(() => {
    const result = {};

    for (const name of extraFilters) {
      result[name] = searchParams.get(name) || "all";
    }

    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, extraFilters.join(",")]);

  const update = useCallback(
    (changes, { resetPage = true } = {}) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);

          for (const [key, value] of Object.entries(changes)) {
            const isDefault =
              value === "" ||
              value === "all" ||
              value === null ||
              value === undefined ||
              (key === "sort" && value === defaultSort) ||
              (key === "order" && value === defaultOrder) ||
              (key === "page" && value === 1);

            if (isDefault) {
              next.delete(key);
            } else {
              next.set(key, String(value));
            }
          }

          if (resetPage && !("page" in changes)) {
            next.delete("page");
          }

          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams, defaultSort, defaultOrder]
  );

  const toggleSort = useCallback(
    (field) => {
      if (field === sort) {
        update({ order: order === "asc" ? "desc" : "asc" }, { resetPage: false });
        return;
      }

      update({ sort: field, order: "asc" });
    },
    [sort, order, update]
  );

  const reset = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  const hasActiveFilters =
    Boolean(query) ||
    statusFilter !== "all" ||
    Object.values(filters).some((value) => value !== "all");

  return {
    query,
    statusFilter,
    filters,
    sort,
    order,
    page,
    pageSize,
    hasActiveFilters,
    setQuery: (value) => update({ q: value }),
    setStatusFilter: (value) => update({ status: value }),
    setFilter: (name, value) => update({ [name]: value }),
    setPage: (value) => update({ page: value }, { resetPage: false }),
    toggleSort,
    reset,
  };
}

function isEmpty(value) {
  return value === null || value === undefined || value === "";
}

function compareValues(a, b) {
  if (a === b) return 0;

  if (typeof a === "number" && typeof b === "number") return a - b;

  return String(a).localeCompare(String(b), undefined, { numeric: true });
}

export function sortRows(rows, sort, order, accessors = {}) {
  const read = accessors[sort] || ((row) => row[sort]);
  const direction = order === "asc" ? 1 : -1;

  return [...rows].sort((rowA, rowB) => {
    const a = read(rowA);
    const b = read(rowB);

    // Blanks always sink to the bottom, whichever way the column is sorted.
    if (isEmpty(a) && isEmpty(b)) return 0;
    if (isEmpty(a)) return 1;
    if (isEmpty(b)) return -1;

    return compareValues(a, b) * direction;
  });
}

export function paginate(rows, page, pageSize) {
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    items: rows.slice(start, start + pageSize),
    page: safePage,
    totalPages,
    total: rows.length,
    from: rows.length ? start + 1 : 0,
    to: Math.min(start + pageSize, rows.length),
  };
}
