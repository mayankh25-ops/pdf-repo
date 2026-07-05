// Downloads General Sans (headings face) from Fontshare and installs the
// woff2 weights into public/fonts. Run once per machine: `npm run fetch-fonts`.
// Fontshare's licence requires you to download it yourself, so the binaries are
// not committed. Until this runs, headings fall back to Hanken Grotesk.
import { mkdirSync, writeFileSync, readdirSync, copyFileSync, rmSync } from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const out = path.join(process.cwd(), "public", "fonts");
const tmp = path.join(process.cwd(), ".fontshare-tmp");
mkdirSync(out, { recursive: true });
mkdirSync(tmp, { recursive: true });

const url = "https://api.fontshare.com/v2/fonts/download/general-sans";
console.log(`[fetch-fonts] downloading ${url}`);
const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
if (!res.ok) {
  console.error(`[fetch-fonts] download failed (${res.status}). Grab General Sans manually from https://www.fontshare.com/fonts/general-sans and drop the woff2 files into public/fonts as GeneralSans-{Regular,Medium,Semibold,Bold}.woff2`);
  process.exit(1);
}
const zipPath = path.join(tmp, "general-sans.zip");
writeFileSync(zipPath, Buffer.from(await res.arrayBuffer()));
execSync(`unzip -o -q ${JSON.stringify(zipPath)} -d ${JSON.stringify(tmp)}`);

const wanted = ["Regular", "Medium", "Semibold", "Bold"];
const found = [];
const walk = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (entry.name.endsWith(".woff2")) found.push(p);
  }
};
walk(tmp);
for (const weight of wanted) {
  const match = found.find((f) => path.basename(f) === `GeneralSans-${weight}.woff2`);
  if (match) {
    copyFileSync(match, path.join(out, `GeneralSans-${weight}.woff2`));
    console.log(`[fetch-fonts] installed GeneralSans-${weight}.woff2`);
  } else {
    console.warn(`[fetch-fonts] could not find GeneralSans-${weight}.woff2 in archive`);
  }
}
rmSync(tmp, { recursive: true, force: true });
console.log("[fetch-fonts] done");
