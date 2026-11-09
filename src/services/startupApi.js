const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

export async function getStartupJobs(startupId, signal) {
  const response = await fetch(`${API_BASE}/startups/${encodeURIComponent(startupId)}/jobs`, { signal });
  if (!response.ok) {
    throw new Error(response.status === 404
      ? "This startup is no longer available. Refresh the directory."
      : "Unable to load jobs. Check the backend connection and try again.");
  }
  const data = await response.json();
  if (!Array.isArray(data.jobs)) throw new Error("The backend returned an invalid jobs response.");
  return data;
}
