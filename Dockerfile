# Production image for the report generator, including headless Chromium.
# Base tag must match the playwright-core version in package.json.
FROM mcr.microsoft.com/playwright:v1.61.1-noble

WORKDIR /app
ENV NODE_ENV=production \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

COPY package.json package-lock.json ./
COPY scripts ./scripts
RUN npm ci --ignore-scripts && node scripts/sync-fonts.mjs

COPY . .
# General Sans (headings) from Fontshare; non-fatal if the CDN is unreachable —
# headings fall back to Hanken Grotesk.
RUN node scripts/fetch-fonts.mjs || true
RUN npm run build

EXPOSE 3000
# Railway/Render/Fly inject PORT; default to 3000 locally.
CMD ["sh", "-c", "npx next start -p ${PORT:-3000}"]
