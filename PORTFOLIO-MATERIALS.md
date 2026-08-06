# CareerIQ — Portfolio Materials

---

## Project Descriptions

### Short (LinkedIn headline / portfolio card, ~25 words)
AI-powered career decision-support app that analyzes resume-vs-job-description fit in under 30 seconds — with an automatic offline fallback, so it never breaks.

### Medium (portfolio project page, ~80 words)
CareerIQ answers one question fast: is this job worth applying to? Upload a resume and a job description, and get an evidence-backed fit report — score, category breakdown, matching strengths, missing skills, eligibility flags, and a clear recommendation — powered by Google Gemini through a secure serverless proxy, with an automatic rule-based offline fallback so the core experience never fails. Built solo across a structured 10-day sprint with full documentation (PRD, architecture, API design) and a production-readiness pass covering security, accessibility, and performance.

### Long (case study intro, ~150 words)
CareerIQ is an AI career coach, not a keyword scanner. During an active internship search, manually cross-checking eligibility criteria and skill requirements against dozens of job postings was the single most time-consuming part of applying — so I built a tool to do it in 30 seconds instead. Upload a resume (PDF or text), paste a job description, and get a structured report: an overall Fit Score, a 7-category breakdown, an Evidence Panel linking every finding back to the exact source text, eligibility red flags, and an honest Apply Confidence recommendation.

The architecture is AI-first (Google Gemini via a Cloudflare Worker proxy that keeps the API key server-side) with a fully deterministic offline fallback engine, so the app is reliable even without connectivity. Built solo over a structured 10-day sprint — from PRD through system design, implementation, a full security/QA pass, and a production launch — with a complete documentation trail at every stage.

---

## Resume Bullet Points

