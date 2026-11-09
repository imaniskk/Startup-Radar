# Startup Radar

React/Vite frontend, FastAPI backend, and Supabase/PostgreSQL.

## Local development

1. Install frontend dependencies with `npm ci`.
2. Use a local Python environment and install `backend/requirements.txt`.
3. Copy `backend/.env.example` to `backend/.env` and supply your Supabase URL and publishable key. Never commit `.env` files.
4. Apply the account migration once; see [account schema setup](backend/migrations/README.md). Do not rerun an already applied migration.
5. Start the backend from the repository root:
   ```sh
   backend/.venv/bin/python -m uvicorn main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload
   ```
6. Start the frontend with `npm run dev` and open the displayed URL.

The frontend defaults to `http://127.0.0.1:8000`. To change it, set `VITE_API_URL` in a root `.env.local` and restart Vite. Update backend CORS origins if hosting the frontend at another origin.

## Authentication

Registration/login/logout use the Supabase Auth SDK. Passwords are sent directly to Supabase Auth; the app never stores passwords in profile tables. Supabase persists and refreshes the browser session. Logout ends the session on this browser.

The frontend obtains only the project URL and publishable key through `GET /auth/config`. `SUPABASE_KEY` may be your publishable key. If the backend uses a secret key for other features, also set `SUPABASE_PUBLISHABLE_KEY` to a separate publishable key. The configuration endpoint refuses secret/service-role keys.

Enable email/password authentication in Supabase. Set the Auth Site URL and allow redirect URLs for your local frontend, including `http://localhost:5173/account` and/or `http://127.0.0.1:5173/account`. With email confirmation enabled, registration displays a check-email message; returning via the confirmation link restores the session. Supabase may return a neutral response for an already registered address to avoid disclosing account existence.

`GET /account/me` requires a Bearer access token, verifies it with Supabase Auth, and reads the linked `user` and `applicant` rows using a fresh request-specific Supabase client with that token. RLS still applies. The `/account` page displays the result and reports missing registration-trigger records rather than silently creating a second profile.

Applicant profiles publish name/email through the migration's public profile view. Registration labels these fields as public. Profile editing, saved-startup persistence, industry interests, education/experience editing, and public profile pages remain the next implementation phase. No bonus features are implemented.

## Verification

```sh
npm run build
npm run lint
backend/.venv/bin/python -m unittest discover -s backend/tests -v
```

Backend tests use mocks, do not send emails or create hosted accounts, and cover token verification, per-user query scoping, missing profiles, and refusal to expose secret configuration. They do not prove hosted RLS behavior.

Manual end-to-end checks with test accounts:

1. Register account A and confirm its email. Check that `auth.users`, `public.user`, and `public.applicant` share the same UUID.
2. Log in with A, open My account, refresh, and confirm the profile remains available.
3. Confirm an incorrect password fails. Log out and confirm `/account` redirects to login.
4. Repeat with account B. Verify each JWT can read only its own private profile through the database API, and cannot update the other account's rows. Public candidate-view fields are intentionally public.
5. Reuse an existing email and verify no duplicate profile/applicant records are created.
