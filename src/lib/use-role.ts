"use client";

import { useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";

export type AuthState = {
  role: string | null;
  email: string | null;
  loading: boolean;
};

export function useAuthState(): AuthState {
  const [state, setState] = useState<AuthState>({
    role: null,
    email: null,
    loading: true,
  });

  useEffect(() => {
    let sb: ReturnType<typeof getBrowserSupabase>;
    try {
      sb = getBrowserSupabase();
    } catch {
      setState({ role: null, email: null, loading: false });
      return;
    }

    sb.auth.getUser().then(({ data: { user } }) => {
      setState({
        role: (user?.app_metadata?.role as string) ?? null,
        email: user?.email ?? null,
        loading: false,
      });
    });

    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => {
      const user = session?.user;
      setState({
        role: (user?.app_metadata?.role as string) ?? null,
        email: user?.email ?? null,
        loading: false,
      });
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return state;
}

export function useIsAdmin() {
  const { role, loading } = useAuthState();
  return { isAdmin: role === "admin", loading };
}
