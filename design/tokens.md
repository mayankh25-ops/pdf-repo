# Design Tokens — Cleaning Works Report Generator

Single source of truth for every colour, type, spacing and rule decision in the
product. The web UI and the generated documents (PDF + Word) consume the same
tokens so they read as one product. **No component may hard-code a hex value** —
components reference the CSS custom properties defined here (implemented in
`app/globals.css`).

---

## 1. Colour

### 1.1 Neutral scale — Radix Colors `sand`

The entire product is near-monochrome. We use the [Radix Colors](https://www.radix-ui.com/colors)
`sand` scale (a warm neutral that flatters architectural and interior
photography) — light steps `--sand-1 … --sand-12` and dark steps via the Radix
dark files (`.dark` scope). Radix step semantics apply:

| Steps | Radix role                     | Our use                                      |
|-------|--------------------------------|----------------------------------------------|
| 1–2   | App / subtle background        | Page + card backgrounds                      |
| 3–5   | Component backgrounds          | Hover states, upload zones, chips            |
| 6–8   | Borders                        | Hairlines (6/7), stronger borders (8)        |
| 9–10  | Solid backgrounds              | (rarely used — no solid brand fills)         |
| 11    | Low-contrast text              | Secondary text, labels, captions             |
| 12    | High-contrast text             | Headings, body text                          |

### 1.2 Semantic aliases (what components actually use)

Light context (`:root`) and dark context (`.dark`) resolve these to the
appropriate sand step automatically:

| Token            | Resolves to      | Use                                        |
|------------------|------------------|--------------------------------------------|
| `--bg`           | sand-1           | Page background                            |
| `--bg-subtle`    | sand-2           | Card / panel background                    |
| `--bg-element`   | sand-3           | Upload zones, input fills, chips           |
| `--bg-hover`     | sand-4           | Hover fills                                |
| `--hairline`     | sand-6           | 1px low-contrast rules (default)           |
| `--border`       | sand-7           | Interactive element borders                |
| `--border-strong`| sand-8           | Focused / selected borders                 |
| `--text-tertiary`| sand-9           | Faint index numbers, watermark type        |
| `--text-muted`   | sand-11          | Secondary text, captions, labels           |
| `--text`         | sand-12          | Primary text                               |

Dark report templates (Minimal Dark, Image Hero — Dark scrim, dark chrome
pages) use the **same aliases** inside a `.dark` scope — neutral dark scale
steps, never invented brand colours.

### 1.3 Alpha scales

Radix `blackA` / `whiteA` for photographic scrims and glass surfaces only
(e.g. the dark gradient scrim on the Image Hero cover uses `--black-a5 →
--black-a11`). Never for text on plain surfaces.

### 1.4 Accent — single swappable token

```css
--accent: var(--sand-12); /* placeholder: high-contrast neutral */
```

One CSS variable, used for: primary button fill, selected-template ring, the
thin accent rule on the Minimal Dark cover, and active step indicator. The
default deliberately stays inside the neutral scale — **no invented palette,
no teal**. Swap the value in one place (`app/globals.css → :root`) when the
designer-curated accent is chosen. `--accent-contrast` (defaults `--sand-1`)
is the on-accent text colour and must be updated in tandem.

---

## 2. Typography

| Token            | Family                        | Use (strict)                                        |
|------------------|-------------------------------|-----------------------------------------------------|
| `--font-display` | **General Sans** (Fontshare)  | Headings, cover titles, section dividers            |
| `--font-body`    | **Hanken Grotesk**            | Body copy, UI controls, captions                    |
| `--font-mono`    | **Geist Mono**                | Dates, page numbers, counts, tag chips — *only*     |

- General Sans is self-hosted from `public/fonts/` (`npm run fetch-fonts`
  downloads it from Fontshare). Until the files exist the stack falls back to
  Hanken Grotesk so nothing breaks.
- Geist Mono is never used for prose; Geist Mono strings are uppercase or
  numeric with `letter-spacing: 0.08em` for tags.

### Type scale (document)

| Token          | Size / line             | Use                          |
|----------------|-------------------------|------------------------------|
| `--type-hero`  | 64pt / 1.02, -2%        | Cover titles                 |
| `--type-h1`    | 32pt / 1.1, -1%         | Section divider headings     |
| `--type-h2`    | 15pt / 1.3              | Scope heading, back page     |
| `--type-body`  | 10.5pt / 1.6            | Scope text                   |
| `--type-caption`| 8.5pt / 1.4            | Photo captions               |
| `--type-meta`  | 7.5pt / 1.4, +6% (mono) | Header/footer meta, tags     |

Web UI uses Tailwind's default scale with the same families.

---

## 3. Rules, radii, elevation

- **Hairlines**: `1px solid var(--hairline)` — the only rule weight in
  documents. Web UI may use `--border` for interactive affordances.
- **Radii**: `--radius-sm: 6px`, `--radius-md: 10px`, `--radius-lg: 16px`
  (web UI only — print artefacts use sharp corners except tag chips:
  `--radius-full`).
- **Shadows**: web UI only, one level: `--shadow-card: 0 1px 2px var(--black-a3),
  0 4px 16px var(--black-a2)`. Documents are flat.

---

## 4. Document grid (A4)

- Page: 210 × 297 mm. Content margins: `--page-margin-x: 16mm`,
  `--page-margin-top: 18mm`, `--page-margin-bottom: 18mm`.
- Header band: 10mm from top edge; footer band: 10mm from bottom edge, both
  bounded by hairlines only.
- Photo grid: 2 images per portrait page, `--photo-gap: 6mm`. Tag chips inset
  `4mm` from the image corner.

## 5. Cover family motifs

Recurring elements that make the five covers read as one family (informed by
the client's reference deck, re-expressed in tokens):

- **Accent dash** — a short `9 × 1.2 mm` bar in `--accent` above the title
  (on photo scrims it renders in `--white-a12`).
- **Mono kicker** — `CLEANING WORKS REPORT` / date line in `--font-mono`,
  `+10%` tracking, `--text-muted`.
- **Meta columns** — a hairline-topped bar of labelled columns (`BUILDING` /
  `DATE OF WORKS` / `PREPARED BY`): 6.5pt mono labels in `--text-muted` over
  9–9.5pt semibold values. Dates always in `--font-mono`.
- **Ghost poster type** — oversized display initials in `--bg-element` behind
  the Minimal Light cover; section dividers use the same idea with the
  section number in `--text-tertiary`.
- **Logo chip** — a `--bg` rounded panel with hairline border where the logo
  overlaps photography (Image Hero — Light panel).

## 6. Motion (web UI)

Restrained: step transitions (`180ms cubic-bezier(0.2, 0, 0, 1)` fade/slide)
and template-picker selection ring (`120ms ease-out`). Nothing else animates.
