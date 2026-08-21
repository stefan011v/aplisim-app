import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BuildingOffice2Icon,
  MagnifyingGlassIcon,
  RectangleStackIcon,
  TicketIcon,
} from "@heroicons/react/24/outline";
import { apiFetch } from "../lib/api";
import { useModalBehavior } from "../hooks/useModalBehavior";

const RESULTS_PER_GROUP = 5;
const STALE_AFTER_MS = 60000;

const GROUP_ORDER = ["clients", "leads", "tickets"];

const GROUP_META = {
  clients: { label: "Clients", icon: BuildingOffice2Icon },
  leads: { label: "Leads", icon: RectangleStackIcon },
  tickets: { label: "Tickets", icon: TicketIcon },
};

function haystack(values) {
  return values.filter(Boolean).join(" ").toLowerCase();
}

function matches(entry, term) {
  if (term.startsWith("#")) {
    const wanted = term.slice(1).trim();
    return wanted ? String(entry.id) === wanted : false;
  }

  return entry.haystack.includes(term);
}

function toClientEntry(client) {
  return {
    id: client.id,
    group: "clients",
    to: `/clients/${client.id}`,
    title: client.companyName || `Client #${client.id}`,
    subtitle: [client.contactName, client.email, client.city]
      .filter(Boolean)
      .join(" - "),
    badge: client.status,
    haystack: haystack([
      client.companyName,
      client.contactName,
      client.email,
      client.phone,
      client.city,
      client.packageName,
      client.primaryService,
    ]),
  };
}

function toLeadEntry(lead) {
  return {
    id: lead.id,
    group: "leads",
    to: `/leads/${lead.id}`,
    title: lead.title || `Lead #${lead.id}`,
    subtitle: [lead.companyName, lead.contactName, lead.email]
      .filter(Boolean)
      .join(" - "),
    badge: lead.status,
    haystack: haystack([
      lead.title,
      lead.companyName,
      lead.contactName,
      lead.email,
      lead.phone,
      lead.source,
    ]),
  };
}

function toTicketEntry(ticket) {
  return {
    id: ticket.id,
    group: "tickets",
    to: `/tickets/${ticket.id}`,
    title: ticket.title || `Ticket #${ticket.id}`,
    subtitle: [`#${ticket.id}`, ticket.client?.companyName, ticket.assignedTo]
      .filter(Boolean)
      .join(" - "),
    badge: ticket.status,
    haystack: haystack([
      ticket.title,
      ticket.description,
      ticket.assignedTo,
      ticket.category,
      ticket.client?.companyName,
      ticket.contact?.fullName,
    ]),
  };
}

