// lib/apiClient.js
export function getAuthHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

export async function safeJsonFetch(url, opts = {}) {
  const fetchOpts = {
    credentials: "same-origin",
    ...opts,
    headers: { ...(opts.headers || {}), ...(getAuthHeaders()) },
  };

  const res = await fetch(url, fetchOpts);
  const text = await res.text();
  try {
    const data = JSON.parse(text || "{}");
    if (!res.ok) throw { status: res.status, data };
    return { ok: true, data };
  } catch (err) {
    // If we couldn't parse JSON, return error with raw text
    if (err && err.status) throw err;
    throw { status: res.status, raw: text || "", message: "Invalid JSON from server" };
  }
}