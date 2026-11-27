import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import AccountCard from "../components/AccountCard";
import AuthStatus from "../components/AuthStatus";
import { apiRequest } from "../lib/api";
import "./LoginPage.css";

export default function StartupEditorPage() {
    const { user, session, loading, error } = useAuth();
    const navigate = useNavigate();
    const [industries, setIndustries] = useState([]);
    const [industriesError, setIndustriesError] = useState("");
    const [message, setMessage] = useState("");
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (!session?.access_token) return;
        const controller = new AbortController();
        apiRequest("/industries", { token: session.access_token, signal: controller.signal })
            .then(setIndustries)
            .catch((failure) => {
                if (failure.name !== "AbortError") setIndustriesError(failure.message);
            });
        return () => controller.abort();
    }, [session?.access_token]);

    if (!loading && !error && !user) return <Navigate to="/login" replace />;
    if (!loading && user && user.user_metadata?.account_type !== "founder") {
        return <Navigate to="/account" replace />;
    }

    async function submit(event) {
        event.preventDefault();
        const fields = new FormData(event.currentTarget);
        const name = fields.get("name").trim();
        if (!name) {
            setMessage("Please enter a startup name.");
            return;
        }
        const industryId = fields.get("industry_id");
        setBusy(true);
        setMessage("");
        try {
            await apiRequest("/founder/startups", {
                token: session.access_token,
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    description: fields.get("description").trim() || null,
                    location: fields.get("location").trim() || null,
                    funding_round: fields.get("funding_round").trim() || null,
                    website: fields.get("website").trim() || null,
                    industry_id: industryId || null,
                }),
            });
            navigate(`/founders/${user.id}`, { replace: true });
        } catch (failure) {
            setMessage(failure.message);
        } finally {
            setBusy(false);
        }
    }
    return (
        <AccountCard
            title="Register your startup"
            description="Add your company so applicants can find you on Startup Radar."
        >
            <AuthStatus />
            <p className="login-message">
                <Link to={`/founders/${user?.id || ""}`}>← Back to your profile</Link>
            </p>
            {industriesError && <p className="login-message" role="alert">{industriesError}</p>}
            <form className="login-form" onSubmit={submit}>
                <fieldset disabled={loading || !!error || busy}>
                    <label htmlFor="name">Startup name</label>
                    <input id="name" name="name" maxLength={200} required />

                    <label htmlFor="description">Description</label>
                    <textarea id="description" name="description" rows={4} maxLength={5000} placeholder="What are you building?" />

                    <label htmlFor="location">Location</label>
                    <input id="location" name="location" maxLength={300} placeholder="City, Country or Remote" />

                    <label htmlFor="funding_round">Funding stage</label>
                    <input id="funding_round" name="funding_round" maxLength={100} placeholder="Pre-Seed, Seed, Series A..." />

                    <label htmlFor="website">Website</label>
                    <input id="website" name="website" type="url" maxLength={500} placeholder="https://" />

                    <label htmlFor="industry_id">Industry</label>
                    <select id="industry_id" name="industry_id" className="startup-filter" defaultValue="">
                        <option value="">Select an industry (optional)</option>
                        {industries.map((industry) => (
                            <option key={industry.industry_id} value={industry.industry_id}>
                                {industry.name}
                            </option>
                        ))}
                    </select>

                    <button className="account-button account-button-primary" type="submit">
                        {busy ? "Registering..." : "Register startup"}
                    </button>
                </fieldset>
                {message && <p className="login-message" role="alert">{message}</p>}
            </form>
        </AccountCard>
    )
}