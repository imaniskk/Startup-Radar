export const API_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

export async function apiRequest(path, { token, signal, ...options } = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      signal,
      headers: { ...options.headers, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error("Unable to reach the server. Check that the backend is running.");
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.detail || "The request failed. Please try again.");
  return data;
}
