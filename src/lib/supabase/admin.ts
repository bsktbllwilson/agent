import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

/**
 * Server-only Supabase client using the service-role key. Bypasses RLS — use
 * only in server actions / route handlers, and only for narrow admin ops
 * (e.g., looking up an auth.users email to send an email). Returns null when
 * SUPABASE_SERVICE_ROLE_KEY is not set so callers can degrade gracefully.
 */
export function getAdminSupabase(): SupabaseClient | null {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  cached = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cached;
}

export async function lookupUserEmail(
  userId: string,
): Promise<string | null> {
  const sb = getAdminSupabase();
  if (!sb) return null;
  const { data, error } = await sb.auth.admin.getUserById(userId);
  if (error) {
    console.error("[admin] lookupUserEmail:", error.message);
    return null;
  }
  return data.user?.email ?? null;
}
