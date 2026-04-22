# NYC Luxury Buyer Prospecting Pipeline

A Python pipeline that monitors NYC real-estate transactions at **$4,000,000+**
in Manhattan and Brooklyn, resolves the buyers behind them, enriches the
contacts, classifies the buyer type, and produces a weekly **Prospect Sheet**
— a CRM-ready list of named buyers with outreach angles.

The $4M+ transactions are the **trigger event**. The product is the **buyer
dossier**, not market analytics.

## Why this exists

Traditional "luxury market reports" produce PPSF charts that nobody calls on.
This pipeline produces **names, work emails, work phones, and a reason to
call** — the minimum viable Monday-morning call list.

## What it does

```
              ┌──────────────── trigger sources (≥ $4M) ──────────────────┐
              │                                                            │
       ACRIS (condos + townhouses)   RPTT (co-ops)   UrbanDigs (contracts) │
              └──────────────────────┬────────────────────────────────────┘
                                     │
                              cross-source dedup
                                     │
                     ┌──── buyer resolution cascade ─────┐
                     │                                   │
             Tier 1 ACRIS parties (named individual)     │
             Tier 2 Marketproof LLC principals           │
             Tier 3 PropertyShark + NY DOS filings       │
             Tier 4 Press fuzzy-match                    │
             Tier 5 ACRIS self-join (holdings)           │
             Tier 6 UrbanDigs agents (parallel)          │
                     └─────────────┬─────────────────────┘
                                   │
                          Clay contact enrichment
                                   │
                     Claude buyer classification
                                   │
                     Routing (direct / broker / attorney / managing agent)
                                   │
                 CSV + XLSX (5 tabs) + Monday briefing (md)
                                   │
                  Optional push → HubSpot / Salesforce
```

## Quick start

```bash
cd prospect-pipeline
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env                  # edit keys as they come online
python -m prospect_pipeline.cli prospect-week --dry-run --lookback-days 30
```

`--dry-run` uses bundled fixtures and the heuristic classifier; it makes zero
network calls. Outputs land in `./out/`.

### Live run

Fill in API keys in `.env`. At minimum, the live ACRIS + RPTT Socrata endpoints
will work unauthenticated (rate-limited); adding `SOCRATA_APP_TOKEN` raises
limits. Everything else has a stub that yields `None` when unconfigured, so the
pipeline runs end-to-end at reduced hit-rate.

```bash
python -m prospect_pipeline.cli prospect-week --lookback-days 7
```

## Data sources — legitimacy + cost

| Source                   | Purpose                                | Legal posture        | Cost       |
|--------------------------|----------------------------------------|----------------------|------------|
| ACRIS (Socrata)          | Deeds, BBL, parties                    | Public record        | Free       |
| RPTT (Socrata / DOF)     | Co-op sales, all transfers             | Public record        | Free       |
| UrbanDigs                | Manhattan contract-signed indicator    | Commercial API (TOS) | Paid       |
| Marketproof              | LLC beneficial-owner unmasking         | Commercial API (TOS) | Paid       |
| PropertyShark            | BBL filings, linked entities           | Commercial API (TOS) | Paid       |
| NY DOS Public Inquiry    | LLC registered agent + service address | Public record        | Free (rate-limited) |
| Press (RSS + HTML)       | Journalist-named buyers                | Respect robots.txt   | Free       |
| Clay                     | Contact enrichment waterfall           | Commercial API (TOS) | Paid (credits) |
| Anthropic (Claude)       | Buyer classification                   | Commercial API       | Paid (tokens) |
| HubSpot / Salesforce     | CRM push                               | Commercial API       | Tenant dep.|

Rough monthly spend for a low-volume shop (dozens of $4M+ deals/week):
**$200-600** depending on Clay credits and Marketproof tier.

## Hit-rate expectations (from a comparable pipeline)

| Outcome                                           | Approx share |
|--------------------------------------------------|--------------|
| Tier 1 direct-named individual (condo/TH)        | 20-35%       |
| Tier 2/3 LLC unmasked with named principal       | 30-45%       |
| Tier 4 press-named buyer                         | 5-10%        |
| Unresolved → indirect route (attorney/mg. agent) | 20-40%       |

Work-email / work-phone resolution via Clay on named individuals: **~60-80%**
depending on seniority and firm type (higher for finance/PE partners, lower
for foreign buyers and retired wealth).

## CLI

