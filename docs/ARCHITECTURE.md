# Architecture

The executable demo separates the approved production architecture from a credential-free vertical slice.

## Executable vertical slice

- Standards-based JavaScript, HTML and CSS PWA with no third-party runtime dependencies
- One seeded fictional case
- Deterministic rubric fallback in `src/domain/scoring.js`
- Privacy-safe challenge payload containing no argument text
- Device-local verdict history
- Node test runner and build script

This implementation choice is temporary and environment-driven: the available package registry did not contain React, Vite or TypeScript packages. It proves the interaction without changing the approved production architecture.

## Approved production path

- React, Vite and TypeScript client
- Cloudflare Pages static hosting
- Supabase Auth, Postgres, RLS and Edge Functions
- Gemini 2.5 Flash-Lite behind a server provider adapter
- Cloudflare Turnstile
- Paystack test mode

The browser must never grant entitlements, verify payment, enforce quotas, or calculate the authoritative production verdict total.
