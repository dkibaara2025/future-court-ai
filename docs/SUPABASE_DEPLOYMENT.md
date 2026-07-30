# Supabase Backend Deployment — Future Court AI

This runbook deploys the database baseline and `judge-argument` Edge Function to the Supabase project. No secret belongs in GitHub, Cloudflare static assets, screenshots, or chat messages.

## Approved project

- Project name: `future-court-ai`
- Project reference: `tfxlmbjfkjwsnubhodmu`
- Production web origin: `https://future-court-ai-dkibaara2025.dkibaara.workers.dev`

The project reference and URL are public identifiers. Database passwords, secret keys, JWT signing keys and provider keys are confidential.

## 1. Prerequisites

Install Docker Desktop, Git and the Supabase CLI on the implementation computer. Clone the repository and work from its root.

```powershell
git clone https://github.com/dkibaara2025/future-court-ai.git
cd future-court-ai
```

## 2. Verify locally

```powershell
npm run check
supabase start
supabase db reset
```

Expected database objects include `profiles`, `user_consents`, `cases`, `case_sides`, `submissions`, `verdicts`, `verdict_scores`, `challenges`, `blocks`, `reports`, `usage_ledger`, `deletion_requests` and `audit_log`.

Stop the local stack when verification is complete:

```powershell
supabase stop
```

## 3. Link the remote project

Authenticate with a Supabase Personal Access Token generated in the Supabase account. Do not use or paste a project secret key for CLI login.

```powershell
supabase login
supabase link --project-ref tfxlmbjfkjwsnubhodmu
supabase migration list
supabase db push --dry-run
```

Review the dry-run output. For a new empty project, deploy the migration and seed data:

```powershell
supabase db push --include-seed
```

Do not create or edit the same tables manually in the Dashboard after migrations are adopted.

## 4. Configure authentication

In Supabase Dashboard → Authentication → URL Configuration:

- Site URL: `https://future-court-ai-dkibaara2025.dkibaara.workers.dev`
- Redirect URL: `https://future-court-ai-dkibaara2025.dkibaara.workers.dev`
- Development redirect: `http://localhost:4173`

Enable Google OAuth only after its client ID and secret are available. Do not depend on the default email sender for the pilot.

## 5. Configure Edge Function secrets

Run these commands on the implementation computer. Enter the newly rotated values locally. Never paste them into chat or commit them.

```powershell
supabase secrets set SUPABASE_SECRET_KEY="<new Supabase secret key>"
supabase secrets set GEMINI_API_KEY="<Gemini API key>"
supabase secrets set GEMINI_MODEL="gemini-2.5-flash-lite"
supabase secrets set AI_CONSENT_VERSION="ai-processing-v1"
supabase secrets set ALLOWED_ORIGINS="https://future-court-ai-dkibaara2025.dkibaara.workers.dev,http://localhost:4173"
```

The function also supports the hosted `SUPABASE_SERVICE_ROLE_KEY` as a compatibility fallback, but the project should use the modern rotated secret key through `SUPABASE_SECRET_KEY`.

## 6. Deploy the function

```powershell
supabase functions deploy judge-argument
```

The function requires an authenticated user JWT. It rejects unknown origins, missing age confirmation, missing consent, invalid cases, invalid sides, repeated high-frequency calls and exhausted free quotas.

## 7. Database verification

Run the following in Supabase SQL Editor after deployment:

```sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;

select proname, prosecdef
from pg_proc
where proname in ('claim_judging_slot', 'finalize_verdict', 'fail_judging_slot')
order by proname;

select c.slug, c.status, count(s.id) as sides
from public.cases c
join public.case_sides s on s.case_id = c.id
group by c.slug, c.status;
```

Required results:

- Every application table reports `rowsecurity = true`.
- All three judging functions report `prosecdef = true`.
- `memory-rights-2089` is active and has two sides.

## 8. Stop gate

Do not connect the production browser client until all of these pass:

- Migration applied without error.
- Seed case exists.
- RLS is enabled on every application table.
- Function deploy succeeds.
- No secret appears in Git history or browser assets.
- A test account can confirm age and insert consent under its own user ID.
- A cross-account RLS test denies access to another user’s submission and verdict.

## Return evidence

Return only:

- Screenshot of the migration success or migration list.
- Screenshot of the Edge Function showing deployed status.
- Output of the three verification queries above with sensitive identifiers obscured.
- Function URL, which is public.

Do not return passwords, secret keys, access tokens, JWTs or authorization headers.
