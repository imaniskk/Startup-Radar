import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import AuthStatus from "../components/AuthStatus";
import AccountCard from "../components/AccountCard";
import { apiRequest } from "../lib/api";

function AccountDetails({ token }) {
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

  if (error) return <div role="alert"><p>{error}</p><button className="account-button account-button-secondary" onClick={() => { setError(""); setResult(null); setAttempt((value) => value + 1); }}>Try again</button></div>;
  if (!result) return <p role="status">Loading your profile…</p>;
  return (
    <>
      <dl className="account-details">
        <dt>Name</dt><dd>{result.profile.name || "Not set"}</dd>
        <dt>Email</dt><dd>{result.profile.email}</dd>
        <dt>Account ID</dt><dd>{result.profile.user_id}</dd>
      </dl>
      <p>Your {result.account_type} account is connected.</p>
      <Link className="account-button account-button-primary" to="/">Explore startups</Link>
    </>
  );
}

export default function AccountPage() {
  const { user, session, loading, error } = useAuth();
  if (!loading && !error && !user) return <Navigate to="/login" replace />;
  return (
    <AccountCard title="Your account" description="Welcome to Startup Radar.">
      <AuthStatus />
      {!loading && !error && user && <AccountDetails key={user.id} token={session.access_token} />}
    </AccountCard>
  );
}
