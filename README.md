# Startup Radar

React/Vite frontend, FastAPI backend, and Supabase/PostgreSQL.

## Local development

1. Install frontend dependencies with `npm ci`.
2. Use a local Python environment and install `backend/requirements.txt`.
3. Copy `backend/.env.example` to `backend/.env` and supply your Supabase URL and publishable key. Never commit `.env` files.
4. Apply the account migration once; see [account schema setup](backend/migrations/README.md). Do not rerun an already applied migration.
5. After the account and applicant tables exist, apply `backend/migrations/20261109_04_job_applications.sql` once in the Supabase SQL Editor as postgres. This creates the job/application tables, RLS policies, and private PDF bucket. Do not rerun an already applied migration.
6. Start the backend from the repository root:
   ```sh
   backend/.venv/bin/python -m uvicorn main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload
   ```
7. Start the frontend with `npm run dev` and open the displayed URL.

The frontend defaults to `http://127.0.0.1:8000`. To change it, set `VITE_API_URL` in a root `.env.local` and restart Vite. Update backend CORS origins if hosting the frontend at another origin.

## Authentication

Registration/login/logout use the Supabase Auth SDK. Passwords are sent directly to Supabase Auth; the app never stores passwords in profile tables. Supabase persists and refreshes the browser session. Logout ends the session on this browser.

The frontend obtains only the project URL and publishable key through `GET /auth/config`. `SUPABASE_KEY` may be your publishable key. If the backend uses a secret key for other features, also set `SUPABASE_PUBLISHABLE_KEY` to a separate publishable key. The configuration endpoint refuses secret/service-role keys.

Enable email/password authentication in Supabase. Set the Auth Site URL and allow redirect URLs for your local frontend, including `http://localhost:5173/account` and/or `http://127.0.0.1:5173/account`. With email confirmation enabled, registration displays a check-email message; returning via the confirmation link restores the session. Supabase may return a neutral response for an already registered address to avoid disclosing account existence.

`GET /account/me` requires a Bearer access token, verifies it with Supabase Auth, and reads the linked `user` and `applicant` rows using a fresh request-specific Supabase client with that token. RLS still applies. The `/account` page displays the result and reports missing registration-trigger records rather than silently creating a second profile.

Applicant profiles publish name/email through the migration's public profile view. Registration labels these fields as public. Profile editing, email/password changes, saved-startup persistence, industry interests, education/experience editing, public profile pages, and job applications are implemented.

## Job applications

Applicants can browse `/jobs`, save application drafts, answer founder-defined short-text, long-text, URL, and yes/no questions, and submit applications. Submitted applications start as pending and cannot be edited; applicants can see draft, pending, accepted, and rejected applications at `/applications`. Founders can publish openings with a company name, role title, description, and up to 30 questions, close or reopen them, review submitted answers, and set each decision to pending, accepted, or rejected.

Resume and college-transcript PDFs are optional on each draft. Uploads are limited to 10 MB per file and stored in the private `application-documents` bucket. API ownership checks and Storage RLS allow the applicant and the hiring founder to access submitted documents; founders cannot view draft documents. Closing an opening prevents new applications and further edits/submissions to existing drafts, but submitted applications remain available for decisions.

The migration depends on the existing `public.founder`, `public.applicant`, `public."user"`, and `public.applicant_public_profile` schema. The backend verifies account roles from `public."user"` and passes each user's JWT to both PostgREST and Storage. Apply the migration before using the job dashboard; the application endpoints do not create database schema automatically.

Manual checks with founder and applicant accounts:

1. As a founder, publish an opening with required and optional questions of each supported type. Close it and reopen it.
2. As an applicant, start an application, save a draft, add either or both PDFs, and reload to confirm the draft persists. Required answers must be present before submission.
3. Submit the application and verify it becomes pending and locked. From the founder dashboard, inspect the answers and PDFs, then change the decision to accepted or rejected.
4. Verify another applicant cannot access that application or its documents, and another founder cannot view or decide it. These checks require the migration to be applied and do not run against the hosted project automatically.

## Verification

```sh
npm run build
npm run lint
backend/.venv/bin/python -m unittest discover -s backend/tests -v
```

Backend unit tests validate job-question definitions and answers, and verify that per-user Supabase clients pass the verified token to Storage. They do not exercise the hosted database or prove hosted RLS behavior.

