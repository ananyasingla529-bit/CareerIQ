# CareerIQ — Future Scope
**How this specific project could evolve beyond v1.0**

CareerIQ v1.0 is a deliberately scoped MVP: AI-first analysis with an offline fallback, save/dashboard, comparison, and — as of the final day — a Resume Rewrite Assistant. This document lays out a realistic, specific evolution path, grounded in what the product actually is today, not generic startup boilerplate.

---

## 3 Months: Deepen the Core Loop

The goal at 3 months is to make the existing single-player experience meaningfully smarter and stickier, without expanding scope into new product categories yet.

- **Full hybrid AI + rule-engine merge.** Today, v1.0 is AI-first with a rule-based offline fallback that runs *instead of* the AI. The natural next step (already scoped in the Implementation Blueprint's v2 notes) is running both in parallel and merging results — using the deterministic engine's eligibility/keyword checks to validate and add confidence scoring on top of the AI's reasoning, rather than treating them as either/or.
- **Analysis version history.** When a user updates their resume and re-analyzes the same job, keep the previous report so they can see their Fit Score improve over time. This directly extends the `Analysis` schema (`SCHEMA.md`) with minimal redesign — it's a natural fit for the existing localStorage architecture.
- **Resume Rewrite Assistant v2.** The current version suggests one bullet per gap on request. The next iteration could let users apply suggestions directly into an editable resume draft stored alongside the analysis, closing the loop from "here's a suggestion" to "here's your updated resume text."
- **DOCX resume support.** PDF-only was a deliberate v1.0 cut (documented in the PRD) to keep parsing scope manageable. Adding `mammoth.js` or similar for `.docx` extraction is a contained, well-understood addition.

## 6 Months: From Personal Tool to Job-Search Companion

At 6 months, the product should start behaving less like a single-analysis tool and more like an ongoing companion for an active job search.

- **Full application pipeline tracking.** Expand the current simple status field (Interested/Applied/Not Applied/Not Interested) into the full 6-stage pipeline already documented in the PRD's v2 roadmap: Interested → Applied → Assessment → Interview → Offer → Rejected — with basic reminders ("You applied 2 weeks ago — any updates?").
- **Resume Improvement Analytics.** Across all of a user's analyzed jobs, surface patterns: which skills come up as "missing" most often, which categories consistently score lowest. This turns individual analyses into a personal upskilling roadmap, and is a natural aggregation on top of data already being collected.
- **Favorites, search, and filter** across saved analyses — straightforward UX additions once the dashboard has enough real usage to need them (the empty-state-friendly design from v1.0 was intentionally simple because this wasn't needed yet).
- **Optional cloud sync.** The `storage.js` abstraction layer was specifically designed (per `ARCHITECTURE.md` §7) so this is a contained swap — replace localStorage calls with API calls to a lightweight backend (e.g., Supabase free tier), without touching `report.js`, `dashboard.js`, or `compare.js`.

## 12 Months: Multi-Sided Product

At 12 months, if user traction justifies it, CareerIQ could evolve beyond a single-user tool into something with real network effects and a sustainable model — mirroring the B2B-SaaS-via-B2C-traction strategy already outlined for the related SkillBridge AI concept.

- **Live job board integration.** Auto-pull listings (e.g., via the Indeed connector already used in earlier project work) and batch-analyze them, turning CareerIQ from "analyze one job I found" into "show me which of these 50 postings are worth my time."
- **Institutional/campus placement cell version.** Colleges and placement offices could get an aggregate view: which students are eligible for which drives, common skill gaps across a graduating class, and application funnel health — a natural extension of the Resume Improvement Analytics concept applied at cohort scale, echoing the B2B angle already explored in the SkillBridge AI strategy work.
- **Full multi-agent hybrid reasoning.** With a year of real usage data, the offline rule engine's keyword taxonomy could be replaced or supplemented by a fine-tuned or retrieval-augmented model trained on which past AI judgments users actually agreed with — closing the loop between "what the AI says" and "what actually helped someone get hired."

---

## What Explicitly Stays Out of Scope, Even Long-Term

To keep this grounded rather than a wishlist, some things are deliberately excluded even at the 12-month mark: CareerIQ is not trying to become a full ATS, a resume *builder* from scratch, or a general career-coaching chatbot. It stays focused on the one sharp problem it was built to solve — helping someone decide, quickly and honestly, whether a specific job is worth their time.
