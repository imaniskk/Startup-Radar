import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import ApplicationDocuments from "../components/ApplicationDocuments";
import { apiRequest } from "../lib/api";
import "./Jobs.css";

function ApplicationQuestionField({ question, value, onChange, disabled }) {
  const id = `question-${question.id}`;
  if (question.type === "yes_no") {
    return (
      <fieldset className="application-question" disabled={disabled}>
        <legend>{question.label}{question.required ? " *" : ""}</legend>
        <label><input type="radio" name={id} checked={value === true} onChange={() => onChange(true)} /> Yes</label>
        <label><input type="radio" name={id} checked={value === false} onChange={() => onChange(false)} /> No</label>
      </fieldset>
    );
  }
  return (
    <label className="application-question" htmlFor={id}>
      {question.label}{question.required ? " *" : ""}
      {question.type === "long_text" ? (
        <textarea id={id} value={value ?? ""} maxLength={10000} required={question.required} disabled={disabled}
          onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input id={id} type={question.type === "url" ? "url" : "text"} value={value ?? ""}
          maxLength={question.type === "short_text" ? 1000 : 2000}
          required={question.required} disabled={disabled}
          onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  );
}

export default function JobOpeningPage() {
  const { openingId } = useParams();
  const { user, session, loading: authLoading } = useAuth();
  const isApplicant = user?.user_metadata?.account_type === "applicant";
  const [opening, setOpening] = useState(null);
  const [application, setApplication] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (authLoading) return undefined;
    const controller = new AbortController();
    async function load() {
      try {
        const job = await apiRequest(`/openings/${openingId}`, { signal: controller.signal });
        setOpening(job);
        if (isApplicant && session?.access_token) {
          const applications = await apiRequest("/applications/mine", { token: session.access_token, signal: controller.signal });
          const existing = applications.find((item) => item.opening_id === openingId);
          if (existing) {
            setApplication(existing);
            setAnswers(existing.answers || {});
          }
        }
      } catch (failure) {
        if (failure.name !== "AbortError") setError(failure.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [openingId, isApplicant, session?.access_token, authLoading]);

  async function startApplication() {
    setBusy(true);
    setError("");
    try {
      const result = await apiRequest(`/openings/${openingId}/applications`, {
        token: session.access_token,
        method: "POST",
      });
      setApplication(result);
      setAnswers(result.answers || {});
      setMessage("Draft started. Your progress is saved when you save the application.");
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveDraft() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await apiRequest(`/applications/${application.application_id}/draft`, {
        token: session.access_token,
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      setApplication((current) => ({ ...current, ...result }));
      setMessage("Draft saved.");
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  async function submitApplication() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await apiRequest(`/applications/${application.application_id}/draft`, {
        token: session.access_token,
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const result = await apiRequest(`/applications/${application.application_id}/submit`, {
        token: session.access_token,
        method: "POST",
      });
      setApplication((current) => ({ ...current, ...result }));
      setMessage("Application submitted. You can track its status from Applications.");
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  if (!authLoading && user?.user_metadata?.account_type === "founder") {
    return <Navigate to="/founder/jobs" replace />;
  }
  if (loading) return <main className="jobs-page"><p role="status">Loading job…</p></main>;
  if (error && !opening) {
    return <main className="jobs-page"><p className="jobs-error" role="alert">{error}</p><Link to="/jobs">Back to open jobs</Link></main>;
  }
  if (!opening) return null;

  const isDraft = application?.status === "draft";
  return (
    <main className="jobs-page">
      <Link to="/jobs" className="jobs-back-link">← Back to open jobs</Link>
      <article className="job-detail">
        <p className="job-company">{opening.company_name}</p>
        <h1>{opening.title}</h1>
        <p className="job-description">{opening.description}</p>
        {error && <p className="jobs-error" role="alert">{error}</p>}
        <h2>Application questions</h2>
        {opening.questions.length ? (
          <ul className="job-question-list">
            {opening.questions.map((question) => <li key={question.id}>{question.label}{question.required ? " (required)" : ""}</li>)}
          </ul>
        ) : <p>No additional questions are required for this role.</p>}
        {!user && <p className="jobs-callout"><Link to="/login">Log in</Link> or create an applicant account to apply.</p>}
        {user && !isApplicant && <p className="jobs-callout">Only applicant accounts can apply to openings.</p>}
        {isApplicant && !application && (
          <button className="account-button account-button-primary" type="button" disabled={busy} onClick={startApplication}>
            {busy ? "Starting…" : "Start application"}
          </button>
        )}
        {isApplicant && application && (
          <section className="application-editor">
            <h2>{isDraft ? "Your application draft" : `Application ${application.status}`}</h2>
            {isDraft ? (
              <>
                {opening.questions.map((question) => (
                  <ApplicationQuestionField key={question.id} question={question}
                    value={answers[question.id]}
                    onChange={(value) => setAnswers((current) => ({ ...current, [question.id]: value }))}
                    disabled={busy} />
                ))}
                <ApplicationDocuments applicationId={application.application_id} token={session.access_token} editable />
                <div className="application-actions">
                  <button className="account-button account-button-secondary" type="button" disabled={busy} onClick={saveDraft}>
                    Save draft
                  </button>
                  <button className="account-button account-button-primary" type="button" disabled={busy} onClick={submitApplication}>
                    {busy ? "Submitting…" : "Submit application"}
                  </button>
                </div>
              </>
            ) : (
              <ApplicationDocuments applicationId={application.application_id} token={session.access_token} />
            )}
            {message && <p className="jobs-success" role="status">{message}</p>}
            {!isDraft && <Link to="/applications" className="account-button account-button-secondary">View application history</Link>}
          </section>
        )}
      </article>
    </main>
  );
}
