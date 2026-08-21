import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { accessStatusClasses, prettyAccessStatus } from "../lib/domain";
import { formatDateTime } from "../lib/format";
import { useAutoDismiss } from "../hooks/useAutoDismiss";

function buildHistoryItems(item) {
  const items = [];

  if (item?.createdAt) {
    items.push({
      id: "created",
      title: "Request submitted",
      meta: formatDateTime(item.createdAt),
      tone: "default",
    });
  }

  if (item?.status === "reviewing") {
    items.push({
      id: "reviewing",
      title: "Moved to reviewing",
      meta: item.reviewedAt
        ? `${formatDateTime(item.reviewedAt)}${
            item.reviewedBy ? ` • by ${item.reviewedBy}` : ""
          }`
        : item.reviewedBy
        ? `by ${item.reviewedBy}`
        : "Marked for review",
      tone: "reviewing",
    });
  }

  if (item?.status === "approved") {
    items.push({
      id: "approved",
      title: "Approved",
      meta: item.reviewedAt
        ? `${formatDateTime(item.reviewedAt)}${
            item.reviewedBy ? ` • by ${item.reviewedBy}` : ""
          }`
        : item.reviewedBy
        ? `by ${item.reviewedBy}`
        : "Approved",
      tone: "approved",
    });
  }

  if (item?.status === "rejected") {
    items.push({
      id: "rejected",
      title: "Rejected",
      meta: item.reviewedAt
        ? `${formatDateTime(item.reviewedAt)}${
            item.reviewedBy ? ` • by ${item.reviewedBy}` : ""
          }`
        : item.reviewedBy
        ? `by ${item.reviewedBy}`
        : "Rejected",
      tone: "rejected",
    });
  }

  if (item?.client?.id) {
    items.push({
      id: "client-linked",
      title: "Converted to client",
      meta: item.client.companyName || `Client #${item.client.id}`,
      tone: "approved",
    });
  }

  return items;
}

function replaceRequestInList(items, updatedRequest) {
  return items.map((item) => (item.id === updatedRequest.id ? updatedRequest : item));
}

