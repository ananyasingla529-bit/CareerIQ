# CareerIQ — 30-Day Growth Plan
**From v1.0 MVP to a significantly more complete product, one achievable milestone per day**

This plan assumes the same working pattern established during the 10-day capstone: focused daily sessions, one milestone at a time, each building on the last, with free tools only unless stated otherwise. It draws directly from the v2 roadmap already documented in the PRD and `future-scope.md` — nothing here is invented fresh.

---

## Week 1: Deepen the Core Analysis (Days 1–7)

| Day | Milestone |
|---|---|
| 1 | Design the schema extension for analysis version history (multiple reports per job, linked by a shared `jobKey`) |
| 2 | Implement version history storage in `storage.js` — save a new version instead of overwriting when re-analyzing the same company+title |
| 3 | Build the UI to view a job's score history over time (simple line/sparkline using existing CSS bar patterns, no new chart library) |
| 4 | Design the full hybrid AI + rule-engine merge logic (how offline engine's deterministic checks combine with AI reasoning into one confidence-weighted report) |
| 5 | Implement the merge logic as a new `analysisController.js` mode, run in parallel rather than as pure fallback |
| 6 | Test and tune the hybrid merge against 10+ real resume/JD pairs, adjusting weighting |
| 7 | **Checkpoint:** full regression test of core analysis flow with hybrid mode; write up what changed in `PROGRESS.md` |

## Week 2: Resume Rewrite Assistant v2 + DOCX Support (Days 8–14)

| Day | Milestone |
|---|---|
| 8 | Design an editable resume draft feature — apply a suggestion directly into a stored, editable text block |
| 9 | Build the "Apply Suggestion" UI action and draft storage schema |
| 10 | Build the editable draft view (textarea pre-filled with original + applied suggestions) |
| 11 | Add "Export Draft as Text" download |
| 12 | Integrate `mammoth.js` (free) for `.docx` text extraction, mirroring the existing `pdfParser.js` pattern |
| 13 | Add `.docx` upload UI alongside the existing PDF dropzone, with the same review/edit step |
| 14 | **Checkpoint:** test both new features end-to-end; update README feature list |

## Week 3: Application Pipeline + Analytics (Days 15–21)

| Day | Milestone |
|---|---|
| 15 | Design the full 6-stage pipeline schema (Interested → Applied → Assessment → Interview → Offer → Rejected) |
| 16 | Build the pipeline status UI on dashboard cards (replacing the current 4-option dropdown) |
| 17 | Add a simple pipeline summary view (count of jobs per stage) |
| 18 | Design the Resume Improvement Analytics aggregation logic (most common missing skills across all saved analyses) |
| 19 | Build the analytics view on the dashboard (simple list/bar breakdown, reusing existing category-bar CSS patterns) |
| 20 | Add average Fit Score trend across all analyses to the analytics view |
| 21 | **Checkpoint:** full walkthrough of pipeline + analytics; verify no regressions in save/compare |

## Week 4: Organization, Polish & Optional Cloud Sync (Days 22–30)

| Day | Milestone |
|---|---|
| 22 | Build Favorites/pinning on dashboard cards |
| 23 | Build search across saved analyses (company/title text match) |
| 24 | Build filter by status and by score range |
| 25 | Research and choose a free-tier backend option for optional cloud sync (e.g., Supabase) |
| 26 | Design the `storage.js` swap plan — confirm the abstraction still holds, no changes needed in `report.js`/`dashboard.js`/`compare.js` |
| 27 | Implement basic auth + cloud save as an opt-in toggle (local-only remains the default) |
| 28 | Test cloud sync across two devices/browsers |
| 29 | Full accessibility + performance re-audit (Lighthouse) given the month's new surface area |
| 30 | **Final checkpoint:** full end-to-end walkthrough, update all documentation (README, PROGRESS.md, ARCHITECTURE.md), tag a `v1.1.0` release |

---

## Guardrails for the Month

- **One milestone per day, no exceptions** — the 10-day capstone's biggest lesson was that disciplined daily scope beats ambitious sprawl.
- **Every new feature gets a v2/v3 boundary check** — if a day's work reveals a bigger idea, log it in `future-scope.md` rather than expanding the current day's scope.
- **Free tools only**, consistent with the original build.
- **Test before moving on** — every "Checkpoint" day exists specifically to catch regressions before compounding new work on top of broken work.
