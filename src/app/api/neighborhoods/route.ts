import { NextResponse } from "next/server";

const AIRTABLE_PAT = process.env.AIRTABLE_PAT;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || "appAF9PYz7hHq5AIM";
const AIRTABLE_TABLE_ID = process.env.AIRTABLE_TABLE_ID || "tblPZcv6xjl4o6PAp";

export async function GET() {
  if (!AIRTABLE_PAT) {
    return NextResponse.json(
      { error: "AIRTABLE_PAT not configured" },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`,
      {
        headers: { Authorization: `Bearer ${AIRTABLE_PAT}` },
        next: { revalidate: 3600 },
      }
    );

    if (!res.ok) throw new Error(`Airtable API error: ${res.status}`);

    const data = await res.json();

    const neighborhoods = data.records.map((rec: Record<string, any>) => ({
      id: rec.id,
      name: rec.fields["Neighborhood"] || rec.fields["Name"] || "",
      avg_rent_sqft: rec.fields["Avg rent PSF (annual)"] || 0,
      foot_traffic_score: rec.fields["Foot traffic score"] || 0,
      asian_dining_score: rec.fields["Asian consumer density"] || 0,
      competitor_count: rec.fields["Cuisine saturation"] || 0,
    }));

    return NextResponse.json(neighborhoods);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
