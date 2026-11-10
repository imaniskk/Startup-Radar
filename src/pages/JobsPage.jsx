import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../lib/api";
import "./Jobs.css";

export default function JobsPage() {
  const [openings, setOpenings] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    apiRequest("/openings", { signal: controller.signal })
      .then(setOpenings)
      .catch((failure) => {
        if (failure.name !== "AbortError") setError(failure.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  return (
    <main className="jobs-page">
      <header className="jobs-header">
        <h1>Open roles</h1>
        <p>Find a role at an early-stage startup and apply directly.</p>
      </header>
      {loading && <p role="status">Loading open roles…</p>}
      {error && <p className="jobs-error" role="alert">{error}</p>}
      {!loading && !error && !openings.length && <p className="jobs-empty">There are no open roles yet. Check back soon.</p>}
      <div className="jobs-grid">
        {openings.map((opening) => (
          <article className="job-card" key={opening.opening_id}>
            <p className="job-company">{opening.company_name}</p>
            <h2>{opening.title}</h2>
            <p>{opening.description}</p>
            <p className="job-question-count">
              {opening.questions.length} additional application question{opening.questions.length === 1 ? "" : "s"}
            </p>
            <Link className="account-button account-button-primary" to={`/jobs/${opening.opening_id}`}>View and apply</Link>
          </article>
        ))}
      </div>
    </main>
  );
}