*(Pick 2-3 depending on the role you're applying for — technical vs. product-leaning)*

**Technical/Engineering-focused:**
- Designed and shipped CareerIQ, an AI-powered resume analysis tool, architecting a provider-agnostic AI integration layer that allowed a mid-build swap from a paid to a free AI provider by modifying a single file, with zero downstream changes
- Built a fully automatic offline fallback system for an AI-dependent application, guaranteeing 100% uptime for core functionality regardless of AI service availability, verified through real network-failure testing
- Implemented a secure serverless proxy architecture (Cloudflare Workers) to protect API credentials in a client-side-only application, including origin-restricted CORS policy and defense-in-depth input validation
- Conducted a full security and accessibility audit of a production web application, identifying and remediating a CORS misconfiguration, adding keyboard navigation and ARIA support, and confirming zero XSS vulnerabilities across all user/AI-generated content rendering

**Product/Process-focused:**
- Led a solo 10-day structured software development lifecycle for an AI product — from requirements gathering and system design through implementation, QA, and production launch — maintaining a full documentation trail (PRD, architecture, API design, daily progress log) throughout
- Practiced disciplined scope management under real time constraints, cutting an initially over-ambitious feature set to a focused MVP and maintaining a documented v2 roadmap rather than scope creep
- Iterated a product's visual design system through multiple rounds of live user feedback, implementing a complete dual-theme (light/dark) redesign via a centralized CSS variable architecture with zero structural rework

---

## Interview Talking Points

**"Tell me about a project you're proud of."**
Lead with the offline fallback: "I built an AI tool that never actually depends on the AI to keep working." Explain the locked JSON schema decision from Day 2 that made this possible — both the AI and the rule-based engine produce identical output shapes, so the UI never needs to know which one ran. This is a strong signal of architectural thinking, not just feature-building.

**"Tell me about a time you had to adapt to a constraint."**
The Claude-API-to-Gemini swap on Day 5. The plan called for Anthropic's API, but it requires billing and the project was scoped to free tools. Because the AI integration was already isolated behind a single abstraction (`aiEngine.js`), the swap required no architectural changes — a direct payoff of a Day 2 design decision. Good story about how good architecture pays for itself when constraints change.

**"Tell me about a bug you had to debug."**
Three options, pick based on what the interviewer seems to value:
- *Library versioning:* PDF.js 4.x silently failing on every PDF due to an ES module format mismatch — root-caused via research, fixed by pinning to a compatible version.
- *API deprecation:* Three consecutive 404s as Gemini retired model versions mid-build — solved not just by finding a working model name, but by switching to a self-updating alias to prevent recurrence, which is the more senior fix.
- *Contrast bugs:* Building a light/dark theme toggle surfaced three separate classes of invisible-text bugs (hardcoded heading colors, badge text tuned for one theme, a badge with the same issue in reverse) — a good story about systematic debugging (checking every text-color declaration, not just the one that was reported).

**"How do you handle scope creep / prioritization?"**
Day 1's interview process: an initially over-ambitious feature list (rule engine + AI reasoning + full application pipeline + analytics + version history, all in v1.0) was deliberately cut to a lean MVP, with everything else captured in a documented v2 roadmap rather than discarded. This pattern repeated throughout — a "Resume Rewrite Assistant" idea was captured on Day 5 and deliberately *not* built until there was verified spare time on Day 10, and even then was scoped honestly (no offline fallback, because faking AI-quality suggestions offline would be dishonest, not a shortcut).

**"How do you approach security in a project like this?"**
Walk through the Day 8 QA pass: found the Cloudflare Worker was reflecting any requesting origin in CORS headers (functionally a wildcard) — fixed with an explicit allowlist. Also describe the systematic XSS audit: verified every AI-generated and user-generated string across the report, dashboard, and comparison views passes through an `escapeHTML()` function before DOM insertion, confirming a consistent security discipline established early (Day 5) rather than bolted on later.

---

## Demo Script (2-3 minutes, live or recorded)

> "This is CareerIQ — it answers one question: is this job worth applying to?
>
> [Upload a resume] I'll upload my resume as a PDF — it's parsed client-side, so nothing gets uploaded anywhere at this stage.
>
> [Paste a JD] And I'll paste in a job description.
>
> [Click Analyze] Now it's calling Google Gemini through a secure proxy I built — the API key never touches the browser.
>
> [Report renders] And here's the full report: a Fit Score, a category breakdown across seven dimensions, and — this is the part I'm most proud of — an Evidence Panel. Every single finding links back to the exact text in my resume or the job description that supports it. It's not a black box.
>
> [Scroll to Apply Confidence] It gives an honest recommendation — apply now, improve first, or focus on upskilling — not just a number.
>
> [Toggle offline in DevTools, re-run] And here's the part that took real engineering: watch what happens if the AI is unavailable. [Toggle network offline, re-analyze] It automatically falls back to a rule-based engine I built — still a full, useful report, clearly labeled, no crash, no dead end.
>
> [Save, go to Dashboard] I can save analyses, track application status, and [go to Compare] compare a few side by side to decide which to prioritize.
>
> [Toggle theme] And this whole thing has a light and dark theme, saved to your preference.
>
> The whole thing — no framework, no build tools, deployed free on GitHub Pages — and it was built solo over a structured 10-day sprint with full documentation at every stage, from a written PRD through a security and accessibility audit before launch."

---

## Suggested Screenshots/Media for Sharing

Already captured and in `assets/screenshots/`:
- `01-home.png` — clean first impression
- `02-analyze.png` — the core input flow
- `04-dashboard.png` — populated dashboard (shows persistence + real usage)
- `05-compare.png` — comparison view (a genuinely differentiated feature)

**For LinkedIn specifically:** the comparison view (`05-compare.png`) or a report screenshot with the Evidence Panel expanded tend to generate the most engagement — they show a concrete "wow, that's smart" detail rather than just a generic landing page. A short screen-recording GIF of the offline-fallback demo (per the script above) would be a strong differentiator if you have time to make one, since "it works even offline" is a rare, specific claim most viewers will remember.