```
prospect-pipeline prospect-week [--lookback-days N] [--dry-run]
prospect-pipeline resolve-buyer <name_or_llc>
prospect-pipeline holdings-report <name>
prospect-pipeline mark-contacted <prospect_id> [--notes ...]
prospect-pipeline do-not-contact <prospect_id>
prospect-pipeline push-to-crm <prospect_id> [--target hubspot|salesforce]
prospect-pipeline send-briefing --briefing <path> [--csv ...] [--xlsx ...]   # re-send
prospect-pipeline seed-agents <building_address>           # single scrape
prospect-pipeline add-building <agent_name> <address>      # manual link
prospect-pipeline bulk-seed-agents <mapping.json>          # batch import
prospect-pipeline list-agents                              # inspect current state
prospect-pipeline backfill --start YYYY-MM-DD --end YYYY-MM-DD
prospect-pipeline health-check [--skip-network] [--skip-smoke] [--json]
prospect-pipeline init-db
```

## Email delivery

When `SMTP_HOST` and `REPORT_RECIPIENT` are set in `.env`, the weekly run
emails the briefing automatically after writing the output files. Body =
rendered markdown; attachments = CSV + XLSX. Subject line includes the
hot/warm/indirect counts so the team can triage straight from the inbox:

```
Subject: NYC prospect briefing 2026-04-22 — 3 hot / 2 warm / 8 indirect
```

Port 465 uses implicit TLS; ports 587 and 25 use STARTTLS. `SMTP_USER` /
`SMTP_PASS` are optional (some relays accept unauthenticated localhost
submissions). `REPORT_RECIPIENT` accepts a comma-separated list.

To resend a prior week's briefing without re-running the pipeline:

```bash
prospect-pipeline send-briefing \
  --briefing out/briefing_2026-04-22.md \
  --csv out/prospects_2026-04-22.csv \
  --xlsx out/prospects_2026-04-22.xlsx
```

## Repeat-buyer rollup

Resolved buyers roll up across weeks — a buyer who closes two $4M+ properties
across different weekly runs gets **one** prospect row with `holdings_count=1`
and the other address in `other_nyc_holdings`, not two separate prospects.
Unresolved buyers stay distinct (we never want 8 anonymous LLCs to collapse
into a single "Unresolved" row). The **Holdings Patterns** tab in the weekly
XLSX surfaces the rolled-up multi-property buyers.

## Outreach angle refinement

The classification Claude call produces a serviceable `outreach_angle`. For
**hot prospects only** (high confidence + work contact) and when an
`ANTHROPIC_API_KEY` is configured, the pipeline runs a second Claude call with
the dedicated `prompts/outreach_angle_v1.txt` prompt — tighter rules (no
em-dashes, no "exclusive/bespoke", no wealth references, 1 sentence). Live
runs only; dry-run keeps the heuristic for determinism. Cost: one extra short
call per hot prospect per week (<10/week typical).

## Weekly outputs

Written to `$PIPELINE_OUTPUT_DIR` (default `./out`):

- `prospects_YYYY-MM-DD.csv` — one row per prospect, CRM-ready
- `prospects_YYYY-MM-DD.xlsx` — five tabs:
  - **Hot Prospects** — high-confidence + work contact (the Monday call list)
  - **Warm Leads** — named but missing contact, or medium confidence
  - **Indirect Outreach** — unresolved + attorney / managing-agent route
  - **Contract Signed** — UrbanDigs contract-signed watchlist (closing 30-60d)
  - **Holdings Patterns** — buyers seen 2+ times
- `briefing_YYYY-MM-DD.md` — one-page exec summary with top-5 call list

## Scheduling

### One-shot installer

```bash
# On the server, after cloning the repo to $PREFIX and creating .venv:
sudo ./scripts/install.sh --prefix /opt/prospect-pipeline --user deploy --timer
```

`install.sh` renders the systemd service + timer (or a cron entry with `--cron`),
creates `/var/log/prospect-pipeline/` with the right ownership, runs a
`health-check --skip-network --skip-smoke` preflight, installs a logrotate
config, and enables the timer. Idempotent — rerun after code pulls.

Flags:
- `--prefix /path`  — deployment root (default `/opt/prospect-pipeline`)
- `--user <name>`   — system user that owns the run (default `deploy`)
- `--timer|--cron`  — which scheduler (default `--timer`)
- `--lookback <n>`  — days to look back per run (default `8`)