export default function AccessRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useAutoDismiss(notice, setNotice);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [createdLoginInfo, setCreatedLoginInfo] = useState(null);

  const [convertForm, setConvertForm] = useState({
    companyName: "",
    contactName: "",
    email: "",
    notes: "",
  });

  const selectionRef = useRef({ id: null, drawerOpen: false });

  useEffect(() => {
    selectionRef.current = {
      id: selectedRequest?.id ?? null,
      drawerOpen,
    };
  }, [selectedRequest, drawerOpen]);

  const loadRequests = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      setError("");
      setNotice("");

      const data = await apiFetch("/api/access-requests");
      setRequests(data.accessRequests || []);

      const selection = selectionRef.current;

      if (selection.id) {
        const updatedSelected = (data.accessRequests || []).find(
          (item) => item.id === selection.id
        );
        setSelectedRequest(updatedSelected || null);

        if (!updatedSelected && selection.drawerOpen) {
          setDrawerOpen(false);
        }
      }
    } catch (err) {
      setError(err.message || "Failed to load access requests");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  function syncUpdatedRequest(updatedRequest) {
    setRequests((prev) => replaceRequestInList(prev, updatedRequest));

    setSelectedRequest((prev) => {
      if (!prev || prev.id !== updatedRequest.id) return prev;
      return updatedRequest;
    });
  }

  async function changeStatus(id, status) {
    try {
      setActionLoadingId(id);
      setError("");
      setNotice("");
      setCreatedLoginInfo(null);

      const data = await apiFetch(`/api/access-requests/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });

      if (data?.accessRequest) {
        syncUpdatedRequest(data.accessRequest);
      }

      setNotice(data?.message || "Status updated successfully");
    } catch (err) {
      setError(err.message || "Failed to update status");
    } finally {
      setActionLoadingId(null);
    }
  }

  function openDrawer(item) {
    setSelectedRequest(item);
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
  }

  function openConvertModal(item) {
    setError("");
    setNotice("");
    setCreatedLoginInfo(null);
    setSelectedRequest(item);
    setConvertForm({
      companyName: item.company || item.fullName || "",
      contactName: item.fullName || "",
      email: item.email || "",
      notes: item.message || "Created from access request",
    });
    setConvertModalOpen(true);
  }

  function closeConvertModal() {
    setConvertModalOpen(false);
    setConvertForm({
      companyName: "",
      contactName: "",
      email: "",
      notes: "",
    });
  }

  function handleConvertFormChange(e) {
    setConvertForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  async function handleConvertSubmit(e) {
    e.preventDefault();

    if (!selectedRequest) return;

    try {
      setActionLoadingId(selectedRequest.id);
      setError("");
      setNotice("");
      setCreatedLoginInfo(null);

      const data = await apiFetch(
        `/api/access-requests/${selectedRequest.id}/convert-to-client`,
        {
          method: "POST",
          body: JSON.stringify(convertForm),
        }
      );

      if (data?.accessRequest) {
        syncUpdatedRequest(data.accessRequest);
      }

      if (data?.login) {
        setCreatedLoginInfo(data.login);
      }

      closeConvertModal();

      if (data?.login?.emailSent) {
        setNotice(
          `Client created and login email sent to ${data.login.email}.`
        );
      } else if (data?.login?.temporaryPassword) {
        setNotice(
          `Client created, but email sending failed. Share the login manually with ${data.login.email}.`
        );
      } else {
        setNotice(data?.message || "Client created successfully");
      }
    } catch (err) {
      setCreatedLoginInfo(null);
      setError(err.message || "Failed to convert request to client");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleDelete(item) {
    const confirmed = window.confirm(
      `Delete access request from "${item.fullName}"? This removes only the request from the database, not any created client.`
    );

    if (!confirmed) return;

    try {
      setActionLoadingId(item.id);
      setError("");
      setNotice("");
      setCreatedLoginInfo(null);

      await apiFetch(`/api/access-requests/${item.id}`, {
        method: "DELETE",
      });

      setRequests((prev) => prev.filter((request) => request.id !== item.id));

      if (selectedRequest?.id === item.id) {
        setDrawerOpen(false);
        setSelectedRequest(null);
      }

      setNotice("Access request deleted successfully");
    } catch (err) {
      setError(err.message || "Failed to delete request");
    } finally {
      setActionLoadingId(null);
    }
  }

  const filteredRequests = useMemo(() => {
    return requests.filter((item) => {
      const matchesQuery =
        !query.trim() ||
        [
          item.fullName,
          item.email,
          item.company,
          item.message,
          item.reviewedBy,
          item.client?.companyName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ? true : item.status === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [requests, query, statusFilter]);

  const stats = useMemo(() => {
    return requests.reduce(
      (acc, item) => {
        acc.total += 1;

        if (item.status === "approved") acc.approved += 1;
        else if (item.status === "rejected") acc.rejected += 1;
        else if (item.status === "reviewing") acc.reviewing += 1;
        else acc.new += 1;

        return acc;
      },
      { total: 0, new: 0, reviewing: 0, approved: 0, rejected: 0 }
    );
  }, [requests]);

  const historyItems = useMemo(
    () => buildHistoryItems(selectedRequest),
    [selectedRequest]
  );

  return (
    <div className="w-full p-3 text-white sm:p-4 lg:p-5">
      <div className="mx-auto max-w-[1700px]">
        <div className="relative overflow-hidden rounded-shell border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-4 shadow-[0_18px_50px_rgba(0,0,0,0.24)] sm:px-5 sm:py-5">
          <div className="relative z-10 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[9px] uppercase tracking-[0.16em] text-slate-300">
                Access control
              </div>

              <h1 className="mt-3 text-[24px] font-semibold tracking-[-0.05em] text-white sm:text-[26px]">
                Access Requests
              </h1>

              <p className="mt-1.5 max-w-3xl text-[11px] leading-5 text-slate-400 sm:text-[12px]">
                Review incoming requests, update status and convert serious
                contacts into clients.
              </p>
            </div>

            <button
              type="button"
              onClick={() => loadRequests(true)}
              disabled={refreshing}
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] font-semibold text-white transition hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-[12px] text-red-200">
            {error}
          </div>
        ) : null}

        {!error && notice ? (
          <div className="mt-4 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-[12px] text-emerald-200">
            {notice}
          </div>
        ) : null}

        {!error && createdLoginInfo && !createdLoginInfo.emailSent ? (
          <div className="mt-4 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-[12px] text-amber-100">
            <div className="font-semibold text-white">Manual login details</div>
            <div className="mt-2">Email: {createdLoginInfo.email}</div>
            <div className="mt-1">
              Temporary password: {createdLoginInfo.temporaryPassword}
            </div>
          </div>
        ) : null}

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Total requests" value={stats.total} />
          <StatCard label="New" value={stats.new} />
          <StatCard label="Reviewing" value={stats.reviewing} />
          <StatCard label="Approved" value={stats.approved} />
          <StatCard label="Rejected" value={stats.rejected} />
        </div>

        <div className="mt-4 rounded-card border border-white/8 bg-slate-900/70 p-4 shadow-[0_10px_32px_rgba(0,0,0,0.18)] backdrop-blur-sm sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-[15px] font-semibold text-white sm:text-[16px]">
                Incoming requests
              </h2>
              <p className="mt-1 text-[11px] leading-5 text-slate-400 sm:text-[12px]">
                Manage requests and convert serious contacts into client records.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, email, company..."
                className="h-9 min-w-0 rounded-xl border border-white/8 bg-field px-3 text-[12px] text-white outline-none placeholder:text-muted focus:border-white/15 sm:w-[260px]"
              />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 rounded-xl border border-white/8 bg-field px-3 text-[12px] text-white outline-none focus:border-white/15"
              >
                <option value="all">All statuses</option>
                <option value="new">New</option>
                <option value="reviewing">Reviewing</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="mt-4 rounded-xl border border-dashed border-white/8 bg-white/[0.02] px-4 py-5 text-[12px] text-slate-400">
              Loading access requests...
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-white/8 bg-white/[0.02] px-4 py-5 text-[12px] text-slate-400">
              No access requests found.
            </div>
          ) : (
            <div className="mt-4 overflow-hidden rounded-card border border-white/8">
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="border-b border-white/8 bg-white/[0.03] text-left">
                      <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                        Requester
                      </th>
                      <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                        Company
                      </th>
                      <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                        Message
                      </th>
                      <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                        Status
                      </th>
                      <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                        Client
                      </th>
                      <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                        Submitted
                      </th>
                      <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredRequests.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-white/8 bg-slate-950/20 align-top transition last:border-b-0 hover:bg-white/[0.025]"
                      >
                        <td className="px-4 py-4">
                          <button
                            type="button"
                            onClick={() => openDrawer(item)}
                            className="min-w-[220px] text-left"
                          >
                            <div className="text-[13px] font-semibold text-white transition hover:text-indigo-300">
                              {item.fullName || "—"}
                            </div>
                            <div className="mt-1 text-[12px] text-slate-400">
                              {item.email || "—"}
                            </div>
                          </button>
                        </td>

                        <td className="px-4 py-4">
                          <div className="min-w-[150px] text-[12px] text-slate-300">
                            {item.company || "—"}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="min-w-[220px] max-w-[340px] whitespace-pre-wrap text-[12px] leading-6 text-slate-300">
                            {item.message || "—"}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full border px-1.5 py-[3px] text-[9px] font-medium leading-none ${accessStatusClasses(
                              item.status
                            )}`}
                          >
                            {prettyAccessStatus(item.status)}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <div className="min-w-[150px] text-[12px]">
                            {item.client?.id ? (
                              <Link
                                to={`/clients/${item.client.id}`}
                                className="font-medium text-indigo-300 transition hover:text-indigo-200 hover:underline"
                              >
                                {item.client.companyName}
                              </Link>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="min-w-[145px] text-[12px] text-slate-400">
                            {formatDateTime(item.createdAt)}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex min-w-[260px] flex-wrap gap-1">
                            <button
                              type="button"
                              disabled={actionLoadingId === item.id}
                              onClick={() => changeStatus(item.id, "reviewing")}
                              className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[9px] font-medium leading-none text-amber-200 transition hover:bg-amber-500/15 disabled:opacity-60"
                            >
                              Reviewing
                            </button>

                            <button
                              type="button"
                              disabled={actionLoadingId === item.id}
                              onClick={() => changeStatus(item.id, "approved")}
                              className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[9px] font-medium leading-none text-emerald-200 transition hover:bg-emerald-500/15 disabled:opacity-60"
                            >
                              Approve
                            </button>

                            <button
                              type="button"
                              disabled={actionLoadingId === item.id}
                              onClick={() => changeStatus(item.id, "rejected")}
                              className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-2 py-1 text-[9px] font-medium leading-none text-rose-200 transition hover:bg-rose-500/15 disabled:opacity-60"
                            >
                              Reject
                            </button>

                            <button
                              type="button"
                              disabled={
                                actionLoadingId === item.id || !!item.clientId
                              }
                              onClick={() => openConvertModal(item)}
                              className="rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-2 py-1 text-[9px] font-medium leading-none text-indigo-200 transition hover:bg-indigo-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {item.clientId ? "Client created" : "To client"}
                            </button>

                            <button
                              type="button"
                              disabled={actionLoadingId === item.id}
                              onClick={() => handleDelete(item)}
                              className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-[9px] font-medium leading-none text-slate-300 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-60"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {convertModalOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-[560px] rounded-shell border border-white/10 bg-field p-5 shadow-[0_30px_100px_rgba(0,0,0,0.45)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex rounded-full border border-indigo-400/20 bg-indigo-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-indigo-200">
                  Convert request
                </div>
                <h3 className="mt-3 text-[22px] font-semibold tracking-[-0.04em] text-white">
                  Create client and login
                </h3>
                <p className="mt-1 text-[12px] leading-5 text-slate-400">
                  This creates a client account, a client user and sends login details by email.
                </p>
              </div>

              <button
                type="button"
                onClick={closeConvertModal}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] font-semibold text-white transition hover:bg-white/[0.07]"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleConvertSubmit} className="mt-5 grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-[12px] font-medium text-slate-300">
                    Company name
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={convertForm.companyName}
                    onChange={handleConvertFormChange}
                    className="w-full rounded-xl border border-white/10 bg-field px-3 py-2.5 text-[12px] text-white outline-none placeholder:text-muted focus:border-white/15"
                  />
                </div>

                <div className="grid gap-2">
                  <label className="text-[12px] font-medium text-slate-300">
                    Contact name
                  </label>
                  <input
                    type="text"
                    name="contactName"
                    value={convertForm.contactName}
                    onChange={handleConvertFormChange}
                    className="w-full rounded-xl border border-white/10 bg-field px-3 py-2.5 text-[12px] text-white outline-none placeholder:text-muted focus:border-white/15"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-[12px] font-medium text-slate-300">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={convertForm.email}
                  onChange={handleConvertFormChange}
                  className="w-full rounded-xl border border-white/10 bg-field px-3 py-2.5 text-[12px] text-white outline-none placeholder:text-muted focus:border-white/15"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-[12px] font-medium text-slate-300">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={convertForm.notes}
                  onChange={handleConvertFormChange}
                  rows={4}
                  className="w-full resize-none rounded-xl border border-white/10 bg-field px-3 py-2.5 text-[12px] text-white outline-none placeholder:text-muted focus:border-white/15"
                />
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[11px] leading-5 text-muted">
                  A temporary password will be generated automatically and sent by email.
                </p>

                <button
                  type="submit"
                  disabled={
                    !selectedRequest || actionLoadingId === selectedRequest.id
                  }
                  className="inline-flex items-center justify-center rounded-xl bg-indigo-500 px-4 py-2.5 text-[12px] font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {selectedRequest && actionLoadingId === selectedRequest.id
                    ? "Creating..."
                    : "Create client"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {drawerOpen && selectedRequest ? (
        <div className="fixed inset-0 z-[95]">
          <div
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
            onClick={closeDrawer}
          />

          <div className="absolute right-0 top-0 h-full w-full max-w-[460px] border-l border-white/10 bg-nav shadow-[-24px_0_60px_rgba(0,0,0,0.35)]">
            <div className="flex h-full flex-col">
              <div className="border-b border-white/8 px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-slate-300">
                      Request details
                    </div>
                    <h3 className="mt-3 text-[22px] font-semibold tracking-[-0.04em] text-white">
                      {selectedRequest.fullName || "Access request"}
                    </h3>
                    <p className="mt-1 text-[12px] text-slate-400">
                      {selectedRequest.email || "—"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={closeDrawer}
                    className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] font-semibold text-white transition hover:bg-white/[0.07]"
                  >
                    Close
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-5">
                <div className="grid gap-4">
                  <DetailCard label="Company" value={selectedRequest.company || "—"} />
                  <DetailCard
                    label="Status"
                    value={
                      <span
                        className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-medium ${accessStatusClasses(
                          selectedRequest.status
                        )}`}
                      >
                        {prettyAccessStatus(selectedRequest.status)}
                      </span>
                    }
                  />
                  <DetailCard
                    label="Submitted"
                    value={formatDateTime(selectedRequest.createdAt)}
                  />
                  <DetailCard
                    label="Reviewed by"
                    value={selectedRequest.reviewedBy || "—"}
                  />
                  <DetailCard
                    label="Reviewed at"
                    value={formatDateTime(selectedRequest.reviewedAt)}
                  />
                  <DetailCard
                    label="Client"
                    value={
                      selectedRequest.client?.id ? (
                        <Link
                          to={`/clients/${selectedRequest.client.id}`}
                          className="font-medium text-indigo-300 hover:text-indigo-200 hover:underline"
                        >
                          {selectedRequest.client.companyName}
                        </Link>
                      ) : (
                        "—"
                      )
                    }
                  />
                  <DetailCard
                    label="Message"
                    value={
                      <div className="whitespace-pre-wrap text-[12px] leading-6 text-slate-200">
                        {selectedRequest.message || "—"}
                      </div>
                    }
                  />

                  <div className="rounded-card border border-white/8 bg-white/[0.03] p-4">
                    <div className="text-[10px] uppercase tracking-[0.14em] text-muted">
                      History
                    </div>

                    <div className="mt-4 space-y-3">
                      {historyItems.length === 0 ? (
                        <div className="text-[12px] text-slate-400">
                          No activity recorded yet.
                        </div>
                      ) : (
                        historyItems.map((entry) => (
                          <div
                            key={entry.id}
                            className="flex gap-3 rounded-2xl border border-white/8 bg-white/[0.02] px-3 py-3"
                          >
                            <div
                              className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                                entry.tone === "approved"
                                  ? "bg-emerald-400"
                                  : entry.tone === "rejected"
                                  ? "bg-rose-400"
                                  : entry.tone === "reviewing"
                                  ? "bg-amber-400"
                                  : "bg-indigo-400"
                              }`}
                            />
                            <div className="min-w-0">
                              <div className="text-[12px] font-medium text-white">
                                {entry.title}
                              </div>
                              <div className="mt-1 text-[11px] leading-5 text-slate-400">
                                {entry.meta}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <p className="mt-4 text-[11px] leading-5 text-muted">
                      Deleting a request here removes only the request record. Any
                      created client remains available in Clients.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/8 px-5 py-4">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={actionLoadingId === selectedRequest.id}
                    onClick={() =>
                      changeStatus(selectedRequest.id, "reviewing")
                    }
                    className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-2.5 py-1.5 text-[10px] font-medium text-amber-200 transition hover:bg-amber-500/15 disabled:opacity-60"
                  >
                    Reviewing
                  </button>

                  <button
                    type="button"
                    disabled={actionLoadingId === selectedRequest.id}
                    onClick={() =>
                      changeStatus(selectedRequest.id, "approved")
                    }
                    className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1.5 text-[10px] font-medium text-emerald-200 transition hover:bg-emerald-500/15 disabled:opacity-60"
                  >
                    Approve
                  </button>

                  <button
                    type="button"
                    disabled={actionLoadingId === selectedRequest.id}
                    onClick={() =>
                      changeStatus(selectedRequest.id, "rejected")
                    }
                    className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-2.5 py-1.5 text-[10px] font-medium text-rose-200 transition hover:bg-rose-500/15 disabled:opacity-60"
                  >
                    Reject
                  </button>

                  <button
                    type="button"
                    disabled={
                      actionLoadingId === selectedRequest.id ||
                      !!selectedRequest.clientId
                    }
                    onClick={() => openConvertModal(selectedRequest)}
                    className="rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1.5 text-[10px] font-medium text-indigo-200 transition hover:bg-indigo-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {selectedRequest.clientId ? "Client created" : "To client"}
                  </button>

                  <button
                    type="button"
                    disabled={actionLoadingId === selectedRequest.id}
                    onClick={() => handleDelete(selectedRequest)}
                    className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[10px] font-medium text-slate-300 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-60"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-card border border-white/8 bg-slate-900/70 p-4">
      <div className="text-[11px] uppercase tracking-[0.14em] text-slate-400">
        {label}
      </div>
      <div className="mt-2 text-[24px] font-semibold tracking-[-0.04em] text-white">
        {value}
      </div>
    </div>
  );
}

function DetailCard({ label, value }) {
  return (
    <div className="rounded-card border border-white/8 bg-white/[0.03] p-4">
      <div className="text-[10px] uppercase tracking-[0.14em] text-muted">
        {label}
      </div>
      <div className="mt-2 text-[12px] text-slate-200">{value}</div>
    </div>
  );
}