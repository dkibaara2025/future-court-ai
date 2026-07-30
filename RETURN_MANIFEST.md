# Return Manifest

- Packet ID: FCAI-VS-001
- Project: Future Court AI
- Artifact version: 0.1.0
- Date created: 2026-07-30
- Environment: Linux container, Node.js 22, Python 3
- Files included: source, PWA assets, tests, build output, Gemini Edge Function scaffold, CI workflow and documentation
- Files excluded: secrets, `.env`, dependency caches and Git internal object directory from the source ZIP
- Commands executed: `npm run check`, HTTP smoke tests, JavaScript syntax checks, secret-pattern scan, Git commit and bundle verification
- Tests executed: 6 Node tests plus production build and HTTP asset checks
- Known failures: Chromium screenshot automation was not available reliably in this container
- Instructions for opening: read `README.md`; run `npm run dev`; open `http://localhost:4173`
- Production status: prototype only; not deployed and not connected to live AI, database or payment services
