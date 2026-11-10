import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import AuthStatus from "../components/AuthStatus";
import AccountCard from "../components/AccountCard";

export default function AccountPage() {
  const { user, loading, error } = useAuth();
  if (loading || error) return <AuthStatus />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.user_metadata?.account_type === "founder") {
    return (
      <AccountCard title="Your founder account" description="Create job openings and review applications from your dashboard.">
        <Link className="account-button account-button-primary" to="/founder/jobs">Manage job openings</Link>
      </AccountCard>
    );
  }
  return <Navigate to={`/applicants/${user.id}`} replace />;
}