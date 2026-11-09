import { createClient } from "@supabase/supabase-js";
import { apiRequest } from "./api";

let clientPromise;
export function getAuthClient() {
  if (!clientPromise) {
    clientPromise = apiRequest("/auth/config").then(({ url, publishableKey }) =>
      createClient(url, publishableKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      })
    ).catch((error) => {
      clientPromise = undefined;
      throw error;
    });
  }
  return clientPromise;
}
