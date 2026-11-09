import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import AuthStatus from "../components/AuthStatus";

export default function AccountPage() {
  const { user, loading, error } = useAuth();
  if (loading || error) return <AuthStatus />;
  return <Navigate to={user ? `/applicants/${user.id}` : "/login"} replace />;
}
