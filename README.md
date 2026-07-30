# Future Court AI

A zero-dependency, web-first PWA vertical slice for a three-minute fictional future-court argument game.

## Implemented

- Landing proposition and 18+ gate
- One fictional future case and two positions
- 500-character argument interaction
- Transparent four-dimension rubric
- Deterministic local fallback verdict
- Privacy-safe challenge link containing no argument text
- Friend participation and comparison screen
- Device-local verdict history
- PWA manifest, service worker and install icons
- Node unit/artifact tests and GitHub Actions workflow
- Supabase Edge Function scaffold for Gemini structured output

## Run

```bash
npm run dev
```

Open `http://localhost:4173`. Complete a verdict, select **Challenge a friend**, then open the generated link in another browser or private window.

## Verify and build

```bash
npm run check
```

The build is written to `dist/`.

## Limitations

This is a vertical-slice prototype, not the approved production implementation. It deliberately uses a deterministic local rubric so no private argument leaves the device. The challenge payload is not cryptographically signed. Supabase Auth/Postgres/RLS, quotas, Turnstile, server-side Gemini consent, report/block/delete persistence, Paystack sandbox and deployment are not yet implemented.

The approved production architecture remains React/TypeScript + Cloudflare Pages + Supabase + Gemini + Paystack. This zero-dependency slice exists to prove the interaction before external credentials and package installation are available.
