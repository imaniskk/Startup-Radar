import { useState } from "react";
import useAccountList from "../lib/useAccountList";
import { apiRequest } from "../lib/api";

export default function IndustryInterests({ token }) {
  const industries = useAccountList("/industries", token);
  const interests = useAccountList("/account/interests", token);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function toggle(id, selected) {
    setBusy(true); setMessage("");
    try {
      await apiRequest(`/account/interests/${id}`, { token, method: selected ? "DELETE" : "PUT" });
      interests.setRows((rows) => selected ? rows.filter((row) => row.industry_id !== id) : [...rows, { industry_id: id }]);
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }
  return (
    <section className="account-section" aria-labelledby="interests-title">
      <h2 id="interests-title">Industry interests</h2>
      {industries.loading || interests.loading ? <p role="status">Loading interests…</p> : industries.error || interests.error ? (
        <div role="alert"><p>{industries.error || interests.error}</p><button type="button" onClick={() => { industries.retry(); interests.retry(); }}>Try again</button></div>
      ) : industries.rows.length === 0 ? <p>No industries are available yet.</p> : (
        <fieldset className="interest-options" disabled={busy}>
          <legend>Choose your interests (public · saved automatically)</legend>
          {industries.rows.map((industry) => {
            const selected = interests.rows.some((row) => row.industry_id === industry.industry_id);
            return <label key={industry.industry_id}><input type="checkbox" checked={selected} onChange={() => toggle(industry.industry_id, selected)} /> {industry.name || "Unnamed industry"}</label>;
          })}
        </fieldset>
      )}
      {busy && <p role="status">Saving interests…</p>}
      {message && <p role="alert">{message}</p>}
    </section>
  );
}
