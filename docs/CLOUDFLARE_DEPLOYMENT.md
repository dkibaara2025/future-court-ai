# Cloudflare Pages Deployment

## Approved project settings

| Setting | Value |
|---|---|
| Repository | `dkibaara2025/future-court-ai` |
| Production branch | `main` |
| Framework preset | `None` |
| Root directory | `/` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node version | Pinned by `.node-version` to `22.16.0` |
| Environment variables | None for the local-rubric vertical slice |

## Dashboard deployment

1. Open Cloudflare Dashboard.
2. Go to **Workers & Pages**.
3. Select **Create application** and then **Pages**.
4. Select **Connect to Git**.
5. Authorize only `dkibaara2025/future-court-ai` where possible.
6. Select the repository and apply the approved settings above.
7. Start the first deployment.
8. Record the assigned `*.pages.dev` URL and deployed commit SHA.

## Required verification

- Root URL returns HTTP 200.
- `/manifest.webmanifest`, `/sw.js`, `/icons/icon-192.png`, and `/src/app.js` return HTTP 200.
- `/sw.js` has `Cache-Control: no-cache`.
- The root response includes `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and the configured Content Security Policy.
- Browser developer tools show the service worker controlling the root page.
- The application is installable on Android Chrome.
- A verdict can be completed and a challenge URL opened in a private browser window.
- No API keys or secrets are present in the deployed JavaScript.

## Rollback

Use the Cloudflare Pages deployment history to roll back to the previously successful deployment. Do not promote a preview deployment until `npm run check` passes for its commit.

## Current boundary

This deployment uses only the deterministic local rubric. Supabase, Gemini, Turnstile and Paystack remain disabled until their separate security and privacy gates pass.
