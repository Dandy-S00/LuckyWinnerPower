---
name: testing-texas-winners
description: Test the Texas Winners sweepstakes app end-to-end. Use when verifying signup, login, usernames, admin/distributor portals, deposit/Stripe, or auth-gated pages.
---

# Testing Texas Winners App

## Overview
Texas Winners is a **React + Vite SPA** (PWA) deployed on Vercel (zero-config). Frontend lives in `src/` (routes in `src/App.jsx`). Backend is Vercel serverless functions (`/api/*.js`), auth via Supabase, payments via Stripe Checkout. Admin/distributor portal is the `/admin` route (`src/pages/Admin.jsx`, shared `UsersTab` for both roles).

Note: the repo still contains legacy HTTrack-scraped `*.html` files at the repo root (e.g. `signup.html`). These are NOT the app — ignore them.

## Devin Secrets Needed
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ACCESS_TOKEN` — Supabase Management API PAT (`sbp_...`), for running SQL migrations / DB queries
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`
- `VERCEL_TOKEN`
- `ADMIN_PASSWORD` — password for the admin account `spacedandyxho@gmail.com` (when present in env)

Supabase env vars are typically already exported in the shell. `ADMIN_EMAILS` may be empty in the shell — you must set it explicitly when running the API locally (see below).

## Running the PR branch locally against production Supabase
The deployed site reflects `Master-Branch`, so to test an unmerged PR run it locally:

1. Start the API (devserver emulates Vercel functions on :3000). **Set `ADMIN_EMAILS`** so the admin account resolves as admin (its `profiles.role` may be `player`; admin status in prod comes from `ADMIN_EMAILS`):
```bash
ADMIN_EMAILS=spacedandyxho@gmail.com PORT=3000 node devserver.js
```
2. Start the frontend (vite dev :5173 proxies `/api` → :3000):
```bash
npx vite --host 0.0.0.0 --port 5173
```
3. **Navigate via in-app SPA links, not direct URLs.** vite dev serves the legacy `signup.html` for a direct `/signup` visit (parse error). Instead open `http://localhost:5173/` and click through (Login → "Create one here", etc.). Direct-nav works fine for `/admin`, `/account`, `/games` after you're on the SPA.

### KNOWN LOCAL GOTCHA: Node 20 + Supabase realtime WebSocket
`/api/portal/*` may return **500** locally with `Node.js 20 detected without native WebSocket support` — `@supabase/supabase-js` throws when building the client in `lib/verifyUser.js`. This is a **local-only** dev-server issue (production works). Fix by polyfilling WebSocket in the untracked, test-only `devserver.js`:
```js
if (!globalThis.WebSocket) { globalThis.WebSocket = require('ws'); }  // at top of devserver.js
npm install ws --no-save
```
Then restart devserver. Alternatively use Node 22+ (has global WebSocket). Never commit devserver.js changes.

### Typing secrets into the browser without exposing them
To log in as admin, focus the password field via the computer tool, then type the env value with xdotool:
```bash
DISPLAY=:0 xdotool type --delay 30 "$ADMIN_PASSWORD"
```

## Current signup/auth behavior (post-PR #12)
- Public signup asks for **email + password only** — NO date-of-birth, NO age/terms checkboxes.
- `mailer_autoconfirm=true` in prod → signup **logs in immediately** and redirects to `/games` (no "check your email" step). Removing DOB also removed the old 18+ enforcement.
- Every account gets a **server-generated Texas-themed username** (e.g. `LuckyMaverick0423`) via a DB trigger (`public.gen_username()` in `supabase/admin-setup.sql`), unique case-insensitively.
- Account page (`/account`) shows Email + Username (fetched from `/api/portal/me`), no DOB/age rows.

## Test Scenarios (current)
1. **Signup form**: only Email + Password + "Create My Account" + username helper text; no DOB/age/terms.
2. **Signup → immediate login**: submit unique `devin-test-<ts>@tempmail.test` / `TestPass123!` → navigates to `/games`, nav shows "My Account"/"Log Out"; no confirmation message.
3. **Account username**: `/account` shows non-empty username, no DOB rows.
4. **Admin portal** (`/admin` as admin): Users table has a **Username** column populated for all rows; search matches email or username.
5. **Admin create-user**: form has Email + Password + optional Distributor, **no DOB**; success reads `... created (username: Xxx)`; row appears.
6. **Distributor portal**: create a temp distributor via admin Distributors tab (Name/Referral Code/Login Email/Login Password) → log in as it → Distributor Portal shows only its own players ("No users found" initially = isolation), create-user has no DOB and note "New players are automatically assigned to you"; created player is scoped to that distributor.

## Post-Test Cleanup
Delete all `@tempmail.test` accounts (auth delete cascades to `profiles` and `distributors`):
```bash
python3 - <<'EOF'
import os, json, urllib.request
url=os.environ["SUPABASE_URL"]; svc=os.environ["SUPABASE_SERVICE_ROLE_KEY"]
def api(m,p):
    r=urllib.request.Request(url+p,method=m,headers={"apikey":svc,"Authorization":"Bearer "+svc})
    return json.loads(urllib.request.urlopen(r).read().decode() or "{}")
for u in api("GET","/auth/v1/admin/users?per_page=200").get("users",[]):
    if u.get("email","").endswith("@tempmail.test"):
        api("DELETE","/auth/v1/admin/users/"+u["id"]); print("deleted",u["email"])
EOF
```
Verify with a Management API SQL query (needs `SUPABASE_ACCESS_TOKEN`) that leftover profiles/distributors = 0.

## Common Issues
- **Supabase project paused (INACTIVE)**: queries time out. Restore via `POST https://api.supabase.com/v1/projects/<ref>/restore` with the PAT, wait for `ACTIVE_HEALTHY`.
- **Management API 403 (Cloudflare)**: add `User-Agent`, `Accept: application/json` headers to curl.
- **`/api/*` 404 in prod**: vercel.json must stay zero-config (no legacy `builds`/`routes`).
- **Stripe test vs live**: test keys `pk_test_`/`sk_test_`; no real money moves.

## Architecture Notes
- Routes: `src/App.jsx` — `/`, `/login`, `/signup`, `/games`, `/deposit`, `/account`, `/admin`, etc.
- Auth: `src/context/AuthContext.jsx` (`signUp`/`signIn`); portal APIs `api/portal/{me,users,distributors,balance,reassign}.js`.
- Role resolution: `lib/requireRole.js` — admin via `ADMIN_EMAILS` OR `profiles.role='admin'`; distributor must be `active`; players blocked from portal endpoints.
- Username generation + DOB-nullable migration: `supabase/admin-setup.sql`.
