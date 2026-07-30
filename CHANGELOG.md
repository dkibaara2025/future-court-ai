# Changelog

## 0.2.0 — backend baseline prepared

- Added versioned Supabase migration and reproducible seed data.
- Added RLS policies, least-privilege grants and service-only judging RPCs.
- Replaced the Gemini scaffold with authenticated, consent-aware, quota-controlled server judging.
- Added deterministic server fallback, idempotency and structured verdict persistence.
- Added backend artifact tests and deployment/security runbooks.
- No credential or secret is stored in the repository.

## 0.1.1 — Cloudflare deployment readiness

- Corrected the service worker scope so it controls the application root.
- Flattened public PWA assets into the Cloudflare Pages output root.
- Added Cloudflare Pages security and cache headers.
- Added a network-first service worker update strategy.
- Pinned Node.js 22.16.0 for reproducible Pages builds.
- Added the Cloudflare deployment and rollback guide.

## 0.1.0 — Vertical slice

- Added the fictional case, argument, deterministic verdict and friend challenge flow.
- Added PWA assets, tests, build script, documentation and Gemini Edge Function scaffold.
