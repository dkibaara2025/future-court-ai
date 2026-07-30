begin;

create extension if not exists pgcrypto with schema extensions;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_alias text not null default 'Counsel' check (char_length(display_alias) between 1 and 24),
  age_confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.user_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  consent_type text not null check (consent_type in ('pilot_terms', 'ai_processing', 'privacy_notice')),
  version text not null check (char_length(version) between 1 and 64),
  accepted_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique (user_id, consent_type, version)
);

create table public.rubric_versions (
  id uuid primary key default gen_random_uuid(),
  version text not null unique,
  weights jsonb not null,
  active boolean not null default false,
  created_at timestamptz not null default now(),
  constraint rubric_weights_shape check (
    weights ?& array['reasoning', 'relevance', 'counterargument', 'clarity']
  )
);

create table public.cases (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  case_year integer not null check (case_year between 2026 and 9999),
  scenario text not null,
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  published_at timestamptz,
  expires_at timestamptz,
  rubric_version_id uuid not null references public.rubric_versions(id),
  assignment_mode text not null default 'choose' check (assignment_mode in ('choose', 'assigned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.case_sides (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  code text not null check (code ~ '^[a-z][a-z0-9_-]{1,31}$'),
  label text not null,
  position_text text not null,
  created_at timestamptz not null default now(),
  unique (case_id, code)
);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  case_id uuid not null references public.cases(id),
  side_id uuid not null references public.case_sides(id),
  argument_text text not null,
  char_count smallint generated always as (char_length(argument_text)) stored,
  idempotency_key text not null check (char_length(idempotency_key) between 8 and 100),
  status text not null default 'pending' check (status in ('pending', 'completed', 'blocked', 'failed')),
  safety_status text not null default 'accepted' check (safety_status in ('accepted', 'blocked', 'review')),
  failure_code text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint argument_length check (char_length(argument_text) between 40 and 500),
  unique (user_id, idempotency_key)
);

create table public.verdicts (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null unique references public.submissions(id) on delete cascade,
  rubric_version_id uuid not null references public.rubric_versions(id),
  model_name text not null,
  prompt_version text not null,
  total_score smallint not null check (total_score between 0 and 100),
  strength text not null,
  improvement text not null,
  opposing_argument text not null,
  fallback_used boolean not null default false,
  latency_ms integer not null default 0 check (latency_ms between 0 and 120000),
  created_at timestamptz not null default now()
);

create table public.verdict_scores (
  verdict_id uuid not null references public.verdicts(id) on delete cascade,
  dimension_code text not null check (dimension_code in ('reasoning', 'relevance', 'counterargument', 'clarity')),
  score smallint not null check (score between 1 and 10),
  feedback text not null,
  primary key (verdict_id, dimension_code)
);

create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id),
  challenger_user_id uuid not null references public.profiles(id) on delete cascade,
  challenger_submission_id uuid not null references public.submissions(id) on delete cascade,
  invitee_user_id uuid references public.profiles(id) on delete set null,
  invitee_submission_id uuid references public.submissions(id) on delete set null,
  token_hash text not null unique,
  status text not null default 'open' check (status in ('open', 'accepted', 'completed', 'expired', 'cancelled')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint challenge_different_users check (invitee_user_id is null or invitee_user_id <> challenger_user_id)
);

create table public.blocks (
  blocker_user_id uuid not null references public.profiles(id) on delete cascade,
  blocked_user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_user_id, blocked_user_id),
  constraint cannot_block_self check (blocker_user_id <> blocked_user_id)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('case', 'verdict', 'challenge', 'profile')),
  target_id uuid not null,
  reason_code text not null check (reason_code in ('harassment', 'unsafe_content', 'privacy', 'spam', 'other')),
  optional_note text check (optional_note is null or char_length(optional_note) <= 500),
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table public.usage_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  usage_type text not null check (usage_type in ('verdict_completed', 'challenge_created', 'sandbox_checkout')),
  units integer not null default 1 check (units > 0),
  reference_id uuid,
  model_name text,
  estimated_cost_usd numeric(12, 8) not null default 0 check (estimated_cost_usd >= 0),
  occurred_at timestamptz not null default now(),
  unique (usage_type, reference_id)
);

create table public.deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'requested' check (status in ('requested', 'processing', 'completed', 'failed')),
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  failure_code text
);

