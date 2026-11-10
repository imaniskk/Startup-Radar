import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import "./AccountNavigation.css";

export default function AccountNavigation() {
  const { user, loading, logOut } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  async function logout() {
    setBusy(true);
    setError("");
    try { await logOut(); navigate("/", { replace: true }); }
    catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }
  return (
    <nav className="account-nav" aria-label="Account">
      {loading ? <span role="status">Loading account…</span> : user ? (
        <>
          <Link className="account-button account-button-secondary" to="/jobs">Open jobs</Link>
          {user.user_metadata?.account_type === "founder" ? (
            <Link className="account-button account-button-secondary" to="/founder/jobs">Manage jobs</Link>
          ) : (
            <Link className="account-button account-button-secondary" to="/applications">Applications</Link>
          )}
          <Link className="account-button account-button-secondary" to="/account">My account</Link>
          <button className="account-button account-button-primary" onClick={logout} disabled={busy}>{busy ? "Logging out…" : "Log out"}</button>
        </>
      ) : (
        <>
          <Link className="account-button account-button-secondary" to="/jobs">Open jobs</Link>
          <Link className="account-button account-button-secondary" to="/login">Log in</Link>
          <Link className="account-button account-button-primary" to="/create-account">Create account</Link>
        </>
      )}
      {error && <p role="alert">{error}</p>}
    </nav>
  );
}
