# Cleaning Works Reports — iPhone / Android App Design Brief

Brief for preparing the mobile app design prototype (Claude Design). The app
is the mobile companion of the existing web portal: cleaners generate
client-ready before / during / after reports from their phone, on site.

**Design keywords:** clean, neutral, simple, one-hand use, camera-first.
The portal chrome stays neutral (white/sand surfaces, dark text); the selected
company's brand accent (e.g. Focused red `#D9232E`) is used only for primary
actions, selection states and the phase colour pills
(BEFORE `#D9232E` · DURING `#E8A020` · AFTER `#1E9E57`; "no tag" photos have
no pill).

**Reference artboards:** iPhone 390×844 (safe areas top 59 / bottom 34) and
Android 360×800. Minimum touch target 44pt. Body text ≥ 16px (no zoom-on-tap).

---

## Screen inventory

### A. Onboarding & account
1. **Splash / launch** — company logo on neutral background.
2. **Sign in** — email + password, "Forgot password?", link to create account.
   Room reserved for "Sign in with Google" and Face ID later.
3. **Create account** — name, email, password.
4. **Forgot password** — email entry + "link sent" confirmation state.
5. **Reset password** — new password (opened from the email link).

### B. Home
6. **Home / dashboard** — the hub. Contains:
   - Active **brand chip** (logo + name) with a switcher (see 14).
   - Big primary CTA: **"New report"**.
   - **Recent reports** (last 3–5): report Nº, title, building, date, with
     PDF / share shortcuts. "See all" → Reports.
   - Small greeting/user row (avatar initial, settings gear).

### C. New report flow (4 steps, same order as the portal)
A persistent stepper (1 Details · 2 Photos · 3 Templates · 4 Generate) and a
sticky bottom bar with Back / Continue. Draft is saved automatically; a
"Resume draft" card appears on Home if a report is half-finished.

7. **Step 1 — Details** — report title, building name, date, level/floor,
   area, prepared by, scope of works. **Building photo (hero)**: shows the
   brand's default building image with a "FROM BRAND PROFILE" badge and a
   **⟳ Change** button; tapping Change offers camera / photo library; after
   overriding, a "Use brand photo instead" action restores the default.
8. **Step 2 — Photos** — the heart of the app. Four zones:
   **BEFORE / DURING WORK / AFTER / NO TAG** (bold zone titles). Each zone:
   - "Take photo" (camera) and "Add from library" (multi-select).
   - Thumbnails with per-photo upload progress ring, failed-tap-to-retry
     state, caption field, delete, and **move to another zone** (long-press
     drag + a fallback zone selector for one-hand use).
   - Photo counter per zone; images are compressed on device before upload.
9. **Camera capture** (full-screen) — native-feeling camera with **zone tabs
   across the top (Before · During · After · No tag)** so a cleaner can shoot
   a burst straight into the right zone without leaving the camera. Flash
   toggle, shutter, thumbnail of last shot, "Done".
10. **Step 3 — Templates** — 2-across grid of cover previews rendered with
    the user's real photos/details. Multi-select with a ✓ badge
    ("Focused — Spec card" is pre-selected as default). No full-document
    preview — covers only.
11. **Step 4 — Generate & share** — summary card (building, date, photo
    counts B·D·A·No tag), paired before/after toggle, remarks field, big
    **Generate** button with per-template progress ("Generating Spec card
    1/2…"). Results list: one card per template with **PDF** and **Word**
    buttons and a **native share sheet** action (WhatsApp / Mail / AirDrop /
    Save to Files). Link to full history.

### D. Reports history
12. **Reports list** — search bar (Nº, building, title), **My reports / All
    reports** toggle, rows: Nº + date, title, building · prepared by · author,
    PDF/Word/share actions. Empty state and loading state.
13. **Report detail** (optional, nice-to-have) — full meta, template used,
    re-download / share, "Duplicate as new report" (pre-fills the wizard).

### E. Brand management
14. **Brands** — list of company profiles (logo, name, accent dot), active
    one highlighted; "+ Add company".
15. **Brand editor** — brand name, accent colour picker, logo upload/replace,
    **logo size slider (50–250 %) with live page-header preview**, and the
    **default building photo** (used as every report's hero unless a report
    overrides it). Create and edit are the same screen.

### F. Settings & system
16. **Settings / account** — name/email, change password, sign out, app
    version; placeholder rows for notifications and Face ID.
17. **System states** (design as a kit, not separate screens):
    - Upload queue banner ("Uploading 4 photos…") + offline notice ("Photos
      will upload when you're back online").
    - Error toasts / inline errors (generation failed, network lost).
    - Empty states (no reports yet, no photos in a zone).
    - Success moment after generation (subtle, not confetti-heavy).

---

## Component kit to design once and reuse
- Primary / secondary / ghost buttons (44pt+), sticky bottom action bar.
- Input, textarea, date field, colour swatch row, range slider.
- Step chips (numbered), zone header (bold letterspaced caps + count).
- Photo tile (progress ring / retry / caption / zone mover).
- Phase pills (colour-coded), template cover card with ✓, report row.
- Brand chip + brand editor card, share sheet trigger, toast.

## Flows to prototype end-to-end
1. Sign in → Home → New report → 4 steps → Generate → share via WhatsApp.
2. Camera-first: Step 2 → Camera capture → switch zone tabs mid-shoot → Done.
3. Brand: Home → Brands → edit logo size + building photo → new report shows
   the brand hero automatically.
4. History: Home → Reports → search → re-share an old PDF.

## Technical note (for context, not for the prototype)
The app talks to the existing portal APIs (login, profiles, upload, generate,
reports). Fastest path to stores is a native shell (Capacitor) around the
existing responsive web UI with native camera/share plugins; the design
prototype above also works unchanged if we later go fully native
(React Native / Expo). PDF/Word generation stays on the server.