Why 8 days instead of 7: a Monday 8am ET fire has to cover anything recorded
after the previous Monday's run. Sunday-recorded deeds often land in Socrata
mid-Monday-morning, and an 8-day window catches them on the next run with
harmless overlap (idempotent event_id dedup).

### Manual install (if you'd rather not run a script)

- Copy `scripts/prospect-pipeline.service` + `scripts/prospect-pipeline.timer` to
  `/etc/systemd/system/`, then `systemctl daemon-reload && systemctl enable --now prospect-pipeline.timer`.
- Or copy `scripts/prospect-pipeline.cron` to `/etc/cron.d/prospect-pipeline`.
- Either way, edit the paths to match your `$PREFIX` + `$USER`.

### Health-check

```bash
python -m prospect_pipeline.cli health-check            # full: imports, db, dirs, yamls, smoke, net probes
python -m prospect_pipeline.cli health-check --skip-network   # offline
python -m prospect_pipeline.cli health-check --skip-smoke     # fast (no end-to-end)
python -m prospect_pipeline.cli health-check --json           # machine-readable
```

Exits non-zero on any `FAIL`; `WARN` entries pass. Wired as `ExecStartPre` so
a broken deployment never gets to send a garbage briefing.

## Growing the routing YAMLs

The first live run resolves named individuals directly, but co-op / anonymous-LLC
buyers fall through to the **managing-agent** route (Tier 9). That route is
only as good as `managing_agents.yaml` — buildings need to be linked to their
current management company.

Three ways to grow it:

**1. Manual add (most common):**
```bash
prospect-pipeline add-building "FirstService Residential New York" "111 West 57 Street"
```

**2. Bulk import from JSON (reviewed offline):**
```bash
prospect-pipeline bulk-seed-agents seed_data/building_directory.json
```
Edit `seed_data/building_directory.json` first. The shipped file has Rudin's
publicly-documented residential portfolio pre-filled; everything else is empty
placeholders awaiting verification. Source truth from CityRealty / PropertyShark
public building pages.

**3. Scrape-grow (live only, rate-limited):**
```bash
prospect-pipeline seed-agents "111 West 57 Street"
```
Hits CityRealty at 1 req / 2 sec with a polite User-Agent. Cached on first hit.

**Inspect current state:**
```bash
prospect-pipeline list-agents
```

Buildings added via any path survive re-runs of `prospect-week` (the YAML seeder
union-merges with existing DB entries — YAML edits add, they don't clobber).

## Storage

Everything persists in a single SQLite file at `$PIPELINE_DB_PATH`
(default `./prospect_pipeline.db`). Tables:

| Table                     | Purpose                                                    |
|---------------------------|------------------------------------------------------------|
| `trigger_events`          | Normalized $4M+ transactions (ACRIS/RPTT/UrbanDigs)        |
| `raw_acris`, `raw_rptt`, `raw_urbandigs` | Audit trail of upstream responses           |
| `prospects`               | Primary product — one row per resolved buyer               |
| `buyer_resolutions`       | Append-only log per tier, per event, with evidence JSON    |
| `contact_enrichment_log`  | Clay credits consumed                                      |
| `llc_registry`            | Cached NY DOS lookups (indefinite TTL)                     |
| `press_index`             | Ingested press mentions                                    |
| `managing_agents`         | YAML seed + scraped additions                              |
| `outreach_status`         | Manual tracking (`mark-contacted`, `do-not-contact`)       |
| `run_log`                 | Per-run metrics                                            |

## Non-goals (intentional)

We **do not**:

- Look up personal email, personal phone, or home addresses. Work contacts only.
- Use data-broker services (Spokeo, BeenVerified, Intelius).
- Scrape LinkedIn directly. Clay uses LinkedIn Sales Navigator via the legitimate API.
- Scrape StreetEasy, Zillow, Redfin, or MLS member sites.
- Produce market analytics (PPSF charts, velocity, absorption) unless they
  surface a wealth signal for a specific buyer.

See `DPA.md` for the full data-handling posture.

## Contributing / maintenance

- `managing_agents.yaml` and `law_firms.yaml` are meant to be grown over time.
  Use `prospect-pipeline seed-agents` as buildings surface in the pipeline.
- Prompts live in `prompts/` with version suffixes; bump the version when you
  change the classifier's expected JSON shape.
- Fixtures under `prospect_pipeline/fixtures/` drive `--dry-run`. Keep them
  realistic and keep `${TODAY-N}` placeholders so the lookback window exercise
  paths stay green.
