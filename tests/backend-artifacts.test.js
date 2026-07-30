import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migrationUrl = new URL('../supabase/migrations/20260730183000_future_court_backend.sql', import.meta.url);
const functionUrl = new URL('../supabase/functions/judge-argument/index.ts', import.meta.url);
const seedUrl = new URL('../supabase/seed.sql', import.meta.url);

const migration = await readFile(migrationUrl, 'utf8');
const edgeFunction = await readFile(functionUrl, 'utf8');
const seed = await readFile(seedUrl, 'utf8');

test('backend migration enables RLS on every private application table', () => {
  for (const table of ['profiles', 'user_consents', 'submissions', 'verdicts', 'verdict_scores', 'challenges', 'blocks', 'reports', 'usage_ledger', 'deletion_requests', 'audit_log']) {
    assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`, 'i'));
  }
});

test('privileged judging functions are restricted to service_role', () => {
  assert.match(migration, /revoke all on function public\.claim_judging_slot[\s\S]*from public, anon, authenticated/i);
  assert.match(migration, /grant execute on function public\.claim_judging_slot[\s\S]*to service_role/i);
  assert.match(migration, /pg_advisory_xact_lock/);
});

test('server computes the final score deterministically', () => {
  assert.match(migration, /v_reasoning \* 0\.35/);
  assert.match(migration, /v_relevance \* 0\.25/);
  assert.match(migration, /v_counterargument \* 0\.20/);
  assert.match(migration, /v_clarity \* 0\.20/);
});

test('edge function keeps privileged keys server-side and verifies the user', () => {
  assert.match(edgeFunction, /Deno\.env\.get\('SUPABASE_SECRET_KEY'\)/);
  assert.match(edgeFunction, /admin\.auth\.getUser\(token\)/);
  assert.doesNotMatch(edgeFunction, /sb_secret_|service_role:\s*eyJ|sb_publishable_/i);
});

test('edge function implements consent, quota, idempotency and safe fallback', () => {
  assert.match(edgeFunction, /CONSENT_VERSION/);
  assert.match(edgeFunction, /idempotencyKey/);
  assert.match(edgeFunction, /claim_judging_slot/);
  assert.match(edgeFunction, /deterministicFallback/);
  assert.match(edgeFunction, /x-goog-api-key/);
});

test('seed data matches the deployed prototype case', () => {
  assert.match(seed, /The People v\. Mnemosyne Cloud/);
  assert.match(seed, /Protect the agreements/);
  assert.match(seed, /Liberate the memories/);
});
