import { useEffect, useState } from "react";
import { apiBlob, apiRequest } from "../lib/api";

const documentLabels = { resume: "Resume", transcript: "College transcript" };

export default function ApplicationDocuments({ applicationId, token, editable = false }) {
  const [documents, setDocuments] = useState({ resume: false, transcript: false });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    apiRequest(`/applications/${applicationId}/documents`, { token, signal: controller.signal })
      .then(setDocuments)
      .catch((failure) => {
        if (failure.name !== "AbortError") setError(failure.message);
      });
    return () => controller.abort();
  }, [applicationId, token]);

  async function upload(kind, file) {
    if (!file) return;
    if (file.type !== "application/pdf") {
      setError("Choose a PDF file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Each PDF must be 10 MB or smaller.");
      return;
    }
    setBusy(kind);
    setError("");
    try {
      await apiRequest(`/applications/${applicationId}/documents/${kind}`, {
        token,
        method: "POST",
        headers: { "Content-Type": "application/pdf" },
        body: file,
      });
      setDocuments((current) => ({ ...current, [kind]: true }));
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy("");
    }
  }

  async function download(kind) {
    setBusy(kind);
    setError("");
    try {
      const blob = await apiBlob(`/applications/${applicationId}/documents/${kind}`, { token });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${kind}.pdf`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy("");
    }
  }

  async function remove(kind) {
    setBusy(kind);
    setError("");
    try {
      await apiRequest(`/applications/${applicationId}/documents/${kind}`, { token, method: "DELETE" });
      setDocuments((current) => ({ ...current, [kind]: false }));
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy("");
    }
  }

  return (
    <section className="application-documents" aria-label="Application documents">
      <h3>PDF documents <span className="optional-label">(optional)</span></h3>
      <p>PDF only, up to 10 MB each. Documents are private to you and the hiring founder.</p>
      <div className="document-list">
        {Object.entries(documentLabels).map(([kind, label]) => (
          <div className="document-row" key={kind}>
            <span>{label}: {documents[kind] ? "Uploaded" : "Not uploaded"}</span>
            {editable && (
              <label className="document-upload">
                {busy === kind ? "Uploading…" : documents[kind] ? "Replace PDF" : "Choose PDF"}
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  disabled={Boolean(busy)}
                  onChange={(event) => {
                    upload(kind, event.target.files?.[0]);
                    event.target.value = "";
                  }}
                />
              </label>
            )}
            {documents[kind] && !editable && (
              <button className="text-button" type="button" disabled={Boolean(busy)} onClick={() => download(kind)}>
                {busy === kind ? "Loading…" : "Download"}
              </button>
            )}
            {documents[kind] && editable && (
              <>
                <button className="text-button" type="button" disabled={Boolean(busy)} onClick={() => download(kind)}>View</button>
                <button className="text-button" type="button" disabled={Boolean(busy)} onClick={() => remove(kind)}>Remove</button>
              </>
            )}
          </div>
        ))}
      </div>
      {error && <p className="jobs-error" role="alert">{error}</p>}
    </section>
  );
}
