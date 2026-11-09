import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import AccountCard from "../components/AccountCard";
import AuthStatus from "../components/AuthStatus";
import "./LoginPage.css";

export default function CreateAccountPage() {
  const { client, user, loading, error } = useAuth();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  if (!loading && user) return <Navigate to="/account" replace />;

  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    if (fields.get("password") !== fields.get("confirmPassword")) {
      setMessage("Passwords must match.");
      return;
    }
    if (!fields.get("name").trim()) { setMessage("Please enter your name."); return; }
    setBusy(true);
    setMessage("");
    try {
      const { data, error: signupError } = await client.auth.signUp({
        email: fields.get("email").trim(), password: fields.get("password"),
        options: {
          data: { name: fields.get("name").trim() },
          emailRedirectTo: `${window.location.origin}/account`,
        },
      });
      if (signupError) throw signupError;
      if (!data.session) {
        setSent(true);
        // Neutral wording also covers Supabase's anti-enumeration response.
        setMessage("Check your email for a confirmation link. If you already have an account, log in instead.");
        form.reset();
      }
    } catch (failure) { setMessage(failure.message); }
    finally { setBusy(false); }
  }

  return (
    <AccountCard title="Create account" description="Find your next startup opportunity.">
      <AuthStatus />
      <form className="login-form" onSubmit={submit}>
        <fieldset disabled={loading || !!error || busy || sent}>
          <label htmlFor="name">Full name</label>
          <input id="name" name="name" autoComplete="name" maxLength={200} required />
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" required />
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
          <label htmlFor="confirmPassword">Confirm password</label>
          <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required />
          <p className="login-message">Use at least 8 characters. Your name and email appear on your public candidate profile.</p>
          <button className="account-button account-button-primary" type="submit">{busy ? "Creating account…" : "Create account"}</button>
        </fieldset>
        {message && <p className="login-message" role={sent ? "status" : "alert"}>{message}</p>}
        {sent && <button type="button" className="account-button account-button-secondary" onClick={() => { setSent(false); setMessage(""); }}>Use a different email</button>}
      </form>
      <p className="login-message">Already registered? <Link to="/login">Log in</Link></p>
    </AccountCard>
  );
}
