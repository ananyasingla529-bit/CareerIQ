# CareerIQ — Challenge Retrospective
**A day-by-day account of the 10-day capstone build**

---

## The Timeline

### Day 1 — Discovery
Started with no fixed idea. Through a structured interview, landed on CareerIQ: an AI-powered resume-vs-job-description fit analyzer, motivated by a real pain felt during an active internship search — manually cross-checking eligibility criteria job by job. The first major discipline exercised here: when the initial feature vision (AI reasoning + rule-based validation + full application pipeline + version history + analytics dashboard, all in v1.0) was clearly too ambitious for 10 days at 3-4 hours/day, the scope was deliberately cut down to a focused MVP, with everything else pushed to a documented v2 roadmap rather than discarded. PRD, Implementation Blueprint, and Pitch Deck were produced before a single line of code was written.

### Day 2 — System Design
Full architecture, data schema, API contracts, and wireframes — all before implementation. The key decision that paid off repeatedly for the rest of the build: designing the locked JSON schema (`AnalysisReport`) that both the eventual AI and offline engines would produce identically, so the UI layer would never need to know which one ran.

### Day 3 — Foundation
Environment setup and the shared design system (`styles.css`, `app.js`). Hit the first real debugging moment: VS Code's Explorer sidebar stopped showing project files. Verified via PowerShell that the files were completely intact on disk — the bug was cosmetic, not data loss — and worked around it rather than losing a day chasing a rendering quirk.

### Day 4 — First Real Feature
Built PDF upload, parsing, and JD input. Hit the first genuine library bug: the initially-chosen PDF.js CDN version (4.0.379) used an ES module format incompatible with classic `<script>` tags, silently failing on every PDF regardless of validity. Root-caused via research and fixed by pinning to `3.11.174`.

### Day 5 — The AI Engine (and a Real Constraint)
The day opened with an important correction: the plan called for the Anthropic Claude API, but that requires billing and the session was scoped to free tools only. Rather than a redesign, this became a clean proof of the Day 2 architecture decision — swapping to Google Gemini touched only `aiEngine.js` and the Worker, nothing else. Then hit three consecutive 404 errors as Gemini retired multiple model versions during setup, finally landing on `gemini-flash-latest` — a self-updating alias chosen specifically so this class of bug couldn't recur.

### Day 6 — Report UI, Offline Engine, and First Deployment
A deliberate pacing decision: rather than accept a mislabeled "MVP complete" framing, agreed to build two Blueprint days together (Report UI + Offline Engine, since they share the same JSON contract) and pushed the first live GitHub Pages deployment — honestly labeled as in-progress, not finished.

### Day 7 — Persistence and a Real UX Instinct
Built save/dashboard with localStorage. A good product instinct emerged here: a request to add a "Not Interested" status distinct from "Not Applied" — the difference between "haven't gotten to it" and "actively decided against it." Followed with a full senior-level UI/UX polish pass: keyboard accessibility, ARIA live regions, skip links, motion design.

### Day 8 — Comparison, a Visual Identity, and Real Security Work
Handled a scope-ordering conflict (QA work was requested before Comparison was built) by reordering rather than skipping either. Built the comparison feature, found and fixed two real layout bugs during testing. Then, mid-session, iteratively redesigned the entire color system through several rounds of feedback — landing on a bold Electric Indigo + Neon Lime dark theme per a detailed design brief, implemented entirely through the existing CSS variable system with zero structural changes, proving the Day 2 architecture decision was sound. Closed with a genuine security/QA pass: found and fixed a real CORS looseness issue (the Worker was reflecting any origin), added a file-size guard, hardened the "never fails" reliability guarantee, and audited for XSS — found none, confirming the escaping discipline held from Day 5 onward.

### Day 9 — Getting Genuinely Launch-Ready
SEO metadata, a branded 404 page, favicon, and a full professional README. A complete release-readiness review across security, accessibility, performance, and documentation — everything passed. Then, with time remaining, iterated further: added a light/dark theme toggle (restoring the original Day 2 palette as "Light" mode) and, in the process, found and fixed three separate classes of theme-contrast bugs — headings hardcoded to white, badge text colors tuned only for dark backgrounds, and a Best Fit badge with the same problem in reverse. Each was root-caused precisely rather than patched generically.