Manual end-to-end checks with test accounts:

1. Register account A and confirm its email. Check that `auth.users`, `public.user`, and `public.applicant` share the same UUID.
2. Log in with A, open My account, refresh, and confirm the profile remains available.
3. Confirm an incorrect password fails. Log out and confirm `/account` redirects to login.
4. Repeat with account B. Verify each JWT can read only its own private profile through the database API, and cannot update the other account's rows. Public candidate-view fields are intentionally public.
5. Reuse an existing email and verify no duplicate profile/applicant records are created.


## Applicant account features

The account page supports profile editing, email/password changes, industry interests, saved startups, and education/experience entries. Public profiles are available at `/applicants/<user UUID>` and can be viewed while logged out. Applicants can view their job-application history at `/applications`.

Account endpoints (Bearer authentication required unless marked public):

- `GET /industries` (public): available industries.
- `GET /applicants/{user_id}` (public): approved candidate profile fields only.
- `GET /account/me`, `PATCH /account/me`: private profile read/edit.
- `GET /account/interests`, `PUT` / `DELETE /account/interests/{industry_id}`.
- `GET /account/saved-startups`, `PUT` / `DELETE /account/saved-startups/{startup_id}`.
- `GET` / `POST /account/education`, `PUT` / `DELETE /account/education/{entry_id}`.
- `GET` / `POST /account/experience`, `PUT` / `DELETE /account/experience/{entry_id}`.

Every private query is filtered by the verified user's UUID and uses their token for RLS. Saved startups and interests use idempotent individual add/remove operations. Invalid dates, supplied ownership fields, and nonexistent update targets are rejected. Saves are shared between discovery and the account page and are restored from Supabase on login/reload. Local YC preview records are not database records and cannot be saved until imported.

### Public profile access repair

The running Supabase project returned `42501: permission denied for table user` when reading its public view. Run `backend/migrations/20261109_02_public_profile_access.sql` once as postgres in Supabase SQL Editor. This reinstates the explicit public-field view with owner permissions; it does not grant anonymous users access to the private base tables or change any account data. Do not rerun the original empty-database migration now that accounts exist.

After migration 03, the view publishes name, bio, email, phone, LinkedIn, education, experience, industry interests, and saved-startup metadata. It excludes profile location/address and resume paths.

### End-to-end checks

1. Select interests, refresh, and confirm they remain selected.
2. Save a real database startup in discovery; confirm it appears on the account page after refreshing. Remove it and confirm discovery updates too.
3. Add, edit, and delete education and experience; confirm each change persists after refreshing. Try an end date before the start date and confirm rejection.
4. Open your public profile while logged out and confirm only public fields appear.
5. With two test accounts, verify private collection-management endpoints stay separate (published profile fields are intentionally readable). Use account A's token to attempt updating account B's entry ID and confirm 404; deletion must leave B's record intact.

Backend collection tests use mocks to check endpoint ownership/validation without mutating hosted records. They do not replace live RLS tests or browser testing.


### Profile navigation

My account opens your public candidate profile at `/applicants/<user UUID>`. Saved startups and interests appear near the top for all visitors after migration 03; only the owner sees management controls. The profile uses a responsive cover/identity card, saved-startup cards, interest tags, and experience/education sections.

Edit profile & account opens `/account/edit`, which retains profile/settings and career-entry forms. Edit links from interests, experience, and education jump to the corresponding section. `/account` remains an authentication callback/compatibility route that redirects to the signed-in user's profile.


### Bio and public collections

Run `backend/migrations/20261109_03_bio_public_collections.sql` once in Supabase SQL Editor as postgres. It adds a bio (maximum 500 characters) and exposes industry interests and saved-startup metadata through the existing public profile view. This makes existing selections public for all applicants, as requested. The underlying interest/save tables retain owner-only RLS; visitors read the explicit public view and cannot change selections. The private location/address and resume paths remain excluded. This migration also includes the public-view access repair; the original empty-database migration must not be rerun.

Edit the bio under Edit profile & account. It appears below the candidate name in place of the old generic tagline. Visitors can view saved startups and interest tags; only the owner sees edit/remove controls. Apply the migration before using profile editing, since the API now reads the new bio column.
