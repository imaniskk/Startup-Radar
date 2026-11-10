import { useEffect, useRef, useState } from "react";
import { apiRequest } from "../lib/api";

export default function useSavedStartups(session) {
  const [savedEntries, setSavedEntries] = useState([]);
  const [savedLoading, setLoading] = useState(!!session);
  const [savedError, setError] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const busy = useRef(false);
  const token = session?.access_token;
  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    setLoading(true);
    apiRequest("/account/saved-startups", { token, signal: controller.signal }).then((rows) => {
      setSavedEntries(rows); setError("");
    }).catch((error) => { if (error.name !== "AbortError") setError(error.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [token, attempt]);

  async function toggleSaved(startupId) {
    if (!token) { setError("Log in to save startups."); return; }
    if (busy.current || savedLoading) return;
    busy.current = true; setSavingId(startupId); setError("");
    try {
      const exists = savedEntries.some((entry) => entry.startup_id === startupId);
      await apiRequest(`/account/saved-startups/${startupId}`, { token, method: exists ? "DELETE" : "PUT" });
      // Show committed database state rather than optimistic success.
      const rows = await apiRequest("/account/saved-startups", { token });
      setSavedEntries(rows);
    } catch (error) { setError(error.message); }
    finally { busy.current = false; setSavingId(null); }
  }
  return { savedEntries, savedStartups: savedEntries.map((entry) => entry.startup_id), savedLoading, savedError, savingId, toggleSaved, retrySaved: () => setAttempt((value) => value + 1) };
}
