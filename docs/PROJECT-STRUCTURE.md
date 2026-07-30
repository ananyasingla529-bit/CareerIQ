# CareerIQ — Project Structure (Updated: Day 3)
**Supersedes the Day 2 version — folder layout is unchanged; file contents are now real for the foundation layer.**

---

## 1. Current Repository Structure

```
careeriq/
├── index.html                    # ✅ BUILT (Day 3) — Landing page, real content
├── analyze.html                  # 🟡 PLACEHOLDER (Day 3 shell) — real feature built Day 4–5
├── dashboard.html                # 🟡 PLACEHOLDER (Day 3 shell) — real feature built Day 7
├── compare.html                  # 🟡 PLACEHOLDER (Day 3 shell) — real feature built Day 8
│
├── css/
│   └── styles.css                # ✅ BUILT (Day 3) — full design system: variables,
│                                  #    nav, buttons, cards, badges, forms, utilities
│
├── js/
│   ├── app.js                    # ✅ BUILT (Day 3) — shared header/footer injection,
│                                  #    active-link highlighting, mobile nav toggle,
│                                  #    escapeHTML() and formatDate() shared utilities
│   ├── pdfParser.js               # ⬜ Empty — built Day 4
│   ├── aiEngine.js                # ⬜ Empty — built Day 5
│   ├── offlineEngine.js           # ⬜ Empty — built Day 6
│   ├── analysisController.js      # ⬜ Empty — built Day 6
│   ├── storage.js                 # ⬜ Empty — built Day 7
│   ├── report.js                  # ⬜ Empty — built Day 5
│   ├── compare.js                 # ⬜ Empty — built Day 8
│   └── dashboard.js               # ⬜ Empty — built Day 7
│
├── data/
│   └── skillsTaxonomy.js          # ⬜ Empty — built Day 6
│
├── assets/
│   ├── screenshots/                # ⬜ Populated progressively from Day 4 onward
│   └── icons/
│
├── proxy/
│   └── cloudflare-worker.js        # ⬜ Empty — built Day 5
│
├── docs/                           # ✅ Added Day 2 — all planning & design documents
│   ├── API.md
│   ├── ARCHITECTURE.md
│   ├── CareerIQ_Implementation_Blueprint.md
│   ├── PROJECT-STRUCTURE.md        # (this file, updated)
│   ├── SCHEMA.md
│   ├── UI-WIREFRAMES.md
│   ├── SETUP.md                    # ✅ Added Day 3
│   ├── ENVIRONMENT.md              # ✅ Added Day 3
│   └── DAY3-SUMMARY.md             # ✅ Added Day 3
│
├── .gitignore
├── LICENSE
├── PROGRESS.md                     # ✅ Running daily log, updated today
└── README.md                       # Placeholder — full version Day 10
```

**Legend:** ✅ Built with real content today | 🟡 Placeholder shell (intentional, per blueprint) | ⬜ Not yet started (scheduled later)

---

## 2. What Changed Since Day 2

Nothing structural changed — every folder and filename matches the Day 2 design exactly. The only change is that **2 files now have real, production-quality content** (`css/styles.css`, `js/app.js`) and **4 HTML files now have real markup** instead of being empty placeholders. No new files, no renamed files, no new folders — confirming the Day 2 architecture required zero adjustments once implementation began.

---

## 3. File Responsibility Recap (Foundation Layer Only)

### `css/styles.css`
Single global stylesheet. Defines all design tokens (colors, spacing, typography, radii, shadows) as CSS custom properties at the top, then reusable component classes below (`.btn-primary`, `.card`, `.badge-success`, etc.). Every future page and every future JS-rendered UI element (report cards, dashboard cards, comparison table) will use these same classes — no page will define its own one-off styles for these components.

### `js/app.js`
Runs on every page via a `<script>` tag at the bottom of `<body>`. On `DOMContentLoaded`, it:
1. Injects the `<header>` (logo + nav) at the top of the page
2. Injects the `<footer>` at the bottom
3. Highlights the current page's nav link as active
4. Wires up the mobile hamburger toggle
5. Exposes `escapeHTML()` and `formatDate()` — small utility functions that `report.js`, `dashboard.js`, and `compare.js` will import and reuse starting Day 5 onward, so date formatting and safe text rendering are consistent everywhere rather than reimplemented per module.

---

## 4. Confirmed Alignment with System Design

This structure was cross-checked against `ARCHITECTURE.md`'s component diagram and `PROJECT-STRUCTURE.md`'s Day 2 file-ownership table — no drift found. Day 4 can proceed directly into `pdfParser.js` and the real `analyze.html` build with zero structural ambiguity.
