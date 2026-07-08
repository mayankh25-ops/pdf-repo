# Claude Design prompt — Cleaning Works Web Portal (matches the mobile app)

Paste everything below the line into Claude Design.

---

Design the **web portal** for "Cleaning Works Reports" using the exact same
design system as my mobile app project "Cleaning Works Mobile App Design" —
same palette, radii, components and tone. Decide details for me; one
direction, realistic content, striped placeholders where photos go.

**Artboards:** desktop 1440×900 and a 390-wide responsive variant for the two
most-used screens (wizard Step 2 and Reports). Web app chrome, not a marketing
site: max content width ~1024px, generous whitespace.

**Design tokens (must match the app exactly):**
- Canvas #F7F6F3 · cards #FFFFFF with 1px #E9E6E0 border, radius 16px
- Inputs: white, 1px #E2DED7, radius 12px, 48px tall, labels 13px/600 #6E6A63
  above; focused = 2px #1B1B1B
- Text: #1B1B1B primary · #6E6A63 secondary · #8B867E muted · #9B968E tertiary
- Red #D9232E strictly for primary buttons (52px, radius 14px, white text,
  soft red glow shadow), selection states, links and the BEFORE pill.
  Disabled buttons: #EDEAE4 fill, #B4AFA6 text
- Phase colours: BEFORE #D9232E · DURING #E8A020 · AFTER #1E9E57; tinted count
  pills (e.g. rgba(217,35,46,0.09) fill with #D9232E label); NO TAG = gray
  #F0EDE7/#8B867E, never gets a pill on photos
- Stepper: 22px numbered circles joined by 2px lines — done = black #1B1B1B
  circle with white check, active = red circle + bold label, upcoming =
  #E9E6E0 circle with #9B968E number
- Segmented control: #ECE9E3 track, 3px padding, white active thumb with
  subtle shadow
- System font stack, body ≥16px, all targets 44px+

**Screens:**

1. **Sign in** — centred white card on canvas: wordmark line "CLEANING WORKS
   REPORT GENERATOR", Sign in / Create account segmented tabs, email +
   password, red Sign in button, "Forgot password?" link. Space reserved for
   "Sign in with Google".
2. **Home / wizard shell** — header: brand logo + "Client-ready before /
   during / after reports" + Reports button (top right). Below: COMPANY
   PROFILE chip row (active brand chip with logo, name, accent dot, red ring;
   pencil edit affordance; dashed "+ Add company"), then the 4-step stepper.
3. **Step 1 — Details** (desktop two-column form card): report title, building
   name, date, level/floor, area, prepared by, scope. Building hero photo
   panel showing the brand's default image with a white "FROM BRAND PROFILE"
   pill (top-left) and a white "⟳ Change" pill (bottom-right).
4. **Step 2 — Photos** (the heart; desktop = 4 zone cards in a row, also show
   the 390 variant stacked): each white zone card has a coloured phase dot +
   bold letterspaced title (BEFORE / DURING WORK / AFTER / NO TAG), "N photos"
   count, big photo tiles with caption fields, upload-progress tile (percent
   ring), failed tile ("⟲ Tap to retry" red overlay), dashed empty state, and
   a button pair: black "Take photo" + white "Add from library". Segmented
   Auto / Columns / Rows layout toggle above. Sticky bottom bar: white Back +
   red Continue.
5. **Step 3 — Templates** — grid of A4 cover thumbnails (3-across desktop,
   2-across mobile) rendered with the user's real photos; selected cards get a
   2px red border + soft red glow + red ✓ badge; "Focused — Spec card" first
   with a small DEFAULT tag.
6. **Step 4 — Generate & share** — left card: building/date summary, tinted
   phase-count pills row, iOS-style red toggle "Paired before / after
   comparison", remarks field, big red "Generate 2 documents" button with
   progress bar state. Right card: per-template result rows (doc icon, name,
   green "Ready", PDF / Word buttons, black share button), then "Share via
   Email" and "Share via WhatsApp" rows and a "View all reports →" link.
7. **Reports archive** — heading "Stored reports" + red "New report" button,
   search input, My reports / All reports segmented toggle, white list card of
   rows: "Nº 2026-0148 · 12 JUN 2026" mono eyebrow, title, building · prepared
   by · author, PDF / Word / download actions. Empty and loading states.
8. **Brand editor** (opens under the chip row) — brand name, accent swatch row
   (#D9232E #0F7B84 #3A4A8C #B0761A #1B1B1B + dashed custom "+"), logo
   replace row, logo-size slider 50–250% with live PAGE HEADER PREVIEW strip,
   "Building photo — default report hero" panel with Change pill, Cancel +
   red Save brand.
9. **System states kit** (one artboard): upload-queue banner (black pill,
   spinner, "Uploading 4 photos… 2 of 4"), offline notice (amber #FBF3E2 /
   #EFD9A4 / #7A5A12), error toast (black pill, red !, Retry), inline field
   error (2px red border + red helper text), empty "No reports yet" card,
   success moment ("2 documents ready", green check).

Keep it clean and simple — neutral chrome, red only where it means "act" or
"selected", exactly like the mobile app.
