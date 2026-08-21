const isDev = import.meta.env.DEV;

const API_BASE = import.meta.env.VITE_API_BASE || (isDev ? "http://localhost:4000" : "");

if (!API_BASE) {
  throw new Error("VITE_API_BASE is not set");
}

function buildUrl(path) {
  const normalizedBase = API_BASE.endsWith("/") ? API_BASE.slice(0, -1) : API_BASE;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

export function apiUrl(path) {
  return buildUrl(path);
}

const unauthorizedHandlers = new Set();

export function onUnauthorized(handler) {
  unauthorizedHandlers.add(handler);
  return () => unauthorizedHandlers.delete(handler);
}

// Login failures and the initial session probe are expected 401s, not expiries.
const SESSION_PROBE_PATHS = ["/api/auth/login", "/api/auth/me", "/api/auth/logout"];

function notifySessionExpired(path) {
  if (SESSION_PROBE_PATHS.some((probe) => path.startsWith(probe))) return;

  for (const handler of unauthorizedHandlers) {
    try {
      handler();
    } catch (handlerError) {
      console.error("UNAUTHORIZED_HANDLER_ERROR:", handlerError);
    }
  }
}

export async function apiFetch(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  const hasBody = options.body !== undefined && options.body !== null;

  const response = await fetch(buildUrl(path), {
    credentials: "include",
    ...options,
    headers: {
      Accept: "application/json",
      ...(hasBody && !isFormData ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
  });

  const contentType = response.headers.get("content-type") || "";

  let data;
  if (contentType.includes("application/json")) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    if (response.status === 401) {
      notifySessionExpired(path);
    }

    const error = new Error(
      (data && typeof data === "object" && data.message) || "Request failed"
    );
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}