export default function GlobalSearch({ user, open, onClose }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const loadedAtRef = useRef(0);

  // The palette manages its own initial focus on the query field.
  const panelRef = useModalBehavior(open, onClose, { autoFocus: false });

  const [term, setTerm] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [entries, setEntries] = useState([]);

  const clientView = user?.role === "client";

  const load = useCallback(async () => {
    if (Date.now() - loadedAtRef.current < STALE_AFTER_MS) return;

    try {
      setLoading(true);
      setError("");

      const requests = clientView
        ? [Promise.resolve([]), Promise.resolve([]), apiFetch("/api/tickets")]
        : [
            apiFetch("/api/clients"),
            apiFetch("/api/leads"),
            apiFetch("/api/tickets"),
          ];

      const [clients, leads, tickets] = await Promise.all(requests);

      setEntries([
        ...(clients || []).map(toClientEntry),
        ...(leads || []).map(toLeadEntry),
        ...(tickets || []).map(toTicketEntry),
      ]);

      loadedAtRef.current = Date.now();
    } catch (err) {
      setError(err.message || "Failed to load search data");
    } finally {
      setLoading(false);
    }
  }, [clientView]);

  useEffect(() => {
    if (!open) return undefined;

    setTerm("");
    setActiveIndex(0);
    load();

    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(focusTimer);
  }, [open, load]);

  const groups = useMemo(() => {
    const trimmed = term.trim().toLowerCase();
    if (!trimmed) return [];

    const buckets = new Map();

    for (const entry of entries) {
      if (!matches(entry, trimmed)) continue;

      const bucket = buckets.get(entry.group) || [];
      if (bucket.length < RESULTS_PER_GROUP) {
        bucket.push(entry);
        buckets.set(entry.group, bucket);
      }
    }

    return GROUP_ORDER.filter((group) => buckets.get(group)?.length).map(
      (group) => ({
        group,
        ...GROUP_META[group],
        items: buckets.get(group),
      })
    );
  }, [entries, term]);

  const flatResults = useMemo(
    () => groups.flatMap((section) => section.items),
    [groups]
  );

  useEffect(() => {
    setActiveIndex(0);
  }, [term]);

  const goTo = useCallback(
    (entry) => {
      if (!entry) return;
      onClose();
      navigate(entry.to);
    },
    [navigate, onClose]
  );

  function handleKeyDown(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) =>
        flatResults.length ? (prev + 1) % flatResults.length : 0
      );
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) =>
        flatResults.length
          ? (prev - 1 + flatResults.length) % flatResults.length
          : 0
      );
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      goTo(flatResults[activeIndex]);
    }
  }

  if (!open) return null;

  let cursor = -1;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Search workspace"
    >
      <div
        className="absolute inset-0 bg-black/65 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        ref={panelRef}
        className="relative w-full max-w-[640px] overflow-hidden rounded-card border border-white/10 bg-field shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
      >
        <div className="flex items-center gap-2.5 border-b border-white/8 px-4 py-3">
          <MagnifyingGlassIcon className="h-4 w-4 shrink-0 text-muted" />
          <input
            ref={inputRef}
            type="text"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              clientView
                ? "Search your tickets, or #id..."
                : "Search clients, leads, tickets, or #id..."
            }
            aria-label="Search query"
            className="w-full bg-transparent text-[13px] text-white outline-none placeholder:text-muted"
          />
          <kbd className="hidden shrink-0 rounded-lg border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[9px] text-slate-400 sm:block">
            ESC
          </kbd>
        </div>

        <div className="max-h-[52vh] overflow-y-auto p-2">
          {error ? (
            <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2.5 text-[11px] text-red-200">
              {error}
            </div>
          ) : null}

          {!error && loading && !entries.length ? (
            <div className="px-3 py-4 text-[11px] text-slate-400">
              Loading workspace data...
            </div>
          ) : null}

          {!error && !loading && !term.trim() ? (
            <div className="px-3 py-4 text-[11px] leading-5 text-slate-400">
              Start typing to search across
              {clientView ? " your tickets" : " clients, leads and tickets"}.
              <br />
              Use <span className="text-slate-300">#42</span> to jump straight to
              a record id.
            </div>
          ) : null}

          {!error && term.trim() && !flatResults.length && !loading ? (
            <div className="px-3 py-4 text-[11px] text-slate-400">
              No matches found.
            </div>
          ) : null}

          {groups.map((section) => {
            const Icon = section.icon;

            return (
              <div key={section.group} className="mb-2 last:mb-0">
                <div className="px-3 py-1.5 text-[9px] uppercase tracking-[0.14em] text-muted">
                  {section.label}
                </div>

                <div className="space-y-1">
                  {section.items.map((entry) => {
                    cursor += 1;
                    const index = cursor;
                    const isActive = index === activeIndex;

                    return (
                      <button
                        key={`${entry.group}-${entry.id}`}
                        type="button"
                        onClick={() => goTo(entry)}
                        onMouseEnter={() => setActiveIndex(index)}
                        className={`flex w-full items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition ${
                          isActive
                            ? "border-white/15 bg-white/[0.07]"
                            : "border-transparent hover:bg-white/[0.04]"
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0 text-slate-400" />

                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[12px] text-white">
                            {entry.title}
                          </div>
                          {entry.subtitle ? (
                            <div className="truncate text-[10px] text-muted">
                              {entry.subtitle}
                            </div>
                          ) : null}
                        </div>

                        {entry.badge ? (
                          <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[9px] uppercase tracking-[0.08em] text-slate-300">
                            {String(entry.badge).replace(/_/g, " ")}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between border-t border-white/8 px-4 py-2 text-[9px] text-muted">
          <span>Arrow keys to navigate, Enter to open</span>
          <span>
            {flatResults.length} result{flatResults.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>
    </div>
  );
}
