insert into public.rubric_versions (id, version, weights, active)
values (
  '00000000-0000-4000-8000-000000000001',
  'future-court-rubric-v1',
  '{"reasoning":0.35,"relevance":0.25,"counterargument":0.20,"clarity":0.20}'::jsonb,
  true
)
on conflict (id) do update
set version = excluded.version, weights = excluded.weights, active = excluded.active;

insert into public.cases (
  id, slug, title, case_year, scenario, status, published_at,
  rubric_version_id, assignment_mode
) values (
  '20890000-0000-4000-8000-000000000001',
  'memory-rights-2089',
  'The People v. Mnemosyne Cloud',
  2089,
  'A company offers free medical treatment in exchange for permanent access to patients’ recorded memories. The memories train diagnostic systems used across the planet. A patient coalition asks the Future Court to invalidate every existing agreement.',
  'active',
  now(),
  '00000000-0000-4000-8000-000000000001',
  'choose'
)
on conflict (id) do update
set title = excluded.title, scenario = excluded.scenario, status = excluded.status,
    published_at = excluded.published_at, rubric_version_id = excluded.rubric_version_id;

insert into public.case_sides (id, case_id, code, label, position_text)
values
  (
    '20890000-0000-4000-8000-000000000011',
    '20890000-0000-4000-8000-000000000001',
    'protect',
    'Protect the agreements',
    'The agreements should remain valid because the service saved lives and users knowingly accepted the exchange.'
  ),
  (
    '20890000-0000-4000-8000-000000000012',
    '20890000-0000-4000-8000-000000000001',
    'liberate',
    'Liberate the memories',
    'The agreements should be invalidated because permanent memory access is too fundamental to trade for essential healthcare.'
  )
on conflict (id) do update
set label = excluded.label, position_text = excluded.position_text;