create unique index one_open_deletion_request_per_user
  on public.deletion_requests(user_id)
  where status in ('requested', 'processing');

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_type text not null check (actor_type in ('user', 'service', 'admin', 'system')),
  actor_id uuid,
  action text not null,
  target_type text not null,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index submissions_user_created_idx on public.submissions(user_id, created_at desc);
create index submissions_status_created_idx on public.submissions(status, created_at desc);
create index challenges_participants_idx on public.challenges(challenger_user_id, invitee_user_id, status);
create index reports_status_created_idx on public.reports(status, created_at);
create index usage_user_type_time_idx on public.usage_ledger(user_id, usage_type, occurred_at desc);
create index audit_action_time_idx on public.audit_log(action, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger cases_set_updated_at
before update on public.cases
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, display_alias)
  values (
    new.id,
    left(coalesce(nullif(new.raw_user_meta_data ->> 'display_alias', ''), 'Counsel'), 24)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.claim_judging_slot(
  p_user_id uuid,
  p_case_id uuid,
  p_side_id uuid,
  p_argument_text text,
  p_idempotency_key text,
  p_consent_version text
)
returns table (
  submission_id uuid,
  is_new boolean,
  submission_status text,
  quota_remaining integer
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_existing public.submissions%rowtype;
  v_daily_count integer;
  v_minute_count integer;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  if not exists (
    select 1 from public.profiles p
    where p.id = p_user_id and p.age_confirmed_at is not null and p.deleted_at is null
  ) then
    raise exception using errcode = 'P0001', message = 'AGE_CONFIRMATION_REQUIRED';
  end if;

  if not exists (
    select 1 from public.user_consents c
    where c.user_id = p_user_id
      and c.consent_type = 'ai_processing'
      and c.version = p_consent_version
      and c.revoked_at is null
  ) then
    raise exception using errcode = 'P0001', message = 'CONSENT_REQUIRED';
  end if;

  if char_length(trim(p_argument_text)) < 40 or char_length(trim(p_argument_text)) > 500 then
    raise exception using errcode = 'P0001', message = 'INVALID_ARGUMENT';
  end if;

  if char_length(p_idempotency_key) < 8 or char_length(p_idempotency_key) > 100 then
    raise exception using errcode = 'P0001', message = 'INVALID_IDEMPOTENCY_KEY';
  end if;

  select * into v_existing
  from public.submissions s
  where s.user_id = p_user_id and s.idempotency_key = p_idempotency_key;

  if found then
    return query
      select v_existing.id, false, v_existing.status,
        greatest(0, 3 - (
          select count(*)::integer from public.submissions q
          where q.user_id = p_user_id
            and q.status in ('pending', 'completed')
            and q.created_at >= date_trunc('day', now() at time zone 'utc') at time zone 'utc'
        ));
    return;
  end if;

  if not exists (
    select 1 from public.cases c
    where c.id = p_case_id
      and c.status = 'active'
      and c.published_at <= now()
      and (c.expires_at is null or c.expires_at > now())
  ) then
    raise exception using errcode = 'P0001', message = 'CASE_NOT_ACTIVE';
  end if;

  if not exists (
    select 1 from public.case_sides s
    where s.id = p_side_id and s.case_id = p_case_id
  ) then
    raise exception using errcode = 'P0001', message = 'INVALID_SIDE';
  end if;

  select count(*)::integer into v_minute_count
  from public.submissions s
  where s.user_id = p_user_id
    and s.status in ('pending', 'completed')
    and s.created_at >= now() - interval '1 minute';

  if v_minute_count >= 5 then
    raise exception using errcode = 'P0001', message = 'RATE_LIMITED';
  end if;

  select count(*)::integer into v_daily_count
  from public.submissions s
  where s.user_id = p_user_id
    and s.status in ('pending', 'completed')
    and s.created_at >= date_trunc('day', now() at time zone 'utc') at time zone 'utc';

  if v_daily_count >= 3 then
    raise exception using errcode = 'P0001', message = 'QUOTA_EXCEEDED';
  end if;

  insert into public.submissions (
    user_id, case_id, side_id, argument_text, idempotency_key, status, safety_status
  ) values (
    p_user_id, p_case_id, p_side_id, trim(p_argument_text), p_idempotency_key, 'pending', 'accepted'
  ) returning id into submission_id;

  is_new := true;
  submission_status := 'pending';
  quota_remaining := greatest(0, 3 - v_daily_count - 1);
  return next;
end;
$$;

create or replace function public.finalize_verdict(
  p_user_id uuid,
  p_submission_id uuid,
  p_model_name text,
  p_prompt_version text,
  p_fallback_used boolean,
  p_latency_ms integer,
  p_verdict jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_submission public.submissions%rowtype;
  v_case public.cases%rowtype;
  v_verdict_id uuid;
  v_reasoning integer;
  v_relevance integer;
  v_counterargument integer;
  v_clarity integer;
  v_total integer;
begin
  select * into v_submission
  from public.submissions s
  where s.id = p_submission_id and s.user_id = p_user_id
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'SUBMISSION_NOT_FOUND';
  end if;

  if v_submission.status = 'completed' then
    select v.id into v_verdict_id from public.verdicts v where v.submission_id = p_submission_id;
    return jsonb_build_object('verdict_id', v_verdict_id, 'already_completed', true);
  end if;

  if v_submission.status <> 'pending' then
    raise exception using errcode = 'P0001', message = 'SUBMISSION_NOT_PENDING';
  end if;

  select * into v_case from public.cases where id = v_submission.case_id;

  v_reasoning := (p_verdict #>> '{reasoning,score}')::integer;
  v_relevance := (p_verdict #>> '{relevance,score}')::integer;
  v_counterargument := (p_verdict #>> '{counterargument,score}')::integer;
  v_clarity := (p_verdict #>> '{clarity,score}')::integer;

  if v_reasoning not between 1 and 10
    or v_relevance not between 1 and 10
    or v_counterargument not between 1 and 10
    or v_clarity not between 1 and 10 then
    raise exception using errcode = 'P0001', message = 'INVALID_VERDICT_SCORES';
  end if;

  v_total := round((
    v_reasoning * 0.35 +
    v_relevance * 0.25 +
    v_counterargument * 0.20 +
    v_clarity * 0.20
  ) * 10)::integer;

  insert into public.verdicts (
    submission_id, rubric_version_id, model_name, prompt_version, total_score,
    strength, improvement, opposing_argument, fallback_used, latency_ms
  ) values (
    p_submission_id,
    v_case.rubric_version_id,
    left(p_model_name, 100),
    left(p_prompt_version, 64),
    v_total,
    left(coalesce(p_verdict ->> 'strength', ''), 800),
    left(coalesce(p_verdict ->> 'improvement', ''), 800),
    left(coalesce(p_verdict ->> 'opposingArgument', ''), 1200),
    p_fallback_used,
    greatest(0, least(p_latency_ms, 120000))
  ) returning id into v_verdict_id;

  insert into public.verdict_scores (verdict_id, dimension_code, score, feedback)
  values
    (v_verdict_id, 'reasoning', v_reasoning, left(coalesce(p_verdict #>> '{reasoning,feedback}', ''), 600)),
    (v_verdict_id, 'relevance', v_relevance, left(coalesce(p_verdict #>> '{relevance,feedback}', ''), 600)),
    (v_verdict_id, 'counterargument', v_counterargument, left(coalesce(p_verdict #>> '{counterargument,feedback}', ''), 600)),
    (v_verdict_id, 'clarity', v_clarity, left(coalesce(p_verdict #>> '{clarity,feedback}', ''), 600));

  update public.submissions
  set status = 'completed', completed_at = now(), failure_code = null
  where id = p_submission_id;

  insert into public.usage_ledger (
    user_id, usage_type, units, reference_id, model_name, estimated_cost_usd
  ) values (
    p_user_id, 'verdict_completed', 1, v_verdict_id, left(p_model_name, 100), 0
  ) on conflict (usage_type, reference_id) do nothing;

  insert into public.audit_log (actor_type, actor_id, action, target_type, target_id, metadata)
  values (
    'service', p_user_id, 'verdict_finalized', 'verdict', v_verdict_id,
    jsonb_build_object('fallback_used', p_fallback_used, 'model_name', left(p_model_name, 100))
  );

  return jsonb_build_object(
    'verdict_id', v_verdict_id,
    'submission_id', p_submission_id,
    'totalScore', v_total,
    'reasoning', p_verdict -> 'reasoning',
    'relevance', p_verdict -> 'relevance',
    'counterargument', p_verdict -> 'counterargument',
    'clarity', p_verdict -> 'clarity',
    'strength', p_verdict ->> 'strength',
    'improvement', p_verdict ->> 'improvement',
    'opposingArgument', p_verdict ->> 'opposingArgument',
    'fallbackUsed', p_fallback_used
  );
end;
$$;

create or replace function public.fail_judging_slot(
  p_user_id uuid,
  p_submission_id uuid,
  p_failure_code text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.submissions
  set status = 'failed', failure_code = left(p_failure_code, 100)
  where id = p_submission_id and user_id = p_user_id and status = 'pending';
end;
$$;

alter table public.profiles enable row level security;
alter table public.user_consents enable row level security;
alter table public.rubric_versions enable row level security;
alter table public.cases enable row level security;
alter table public.case_sides enable row level security;
alter table public.submissions enable row level security;
alter table public.verdicts enable row level security;
alter table public.verdict_scores enable row level security;
alter table public.challenges enable row level security;
alter table public.blocks enable row level security;
alter table public.reports enable row level security;
alter table public.usage_ledger enable row level security;
alter table public.deletion_requests enable row level security;
alter table public.audit_log enable row level security;

create policy profiles_select_own on public.profiles
for select to authenticated using (id = (select auth.uid()));
create policy profiles_update_own on public.profiles
for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy consents_select_own on public.user_consents
for select to authenticated using (user_id = (select auth.uid()));
create policy consents_insert_own on public.user_consents
for insert to authenticated with check (user_id = (select auth.uid()));

create policy rubric_read_active on public.rubric_versions
for select to anon, authenticated using (active = true);

create policy cases_read_active on public.cases
for select to anon, authenticated using (
  status = 'active' and published_at <= now() and (expires_at is null or expires_at > now())
);

create policy sides_read_for_active_case on public.case_sides
for select to anon, authenticated using (
  exists (
    select 1 from public.cases c
    where c.id = case_sides.case_id
      and c.status = 'active'
      and c.published_at <= now()
      and (c.expires_at is null or c.expires_at > now())
  )
);

create policy submissions_select_own on public.submissions
for select to authenticated using (user_id = (select auth.uid()));

create policy verdicts_select_own on public.verdicts
for select to authenticated using (
  exists (
    select 1 from public.submissions s
    where s.id = verdicts.submission_id and s.user_id = (select auth.uid())
  )
);

create policy verdict_scores_select_own on public.verdict_scores
for select to authenticated using (
  exists (
    select 1
    from public.verdicts v
    join public.submissions s on s.id = v.submission_id
    where v.id = verdict_scores.verdict_id and s.user_id = (select auth.uid())
  )
);

create policy challenges_select_participant on public.challenges
for select to authenticated using (
  challenger_user_id = (select auth.uid()) or invitee_user_id = (select auth.uid())
);

create policy blocks_select_own on public.blocks
for select to authenticated using (blocker_user_id = (select auth.uid()));
create policy blocks_insert_own on public.blocks
for insert to authenticated with check (blocker_user_id = (select auth.uid()));
create policy blocks_delete_own on public.blocks
for delete to authenticated using (blocker_user_id = (select auth.uid()));

create policy reports_select_own on public.reports
for select to authenticated using (reporter_user_id = (select auth.uid()));
create policy reports_insert_own on public.reports
for insert to authenticated with check (reporter_user_id = (select auth.uid()));

create policy deletion_requests_select_own on public.deletion_requests
for select to authenticated using (user_id = (select auth.uid()));
create policy deletion_requests_insert_own on public.deletion_requests
for insert to authenticated with check (user_id = (select auth.uid()));

revoke all on all tables in schema public from anon, authenticated;
grant select on public.rubric_versions, public.cases, public.case_sides to anon, authenticated;
grant select on public.profiles, public.user_consents, public.submissions, public.verdicts,
  public.verdict_scores, public.challenges, public.blocks, public.reports,
  public.deletion_requests to authenticated;
grant update (display_alias, age_confirmed_at) on public.profiles to authenticated;
grant insert on public.user_consents, public.blocks, public.reports, public.deletion_requests to authenticated;
grant delete on public.blocks to authenticated;

revoke all on function public.claim_judging_slot(uuid, uuid, uuid, text, text, text) from public, anon, authenticated;
revoke all on function public.finalize_verdict(uuid, uuid, text, text, boolean, integer, jsonb) from public, anon, authenticated;
revoke all on function public.fail_judging_slot(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.claim_judging_slot(uuid, uuid, uuid, text, text, text) to service_role;
grant execute on function public.finalize_verdict(uuid, uuid, text, text, boolean, integer, jsonb) to service_role;
grant execute on function public.fail_judging_slot(uuid, uuid, text) to service_role;

commit;
