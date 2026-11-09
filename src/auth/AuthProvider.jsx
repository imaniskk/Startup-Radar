import { createContext, useContext, useEffect, useState } from "react";
import { getAuthClient } from "../lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [client, setClient] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    let subscription;
    getAuthClient().then(async (authClient) => {
      if (!active) return;
      setClient(authClient);
      // Keep this callback synchronous: awaiting Auth methods here can deadlock.
      subscription = authClient.auth.onAuthStateChange((_event, nextSession) => {
        if (active) {
          setSession(nextSession);
          setLoading(false);
        }
      }).data.subscription;
      const { error: sessionError } = await authClient.auth.getSession();
      if (sessionError) throw sessionError;
    }).catch((failure) => {
      if (active) {
        setError(failure.message);
        setLoading(false);
      }
    });
    return () => { active = false; subscription?.unsubscribe(); };
  }, [attempt]);

  function retry() {
    setError("");
    setLoading(true);
    setAttempt((value) => value + 1);
  }

  async function logOut() {
    const { error: signOutError } = await client.auth.signOut({ scope: "local" });
    if (signOutError) throw signOutError;
    setSession(null);
  }

  return (
    <AuthContext.Provider value={{ client, session, user: session?.user ?? null, loading, error, retry, logOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth requires AuthProvider");
  return context;
}
