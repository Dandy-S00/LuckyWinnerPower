# Texas Winners — Setup & Deploy Walkthrough

This guide takes you from zero to a live site with accounts, age verification, and Stripe deposits. Two services, both free to start: **Supabase** (accounts/database) and **Vercel** (hosting + serverless API).

---

## Part 1 — Create your Supabase project (~3 min)

1. Go to <https://supabase.com> and sign up (GitHub login is easiest).
2. Click **New project**.
   - **Name:** `texas-winners` (anything you like)
   - **Database Password:** generate a strong one and save it somewhere safe.
   - **Region:** pick the one closest to your players.
3. Wait ~1 minute for it to provision.

### Run the database setup script
1. In the left sidebar, open **SQL Editor → New query**.
2. Open the file [`supabase/setup.sql`](supabase/setup.sql) from this repo, copy its entire contents, paste into the editor, and click **Run**.
3. You should see "Success. No rows returned." This creates:
   - a `profiles` table (date of birth + age-verified flag),
   - a `deposits` table (deposit history),
   - **Row-Level Security** so each user can only read their own data,
   - a **trigger that enforces 18+ on the server** — even if someone tampers with the browser, an under-18 signup is rejected by the database.

### Grab your Supabase keys
1. Go to **Project Settings → API**.
2. Copy these three values (you'll paste them into Vercel in Part 3):
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY` (safe to expose in the browser)
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (**SECRET** — server only, never commit it)

### Optional but recommended: email confirmation
- **Authentication → Providers → Email** is on by default and requires users to confirm their email before logging in. For going live tonight you can leave it on (more secure) or turn off "Confirm email" for instant logins during testing.
- **Authentication → URL Configuration → Site URL:** set this to your Vercel URL once you have it (Part 3) so confirmation links point to the right place.

---

## Part 2 — Stripe keys (you already have these)

You'll need three values:
- **Publishable key** (`pk_...`) → `STRIPE_PUBLISHABLE_KEY`
- **Secret key** (`sk_...`) → `STRIPE_SECRET_KEY`
- **Webhook signing secret** (`whsec_...`) → `STRIPE_WEBHOOK_SECRET` — you create this in Part 4, after the site is deployed.

---

## Part 3 — Deploy to Vercel and add environment variables

1. Go to <https://vercel.com>, sign in with GitHub, and **Add New → Project**.
2. Import the `Dandy-S00/LuckyWinnerPower` repo. Vercel auto-detects the config — just click **Deploy**.
3. After the first deploy you'll get a URL like `https://texas-winners.vercel.app`. Copy it.
4. Go to **Project → Settings → Environment Variables** and add all of these (Production + Preview):

   | Name | Value |
   |------|-------|
   | `STRIPE_SECRET_KEY` | your `sk_...` key |
   | `STRIPE_PUBLISHABLE_KEY` | your `pk_...` key |
   | `STRIPE_WEBHOOK_SECRET` | `whsec_...` (from Part 4) |
   | `BASE_URL` | your Vercel URL, e.g. `https://texas-winners.vercel.app` |
   | `SUPABASE_URL` | your Supabase Project URL |
   | `SUPABASE_ANON_KEY` | your Supabase anon public key |
   | `SUPABASE_SERVICE_ROLE_KEY` | your Supabase service_role key |

5. After adding the variables, go to **Deployments → ⋯ → Redeploy** so they take effect.

> Note: the `@stripe-secret-key` style references in `vercel.json` just map env var names; setting the plain variables above in the dashboard is all you need.

---

## Part 4 — Connect the Stripe webhook (so deposits get recorded)

1. In Stripe Dashboard go to **Developers → Webhooks → Add endpoint**.
2. **Endpoint URL:** `https://YOUR-VERCEL-URL/api/webhook`
3. **Events to send:** select `checkout.session.completed` (and optionally `payment_intent.payment_failed`).
4. Click **Add endpoint**, then copy the **Signing secret** (`whsec_...`).
5. Put that value into Vercel as `STRIPE_WEBHOOK_SECRET` and **redeploy** once more.

---

## Part 5 — Test the live flow

1. Visit your site → **Create Account** → enter email, password, a date of birth that's 18+, check both boxes.
2. Confirm your email if confirmation is on, then **Log In**.
3. Try **Play Games** — you should now reach the lobby. Logged out, it redirects to login.
4. Try **Deposit** → use Stripe test card `4242 4242 4242 4242`, any future expiry, any CVC.
5. In Supabase **Table Editor → deposits**, you should see the recorded deposit row.

### Under-18 check
Create an account with a DOB under 18 — the database trigger rejects it with "You must be at least 18 years old to create an account."

---

## What enforces the age rule?

- **Front end:** the signup form blocks under-18 dates and requires the attestation checkbox.
- **Back end (cannot be bypassed):** a Postgres trigger recomputes age from the submitted date of birth on every signup and aborts the account creation if it's under 18. No government ID is ever requested — this is the legal self-attestation model used by sweepstakes/social-casino sites.
