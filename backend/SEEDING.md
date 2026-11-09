# Importing the YC directory data

The frontend JSON is not automatically stored in Supabase. The existing
`startup`, `industry`, and `startup_industry` tables receive the import.

## Current access limitation

The configured publishable key can issue SELECT requests, but the attempted
startup insert was rejected with PostgreSQL code `42501`: a row-level security
policy blocks this role. That attempt inserted no records. SELECT also returned
no visible rows; empty results alone do not prove the database is empty.

Do not enable anonymous writes or disable RLS to run a one-time import.

## SQL Editor import

1. Open the team's Supabase project and its SQL Editor using an authorized account.
2. Paste and run all of `backend/seed_startups.sql` together.
3. Check the final results. The file adds 50 startups, 8 primary industry categories,
   and 50 links if absent. It reuses existing records by case-insensitive name,
   checks startup websites, and does not update existing records.
4. If any constraint fails, the entire import transaction rolls back. If the
   SQL Editor connection remains in an aborted transaction, run `ROLLBACK;`
   before retrying. Resolve the reported mismatch with the team; do not alter
   their schema blindly.
5. Restart the backend and test `GET http://127.0.0.1:8000/startups`. The endpoint
   includes industry names from the link table. Uncheck the frontend preview
   option to see database results.

The API role needs a suitable SELECT policy on all three tables. Data visible
in the SQL Editor may still be hidden from the publishable key. Any policy
changes should follow the team's intended public-directory access rules.

## Optional Python importer

From `backend/`, using a locally configured Python environment:

```bash
python seed_startups.py          # Validate the fixture; no database calls
python seed_startups.py --apply  # Requires a role allowed to insert and read
```

This loads the existing `backend/.env` via `database.py`. Never commit credentials
or put a privileged key into frontend code. The Python importer uses separate
requests, so a later failure can leave earlier batches inserted. Rerunning skips
existing primary keys without overwriting values; it verifies all startup IDs
and industry links are readable afterward. Prefer the transactional SQL file
when using the Dashboard.

## Data conventions

- UUIDs for new startups derive deterministically from their YC profile URLs.
- UUIDs for new industries derive from normalized primary industry names.
- The import uses the primary `industry` category only; the fixture retains
  detailed categories, source URLs, and retrieval dates.
- Funding rounds stay NULL for new records. Founding dates are not invented.
- No job listings, applications, accounts, founders, or saved startups are written.
- These scripts do not create tables or change security policies.
