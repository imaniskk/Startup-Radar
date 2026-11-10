import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { apiRequest } from "../lib/api";
import founderAvatar from "../assets/applicant-creature-avatar.png";
import "./ProfilePage.css";

function safeHttpsUrl(value, requiredHost) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    if (requiredHost && url.hostname !== requiredHost && !url.hostname.endsWith(`.${requiredHost}`)) return null;
    return url.href;
  } catch {
    return null;
  }
}

function OpenRoles({ roles }) {
  if (!roles.length) return <p className="profile-empty">No open roles right now.</p>;
  return (
    <ul className="account-list">
      {roles.map((role) => {
        const applyUrl = safeHttpsUrl(role.application_url);
        return (
          <li key={role.job_id}>
            <h3>{role.title}</h3>
            <p>{[role.location, role.application_deadline && `Apply by ${role.application_deadline}`].filter(Boolean).join(" · ")}</p>
            {applyUrl && <a href={applyUrl} target="_blank" rel="noreferrer">Apply ↗</a>}
          </li>
        );
      })}
    </ul>
  );
}

export default function FounderProfilePage() {
  const { userId } = useParams();
  const { user } = useAuth();
  const ownProfile = user?.id === userId;
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setProfile(null); setError("");
    apiRequest(`/founders/${encodeURIComponent(userId)}`, { signal: controller.signal }).then(setProfile)
      .catch((failure) => { if (failure.name !== "AbortError") setError(failure.message); });
    return () => controller.abort();
  }, [userId, attempt]);

  const linkedIn = safeHttpsUrl(profile?.linkedin_url, "linkedin.com");

  return (
    <main className="profile-page">
      <div className="profile-breadcrumb"><Link to="/">← Discover startups</Link><span>{ownProfile ? "Your founder page" : "Founder profile"}</span></div>
      <section className="profile-hero" aria-label="Founder introduction">
        <div className="profile-intro">
          <div className="profile-avatar"><img src={founderAvatar} alt="Default founder avatar" width="90" height="90" /></div>
          {error ? <div role="alert"><p>{error}</p><button onClick={() => setAttempt((n) => n + 1)}>Try again</button></div> : !profile ? <p role="status">Loading founder profile…</p> : (
            <div className="profile-summary">
              <div className="profile-identity">
                <p className="profile-eyebrow">FOUNDER</p>
                <h1>{profile.name || "Founder profile"}</h1>
                <div className="profile-contact">
                  <span>{profile.email}</span>
                  {profile.phone && <span>{profile.phone}</span>}
                  {linkedIn && <a href={linkedIn} target="_blank" rel="noreferrer">LinkedIn ↗</a>}
                </div>
                {ownProfile && <Link className="account-button account-button-secondary profile-edit-button" to="/account/edit">Edit profile & account</Link>}
              </div>
              {(profile.bio || ownProfile) && <div className="profile-about">
                <h2>About</h2>
                {profile.bio ? <p className="profile-bio">{profile.bio}</p> : <Link className="profile-text-link profile-add-bio" to="/account/edit">+ Add a short bio</Link>}
              </div>}
            </div>
          )}
        </div>
      </section>

      {profile && <div className="profile-history">
        {profile.startups.length ? profile.startups.map((startup) => (
          <section className="profile-panel profile-saved" key={startup.startup_id} aria-labelledby={`startup-${startup.startup_id}`}>
            <div className="profile-section-heading"><h2 id={`startup-${startup.startup_id}`}>{startup.name}</h2><span className="private-label">Company</span></div>
            {startup.description && <p className="profile-muted">{startup.description}</p>}
            <p className="profile-muted">{[startup.location, startup.funding_round].filter(Boolean).join(" · ")}</p>
            <h3>Open roles</h3>
            <OpenRoles roles={startup.open_roles} />
          </section>
        )) : (
          <section className="profile-panel">
            <h2>Company</h2>
            <p className="profile-empty">{ownProfile ? "You haven't registered a startup yet." : "No startup listed yet."}</p>
            {ownProfile && <Link className="profile-text-link" to="/founder/startups/new">Register your startup →</Link>}
          </section>
        )}
      </div>}
    </main>
  );
}