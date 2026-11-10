export const API_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

function authHeaders(token) {
  return token ? { Authorization: "Bearer " + token } : {};
}

function responseMessage(data, fallback) {
  const detail = data?.detail;
  return Array.isArray(detail)
    ? detail.map((item) => `${item.loc?.slice(1).join(".") || "Input"}: ${item.msg}`).join(" ")
    : typeof detail === "string" ? detail : fallback;
}

async function fetchWithAuth(path, { token, signal, ...options } = {}) {
  try {
    return await fetch(`${API_URL}${path}`, {
      ...options,
      signal,
      headers: { ...options.headers, ...authHeaders(token) },
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error("Unable to reach the server. Check that the backend is running.");
  }
}

export async function apiRequest(path, options = {}) {
  const response = await fetchWithAuth(path, options);
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(responseMessage(data, "The request failed. Please try again."));
  return data;
}

export async function apiBlob(path, options = {}) {
  const response = await fetchWithAuth(path, options);
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(responseMessage(data, "Unable to download the document."));
  }
  return response.blob();
}
