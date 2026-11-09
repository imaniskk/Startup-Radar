# Demo startups and internship jobs — Milestone 3

`src/data/demo_startups_seed.json` contains 10 fictional startups and 30 sample
internships. Companies have `[DEMO]` names and descriptions; every job description
also starts with `[DEMO]`. Funding, websites, deadlines, and application URLs are
not invented. No real applications are accepted for these openings.

## Import into the existing Supabase project

The existing publishable key cannot insert startup records under the current
RLS policy. Using an authorized account, run all of `backend/seed_demo_startups.sql`
in the Supabase SQL Editor. This imports startup, primary industry, industry-link,
and job records in one transaction. It creates no tables and changes no policies.
The final query should show 10 companies, each with 3 jobs.

Stable UUIDs make reruns safe. Existing records are not updated or deleted; ID or
name conflicts fail the transaction instead of overwriting data. `date_posted`
is the import date, used only for these fictional jobs. If the editor leaves a
failed transaction open, run `ROLLBACK;` before retrying. Do not change shared
constraints just to make the seed pass; ask the team about any schema mismatch.

The API role needs SELECT access to `startup`, `job_listing`, `industry`, and
`startup_industry`. Owner-visible SQL Editor results do not establish API access.
Keep policies consistent with the team's public-directory requirements; do not
disable RLS or add public writes to import demo records.

## Backend and frontend

Start the existing backend from `backend/` in your own Python environment:

```bash
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

The directory uses `GET /startups`. Clicking **View Jobs** calls the new
`GET /startups/{startup_id}/jobs` endpoint. It queries Supabase's `job_listing`
table for that startup, selecting `status = 'open'` and a future or NULL deadline.
This demo establishes the `open` status convention; coordinate other status values
with the job-management owner. Unknown/inaccessible startups return 404, invalid
UUIDs return 422, and query failures return 503. Existing startups without visible
available jobs return an empty list. Hidden jobs cannot be distinguished from
missing jobs without an authorized database check.

`src/services/startupApi.js` handles jobs requests; `StartupJobs.jsx` provides
expand/collapse, loading, empty, error/retry states, and demo labeling. Jobs are
never substituted from JSON in the browser. Application links are only shown for
non-demo records with HTTP(S) URLs. The application flow remains with its owner.

## Demonstration and validation

1. Import the SQL and confirm the 10-by-3 result.
2. Restart the backend and open `http://127.0.0.1:8000/docs` to exercise the jobs endpoint.
3. In the frontend, leave **Use local YC preview data** unchecked.
4. Search `[DEMO]`, then click **View Jobs** on a demo company. Confirm the request
   appears in the browser Network tab and returns 3 actual database rows.
5. Open a real company without jobs to demonstrate the empty state.
6. Stop the backend, expand another card, and use Retry after restarting it.

Automated checks:

```bash
cd backend
python -m unittest test_startup_jobs -v
cd ..
npm run build
npm run lint
```

Unit tests stub the database and need no credentials. A successful live demo also
requires importing the seed and verifying the API role can read it. The fixture
and local tests alone do not satisfy the database-backed milestone requirement.
