# Future Court AI

A zero-dependency, web-first PWA vertical slice for a three-minute fictional future-court argument game.

## Live deployment

- Production URL: `https://future-court-ai-dkibaara2025.dkibaara.workers.dev/`
- Deployment platform: Cloudflare Workers & Pages
- Production branch: `main`
- Current application version: `0.1.1`

The deployment has been visually verified from the public production route and Cloudflare dashboard. Independent automated response-header verification remains pending because the assistant web-fetch environment could not resolve the new `workers.dev` hostname.

## Implemented

- Landing proposition and 18+ gate
- One fictional future case and two positions
- 500-character argument interaction
- Transparent four-dimension rubric
- Deterministic local fallback verdict
- Privacy-safe challenge link containing no argument text
- Friend participation and comparison screen
- Device-local verdict history
- Root-scoped PWA manifest, service worker and install icons
- Cloudflare Pages security headers and deployment guide
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

The Cloudflare-ready build is written to `dist/`.

## Cloudflare Pages settings

- Framework preset: `None`
- Build command: `npm run build`
- Output directory: `dist`
- Production branch: `main`

See [`docs/CLOUDFLARE_DEPLOYMENT.md`](docs/CLOUDFLARE_DEPLOYMENT.md) for deployment and verification steps.

## Limitations

This is a vertical-slice prototype, not the approved production implementation. It deliberately uses a deterministic local rubric so no private argument leaves the device. The challenge payload is not cryptographically signed. Supabase Auth/Postgres/RLS, quotas, Turnstile, server-side Gemini consent, report/block/delete persistence and Paystack sandbox are not yet implemented.

The approved production architecture remains React/TypeScript + Cloudflare Pages + Supabase + Gemini + Paystack. This zero-dependency slice exists to prove the interaction before external credentials and package installation are available.
