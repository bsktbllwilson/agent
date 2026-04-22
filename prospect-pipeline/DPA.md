# Data Handling Policy

This document describes the data practices of the luxury buyer prospecting
pipeline. It is intended for internal reference and for answering questions
from compliance, counsel, or clients about how leads are sourced.

## Data sources — all legitimate, work-contact only

| Source                           | What we use                                   | Why it's legitimate                                                         |
|----------------------------------|-----------------------------------------------|-----------------------------------------------------------------------------|
| NYC ACRIS (Socrata)              | Deeds, BBL, party names                       | Public record under NY Real Property Law Article 9                          |
| NYC RPTT / DOF                   | Sale filings, co-op transfers                 | Public record; DOF publishes rolling sales monthly                          |
| NY Department of State           | LLC registered-agent + service-of-process     | Public record under NY BCL § 306                                            |
| UrbanDigs                        | Manhattan contract-signed aggregates          | Paid API under UrbanDigs' commercial terms                                  |
| Marketproof                      | Beneficial-ownership research                 | Paid API under Marketproof's commercial terms                               |
| PropertyShark                    | BBL filings + linked entities                 | Paid API under PropertyShark's commercial terms                             |
| Press outlets (TRD, WSJ, etc.)   | Journalist-attributed buyer identifications   | Fair-use excerpts + fuzzy match; respect robots.txt, RSS when available     |
| Clay (contact enrichment)        | Work email, work phone, LinkedIn URL, title   | Paid workflow orchestrating Apollo / ZoomInfo / Hunter / LinkedIn Sales Nav |
| Anthropic Claude                 | Buyer classification                          | Paid inference on evidence we already have                                  |

## What we do not do

We have written these out explicitly — they are hard lines, not merely absent:

- **No personal email, personal phone, or home-address lookups.** Anything we
  surface is a work contact reachable in a professional capacity.
- **No data-broker services** (Spokeo, BeenVerified, Intelius, Whitepages
  premium, etc.). These sell consumer records we have no lawful basis to use.
- **No scraped LinkedIn.** Clay uses LinkedIn Sales Navigator via LinkedIn's
  legitimate commercial API; we never scrape `linkedin.com` pages ourselves.
- **No StreetEasy / Zillow / Redfin / MLS member-site scraping.** Their TOS
  prohibit programmatic access, and MLS member data is trade-secret-protected.
- **No identity enrichment on minors or on spouses/family members** not party
  to a public-record transaction.

## Scraping posture

When we do scrape public pages (press outlets, CityRealty building pages, NY
DOS public inquiry):

- `User-Agent` header always includes a **contact email** for publishers who
  want to reach us.
- Rate-limited to **at most 1 req / 2 sec per host** (press), **1 req / 3 sec**
  (NY DOS), **1 req / 2 sec** (CityRealty).
- `robots.txt` is respected.
- RSS / JSON feeds are preferred over HTML when a publication offers them.
- Scraping flag: `ENABLE_PRESS_SCRAPER` can be disabled per-deployment.

## Suppression & do-not-contact

- **Suppression window:** default 90 days. A prospect surfaced in a weekly run
  but already contacted within the window is hidden from that week's lists.
- **Permanent suppression:** `prospect-pipeline do-not-contact <prospect_id>`
  writes a `do-not-contact` status that is never overridden by later triggers.
- **Individual removal requests** (from buyers who contact us directly) are
  honored immediately via the same command plus manual deletion of associated
  rows from `prospects` and `contact_enrichment_log`.

## Retention

- Raw upstream responses (`raw_acris`, `raw_rptt`, `raw_urbandigs`): **24 months**
  for audit / re-derivation; older rows can be pruned.
- Contact enrichment results: **12 months** (contacts go stale fast).
- Press index: **18 months**.
- `prospects` and `outreach_status`: retained as long as the relationship is
  commercially meaningful; do-not-contact entries are retained indefinitely
  precisely to honor the request.

## Auditability

Every tier of the resolution cascade writes a row to `buyer_resolutions` with
the tier name, source, resolved name (if any), confidence, and evidence JSON.
This is intentional — if a prospect ever asks "how did you find me?" we can
reconstruct the trail.

Every Clay enrichment call logs input, output, and credits to
`contact_enrichment_log`.

Every weekly run logs totals + error summaries to `run_log`.

## Security

- All API keys are read from environment (`.env` is git-ignored). See
  `.env.example`.
- SQLite database file permissions: deploy with mode `0600` on shared hosts.
- No PII is transmitted to Anthropic Claude beyond what is already in
  public-record or paid-enrichment sources; prompts do not include personal
  phone, personal email, or home addresses (we don't collect those to begin
  with).
