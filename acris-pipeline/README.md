# acris-pipeline

Nightly pipeline that pulls $4M+ residential deed records (condos + 1–3 family homes, Manhattan & Brooklyn) from the NYC Open Data ACRIS datasets via the Socrata API, enriches them with PLUTO building area, tags each sale with ownership-structure heuristics (LLC / trust / beneficial-owner category / all-cash), and upserts to Airtable keyed on `document_id`. Deployed on Railway as a cron-triggered one-shot process.

## Caveats

- **Co-ops are not included.** ACRIS records deeds only; co-op apartments transfer via stock certificates, which don't hit this system.
- **NYC Open Data lags the live ACRIS system by 1–7 days.** The nightly job runs with `--backfill-days 2` for overlap safety; use `--backfill-days 7` if you want to reliably capture stragglers.
- **PPSF is null for most condos.** PLUTO's `bldgarea` is building-wide, not unit-level, so it would be misleading as a condo unit sqft. Only 1–3 family homes get a computed PPSF.
- **Beneficial-owner tagging is heuristic v1.** It's name- and address-regex based; treat it as a first-pass sort, not ground truth.

## Airtable schema

Table name: **`Comps_NYC_4M_Plus`**

| Field | Type | Notes |
|---|---|---|
| `document_id` | Single line text | **PRIMARY**, upsert key |
| `recorded_date` | Date | |
| `doc_date` | Date | |
| `borough` | Single select | `Manhattan`, `Brooklyn` |
| `address` | Single line text | |
| `bbl` | Single line text | 10-char borough+block+lot |
| `property_type` | Single select | `Condo`, `1-Fam`, `2-Fam`, `3-Fam` |
| `price` | Currency | USD, 0 decimals |
| `sqft` | Number | integer |
| `ppsf` | Number | 1 decimal |
| `all_cash_flag` | Checkbox | |
| `llc_flag` | Checkbox | |
| `trust_flag` | Checkbox | |
| `entity_type` | Single select | `Individual`, `LLC`, `Trust`, `Corp`, `Partnership`, `Unknown` |
| `beneficial_owner_category` | Single select | `Domestic individual`, `Domestic entity-shielded`, `Foreign-inferred`, `Developer/sponsor`, `Institutional`, `Unknown` |
| `buyer_name` | Long text | pipe-joined if multiple |
| `seller_name` | Long text | pipe-joined if multiple |
| `acris_url` | URL | deep link to ACRIS DocumentDetail |
| `building_name` | Single line text | optional, manual |

## Deploy (GitHub Actions)

The workflow lives at `.github/workflows/acris-sync.yml` and runs on cron `0 9 * * *` (09:00 UTC = 05:00 ET).

**Set three repo secrets** at `Settings → Secrets and variables → Actions → New repository secret`:

- `AIRTABLE_API_KEY` — personal access token with `data.records:read` + `data.records:write` on the base
- `AIRTABLE_BASE_ID` — starts with `app…`
- `AIRTABLE_TABLE_NAME` — `Comps_NYC_4M_Plus`
- `SOCRATA_APP_TOKEN` — optional; skip if you don't have one

That's it. The workflow will run nightly. It also runs `test_tagging.py` on every invocation so a bad regex change never reaches Airtable.

### Manual runs (backfill / dry-run)

Go to `Actions → ACRIS Sync → Run workflow`. Inputs:

- **Days to backfill** — default `2`. Set to `90` for the initial backfill.
- **Dry run** — check this to skip the Airtable write entirely. Useful for a one-off sanity check.
- **Optional `--limit N`** — leave blank for production; set to e.g. `5` for a fast smoke test.

### Alternative: Railway

`railway.toml` is included for Railway deployment (NIXPACKS, `python sync.py --backfill-days 2`, `restartPolicyType = "NEVER"`). See the Railway dashboard for env vars + cron schedule setup. The GitHub Actions path is simpler and recommended.

## Local dev

Create `.env` from `.env.example`, fill in values, then:

```
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
source .env && python sync.py --backfill-days 7
```

Smoke-test flags (no Airtable writes):

```
python sync.py --backfill-days 2 --dry-run --limit 5
```

`--dry-run` skips the Airtable upsert entirely (no credentials required) and logs a sample of the assembled records. `--limit N` truncates deeds to the first N after fetch, for a fast end-to-end test. Combine both before the first production run.

Unit tests for the tagging helpers:

```
python -m unittest test_tagging -v
```

Weekly Excel snapshot:

```
source .env && python export_excel.py --days 30
```

## Tagging reference

| Flag / field | Meaning | Derivation |
|---|---|---|
| `all_cash_flag` | No same-day mortgage recorded at the same BBL | True when `(bbl, recorded_date)` does not appear in the set of mortgage-class docs (`MTGE`, `AGMT`, `MTGC`) fetched over the same window |
| `llc_flag` | Buyer name matches LLC regex | `\b(LLC\|L\.L\.C\.?\|LTD\|LIMITED\|HOLDINGS?)\b` |
| `trust_flag` | Buyer name matches trust regex | `\b(TRUST\|TRUSTEE\|REVOCABLE\|IRREVOCABLE\|U/T/A\|U/A\|FAMILY\s+TRUST)\b` |
| `entity_type` | Legal-structure bucket for the primary buyer | Priority: Trust > LLC > Corp > Partnership > Individual; Unknown if no name |
| `beneficial_owner_category` | Who's behind the entity, heuristically | Checked in order: Institutional regex → Foreign-hint regex (name or address) → seller name contains `SPONSOR` → entity is Individual/Trust → entity is LLC/Corp/Partnership → Unknown |
