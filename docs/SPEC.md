# Claude Code Prompt — Before/During/After Report Generator (v2)

Copy everything below into Claude Code:

---

Build a premium single-purpose web app: a **Cleaning Works Report Generator** that produces polished, client-ready reports (PDF and Word) documenting cleaning/restoration work with Before / During / After photo evidence.

## Stack
- Next.js 15+ (App Router), TypeScript, Tailwind CSS
- **PDF export:** server-side render via headless Chromium (Playwright/Puppeteer) printing an HTML template — print-grade quality, no client-side PDF libs.
- **Word export:** generate .docx server-side with the `docx` npm library, mirroring the same structure (cover, headers/footers, tagged photo sections).
- Local file handling for v1 (no auth, no DB). Images in temp storage, files returned as downloads.

## User flow (single page, four steps)

**Step 1 — Report details.** Clean form card:
1. Report title
2. Building name
3. Building photo upload (hero background where the template uses one)
4. Facility company logo upload (SVG/PNG)
5. Report date (defaults today, editable)
6. Optional: prepared-by name, short scope-of-works description

**Step 2 — Template picker.** A horizontal gallery of **at least 5 report templates**, each shown as a live mini-preview thumbnail of its cover page (rendered from real components, not static images). Selecting one updates a large preview pane. Templates:
1. **Image Hero — Dark scrim.** Full-bleed building photo, dark gradient scrim, white display type.
2. **Image Hero — Light panel.** Building photo top two-thirds, solid light panel below carrying title/logo/date.
3. **Minimal Light.** No photo on cover — white page, oversized display title, hairline rules, logo top-left, small building thumbnail inset.
4. **Minimal Dark.** Near-black cover, light type, logo reversed, thin accent rule.
5. **Editorial Split.** Vertical split cover — photo left half, typographic block right half.
The chosen template drives the entire document: cover, section dividers, header/footer treatment, and light/dark page chrome. All 5 share the same type system and grid so they feel like one family.

**Step 3 — Photo upload.** Three large equal-weight upload zones:
- **BEFORE** — dirty/damaged areas
- **DURING** — work in progress
- **AFTER** — cleaned result
Each: multi-image drag-and-drop + tap-to-select (multi-select from gallery must work on mobile), thumbnail grid, per-image remove, drag-to-reorder, optional one-line captions, image count badge. DURING is optional — if empty, the report simply skips that section.

**Step 4 — Generate & share.** Prominent "Generate Report" button with progress state, then a results card offering:
- **Download PDF**
- **Download Word (.docx)**
- **Share via Email** — `mailto:` link with pre-filled subject ("[Building name] — [Report title], [date]") and body; note in a tooltip that the file must be attached manually (mailto can't attach), OR if trivial to add, an SMTP send endpoint (Resend/Nodemailer) with a recipient field — build the mailto version first, stub the send endpoint behind an env flag.
- **Share via WhatsApp** — `https://wa.me/?text=` deep link with the same pre-filled message; since WhatsApp links can't carry attachments, generate a short-lived download link (temp file served by the app, expires after 24h) and include that URL in the message.

## Report structure (PDF and Word)
1. **Cover page** — per selected template.
2. **Header + footer on every subsequent page** — header: small logo + report title; footer: building name, date, page number in Geist Mono. Hairline rules only. Dark templates use dark chrome.
3. **Optional scope page** if scope text provided.
4. **Photo sections in order: Before → During → After.** Each opens with a section divider page styled to the template, and every image carries a small **tag chip** ("BEFORE" / "DURING WORK" / "AFTER") so photos are unambiguous even out of context. Grid: 2 images per page portrait, adaptive to orientation, captions in small type.
5. **Optional paired comparison layout** — toggle before generating: if before/after counts match, rows of before-left / after-right (during photos stay in their own section).
6. **Back page** — logo centred, contact placeholder.

## Design requirements (binding)
- Typography: **General Sans** headings, **Hanken Grotesk** body/UI, **Geist Mono** strictly for dates, page numbers, counts, tags.
- Do NOT invent colour palettes. Neutral near-monochrome base via Radix Colors scale steps defined as tokens in `design/tokens.md` — no hard-coded hex in components. Single CSS-variable accent token, swappable; I will select the accent from a designer-curated source later. No teal. Dark templates = neutral dark scale steps, not invented brand colours.
- Aesthetic benchmark: Stripe / Linear / Apple. Generous whitespace, 1px low-contrast hairlines, restrained motion (step transitions and template-picker selection only).
- Web UI and documents must feel like one product.
- Image handling: server-side compress/resize (max ~1600px long edge), preserve EXIF orientation, PDFs under ~15MB with 40+ photos.

## Quality bar
- Print-grade A4 output for all 5 templates; test each with 10+ mixed-orientation images across all three sections.
- Word output must open cleanly in MS Word and Google Docs with headers/footers and tags intact (accept that .docx fidelity is slightly simpler than PDF — keep it clean rather than fighting Word layout).
- Empty states, error states (wrong type, oversized), full mobile layout (photos are taken on-site).
- Working local app via `npm run dev`; note deployment options for the Chromium render endpoint (Vercel + @sparticuz/chromium vs small Railway/Fly container).

Start by scaffolding, then show me for approval: (1) the design tokens file, (2) cover pages for all 5 templates rendered with sample data. After approval, build the rest autonomously.
