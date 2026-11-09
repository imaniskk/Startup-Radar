import { useOutletContext } from "react-router-dom";

export default function SavedStartups() {
  const { savedEntries, savedLoading, savedError, savingId, toggleSaved, retrySaved } = useOutletContext();
  return (
    <section className="account-section" aria-labelledby="saved-title">
      <h2 id="saved-title">Saved startups</h2>
      <p className="profile-muted">These startups appear on your public profile.</p>
      {savedLoading && <p role="status">Loading saved startups…</p>}
      {savedError && <div role="alert"><p>{savedError}</p><button type="button" onClick={retrySaved}>Try again</button></div>}
      {!savedLoading && !savedError && savedEntries.length === 0 && <p>No saved startups yet. Save a startup from the discovery page to see it here.</p>}
      <ul className="account-list">
        {savedEntries.map(({ startup_id, startup }) => (
          <li key={startup_id}>
            <h3>{startup?.name || "Startup unavailable"}</h3>
            {startup && <><p>{startup.description}</p><p>{startup.location} · {startup.funding_round || "Funding not listed"}</p></>}
            <button className="account-button account-button-secondary" disabled={savingId !== null || savedLoading} onClick={() => toggleSaved(startup_id)}>{savingId === startup_id ? "Removing…" : "Remove from saved"}</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
