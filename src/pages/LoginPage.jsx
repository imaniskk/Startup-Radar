import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import AccountCard from "../components/AccountCard";
import AuthStatus from "../components/AuthStatus";
import "./LoginPage.css";

export default function LoginPage() {
  const { client, user, loading, error } = useAuth();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  if (!loading && user) return <Navigate to="/account" replace />;

  async function submit(event) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    setBusy(true);
    setMessage("");
    try {
      const { error: loginError } = await client.auth.signInWithPassword({
        email: fields.get("email").trim(), password: fields.get("password"),
      });
      if (loginError) throw loginError;
    } catch (failure) {
      setMessage(failure.code === "invalid_credentials" ? "Incorrect email or password." : failure.message);
    } finally { setBusy(false); }
  }

  return (
    <AccountCard title="Welcome back" description="Log in to continue discovering your next perfect match.">
      <AuthStatus />
      <form className="login-form" onSubmit={submit}>
        <fieldset disabled={loading || !!error || busy}>
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" required />
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required />
          <button className="account-button account-button-primary" type="submit">{busy ? "Logging in…" : "Log in"}</button>
        </fieldset>
        {message && <p className="login-message" role="alert">{message}</p>}
      </form>
      <p className="login-message">New here? <Link to="/create-account">Create an account</Link></p>
    </AccountCard>
  );
}
