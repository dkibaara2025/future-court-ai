# Test Results — Vertical Slice 0.1.1

Date: 2026-07-30

## Automated checks

Command:

```bash
npm run check
```

Result:

- Node test runner: 7 tests passed, 0 failed.
- Deterministic scoring: passed.
- Score bounds and rubric feedback: passed.
- Counterargument-awareness differentiation: passed.
- Challenge encode/decode: passed.
- Malformed challenge rejection: passed.
- Root-scoped PWA manifest/service-worker wiring: passed.
- Cloudflare security-header definition: passed.
- Privacy check: challenge module contains no private argument field: passed.
- Production build: passed; output written to `dist/`.

## Build output

The build contains root-level deployment assets required by Cloudflare Pages:

- `/index.html`
- `/manifest.webmanifest`
- `/sw.js`
- `/icons/icon-192.png`
- `/icons/icon-512.png`
- `/_headers`
- `/src/app.js`

## HTTP smoke test

A local server returned HTTP 200 for:

- `/`
- `/manifest.webmanifest`
- `/sw.js`
- `/icons/icon-192.png`
- `/src/app.js`

## Unverified

- Cloudflare Pages production build and assigned URL.
- Production response security and cache headers.
- Service-worker control and install prompt on physical Android Chrome.
- Real Gemini response quality and latency.
- Supabase RLS and cross-account authorization.
- Server-generated signed invitation links.
- Paystack sandbox checkout.
