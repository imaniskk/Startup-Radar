import { useAuth } from "../auth/AuthProvider";

export default function AuthStatus() {
  const { loading, error, retry } = useAuth();
  if (loading) return <p role="status">Connecting to your account…</p>;
  if (error) return <div role="alert"><p>{error}</p><button className="account-button account-button-secondary" onClick={retry}>Try again</button></div>;
  return null;
}
