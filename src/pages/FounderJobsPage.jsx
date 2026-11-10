import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import ApplicationDocuments from "../components/ApplicationDocuments";
import { apiRequest } from "../lib/api";
import "./Jobs.css";

const questionTypes = [
  ["short_text", "Short text"],
  ["long_text", "Long text"],
  ["url", "Website URL"],
  ["yes_no", "Yes / no"],
];
const decisionLabels = { pending: "Pending", accepted: "Accepted", rejected: "Rejected" };

function createQuestion() {
  return { id: crypto.randomUUID(), label: "", type: "short_text", required: false };
}

export default function FounderJobsPage() {
  const { user, session, loading: authLoading } = useAuth();
  const isFounder = user?.user_metadata?.account_type === "founder";
  const [openings, setOpenings] = useState([]);
  const [applications, setApplications] = useState({});
  const [expanded, setExpanded] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (authLoading || !session?.access_token || !isFounder) return undefined;
    const controller = new AbortController();
    apiRequest("/founder/openings", { token: session.access_token, signal: controller.signal })
      .then(setOpenings)
      .catch((failure) => {
        if (failure.name !== "AbortError") setError(failure.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setBusy(false);
      });
    setBusy(true);
    return () => controller.abort();
  }, [authLoading, isFounder, session?.access_token]);

  if (!authLoading && !user) return <Navigate to="/login" replace />;
  if (!authLoading && user?.user_metadata?.account_type !== "founder") return <Navigate to="/jobs" replace />;

  function updateQuestion(id, field, value) {
    setQuestions((current) => current.map((question) => question.id === id ? { ...question, [field]: value } : question));
  }

  async function createOpening(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await apiRequest("/founder/openings", {
        token: session.access_token,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: companyName,
          title,
          description,
          questions: questions.filter((question) => question.label.trim()),
        }),
      });
      setOpenings((current) => [result, ...current]);
      setCompanyName("");
      setTitle("");
      setDescription("");
      setQuestions([]);
      setMessage("Your job is now open.");
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  async function toggleApplications(openingId) {
    if (expanded === openingId) {
      setExpanded("");
      return;
    }
    setExpanded(openingId);
    if (applications[openingId]) return;
    setBusy(true);
    setError("");
    try {
      const result = await apiRequest(`/founder/openings/${openingId}/applications`, { token: session.access_token });
      setApplications((current) => ({ ...current, [openingId]: result }));
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  async function changeOpeningStatus(opening) {
    setBusy(true);
    setError("");
    try {
      const result = await apiRequest(`/founder/openings/${opening.opening_id}`, {
        token: session.access_token,
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: opening.status === "open" ? "closed" : "open" }),
      });
      setOpenings((current) => current.map((item) => item.opening_id === result.opening_id ? result : item));
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  async function changeDecision(openingId, applicationId, status) {
    setBusy(true);
    setError("");
    try {
      const result = await apiRequest(`/founder/applications/${applicationId}/decision`, {
        token: session.access_token,
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setApplications((current) => ({
        ...current,
        [openingId]: current[openingId].map((item) => item.application_id === applicationId ? { ...item, ...result } : item),
      }));
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="jobs-page founder-jobs-page">
      <header className="jobs-header">
        <h1>Founder job dashboard</h1>
        <p>Create openings, review submitted applications, and record decisions.</p>
        <Link to="/jobs">Browse open jobs</Link>
      </header>

      <section className="job-card founder-opening-form">
        <h2>Create a job opening</h2>
        <form className="opening-form" onSubmit={createOpening}>
          <label>Company name
            <input value={companyName} onChange={(event) => setCompanyName(event.target.value)} maxLength={200} required />
          </label>
          <label>Role title
            <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={200} required />
          </label>
          <label>Job description
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={10000} required />
          </label>
          <div className="opening-questions">
            <h3>Application questions</h3>
            <p>Add optional or required questions for applicants. Resume and transcript PDFs are optional.</p>
            {questions.map((question, index) => (
              <fieldset className="opening-question" key={question.id}>
                <legend>Question {index + 1}</legend>
                <label>Question text
                  <input value={question.label} onChange={(event) => updateQuestion(question.id, "label", event.target.value)} maxLength={200} />
                </label>
                <label>Answer type
                  <select value={question.type} onChange={(event) => updateQuestion(question.id, "type", event.target.value)}>
                    {questionTypes.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                  </select>
                </label>
                <label className="required-question">
                  <input type="checkbox" checked={question.required} onChange={(event) => updateQuestion(question.id, "required", event.target.checked)} />
                  Require an answer
                </label>
                <button className="text-button" type="button" onClick={() => setQuestions((current) => current.filter((item) => item.id !== question.id))}>
                  Remove question
                </button>
              </fieldset>
            ))}
            {questions.length < 30 && <button className="account-button account-button-secondary" type="button" onClick={() => setQuestions((current) => [...current, createQuestion()])}>Add a question</button>}
          </div>
          <button className="account-button account-button-primary" type="submit" disabled={busy}>{busy ? "Saving…" : "Publish opening"}</button>
        </form>
      </section>

      <section className="founder-openings">
        <h2>Your openings</h2>
        {busy && !openings.length && <p role="status">Loading your openings…</p>}
        {!busy && !error && !openings.length && <p>You have not published any openings yet.</p>}
        {openings.map((opening) => (
          <article className="job-card founder-opening" key={opening.opening_id}>
            <div className="opening-title-row">
              <div><p className="job-company">{opening.company_name}</p><h3>{opening.title}</h3></div>
              <span className={`opening-state state-${opening.status}`}>{opening.status}</span>
            </div>
            <p>{opening.description}</p>
            <div className="opening-actions">
              <button className="account-button account-button-secondary" type="button" disabled={busy} onClick={() => changeOpeningStatus(opening)}>
                {opening.status === "open" ? "Close opening" : "Reopen"}
              </button>
              <button className="account-button account-button-secondary" type="button" disabled={busy} onClick={() => toggleApplications(opening.opening_id)}>
                {expanded === opening.opening_id ? "Hide applicants" : "View applicants"}
              </button>
            </div>
            {expanded === opening.opening_id && (
              <div className="founder-applications">
                {!applications[opening.opening_id] && <p role="status">Loading submitted applications…</p>}
                {applications[opening.opening_id]?.length === 0 && <p>No submitted applications yet.</p>}
                {(applications[opening.opening_id] || []).map((application) => (
                  <article className="founder-application" key={application.application_id}>
                    <h4>{application.applicant?.name || "Applicant"}</h4>
                    {application.applicant?.email && <p>{application.applicant.email}</p>}
                    <p>Submitted {new Date(application.submitted_at).toLocaleDateString()}</p>
                    <dl className="application-answers">
                      {opening.questions.map((question) => {
                        const answer = application.answers?.[question.id];
                        return answer === undefined ? null : (
                          <div key={question.id}><dt>{question.label}</dt><dd>{typeof answer === "boolean" ? answer ? "Yes" : "No" : answer}</dd></div>
                        );
                      })}
                    </dl>
                    <ApplicationDocuments applicationId={application.application_id} token={session.access_token} />
                    <label className="decision-control">Decision
                      <select value={application.status} disabled={busy} onChange={(event) => changeDecision(opening.opening_id, application.application_id, event.target.value)}>
                        {Object.entries(decisionLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                      </select>
                    </label>
                  </article>
                ))}
              </div>
            )}
          </article>
        ))}
      </section>
      {message && <p className="jobs-success" role="status">{message}</p>}
      {error && <p className="jobs-error" role="alert">{error}</p>}
    </main>
  );
}
