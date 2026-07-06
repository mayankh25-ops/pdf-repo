# Cleaning Works Report Generator

A single-purpose web app that produces polished, client-ready reports (PDF and
Word) documenting cleaning/restoration work with **Before / During / After**
photo evidence.

- **Next.js (App Router) + TypeScript + Tailwind v4**
- **PDF**: server-side headless Chromium (playwright-core) printing the same
  React components you see on screen — print-grade A4, no client-side PDF libs
- **Word**: `.docx` generated server-side with the `docx` library, mirroring
  the same structure
- Local temp-file handling, no auth/DB. Download links expire after 24h.

## Quick start

```bash
npm install            # also syncs Geist Mono + Hanken Grotesk into public/fonts
npm run fetch-fonts    # downloads General Sans (headings) from Fontshare — optional but recommended
npx playwright install chromium   # once, if no system Chromium is available
npm run dev
```

The portal is login-protected (default `admin` / `Explicit@1234`; override with
`ADMIN_USER` / `ADMIN_PASS` env vars). Open http://localhost:3000 and walk the
four steps: **Details → Photos → Templates → Generate**. The template step
previews every template with your real photos — tap one to see all of its
pages, and multi-select to download several templates at once. Every generated report gets a sequential **report number**
(e.g. `2026-0014`) and is stored on the portal — search and re-download it
anytime at `/reports`.

`/preview` shows all ten cover templates with sample data;
`/preview?template=<id>` renders a full sample document (`hero-dark`,
`hero-light`, `minimal-light`, `minimal-dark`, `editorial-split`, `flow-dark`,
`quiet-caps`, `accent-panel`, `collage-card`, `filmstrip`; add `&paired=1` for
the comparison layout).

Photos are never cropped or stretched: pages adapt to orientation — two
portraits side-by-side, two landscapes stacked, or one large photo per page.

Sample imagery in `public/samples` can be regenerated with
`npm run make-samples`.

## How PDF generation works

`POST /api/generate` stores the report payload as a job, points headless
Chromium at `/print/<jobId>` (a page of explicitly paginated A4
`.doc-page` sections) and calls `page.pdf()`. Because the preview, the print
route and the PDF share the exact same components and tokens, what you see is
what prints.

Chromium resolution order (`lib/pdf.ts`): `CHROMIUM_EXECUTABLE` env var →
common system paths → Playwright's own browser cache.

## Design system

All colour/type/spacing decisions live in [`design/tokens.md`](design/tokens.md)
and are implemented as CSS custom properties in `app/globals.css`. Neutral
near-monochrome Radix `sand` scale, one swappable `--accent` token, General
Sans / Hanken Grotesk / Geist Mono. No hex values in components.

## Email / WhatsApp sharing

- **Email** uses a pre-filled `mailto:` link (attachments must be added
  manually — mailto can't carry files). An SMTP/Resend endpoint exists at
  `POST /api/send`, disabled unless `EMAIL_SEND_ENABLED=1` and
  `RESEND_API_KEY` (+ `EMAIL_FROM`) are set.
- **WhatsApp** uses a `wa.me` deep link containing a short-lived download URL
  (24h expiry, served by `/api/files/<token>`).

## Deployment notes (Chromium render endpoint)

The only deployment-sensitive piece is headless Chromium:

1. **Small container (Railway / Fly.io / Render) — recommended.** Use
   `mcr.microsoft.com/playwright:v1.x` as the base image (Chromium included),
   or `npx playwright install --with-deps chromium` in your Dockerfile.
   No further config needed. Generation is CPU/RAM hungry for a few seconds —
   512MB–1GB instances are fine.
2. **Vercel.** Serverless functions can't run Playwright's bundled Chromium.
   Add `@sparticuz/chromium` + `puppeteer-core` (or `playwright-core` with
   `chromium.executablePath()` from Sparticuz) and set `CHROMIUM_EXECUTABLE`
   accordingly; keep `maxDuration` ≥ 60s and be aware of the 50MB function
   limit and cold-start cost. Temp storage on Vercel is per-invocation, so the
   24h download links additionally require object storage (S3/Blob) — a small
   always-on container is the simpler v1 choice.

Set `CWR_DATA_DIR` to control where uploads/jobs/outputs and the report
registry are stored (defaults to `$TMPDIR/cwr-data`), and `INTERNAL_ORIGIN` if
the server should reach itself on a different origin than the public one.

**Persistence:** stored reports live on the filesystem. On Railway/Fly attach
a volume and point `CWR_DATA_DIR` at its mount path (e.g. `/data`) so the
report archive survives redeploys.
