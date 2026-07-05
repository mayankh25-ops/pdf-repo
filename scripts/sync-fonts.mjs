// Copies self-hosted font binaries from node_modules into public/fonts so the
// web UI and the print (PDF) route load identical @font-face files.
// Runs on postinstall. General Sans is fetched separately: `npm run fetch-fonts`.
import { copyFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const out = path.join(root, "public", "fonts");
mkdirSync(out, { recursive: true });

const files = [
  // Geist Mono — dates, page numbers, counts, tags only
  ["node_modules/geist/dist/fonts/geist-mono/GeistMono-Regular.woff2", "GeistMono-Regular.woff2"],
  ["node_modules/geist/dist/fonts/geist-mono/GeistMono-Medium.woff2", "GeistMono-Medium.woff2"],
  // Hanken Grotesk variable — body/UI
  [
    "node_modules/@fontsource-variable/hanken-grotesk/files/hanken-grotesk-latin-wght-normal.woff2",
    "HankenGrotesk-Variable.woff2",
  ],
  [
    "node_modules/@fontsource-variable/hanken-grotesk/files/hanken-grotesk-latin-ext-wght-normal.woff2",
    "HankenGrotesk-Variable-ext.woff2",
  ],
];

for (const [src, dest] of files) {
  const from = path.join(root, src);
  if (!existsSync(from)) {
    console.warn(`[sync-fonts] missing ${src} — did npm install run?`);
    continue;
  }
  copyFileSync(from, path.join(out, dest));
}
console.log(`[sync-fonts] fonts synced to public/fonts`);
