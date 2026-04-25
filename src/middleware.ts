import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

// Refreshes the Supabase session cookie on every request so Server Components
// always see a fresh user. Skipped if env vars are missing (dev without Supabase).
export async function middleware(request: NextRequest) {
  // Run next-intl first so it handles locale negotiation/redirects.
  const response = intlMiddleware(request);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return response;

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });
  await supabase.auth.getUser();
  return response;
}

export const config = {
  // Skip Next internals, static files, and routes that don't need locale handling.
  matcher: [
    "/((?!api|auth/callback|_next/static|_next/image|favicon|og|robots\\.txt|sitemap\\.xml|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.ico).*)",
  ],
};
