import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase/server";

export async function getCurrentUser() {
  const sb = await getServerSupabase();
  if (!sb) return null;
  const {
    data: { user },
  } = await sb.auth.getUser();
  return user;
}

export async function getRole(): Promise<string | null> {
  const user = await getCurrentUser();
  const role = user?.app_metadata?.role;
  return typeof role === "string" ? role : null;
}

export async function isAdmin() {
  return (await getRole()) === "admin";
}

export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/");
}

export async function requireSignedIn() {
  if (!(await getCurrentUser())) redirect("/signin");
}
