import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { apiRequest } from "../lib/api";
import useAccountList from "../lib/useAccountList";
import { EntryContent } from "../components/CareerEntries";
import SavedStartups from "../components/SavedStartups";
import "./ProfilePage.css";

function PersonalInterests({ token }) {
  const interests = useAccountList("/account/interests", token);
  const industries = useAccountList("/industries", token);
  const selected = new Set(interests.rows.map((item) => item.industry_id));
  const names = industries.rows.filter((industry) => selected.has(industry.industry_id));
  return (
    <section className="profile-panel profile-interests" aria-labelledby="profile-interests-title">
      <div className="profile-section-heading"><h2 id="profile-interests-title">Your interests</h2><span className="private-label">Public</span></div>
      <p className="profile-muted">The industries you want to explore.</p>
      {interests.loading || industries.loading ? <p role="status">Loading interests…</p> : interests.error || industries.error ? <div role="alert"><p>{interests.error || industries.error}</p><button onClick={() => { interests.retry(); industries.retry(); }}>Try again</button></div> : names.length ? <div className="interest-tags">{names.map((industry) => <span key={industry.industry_id}>{industry.name}</span>)}</div> : <p className="profile-empty">A little curiosity goes a long way. Add industries that interest you.</p>}
      <Link className="profile-text-link" to="/account/edit#interests-title">Manage interests →</Link>
    </section>
  );
}

export default function PublicProfilePage() {
  const { userId } = useParams();
  const { user, session } = useAuth();
  const ownProfile = user?.id === userId;
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setProfile(null); setError("");
    apiRequest(`/applicants/${encodeURIComponent(userId)}`, { signal: controller.signal }).then(setProfile)
      .catch((failure) => { if (failure.name !== "AbortError") setError(failure.message); });
    return () => controller.abort();
  }, [userId, attempt]);
  let linkedIn = null;
  try {
    const url = new URL(profile?.linkedin_url);
    if (url.protocol === "https:" && !url.username && !url.password && (url.hostname === "linkedin.com" || url.hostname.endsWith(".linkedin.com"))) linkedIn = url.href;
  } catch { /* Missing or invalid legacy URL. */ }
  const name = profile?.name || "Candidate profile";
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  return (
    <main className="profile-page">
      <div className="profile-breadcrumb"><Link to="/">← Discover startups</Link><span>{ownProfile ? "Your corner of Startup Radar" : "Candidate profile"}</span></div>
      <section className="profile-hero" aria-label="Candidate introduction">
        <div className="profile-cover" aria-hidden="true"><span>Find your next beginning.</span><span className="cover-heart">♡</span></div>
        <div className="profile-intro">
          <div className="profile-avatar" aria-hidden="true">{profile ? initials : "♡"}</div>
          {ownProfile && <Link className="account-button account-button-secondary profile-edit-button" to="/account/edit">Edit profile & account</Link>}
          {error ? <div role="alert"><p>{error}</p><button onClick={() => setAttempt((n) => n + 1)}>Try again</button></div> : !profile ? <p role="status">Loading candidate profile…</p> : <>
            <div className="profile-summary">
              <div className="profile-identity">
                <p className="profile-eyebrow">CANDIDATE</p>
                <h1>{name}</h1>
                <div className="profile-contact">
                  <span>{profile.email}</span>
                  {profile.phone && <span>{profile.phone}</span>}
                  {linkedIn && <a href={linkedIn} target="_blank" rel="noreferrer">LinkedIn ↗</a>}
                </div>
              </div>
              {(profile.bio || ownProfile) && <div className="profile-about">
                <h2>About</h2>
                {profile.bio ? <p className="profile-bio">{profile.bio}</p> : <Link className="profile-text-link profile-add-bio" to="/account/edit">+ Add a short bio</Link>}
              </div>}
            </div>
          </>}
        </div>
      </section>
      {ownProfile && <div className="profile-owner-layout">
        <section className="profile-panel profile-saved" aria-label="Your saved startups">
          <div className="profile-section-heading"><p className="profile-eyebrow">YOUR NEXT CHAPTER</p><span className="private-label">Public</span></div>
          <SavedStartups />
          <Link className="profile-text-link" to="/">Discover more startups →</Link>
        </section>
        <PersonalInterests key={userId} token={session.access_token} />
      </div>}
      {!ownProfile && profile && <div className="profile-owner-layout">
        <section className="profile-panel profile-saved"><h2>Saved startups</h2>{profile.saved_startups?.length ? <ul className="account-list">{profile.saved_startups.map((startup) => <li key={startup.startup_id}><h3>{startup.name || "Startup"}</h3><p>{startup.description}</p><p>{[startup.location, startup.funding_round].filter(Boolean).join(" · ")}</p></li>)}</ul> : <p className="profile-empty">No saved startups yet.</p>}</section>
        <section className="profile-panel"><h2>Interests</h2>{profile.interests?.length ? <div className="interest-tags">{profile.interests.map((industry) => <span key={industry.industry_id}>{industry.name}</span>)}</div> : <p className="profile-empty">No interests listed.</p>}</section>
      </div>}
      {profile && <div className="profile-history">
        {["experience", "education"].map((kind) => <section className="profile-panel" key={kind} aria-labelledby={`public-${kind}`}>
          <div className="profile-section-heading"><h2 id={`public-${kind}`}>{kind === "education" ? "Education" : "Experience"}</h2>{ownProfile && <Link className="profile-text-link" to={`/account/edit#${kind}-title`}>Edit</Link>}</div>
          {profile[kind]?.length ? <ul className="profile-timeline">{profile[kind].map((entry) => <li key={entry[`${kind}_id`]}><span className="timeline-mark" aria-hidden="true">{kind === "education" ? "◇" : "✧"}</span><div><EntryContent kind={kind} entry={entry} /></div></li>)}</ul> : <p className="profile-empty">{ownProfile ? `Add your ${kind} to tell more of your story.` : `No ${kind} listed.`}</p>}
        </section>)}
      </div>}
    </main>
  );
}
