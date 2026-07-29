# CareerIQ — Project Structure
**Day 2 Deliverable — Confirmed and scaffolded today**

---

## 1. Final Folder Structure (as created today)

```
careeriq/
├── index.html                    # Landing page — value prop + CTA into the core flow
├── analyze.html                  # Resume + JD input, analysis, and report display (single page)
├── dashboard.html                # Saved analyses list, status tracking, export/delete
├── compare.html                  # Side-by-side comparison of 2–3 saved analyses
│
├── css/
│   └── styles.css                # Single global stylesheet: CSS variables (palette, spacing,
│                                  # typography scale) + reusable component classes
│                                  # (.btn-primary, .card, .badge, etc.)
│
├── js/
│   ├── app.js                    # Shared nav injection, mobile menu, cross-page utilities
│   ├── pdfParser.js               # PDF.js wrapper — extractTextFromPDF()
│   ├── aiEngine.js                # Claude API client via proxy — getAIAnalysis()
│   ├── offlineEngine.js           # Rule-based fallback engine — generateOfflineReport()
│   ├── analysisController.js      # Orchestrator — runAnalysis() (AI-first, offline fallback)
│   ├── storage.js                 # localStorage CRUD — saveAnalysis(), getAllAnalyses(), etc.
│   ├── report.js                  # Renders the AnalysisReport JSON into the report UI
│   ├── compare.js                 # Comparison view logic
│   └── dashboard.js               # Dashboard list rendering, status updates, delete/export
│
├── data/
│   └── skillsTaxonomy.js          # Skill/keyword dictionary + synonym map, used only by
│                                  # offlineEngine.js
│
├── assets/
│   ├── screenshots/                # Populated progressively from Day 3 onward; final set
│                                  # feeds the README and LinkedIn post
│   └── icons/                      # Any custom icon assets (most icons are emoji/CSS-based
│                                  # per the design system, so this folder may stay light)
│
├── proxy/
│   └── cloudflare-worker.js        # Serverless proxy source — deployed to Cloudflare
│                                  # separately from GitHub Pages; kept in-repo for
│                                  # documentation/portfolio transparency
│
├── .gitignore
├── LICENSE                         # MIT (already present)
└── README.md                       # Placeholder today; full version written Day 10
```

---

## 2. Why This Structure

**One file per responsibility, not per feature.** Each JS file has a single, named job (`storage.js` only ever touches `localStorage`; `report.js` only ever renders). This directly supports the PRD's "Modular & Scalable" architecture principle — any future AI provider swap, storage backend swap, or new analysis module touches exactly one file, never a tangle of mixed concerns.

**No `src/`, no build output folder, no `node_modules`.** Since the stack is deliberately framework-free and build-tool-free (locked Day 1), there is nothing to compile — every file in the repo is exactly what the browser loads. This eliminates an entire category of setup/deployment failure modes given the tight daily time budget.

**`analyze.html` handles both input and report display.** A separate `report.html` was considered and rejected (see `UI-WIREFRAMES.md` §2) — keeping the core value moment on one continuous page avoids a page reload interrupting the "aha moment" the PRD identifies as the most important success signal.

**`proxy/` lives inside the same repo even though it deploys elsewhere.** Cloudflare Workers are deployed independently of GitHub Pages, but keeping the source file in-repo means the architecture is fully visible and explainable to anyone reviewing the GitHub repository — important for the portfolio/interview goal in the PRD.

**`data/skillsTaxonomy.js` is separate from `offlineEngine.js`.** The taxonomy is a data file, not logic — separating them means the taxonomy can grow (more skills, better synonyms) without touching the matching algorithm, and vice versa.

---

## 3. Where Future Code Will Live (Day-by-Day Map)

| Day | Files Actively Built |
|---|---|
| Day 3 | `analyze.html` (input UI), `js/pdfParser.js` |
| Day 4 | `proxy/cloudflare-worker.js`, `js/aiEngine.js` |
| Day 5 | `js/report.js`, `analyze.html` (report UI section) |
| Day 6 | `data/skillsTaxonomy.js`, `js/offlineEngine.js`, `js/analysisController.js` |
| Day 7 | `js/storage.js`, `js/dashboard.js`, `dashboard.html` |
| Day 8 | `js/compare.js`, `compare.html`, polish to `js/dashboard.js` |
| Day 9 | Fixes/polish across all files — no new files expected |
| Day 10 | `README.md` (final), `LICENSE` confirmed, `assets/screenshots/` finalized |

This table is the same file-ownership map already implied by the Implementation Blueprint — confirmed here as consistent with today's actual folder structure with no drift.

---

## 4. Naming & Coding Conventions (for consistency across days)

- **Files:** `camelCase.js` for JS modules, `kebab-case` not used (matches the blueprint's existing naming).
- **Functions:** `camelCase`, verb-first (`getAllAnalyses`, `renderReport`, `extractTextFromPDF`).
- **CSS classes:** `kebab-case`, component-prefixed (`.btn-primary`, `.card-analysis`, `.badge-success`).
- **Constants/enums:** `UPPER_SNAKE_CASE` for fixed value sets (e.g., `ANALYSIS_MODE.AI`, `ANALYSIS_MODE.OFFLINE`) where used, to avoid typo'd string literals scattered across files.
- **Comments:** Every non-trivial function gets a one-line purpose comment; scoring formulas (Day 6) get fuller comments explaining the weighting logic, since this is explicitly called out in the Blueprint as something to be interview-ready to explain.
