# CareerIQ — Progress Log
Tracking daily progress across the 10-day capstone build.

---

## Day 1 — Product Discovery & Sprint Planning (July 28, 2026)
Interviewed to discover the project idea, landing on **CareerIQ** — an AI-powered resume-vs-job-description fit analyzer that acts as a career coach rather than a keyword scanner. Defined the target problem (hidden eligibility mismatches and skill gaps wasting job-seeker effort), primary and secondary personas, and locked v1.0 scope against a v2 roadmap to prevent scope creep. Key decisions: AI-first analysis with automatic offline fallback, PDF + text resume input, saved analyses with basic 2–3 job comparison, deployment on GitHub Pages with a serverless proxy for API key security.

**Deliverables produced:** Product Requirements Document (PRD), Implementation Blueprint (Days 2–10), Pitch Deck.

**Status:** ✅ Complete

---

## Day 2 — System Design (July 29, 2026)
Created the GitHub repository (`github.com/ananyasingla529-bit/CareerIQ`), cloned it locally, and scaffolded the full project folder structure — 4 HTML pages, 9 JS modules, CSS, data, assets, and proxy folders, matching the Blueprint's target structure exactly. Finalized the tech stack: vanilla HTML/CSS/JavaScript (no framework/build tools), Claude API (`claude-sonnet-4-6`) via a Cloudflare Worker proxy, PDF.js for resume parsing, Chart.js for visualizations, `localStorage` for persistence, GitHub Pages for hosting — all free-tier tools.

Produced the full system design:
- **ARCHITECTURE.md** — component diagram, sequence diagram for the analysis flow, request lifecycle flowchart, AI interaction design, external services table
- **SCHEMA.md** — locked JSON contract (`AnalysisReport`) shared by both the AI and offline engines, validated against every PRD user story
- **API.md** — the one real network endpoint (Worker proxy) plus all 9 internal module function contracts, each with request/response/validation/auth/error cases
- **UI-WIREFRAMES.md** — user flow diagram, screen flow/navigation map, 6 low-fidelity wireframes covering every screen and state
- **PROJECT-STRUCTURE.md** — final folder structure with rationale, plus a day-by-day file-ownership map through Day 10

No conflicts found between today's design work and the approved PRD/Blueprint — no scope changes were needed. Two ambiguities that would otherwise have been decided mid-build were resolved in advance: the report renders inline on `analyze.html` (no separate report page), and mobile comparison uses horizontal scroll rather than a stacked layout.

**Deliverables produced:** ARCHITECTURE.md, SCHEMA.md, API.md, UI-WIREFRAMES.md, PROJECT-STRUCTURE.md, updated Implementation Blueprint (Day 2 addendum), PROGRESS.md.

**Repository status:** 2 commits on `main` — `Initial commit`, `Day 2: system design docs, project scaffold, and folder structure`.

**Status:** ✅ Complete — Day 3 ready to begin implementation immediately, no further planning required.

---

## Day 3 — Project Setup & Foundation (July 30, 2026)
Adapted the day's plan to fit CareerIQ's locked architecture (no framework, no database, no auth) rather than following a generic setup template. Installed and configured the local development environment: VS Code, the Live Server extension, and Node.js LTS (v24.18.1). Opened the project locally and verified it runs correctly via Live Server. Debugged a cosmetic VS Code Explorer sidebar display issue (files were confirmed intact on disk throughout via `tree /F`; worked around using File → Open File... directly).

Built the two genuinely foundational code files: **`css/styles.css`** (complete design system — color palette, typography, spacing, buttons, cards, badges, responsive nav) and **`js/app.js`** (shared header/footer injection, active-nav highlighting, mobile menu toggle, shared `escapeHTML()`/`formatDate()` utilities). Gave `index.html` real landing-page content; left `analyze.html`, `dashboard.html`, `compare.html` as clearly labeled placeholder shells per the blueprint's Day-by-day feature schedule.

Verified: landing page loads and styles correctly, navigation works across all 4 pages, mobile hamburger menu functions, zero console errors, structure matches `ARCHITECTURE.md`/`PROJECT-STRUCTURE.md` with no drift.

**Deliverables produced:** SETUP.md, ENVIRONMENT.md, updated PROJECT-STRUCTURE.md, DAY3-SUMMARY.md, Implementation Blueprint addendum (clarifying capstone-day vs. blueprint-day numbering going forward).

**Repository status:** Resolved one merge conflict (local vs. remote doc versions) cleanly; 5 commits total on `main`.

**Status:** ✅ Complete — Day 4 (Blueprint's "Day 3": Resume Input) ready to begin immediately, no additional setup required.

---

## Day 4 — Resume Input: Upload, Parsing & Job Description Entry (Upcoming)
**Planned:** Build the PDF upload widget, PDF.js text extraction, review/edit step, plain-text paste fallback, and job description input with validation on the real `analyze.html`. See Implementation Blueprint, Day 3 section, for full detail.

**Status:** ⏳ Not started
