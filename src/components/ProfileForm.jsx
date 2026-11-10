import { useState } from "react";
import { apiRequest } from "../lib/api";

export default function ProfileForm({ profile, token, onSaved }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  async function submit(event) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const body = Object.fromEntries(["name", "bio", "location", "phone", "linkedin_url"].map((key) => [key, fields.get(key).trim()]));
    if (!body.name) { setFailed(true); setMessage("Please enter your name."); return; }
    setBusy(true); setMessage(""); setFailed(false);
    try {
      const result = await apiRequest("/account/me", {
        token, method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      onSaved(result.profile);
      setMessage("Profile saved.");
    } catch (error) { setFailed(true); setMessage(error.message); }
    finally { setBusy(false); }
  }
  return (
    <section aria-labelledby="profile-heading">
      <h2 id="profile-heading">Profile details</h2>
      <p>Your name, bio, phone, and LinkedIn appear on your public profile. Your location stays private.</p>
      <form className="login-form" onSubmit={submit}>
        <fieldset disabled={busy}>
          <label htmlFor="profile-name">Full name</label>
          <input id="profile-name" name="name" defaultValue={profile.name || ""} autoComplete="name" maxLength={200} required />
          <label htmlFor="profile-bio">Short bio</label>
          <textarea id="profile-bio" name="bio" defaultValue={profile.bio || ""} maxLength={500} rows={3} placeholder="A little about you, your interests, and what you hope to build next." />
          <p className="profile-muted">Up to 500 characters · Public</p>
          <label htmlFor="profile-location">Location / address</label>
          <input id="profile-location" name="location" defaultValue={profile.location || ""} autoComplete="street-address" maxLength={300} />
          <label htmlFor="profile-phone">Phone</label>
          <input id="profile-phone" name="phone" type="tel" defaultValue={profile.phone || ""} autoComplete="tel" maxLength={50} />
          <label htmlFor="profile-linkedin">LinkedIn URL</label>
          <input id="profile-linkedin" name="linkedin_url" type="url" defaultValue={profile.linkedin_url || ""} placeholder="https://www.linkedin.com/in/your-name" maxLength={500} />
          <button className="account-button account-button-primary" type="submit">{busy ? "Saving…" : "Save profile"}</button>
        </fieldset>
        {message && <p className="login-message" role={failed ? "alert" : "status"}>{message}</p>}
      </form>
    </section>
  );
}
