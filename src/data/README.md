# Startup directory fixture

`startups_seed.json` is a temporary frontend fixture containing 50 real YC companies.
It does not connect to or seed Supabase. `DiscoverPage.jsx` imports it directly
for the explicit "Use local YC preview data" option. By default, the page loads
from the team's backend at `http://127.0.0.1:8000/startups`; a backend error does
not silently substitute fixture records.

## Source and selection

- Dataset: https://yc-oss.github.io/api/companies/all.json
- Dataset documentation: https://github.com/yc-oss/api
- Original directory: https://www.ycombinator.com/companies
- Retrieved: November 9, 2026 (America/New_York).
- Downloaded dataset SHA-256: `84cc27184850cd51227c77dc07da590a5c69c3816e5e04ea5b27364c16718a36`

YC OSS is an unofficial public dataset derived from YC's directory search index.
The fixture preserves each company's YC profile URL, individual dataset record URL,
YC ID, batch, reported status, and retrieval date in its `source` object.
Retrieval does not independently verify company websites, current operations,
funding rounds, or hiring status.

Companies were eligible when the dataset reported `Active` and supplied a name,
one-line description, industry, location, website with an HTTP(S) scheme, and YC
profile URL. Selection takes the lowest YC IDs within each industry quota:
B2B (10), Healthcare (8), Fintech (8), Industrials (8), Consumer (6), Education (4),
Government (3), and Real Estate and Construction (3). This provides varied filter
values; it is not a ranking or a representative sample. Records are displayed
alphabetically by company name.

## Field conventions

- `id`: `yc-<YC ID>`, a stable local React/save identifier, not a Supabase UUID.
- `name`, `industry`, `industries`, `website`: copied from the source record.
- `description`: the source's `one_liner`, copied without invented claims.
- `location`: the source's `all_locations`, including multiple locations or Remote.
- `funding_round`: `null` for every record; funding is unverified. YC batch and
  the dataset's general company stage are not funding rounds.
- `source.retrieved_at`: the date this metadata was downloaded, not a funding or
  company-update verification date.

There are no job listings in this fixture. Any later mock jobs must be clearly
identified as demonstration data. Before a database import, confirm defaults,
constraints, UUID mapping, and industry relationships with the team. The preview
IDs stay local; backend records use `startup_id` for their display/save identity.