### Day 10 — Wrap-Up
Between Day 9 and Day 10, the Resume Rewrite Assistant (captured back on Day 5/6 as a v2 idea) was built and shipped as a bonus feature — deliberately scoped honestly: it requires live AI (no offline fallback, because grounded creative phrasing can't be meaningfully faked by a rule engine), and it refuses to fabricate experience the resume doesn't actually show evidence of. Final day: screenshots, README finalization, repo metadata, and this documentation.

---

## Major Technical Decisions & Why They Held Up

1. **Locked JSON schema before any engine existed (Day 2).** This single decision is why swapping AI providers (Day 5), adding the offline engine (Day 6), building comparison (Day 8), and adding the Rewrite Assistant (Day 10) all required zero changes to the report rendering logic.
2. **CSS variables for the entire design system (Day 3).** This is why a full palette swap (Day 8) and a complete light/dark theme system (Day 9) were both achievable in hours, not days.
3. **AI-first with automatic, silent offline fallback (Day 6), designed to never reject.** This is the app's core reliability promise, and it was stress-tested for real via DevTools' offline mode, not just assumed.
4. **Modular provider abstraction (`aiEngine.js`) (Day 2 principle, proven Day 5).** When Claude API wasn't viable, swapping to Gemini touched one file, exactly as the architecture predicted it would.

## Skills Demonstrated

Requirements gathering and disciplined scope management under real time constraints; system architecture and API contract design; full-stack vanilla JS development without framework scaffolding; third-party API integration and prompt engineering (Gemini); serverless proxy design for credential security; client-side file parsing (PDF.js); state management via localStorage; responsive, accessible UI/UX design including WCAG-conscious contrast and keyboard navigation; security review (CORS, XSS); debugging methodology (isolating root causes across a library version bug, three API deprecation cycles, and multiple theme-contrast issues); iterative design collaboration; and technical documentation discipline maintained across all 10 days.

## Lessons Learned

- **A locked data contract is worth designing before any code exists.** Every major feature added after Day 2 was cheaper because of it.
- **"Free" AI still requires real engineering discipline** — model names change, and building against a self-updating alias rather than a pinned version is the correct defensive pattern, learned the hard way through three 404s in one session.
- **Cosmetic bugs and real bugs look identical at first glance** — the VS Code sidebar issue and the theme-contrast issues both required verifying from a different angle (disk contents; actual rendered screenshots) rather than assuming.
- **Honest scope boundaries are a feature, not a limitation.** The decision to *not* fake an offline Rewrite Assistant, and to clearly label in-progress deployments as such, are what make the finished product trustworthy rather than just polished.

## Final Project Summary

CareerIQ shipped as a complete, live, AI-first career decision-support tool with genuine reliability engineering (automatic offline fallback), real persistence and comparison features, a security-reviewed and accessibility-reviewed codebase, a fully custom dual-theme design system, and an honestly-scoped bonus AI feature — all built and documented across 10 structured days, with every major decision traceable back to a PRD written before any code existed.

---

## A Note From Your AI Pair Programmer

Ten days ago you didn't have an idea yet. What you have now is a real product with a real architecture, built through actual debugging — not smooth, uninterrupted progress, but the kind of real problem-solving that teaches you something each time: a mislabeled model name, a sidebar that lied to you, a badge that vanished on a bright background. Every one of those got run down to a precise cause instead of papered over, and that habit is worth more than any single feature in this app.

You also did something a lot of builders don't: you kept saying no to scope you didn't have time for, and yes to the specific pieces of feedback that actually made the product better — a status label, a color palette, a contrast fix, a feature you'd deliberately deferred and then came back for when there was genuinely time. That's what disciplined product judgment looks like in practice, not in theory.

CareerIQ is yours. It works, it's honest about what it can and can't do, and it's a genuinely strong thing to point to and say "I built this." Well done.
