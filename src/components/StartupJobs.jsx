import { useEffect, useId, useState } from "react";
import { getStartupJobs } from "../services/startupApi";
import "./StartupJobs.css";

function applicationLink(value) {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

export default function StartupJobs({ startupId, startupName, isDemo }) {
  const panelId = useId();
  const [expanded, setExpanded] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState({ loading: true, error: "", jobs: [], isDemo });

  useEffect(() => {
    if (!expanded) return;
    const controller = new AbortController();
    async function loadJobs() {
      setResult({ loading: true, error: "", jobs: [], isDemo });
      try {
        const data = await getStartupJobs(startupId, controller.signal);
        if (!controller.signal.aborted) {
          setResult({ loading: false, error: "", jobs: data.jobs, isDemo: isDemo || data.is_demo });
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setResult({ loading: false, error: error.message, jobs: [], isDemo });
        }
      }
    }
    loadJobs();
    return () => controller.abort();
  }, [expanded, startupId, isDemo, attempt]);

  return (
    <div className="startup-jobs">
      <button
        type="button"
        className="view-jobs"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={() => setExpanded((previous) => !previous)}
      >
        {expanded ? "Hide Jobs" : "View Jobs"}
      </button>
      {expanded && (
        <section id={panelId} className="jobs-panel" aria-label={`Jobs at ${startupName}`} aria-busy={result.loading}>
          <h3>{isDemo ? "Sample internships" : "Available jobs"}</h3>
          {result.loading ? <p role="status">Loading jobs...</p> : result.error ? (
            <div role="alert">
              <p>{result.error}</p>
              <button type="button" className="view-jobs" onClick={() => setAttempt((previous) => previous + 1)}>Retry</button>
            </div>
          ) : (
            <>
              {result.isDemo && <p className="demo-notice">Demo company and fictional openings. No real applications are accepted.</p>}
              {result.jobs.length === 0 ? <p>No available jobs are listed for this startup.</p> : (
                <ul className="job-list">
                  {result.jobs.map((job) => {
                    const href = result.isDemo ? null : applicationLink(job.application_url);
                    return (
                      <li key={job.job_id} className="job-listing">
                        <h4>{job.title}</h4>
                        <p>{job.location}</p>
                        <p>{job.description}</p>
                        {href && <a href={href} target="_blank" rel="noopener noreferrer">View application</a>}
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}
