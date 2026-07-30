# Implementation Backlog

## P0 — Next increment

1. Create Supabase project, migrations and RLS policies.
2. Add Google OAuth and versioned age/AI-processing consent.
3. Replace local authoritative state with Supabase case, submission, verdict and challenge records.
4. Complete `judge-argument` Edge Function with JWT, consent, Turnstile, quota, idempotency, schema validation and fallback.
5. Replace encoded challenge payload with a server-generated opaque token.
6. Add cross-account authorization tests.

## P1 — Before controlled pilot

1. Persist report, block and deletion workflows.
2. Add first-party analytics events and AI usage ledger.
3. Deploy to Cloudflare Pages and test installation on Android.
4. Add Paystack test checkout and signed webhook processing.
5. Run five-user comprehension test and two-account invitation test.

## P2 — After prototype gate

1. Add additional administrator-authored cases.
2. Add verdict usefulness ratings and seven-day history.
3. Add Court Pass presentation and capacity entitlements.
4. Run 50-user launch experiment.
