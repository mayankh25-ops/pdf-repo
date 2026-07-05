// Generates neutral placeholder photography for template previews and testing.
// Output: public/samples/*.jpg + logo.svg. Run: node scripts/make-samples.mjs
import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const out = path.join(process.cwd(), "public", "samples");
mkdirSync(out, { recursive: true });

// Greys drawn from the Radix sand scale so samples sit inside the token system.
const SAND = {
  2: "#f9f9f8", 3: "#f1f0ef", 4: "#e9e8e6", 5: "#e2e1de", 6: "#dad9d6",
  7: "#cfceca", 8: "#bcbbb5", 9: "#8d8d86", 10: "#82827c", 11: "#63635e", 12: "#21201c",
};

const facade = (w, h, seed, dark = false) => {
  const cols = 6 + (seed % 3);
  const rows = 8 + (seed % 4);
  const cw = w / cols;
  const rh = h / rows;
  let cells = "";
  let n = seed;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      n = (n * 9301 + 49297) % 233280;
      const v = n / 233280;
      const tone = dark
        ? [SAND[9], SAND[10], SAND[11], SAND[12]][Math.floor(v * 4)]
        : [SAND[4], SAND[5], SAND[6], SAND[7], SAND[8]][Math.floor(v * 5)];
      cells += `<rect x="${(c * cw + cw * 0.08).toFixed(1)}" y="${(r * rh + rh * 0.1).toFixed(1)}" width="${(cw * 0.84).toFixed(1)}" height="${(rh * 0.8).toFixed(1)}" fill="${tone}" opacity="${(0.55 + v * 0.45).toFixed(2)}"/>`;
    }
  }
  const skyTop = dark ? SAND[11] : SAND[3];
  const skyBottom = dark ? SAND[12] : SAND[6];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0" stop-color="${skyTop}"/><stop offset="1" stop-color="${skyBottom}"/>
    </linearGradient>
    <linearGradient id="glare" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.35"/>
      <stop offset="0.5" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#sky)"/>
  ${cells}
  <rect width="${w}" height="${h}" fill="url(#glare)"/>
</svg>`;
};

// A "surface" photo: soft gradient plane with vignette + grime blobs whose
// opacity depends on the phase (before = heavy, during = medium, after = none).
const surface = (w, h, seed, phase, label) => {
  let n = seed;
  const rnd = () => ((n = (n * 9301 + 49297) % 233280), n / 233280);
  let blobs = "";
  const count = phase === "before" ? 9 : phase === "during" ? 5 : 0;
  for (let i = 0; i < count; i++) {
    const bx = rnd() * w, by = rnd() * h * 0.9 + h * 0.05;
    const r = (0.06 + rnd() * 0.14) * Math.min(w, h);
    blobs += `<ellipse cx="${bx.toFixed(0)}" cy="${by.toFixed(0)}" rx="${r.toFixed(0)}" ry="${(r * (0.5 + rnd() * 0.8)).toFixed(0)}" fill="${SAND[11]}" opacity="${(0.12 + rnd() * 0.25).toFixed(2)}"/>`;
  }
  const base1 = phase === "after" ? SAND[2] : SAND[4];
  const base2 = phase === "after" ? SAND[5] : SAND[8];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${base1}"/><stop offset="1" stop-color="${base2}"/>
    </linearGradient>
    <radialGradient id="v" cx="0.5" cy="0.45" r="0.9">
      <stop offset="0.6" stop-color="#000000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0.18"/>
    </radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
  <line x1="0" y1="${h * 0.72}" x2="${w}" y2="${h * 0.66}" stroke="${SAND[9]}" stroke-width="2" opacity="0.5"/>
  ${blobs}
  <rect width="${w}" height="${h}" fill="url(#v)"/>
  <text x="${w / 2}" y="${h - 24}" font-family="Arial" font-size="${Math.round(h * 0.028)}" fill="${SAND[10]}" text-anchor="middle" opacity="0.8">${label}</text>
</svg>`;
};

const jobs = [];
const save = (name, svg, q = 80) =>
  jobs.push(
    sharp(Buffer.from(svg)).jpeg({ quality: q, mozjpeg: true }).toFile(path.join(out, name)),
  );

// Building hero (landscape, generous resolution for full-bleed covers)
save("building.jpg", facade(2400, 1600, 7));

// Mixed-orientation sample photos, 4 per phase
const L = [1600, 1067];
const P = [1067, 1600];
for (const [phase, seeds] of [
  ["before", [11, 23, 37, 41]],
  ["during", [53, 67, 71, 83]],
  ["after", [97, 103, 109, 127]],
]) {
  seeds.forEach((seed, i) => {
    const portrait = i % 2 === 1;
    const [w, h] = portrait ? P : L;
    save(`${phase}-${i + 1}.jpg`, surface(w, h, seed, phase, `Sample ${phase} photo ${i + 1}`));
  });
}

// Sample facility-company logo (wordmark, currentColor-friendly greys)
writeFileSync(
  path.join(out, "logo.svg"),
  `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="88" viewBox="0 0 320 88">
  <circle cx="44" cy="44" r="26" fill="none" stroke="${SAND[12]}" stroke-width="5"/>
  <path d="M31 44 l9 9 l18 -19" fill="none" stroke="${SAND[12]}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="88" y="52" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="700" letter-spacing="1" fill="${SAND[12]}">ACME FM</text>
  <text x="88" y="72" font-family="Arial, Helvetica, sans-serif" font-size="13" letter-spacing="3" fill="${SAND[11]}">FACILITY SERVICES</text>
</svg>`,
);

await Promise.all(jobs);
console.log(`[make-samples] wrote ${jobs.length} jpgs + logo.svg to public/samples`);
