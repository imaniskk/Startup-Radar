import { useState } from "react";
import useAccountList from "../lib/useAccountList";
import { apiRequest } from "../lib/api";

export function EntryContent({ entry, kind }) {
  return <>
    <h3>{kind === "education" ? entry.institution : `${entry.title} at ${entry.organization}`}</h3>
    {kind === "education" && <p>{[entry.degree, entry.field_of_study].filter(Boolean).join(" · ")}</p>}
    <p>{entry.start_date || "Start date not listed"} – {entry.is_current ? "Present" : entry.end_date || "End date not listed"}</p>
    {entry.location && <p>{entry.location}</p>}
    {entry.description && <p className="entry-description">{entry.description}</p>}
  </>;
}

export default function CareerEntries({ kind, token }) {
  const collection = useAccountList(`/account/${kind}`, token);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [current, setCurrent] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const education = kind === "education";
  const idKey = `${kind}_id`;
  const title = education ? "Education" : "Experience";
  const fields = education
    ? [["institution", "Institution", true, 200], ["degree", "Degree", false, 200], ["field_of_study", "Field of study", false, 200]]
    : [["organization", "Organization", true, 200], ["title", "Job title", true, 200], ["location", "Location", false, 300]];

  async function save(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const body = Object.fromEntries([...fields.map(([key]) => key), "start_date", "end_date", "description"].map((key) => [key, String(data.get(key) || "").trim() || null]));
    if (!education) { body.is_current = current; if (current) body.end_date = null; }
    setBusy(true); setMessage("");
    try {
      const existingId = editing?.[idKey];
      const row = await apiRequest(`/account/${kind}${existingId ? `/${existingId}` : ""}`, {
        token, method: existingId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      collection.setRows((rows) => existingId ? rows.map((entry) => entry[idKey] === existingId ? row : entry) : [...rows, row]);
      setEditing(null); setMessage(`${title} saved.`);
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }
  async function remove(id) {
    setBusy(true); setMessage("");
    try {
      await apiRequest(`/account/${kind}/${id}`, { token, method: "DELETE" });
      collection.setRows((rows) => rows.filter((entry) => entry[idKey] !== id));
      setConfirmId(null); setMessage(`${title} removed.`);
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }
  return (
    <section className="account-section" aria-labelledby={`${kind}-title`}>
      <h2 id={`${kind}-title`}>{title}</h2>
      <p>These details appear on your public candidate profile.</p>
      {collection.loading ? <p role="status">Loading {kind}…</p> : collection.error ? <div role="alert"><p>{collection.error}</p><button onClick={collection.retry}>Try again</button></div> : (
        <>
          <ul className="account-list">
            {collection.rows.map((entry) => <li key={entry[idKey]}>
              <EntryContent entry={entry} kind={kind} />
              <div className="entry-actions">
                <button className="account-button account-button-secondary" disabled={busy || editing !== null} onClick={() => { setEditing(entry); setCurrent(!!entry.is_current); setMessage(""); setConfirmId(null); }}>Edit</button>
                {confirmId === entry[idKey] ? <><span>Delete this entry?</span><button disabled={busy} onClick={() => remove(entry[idKey])}>Confirm delete</button><button disabled={busy} onClick={() => setConfirmId(null)}>Cancel</button></> : <button className="account-button account-button-secondary" disabled={busy || editing !== null} onClick={() => setConfirmId(entry[idKey])}>Delete</button>}
              </div>
            </li>)}
          </ul>
          {collection.rows.length === 0 && <p>No {kind} added yet.</p>}
          {editing === null ? <button className="account-button account-button-secondary" onClick={() => { setEditing({}); setCurrent(false); setMessage(""); setConfirmId(null); }}>Add {kind}</button> : (
            <form className="login-form" key={editing[idKey] || "new"} onSubmit={save}>
              <fieldset disabled={busy}>
                <legend>{editing[idKey] ? "Edit" : "Add"} {kind}</legend>
                {fields.map(([key, label, required, maxLength]) => <div key={key}><label htmlFor={`${kind}-${key}`}>{label}</label><input id={`${kind}-${key}`} name={key} defaultValue={editing[key] || ""} required={required} maxLength={maxLength} /></div>)}
                <label htmlFor={`${kind}-start`}>Start date</label><input id={`${kind}-start`} name="start_date" type="date" defaultValue={editing.start_date || ""} />
                {!education && <label className="current-role"><input type="checkbox" checked={current} onChange={(event) => setCurrent(event.target.checked)} /> I currently work here</label>}
                <label htmlFor={`${kind}-end`}>End date</label><input id={`${kind}-end`} name="end_date" type="date" disabled={!education && current} defaultValue={editing.end_date || ""} />
                <label htmlFor={`${kind}-description`}>Description</label><textarea id={`${kind}-description`} name="description" defaultValue={editing.description || ""} maxLength={5000} rows={4} />
                <div className="entry-actions"><button className="account-button account-button-primary" type="submit">{busy ? "Saving…" : "Save"}</button><button className="account-button account-button-secondary" type="button" onClick={() => setEditing(null)}>Cancel</button></div>
              </fieldset>
            </form>
          )}
        </>
      )}
      {message && <p className="login-message" role="status">{message}</p>}
    </section>
  );
}
