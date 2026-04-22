import { NextResponse, type NextRequest } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  let listingId: string | null = null;
  try {
    const body = await request.json();
    listingId = typeof body?.listing_id === "string" ? body.listing_id : null;
  } catch {
    // ignored
  }
  if (!listingId)
    return NextResponse.json({ ok: false }, { status: 400 });

  const sb = await getServerSupabase();
  if (!sb) return NextResponse.json({ ok: true });

  const {
    data: { user },
  } = await sb.auth.getUser();

  const { error } = await sb.from("listing_views").insert({
    listing_id: listingId,
    viewer_id: user?.id ?? null,
  });
  if (error) {
    // RLS will reject unpublished listings — that's fine, swallow it.
    console.warn("[track] view insert failed:", error.message);
  }
  return NextResponse.json({ ok: true });
}
