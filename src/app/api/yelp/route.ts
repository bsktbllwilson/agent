import { NextResponse } from "next/server";

const YELP_API_KEY = process.env.YELP_API_KEY;

const ASIAN_CATEGORIES = [
  "chinese",
  "japanese",
  "korean",
  "thai",
  "vietnamese",
  "taiwanese",
  "asianfusion",
  "ramen",
  "sushi",
  "filipino",
  "malaysian",
  "indonesian",
  "singaporean",
  "burmese",
  "dimsum",
  "noodles",
  "hotpot",
].join(",");

interface YelpSearchResult {
  total: number;
  businesses: { id: string; name: string; rating: number; review_count: number }[];
}

export async function GET(request: Request) {
  if (!YELP_API_KEY) {
    return NextResponse.json(
      { error: "YELP_API_KEY not configured" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const name = searchParams.get("name") || "neighborhood";

  if (!lat || !lng) {
    return NextResponse.json(
      { error: "lat and lng query params required" },
      { status: 400 }
    );
  }

  try {
    const url = new URL("https://api.yelp.com/v3/businesses/search");
    url.searchParams.set("latitude", lat);
    url.searchParams.set("longitude", lng);
    url.searchParams.set("categories", ASIAN_CATEGORIES);
    url.searchParams.set("radius", "800"); // ~0.5 miles
    url.searchParams.set("limit", "50");
    url.searchParams.set("sort_by", "review_count");

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${YELP_API_KEY}` },
      next: { revalidate: 86400 }, // cache 24h
    });

    if (!res.ok) throw new Error(`Yelp API error: ${res.status}`);

    const data: YelpSearchResult = await res.json();

    return NextResponse.json({
      neighborhood: name,
      total_asian_restaurants: data.total,
      top_rated: data.businesses.slice(0, 5).map((b) => ({
        name: b.name,
        rating: b.rating,
        review_count: b.review_count,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
