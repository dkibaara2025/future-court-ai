# Future Court AI Backend Return Manifest

## Package

- Backend baseline: 0.2.0
- Production frontend remains: 0.1.1
- Supabase project reference: tfxlmbjfkjwsnubhodmu
- Production origin: https://future-court-ai-dkibaara2025.dkibaara.workers.dev

## Included

- Versioned Postgres migration
- Reproducible seed data
- Row Level Security policies
- Least-privilege grants
- Atomic quota and idempotency RPCs
- Authenticated judge-argument Edge Function
- Gemini structured-output path
- Deterministic server fallback
- Backend artifact tests
- Deployment and cross-account RLS test runbooks

## Verified in this environment

- `npm run check`: passed
- Node tests: 13 passed, 0 failed
- Production build: passed
- Credential-value scan: passed

## Not verified in this environment

- Supabase local database reset
- Remote migration execution
- Edge Function type-check under Deno
- Cross-account RLS behavior
- Gemini provider response

The missing checks require Docker, Supabase CLI, Deno and authenticated external services, none of which are available in this execution environment.

## External return evidence

Return only screenshots or non-secret output showing:

1. `supabase migration list` after deployment.
2. Edge Function deployed status.
3. RLS query results.
4. Seed case with two sides.
5. Cross-account denial test results.
6. Public function URL.

Never return passwords, secret keys, JWTs, access tokens or authorization headers.
