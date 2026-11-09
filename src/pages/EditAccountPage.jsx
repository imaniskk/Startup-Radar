import { useEffect, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import AuthStatus from "../components/AuthStatus";
import AccountCard from "../components/AccountCard";
import ProfileForm from "../components/ProfileForm";
import AccountSettings from "../components/AccountSettings";
import IndustryInterests from "../components/IndustryInterests";
import CareerEntries from "../components/CareerEntries";
import "./LoginPage.css";
import { apiRequest } from "../lib/api";

function AccountDetails({ token }) {
  const { hash } = useLocation();
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    apiRequest("/account/me", { token, signal: controller.signal })
      .then(setResult)
      .catch((failure) => {
        if (failure.name !== "AbortError") setError(failure.message);
      });
    return () => controller.abort();
  }, [token, attempt]);

  const profileId = result?.profile.user_id;
  useEffect(() => {
    if (profileId && hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [profileId, hash]);

  if (error) return <div role="alert"><p>{error}</p><button className="account-button account-button-secondary" onClick={() => { setError(""); setResult(null); setAttempt((value) => value + 1); }}>Try again</button></div>;
  if (!result) return <p role="status">Loading your profile…</p>;
  return (
    <>
      <dl className="account-details">
        <dt>Name</dt><dd>{result.profile.name || "Not set"}</dd>
        <dt>Email</dt><dd>{result.profile.email}</dd>
        <dt>Account ID</dt><dd>{result.profile.user_id}</dd>
      </dl>
      <p className="login-message"><Link to={`/applicants/${result.profile.user_id}`}>← Back to your profile</Link></p>
      <ProfileForm profile={result.profile} token={token} onSaved={(profile) => setResult((current) => ({ ...current, profile }))} />
      <IndustryInterests token={token} />
      <CareerEntries kind="education" token={token} />
      <CareerEntries kind="experience" token={token} />
      
      <AccountSettings />
      <Link className="account-button account-button-primary" to="/">Explore startups</Link>
    </>
  );
}

export default function EditAccountPage() {
  const { user, session, loading, error } = useAuth();
  if (!loading && !error && !user) return <Navigate to="/login" replace />;
  return (
    <AccountCard title="Edit your profile" description="Keep your personal details and preferences up to date.">
      <AuthStatus />
      {!loading && !error && user && <AccountDetails key={user.id} token={session.access_token} />}
    </AccountCard>
  );
}
