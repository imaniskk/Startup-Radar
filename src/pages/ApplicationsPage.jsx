import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import ApplicationDocuments from "../components/ApplicationDocuments";
import { apiRequest } from "../lib/api";
import "./Jobs.css";

const statusLabels = {
  draft: "Draft",
  pending: "Pending",
  accepted: "Accepted",
  rejected: "Rejected",
};

export default function ApplicationsPage() {
  const { user, session, loading: authLoading } = useAuth();
  const [applications, setApplications] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !session?.access_token) return undefined;
    const controller = new AbortController();
    apiRequest("/applications/mine", { token: session.access_token, signal: controller.signal })
      .then(setApplications)
      .catch((failure) => {
        if (failure.name !== "AbortError") setError(failure.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [authLoading, session?.access_token]);

  if (!authLoading && !user) return <Navigate to="/login" replace />;
  if (!authLoading && user?.user_metadata?.account_type === "founder") return <Navigate to="/founder/jobs" replace />;

  return (
    <main className="jobs-page">
      <header className="jobs-header">
        <h1>Application history</h1>
        <p>Continue drafts and track every submitted application and decision.</p>
      </header>
      {loading && <p role="status">Loading your applications…</p>}
      {error && <p className="jobs-error" role="alert">{error}</p>}
      {!loading && !error && !applications.length && (
        <p className="jobs-empty">You have no applications yet. <Link to="/jobs">Browse open jobs</Link>.</p>
      )}
      <div className="application-history">
        {applications.map((application) => {
          const opening = application.opening;
          return (
            <article className="job-card application-history-card" key={application.application_id}>
              <p className={`application-status status-${application.status}`}>{statusLabels[application.status] || application.status}</p>
              <p className="job-company">{opening?.company_name || "Startup"}</p>
              <h2>{opening?.title || "Job opening"}</h2>
              <p>Started {new Date(application.created_at).toLocaleDateString()}</p>
              {application.submitted_at && <p>Submitted {new Date(application.submitted_at).toLocaleDateString()}</p>}
              {application.decided_at && <p>Decision updated {new Date(application.decided_at).toLocaleDateString()}</p>}
              {opening && application.status === "draft" && opening.status === "open" && (
                <Link className="account-button account-button-primary" to={`/jobs/${application.opening_id}`}>Continue draft</Link>
              )}
              {application.status === "draft" && opening?.status === "closed" && <p>This job has closed; the draft can no longer be submitted.</p>}
              {application.status !== "draft" && <ApplicationDocuments applicationId={application.application_id} token={session?.access_token} />}
            </article>
          );
        })}
      </div>
    </main>
  );
}
