# Project State

- Project: Future Court AI
- Production frontend version: 0.1.1
- Backend package version: 0.2.0 baseline
- Stage: Stage 7 — Supabase backend prepared; remote deployment pending
- Live frontend: `https://future-court-ai-dkibaara2025.dkibaara.workers.dev/`
- Implemented in this package: versioned migration, seed case, RLS, least-privilege grants, profile trigger, atomic quota/idempotency RPCs, verdict persistence, authenticated `judge-argument` Edge Function, Gemini structured output, deterministic fallback, CORS allowlist and backend tests.
- Security state: previously exposed credentials were reported rotated; this package contains placeholders only.
- Verified locally without Docker/Supabase runtime: Node artifact tests, source build and secret-pattern scan.
- Requires external execution: `supabase db push --include-seed`, secret configuration, function deployment and cross-account RLS tests.
- Production client remains on deterministic local scoring until the backend deployment and security gate pass.
- Prototype Gate: PARTIAL PASS.
- Next gate: deploy and verify Supabase migration/function, then integrate authenticated browser calls.
