import { useState } from "react";
import { useAuth } from "../auth/AuthProvider";

export default function AccountSettings() {
  const { client, user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [emailMessage, setEmailMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [emailFailed, setEmailFailed] = useState(false);
  const [passwordFailed, setPasswordFailed] = useState(false);
  async function changeEmail(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const email = new FormData(form).get("email").trim();
    setEmailMessage(""); setEmailFailed(false);
    if (email.toLowerCase() === user.email.toLowerCase()) { setEmailFailed(true); setEmailMessage("Enter a different email address."); return; }
    setBusy(true);
    try {
      const { data, error } = await client.auth.updateUser({ email }, { emailRedirectTo: `${window.location.origin}/account` });
      if (error) throw error;
      setEmailMessage(data.user.email === email ? "Email updated." : "Check your email to confirm the change. Supabase may require confirmation from both addresses. Your current email stays active until then.");
      form.reset();
    } catch (error) { setEmailFailed(true); setEmailMessage(error.message); }
    finally { setBusy(false); }
  }
  async function changePassword(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    setPasswordMessage(""); setPasswordFailed(false);
    if (fields.get("password") !== fields.get("confirmation")) { setPasswordFailed(true); setPasswordMessage("New passwords must match."); return; }
    setBusy(true);
    try {
      const { error } = await client.auth.updateUser({ password: fields.get("password"), current_password: fields.get("currentPassword") });
      if (error) throw error;
      form.reset();
      setPasswordMessage("Password updated. Use your new password the next time you log in.");
    } catch (error) { setPasswordFailed(true); setPasswordMessage(error.message); }
    finally { setBusy(false); }
  }
  return (
    <section className="account-settings" aria-labelledby="settings-heading">
      <h2 id="settings-heading">Account settings</h2>
      <p>Current email: {user.email}</p>
      {user.new_email && <p role="status">Pending email change: {user.new_email}. Check your inbox for confirmation.</p>}
      <form className="login-form" onSubmit={changeEmail}>
        <fieldset disabled={busy}>
          <label htmlFor="new-email">New email</label>
          <input id="new-email" name="email" type="email" autoComplete="email" required />
          <button className="account-button account-button-secondary" type="submit">{busy ? "Please wait…" : "Change email"}</button>
        </fieldset>
        {emailMessage && <p className="login-message" role={emailFailed ? "alert" : "status"}>{emailMessage}</p>}
      </form>
      <form className="login-form" onSubmit={changePassword}>
        <fieldset disabled={busy}>
          <label htmlFor="current-password">Current password</label>
          <input id="current-password" name="currentPassword" type="password" autoComplete="current-password" required />
          <label htmlFor="new-password">New password</label>
          <input id="new-password" name="password" type="password" autoComplete="new-password" minLength={8} required />
          <label htmlFor="confirm-new-password">Confirm new password</label>
          <input id="confirm-new-password" name="confirmation" type="password" autoComplete="new-password" minLength={8} required />
          <button className="account-button account-button-secondary" type="submit">{busy ? "Please wait…" : "Change password"}</button>
        </fieldset>
        {passwordMessage && <p className="login-message" role={passwordFailed ? "alert" : "status"}>{passwordMessage}</p>}
      </form>
    </section>
  );
}
