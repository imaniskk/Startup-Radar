import { useEffect, useState } from "react";
import { apiRequest } from "./api";

export default function useAccountList(path, token) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError("");
    apiRequest(path, { token, signal: controller.signal }).then(setRows)
      .catch((failure) => { if (failure.name !== "AbortError") setError(failure.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [path, token, attempt]);
  return { rows, setRows, loading, error, retry: () => setAttempt((n) => n + 1) };
}
