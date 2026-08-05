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

## Day 4 — Resume Input: Upload, Parsing & Job Description Entry (July 31, 2026)
Built the first real user-facing feature: PDF upload (drag-and-drop + click-to-browse) with client-side text extraction via PDF.js, an editable review step, and a plain-text paste fallback for parse failures or scanned PDFs. Added job description input with live character-count validation (100-char minimum) and wired the Analyze button's enable/disable logic to require both valid resume and JD text.

**Issue resolved:** the initially chosen PDF.js CDN version (4.0.379) failed to load correctly via a classic script tag due to an ES module format change, causing every PDF to fail parsing regardless of validity. Fixed by pinning to PDF.js 3.11.174, the last version compatible with non-module script loading. Verified working end-to-end with a real resume PDF afterward.

New file added beyond the original Day 2 scaffold: `js/analyze-page.js`, holding page-specific UI wiring separately from the reusable `pdfParser.js` module.

**Deliverables produced:** DAY4-SUMMARY.md; working `pdfParser.js`, `analyze-page.js`, updated `analyze.html` and `css/styles.css`.

**Status:** ✅ Complete — Day 5 (Blueprint's "Day 4": AI Analysis Engine) ready to begin immediately.

---

## Day 5 — AI Analysis Engine (August 1, 2026)
Adapted the plan to use free tools only: since the Anthropic Claude API requires billing, substituted **Google Gemini API** as the AI provider — a swap requiring zero architectural changes, since `aiEngine.js` was always the single isolated integration point per the modularity principle established in `ARCHITECTURE.md`.

Created a free Google AI Studio account and Gemini API key (practiced good security hygiene: an accidentally-exposed key was immediately revoked and regenerated). Deployed a Cloudflare Worker (`black-river-885d.ananyasingla529.workers.dev`) storing the key as an encrypted secret, never exposed to the browser or committed to the repo. Built `proxy/cloudflare-worker.js` (validates requests, prompts Gemini, validates and returns the locked JSON schema) and `js/aiEngine.js` (client-side call with timeout, retry-ready error typing, defense-in-depth schema validation). Wired the real AI call into `analyze.html`, replacing yesterday's placeholder.

**Issues resolved:** hit three consecutive 404 errors as Google has retired/renamed several Gemini model versions recently; root-caused via Gemini's own error message and confirmed via research. Fixed by switching to `gemini-flash-latest` — Google's official self-updating model alias — specifically chosen to prevent this exact breakage from recurring as models are retired going forward.

**Deliverables produced:** DAY5-SUMMARY.md, updated ENVIRONMENT.md (Gemini config replacing the originally-planned Anthropic config).

**Status:** ✅ Complete — full AI pipeline verified working end-to-end with real, varying results across multiple job descriptions. Day 6 (Blueprint's "Day 5": Report UI) ready to begin immediately.

---

## 💡 v2 Idea Captured (August 1, 2026)
**Resume Rewrite Assistant** — while reviewing Day 5's AI output, identified a natural extension beyond the current `recommendations` field: AI-suggested phrasing/edits to help surface skills the candidate already has but that aren't clearly reflected in their resume text (e.g., "you have this JD-required skill from Project X, but it's not in your Skills section — here's suggested wording"). This goes beyond advice into actual editable rewrite suggestions — a genuinely new feature (own UI, own prompt, edits the user's document) rather than a display improvement, so it's deliberately deferred to v2 to protect the remaining 5 days' core scope. v1.0's `recommendations` array already covers "what to improve," just not "exact suggested wording."

---

## Day 6 — Report UI, Offline Fallback Engine & Live Deployment (August 2, 2026)
Agreed on a pacing adjustment: rather than declaring "MVP complete" (which was actually the Blueprint's final-day scope), built two naturally-paired Blueprint days today — the full Report UI and the Offline Fallback Engine — since both share the same JSON contract. Save/Dashboard and Comparison remain on Days 8-9, not rushed.

Built `js/report.js` (full styled report: score hero, confidence meter, category breakdown, Evidence Panels, eligibility flags, Why Good Fit, recommendations, expandable Reasoning Panel) and ~300 lines of new component CSS. Built the complete offline engine (`data/skillsTaxonomy.js`, `js/offlineEngine.js` with a documented weighted scoring formula, `js/analysisController.js` orchestrating automatic AI-to-offline fallback) — verified working via DevTools offline simulation, producing a full sensible report with correct mode labeling.

Added the required footer attribution ("Built with Claude as part of the AB Talks 60-Day Claude AI Challenge") and deployed to GitHub Pages — live at **https://ananyasingla529-bit.github.io/CareerIQ/**. Verified the full AI pipeline (GitHub Pages → Cloudflare Worker → Gemini → rendered report) works correctly in production, not just locally, and confirmed the footer is visible on the live site.

**Deliverables produced:** DAY6-SUMMARY.md; 10 new/updated code files; first live, publicly shareable deployment.

**Status:** ✅ Complete — full report UI and offline reliability both verified working, locally and in production. Day 7 (Blueprint's "Day 7": Saved Analyses & Dashboard) ready to begin immediately.

---

## Day 7 — Saved Analyses, Dashboard & UI/UX Polish (August 3, 2026)
Built `js/storage.js` (full localStorage CRUD with schema validation), a "Company & Role" input step on the analyze page, and a "Save This Analysis" action. Built the real `dashboard.html`/`js/dashboard.js`: card grid, status tracking (added a user-requested "Not Interested" status alongside Interested/Applied/Not Applied), View Report modal reusing `report.js`, delete/export/delete-all, and a proper empty state.

Followed with a senior-level UI/UX polish pass across the whole app: accessibility (skip link, focus outlines, ARIA live regions and labels, keyboard-accessible dropzone, Escape-to-close modals with focus return, improved text contrast), motion/feedback (loading spinner, report fade-in, card hover lift, button press feedback, reduced-motion support), and structural polish (sticky header with scroll shadow, spacing/mobile refinements).

**Deliverables produced:** DAY7-SUMMARY.md; 14 new/updated code files spanning storage, dashboard, and app-wide polish.

**Status:** ✅ Complete — save/dashboard fully functional and verified, full regression pass confirmed nothing broke. Day 8 (Blueprint's "Day 8": Job Comparison) ready to begin immediately.

---

## Day 8 — Job Comparison, Design Refresh & Production QA (August 4, 2026)
Built the Comparison feature: `js/compare.js`, real `compare.html`, dashboard checkbox selection with a sticky "Compare Selected" bar (max 3, min 2 enforced). Fixed two real bugs during testing — a "Best Fit" badge clipping issue and column over-stretching with few cards.

Iteratively refreshed the visual design per direct feedback — from the original navy/cyan palette through Electric Indigo + Lime to a full dark-mode design system (Deep Indigo → Midnight Navy gradient, dark slate glassmorphic cards, sparingly-used Neon Lime accents) matching a Linear/Raycast/Vercel/Perplexity aesthetic. Updated score-tier breakpoints to 85/70/50 (Excellent/Good/Average/Poor) across all three rendering files to match.

Ran a full production-readiness QA pass as a senior QA/security/performance reviewer: tightened Cloudflare Worker CORS from an effectively-open policy to an explicit origin allowlist, added an 8MB PDF file-size guard, added a defensive inner fallback to `analysisController.js` so the "never fails" promise has zero gaps even in worst-case scenarios, fixed a UI overlap bug with the sticky compare bar, and manually audited every dynamic text insertion point for XSS safety (confirmed clean). Completed a full end-to-end regression walkthrough with zero console errors.

**Deliverables produced:** DAY8-SUMMARY.md; comparison feature (3 new/updated files), dark theme redesign (styles.css + 3 JS files), 5 QA/security fixes.

**Status:** ✅ Complete — Comparison feature and full QA pass both verified locally and on the live production site. Day 9 (final polish/testing per Blueprint) ready to begin.

---

## Day 9 — Launch & Production Readiness (August 5, 2026)
Since the full QA pass was already completed on Day 8, today focused on the remaining launch-readiness items: SEO/social metadata (Open Graph, Twitter Card) and a custom SVG favicon across all pages, a branded 404 error page replacing GitHub Pages' default, and a full professional README (feature list, architecture summary, tech stack, setup instructions, project structure, v2 roadmap, documentation links). Completed a full Release Readiness Review across deployment, secrets, docs, license, SEO, branding, error pages, states, UI consistency, performance, accessibility, security, and production config — everything passed. Verified live on production with hard-refresh, including the 404 page and favicon.

**Deliverables produced:** DAY9-SUMMARY.md; favicon, 404 page, full README, SEO metadata across all 4 main pages.

**Status:** ✅ Complete — app confirmed genuinely public-launch-ready. Day 10 (final day) ready to begin.

---

## Day 10 — Final Day: Wrap-Up & Launch (Upcoming)
**Planned:** Final incognito walkthrough, optional debug-log cleanup, finalize screenshots, tag `v1.0` GitHub Release, prepare LinkedIn/portfolio post and interview talking points, confirm against the PRD's Definition of Done.

**Status:** ⏳ Not started
