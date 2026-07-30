# CareerIQ — Implementation Blueprint (Days 2–10)
### "Smarter Job Decisions Start Here"
**Single Source of Truth for the remainder of the capstone.** Each day below is written so that a fresh AI conversation can pick it up with zero additional context and continue building without re-planning or re-architecting anything. Paste the relevant day's section (plus the PRD) into a new chat to continue.

---

## 🧭 Project Context (paste this into every new day's conversation)

> **Project:** CareerIQ — an AI-powered resume-vs-job-description fit analyzer that acts like a career coach, not a keyword scanner.
> **Stack decisions locked for this build:** Vanilla HTML/CSS/JavaScript (no framework, no build tools), single-file-per-concern architecture, `localStorage` for persistence, Claude API (`claude-sonnet-4-6`) as the AI engine routed through a Cloudflare Worker proxy, PDF.js for resume parsing, Chart.js for any visualizations, deployed on GitHub Pages.
> **Non-negotiable architecture principles:** Modular & scalable, transparent AI (Reasoning + Evidence panels), offline-first reliability (app shell always works; AI degrades gracefully to rule-based offline analysis), professional UX, privacy by design (data stays local), strict v1.0/v2 scope separation (see PRD §5).
> **Priority order under time pressure:** Analysis Quality > User Experience > Visual Polish.
> **Definition of Done (Day 10):** Live GitHub Pages deployment, PDF+text resume input, AI report with Fit Score/Evidence/Reasoning/Apply Confidence/Next Action, automatic offline fallback, saved analyses + 2–3 job comparison, professional documented GitHub repo.

---

## 📁 Target Final Repository Structure

```
careeriq/
├── index.html                  # Landing / entry point
├── analyze.html                # Resume + JD input & analysis flow
├── dashboard.html               # Saved analyses list
├── compare.html                 # Side-by-side comparison view
├── css/
│   └── styles.css               # Global design system (variables, components)
├── js/
│   ├── app.js                   # Shared init, navigation, utilities
│   ├── pdfParser.js              # PDF text extraction (PDF.js wrapper)
│   ├── aiEngine.js               # Claude API call + proxy handling + retry logic
│   ├── offlineEngine.js          # Rule-based fallback analysis engine
│   ├── analysisController.js     # Orchestrates AI-first-with-fallback, merges output shape
│   ├── storage.js                # localStorage CRUD for saved analyses
│   ├── report.js                 # Renders the report UI (score, panels, meters)
│   ├── compare.js                # Comparison view logic
│   └── dashboard.js              # Dashboard list, status updates, delete/export
├── data/
│   └── skillsTaxonomy.js         # Keyword/skill dictionary used by offline engine
├── assets/
│   ├── screenshots/               # For README + LinkedIn
│   └── icons/
├── proxy/
│   └── cloudflare-worker.js       # Serverless proxy source (deployed separately)
├── README.md
├── LICENSE
└── .gitignore
```

This structure is fixed for the whole build — every day below tells you exactly which files to touch.

---

# DAY 2 — Project Setup, Design System & Static Shell

### 🎯 Objective
Stand up the full repository skeleton, GitHub Pages deployment pipeline, and the visual design system — so that from Day 3 onward you are only writing feature logic, never fighting setup.

### 📖 What I'll Learn
- Structuring a modular vanilla JS project without a build tool
- Setting up GitHub Pages deployment from a repo
- Building a reusable CSS design system with variables (the "SaaS polish" foundation)

### 🛠 Features to Build
- Empty-but-navigable multi-page shell (`index.html`, `analyze.html`, `dashboard.html`, `compare.html`)
- Global design system: color palette, typography scale, spacing scale, button/card/badge components
- Shared navigation header/footer across all pages
- GitHub repo created and Pages deployment working end-to-end (even with placeholder content)

### 📝 Step-by-Step Implementation Plan
1. Create local project folder `careeriq/` matching the structure above.
2. Build `css/styles.css` first: define CSS custom properties for color palette (pick a professional palette — e.g., deep indigo primary, cyan/teal accent, clean neutrals; avoid pure default blue), font stack (system fonts are fine for reliability), spacing scale (4/8/16/24/32px), and reusable classes: `.btn-primary`, `.btn-secondary`, `.card`, `.badge`, `.badge-success/warning/danger`, `.container`.
3. Build `index.html`: hero section explaining CareerIQ's value prop, tagline "Smarter Job Decisions Start Here," CTA button to `analyze.html`.
4. Build empty-shell versions of `analyze.html`, `dashboard.html`, `compare.html` with just headers/footers and placeholder content, linked via shared nav.
5. Build `js/app.js` with a shared `initNav()` function injected on every page (highlight active page, mobile menu toggle if needed).
6. Initialize git repo, create `.gitignore` (ignore `node_modules`, `.DS_Store`), first commit.
7. Create the GitHub repository named `careeriq` under your GitHub account.
8. Push local repo to GitHub.
9. Enable GitHub Pages (Settings → Pages → Deploy from branch → `main` → `/root`).
10. Verify the live URL loads and navigation works across all four pages.

### 📂 Files to Create
`index.html`, `analyze.html`, `dashboard.html`, `compare.html`, `css/styles.css`, `js/app.js`, `.gitignore`, `README.md` (placeholder only — full version on Day 10)

### 🔗 Tools to Integrate
None yet — this day is intentionally dependency-free.

### 🧪 Testing Tasks
- Load the live GitHub Pages URL on both desktop and mobile browser widths
- Click through every nav link and confirm no broken paths
- Confirm no console errors on any page

### 🐞 Common Issues & Debugging Tips
- **404 on GitHub Pages:** confirm the Pages source branch/folder matches where `index.html` actually lives (root vs `/docs`).
- **CSS not loading:** check relative paths (`css/styles.css` not `/css/styles.css` — GitHub Pages project sites are subpath-hosted).
- **Changes not appearing live:** GitHub Pages can take 1–2 minutes to redeploy after a push; hard-refresh (Ctrl+Shift+R).

### ✅ End-of-Day Checklist
- [ ] Repo created and pushed to GitHub
- [ ] GitHub Pages live URL working
- [ ] All 4 pages reachable via nav with no console errors
- [ ] Design system variables defined and visibly applied (colors, fonts, spacing)
- [ ] First commit message follows a clear convention (e.g., `feat: project scaffold and design system`)

### 📸 Expected State & Screenshots
Screenshot the live homepage (desktop + mobile width) and the empty shells of the other three pages. Save to `assets/screenshots/day2-*.png`.

### ➡️ Handoff Notes for Day 3
Repo is live and navigable with a polished but empty shell. Next: build the resume input flow (PDF upload + parsing + text paste) on `analyze.html`. The design system classes (`.card`, `.btn-primary`, etc.) are ready to use — do not create new one-off styles without checking `styles.css` first.

---

# DAY 3 — Resume Input: Upload, Parsing & Job Description Entry

### 🎯 Objective
Build the complete input side of the product: PDF upload with text extraction, the review/edit step, plain-text paste fallback, and job description entry — the first half of the core user journey.

### 📖 What I'll Learn
- Client-side PDF text extraction using PDF.js
- Designing graceful error-handling UX (parse failure → fallback path)
- Form validation patterns in vanilla JS

### 🛠 Features to Build
- PDF upload widget (drag-and-drop + click-to-browse) on `analyze.html`
- PDF.js integration to extract raw text from the uploaded file
- Editable textarea showing extracted resume text for user review/correction
- "Paste text instead" toggle for users without a PDF
- Job description textarea with minimum-length validation
- "Analyze" button that only enables once both resume text and JD text are present

### 📝 Step-by-Step Implementation Plan
1. Add PDF.js via CDN script tag in `analyze.html` (`https://cdnjs.cloudflare.com/ajax/libs/pdf.js/...`).
2. Build `js/pdfParser.js` with an `extractTextFromPDF(file)` async function: reads the file as ArrayBuffer, loads it via `pdfjsLib.getDocument()`, iterates pages, concatenates `getTextContent()` results into a single string.
3. Wrap the extraction call in try/catch. On failure, show a clear inline message: "We couldn't read this PDF automatically. Please paste your resume text below instead." and auto-switch the UI to text-paste mode.
4. Build the upload UI: a dashed-border drop zone card (`.card` style) with drag-and-drop event listeners (`dragover`, `drop`) plus a hidden `<input type="file" accept=".pdf">` triggered by click.
5. After successful extraction, populate an editable `<textarea id="resumeText">` with the extracted content and show a helper note: "Review the extracted text — fix anything that looks off before analyzing."
6. Add a toggle button "Paste text instead" that hides the upload zone and shows an empty `<textarea>` directly.
7. Build the JD input section: a `<textarea id="jdText">` with a live character counter and minimum-length validation (e.g., require 100+ characters before enabling Analyze).
8. Wire up the "Analyze" button: disabled by default, enabled via an input-listener that checks both fields meet minimum content requirements.
9. On Analyze click (for now, since the engine isn't built yet): store both text values in a temporary JS object and `console.log()` them to confirm data capture — Day 4 will wire this into the real analysis engine.

### 📂 Files to Create/Modify
Modify `analyze.html`, create `js/pdfParser.js`, extend `css/styles.css` with drop-zone and textarea styles, extend `js/app.js` if shared validation helpers are needed.

### 🔗 APIs/Libraries to Integrate
PDF.js (CDN) — no API key required, purely client-side.

### 🧪 Testing Tasks
- Upload a real multi-page PDF resume and confirm text extracts correctly
- Upload a corrupted/non-PDF file and confirm graceful fallback message appears
- Use "Paste text instead" and confirm it works independently of upload
- Confirm Analyze button stays disabled until both fields have sufficient content
- Test drag-and-drop on desktop; confirm click-to-browse works on mobile

### 🐞 Common Issues & Debugging Tips
- **PDF.js worker errors:** must set `pdfjsLib.GlobalWorkerOptions.workerSrc` to match the CDN version exactly, or extraction silently fails.
- **Scanned/image-only PDFs:** PDF.js extracts no text from image-based PDFs (no OCR in v1.0) — this must trigger the fallback path, not a blank textarea. Detect near-empty extraction result and treat it as a failure.
- **Large PDFs freezing the UI:** run extraction inside the async function properly awaited — don't block the main thread synchronously.

### ✅ End-of-Day Checklist
- [ ] PDF upload + extraction working on a real resume
- [ ] Extracted text is editable before proceeding
- [ ] Parse failure shows a clear, non-technical error and offers the text-paste fallback
- [ ] JD textarea validates minimum length
- [ ] Analyze button correctly enables/disables based on input state

### 📸 Expected State & Screenshots
Screenshot: empty upload state, populated/editable extracted text state, and the JD input section filled in. Save as `day3-*.png`.

### ➡️ Handoff Notes for Day 4
Both resume text and JD text are captured in the UI and validated. Nothing is analyzed yet. Next: build the AI analysis engine (Claude API call via proxy) and its exact JSON output contract — this output shape will drive every later day's UI, so it must be defined precisely on Day 4.

---

# DAY 4 — AI Analysis Engine (Claude API Integration + Proxy)

### 🎯 Objective
Build the primary AI-first analysis path: a Cloudflare Worker proxy that hides the API key, a structured prompt that produces the full coach-style report, and the exact JSON contract every later feature (report UI, evidence panel, storage, comparison) will depend on.

### 📖 What I'll Learn
- Serverless proxy patterns for hiding API keys in static sites
- Structured/JSON prompting techniques for reliable AI output
- Designing a stable data contract before building UI on top of it

### 🛠 Features to Build
- Cloudflare Worker proxy that forwards requests to the Claude API with the key stored as a server-side secret
- `js/aiEngine.js`: sends resume + JD to the proxy, requests a structured JSON response
- Defined, locked JSON output schema (see below) used by all future days
- Basic loading state while the AI call is in progress

### 📝 Step-by-Step Implementation Plan
1. **Manual step (I will guide you live):** create a free Cloudflare account, create a new Worker, and add your Anthropic API key as a Worker secret (never in code). I'll walk you through the exact dashboard buttons when you reach this step.
2. Write `proxy/cloudflare-worker.js`: accepts a POST request with `{ resumeText, jdText }`, constructs the Claude API request server-side using the secret key, returns the model's response to the caller. Include CORS headers so your GitHub Pages origin can call it.
3. Design the **locked JSON output schema** (every field below is required in every AI response — this is the contract the whole product depends on):
```json
{
  "overallFitScore": 0,
  "analysisMode": "ai",
  "categoryScores": {
    "technicalSkills": 0, "experience": 0, "education": 0,
    "projects": 0, "softSkills": 0, "eligibility": 0, "keywords": 0
  },
  "strengths": [{ "point": "", "evidenceResume": "", "evidenceJD": "" }],
  "gaps": [{ "point": "", "evidenceJD": "", "severity": "minor|major" }],
  "eligibilityFlags": [{ "issue": "", "evidenceJD": "", "isHardBlocker": true }],
  "recommendations": [""],
  "whyGoodFit": [""],
  "applyConfidence": { "tier": "apply_now|improve_first|borderline|upskill_first", "label": "" },
  "recommendedAction": "apply_now|improve_resume|learn_skills|save_for_later|not_a_match",
  "reasoning": [{ "conclusion": "", "explanation": "", "confidence": "high|medium|low" }]
}
```
4. In `js/aiEngine.js`, write the prompt instructing Claude to act as an expert career coach, reason about transferable skills and hidden JD expectations, and **respond only with valid JSON matching the schema above** — no markdown fences, no preamble.
5. Implement `getAIAnalysis(resumeText, jdText)`: calls the proxy, parses the JSON response, validates all required fields exist, throws a typed error (`AIServiceError`) if the call fails, times out (set a 25s timeout), or returns malformed JSON.
6. Wire the Day 3 "Analyze" button to call `getAIAnalysis()`, show a loading state ("Analyzing your fit... this takes about 20 seconds"), and `console.log` the raw structured result for now (real rendering happens Day 5).
7. Add basic retry logic: one automatic retry on timeout/network error before surfacing failure upward (full offline fallback trigger happens Day 6).

### 📂 Files to Create/Modify
Create `proxy/cloudflare-worker.js`, `js/aiEngine.js`; modify `analyze.html` to wire the Analyze button to the real call and show loading state.

### 🔗 APIs/Services to Integrate
Anthropic Claude API (`claude-sonnet-4-6`) via Cloudflare Workers (free tier).

### 🧪 Testing Tasks
- Call the proxy directly (e.g., via browser fetch in console) with a sample resume/JD and confirm valid JSON returns
- Confirm the API key never appears in any client-side file or browser network tab request payload
- Test with an intentionally malformed prompt response (simulate) to confirm the JSON validation catches it
- Test the 25s timeout by throttling network in dev tools

### 🐞 Common Issues & Debugging Tips
- **CORS errors:** the Worker must explicitly set `Access-Control-Allow-Origin` matching your GitHub Pages domain (or `*` for now, tighten later).
- **AI returns JSON wrapped in markdown fences:** strip ` ```json ` and ` ``` ` before `JSON.parse()` defensively, even though the prompt asks it not to.
- **Worker secret not found:** secrets must be set via `wrangler secret put` or the Cloudflare dashboard, not hardcoded — redeploy after setting.
- **Inconsistent JSON shape from the model:** add explicit validation per field on the client; treat any missing required field as a failure and fall back gracefully (Day 6).

### ✅ End-of-Day Checklist
- [ ] Cloudflare Worker deployed and callable from the browser
- [ ] API key confirmed never exposed client-side
- [ ] `getAIAnalysis()` returns the full locked JSON schema on a real resume/JD pair
- [ ] Loading state displays during the ~20s call
- [ ] Basic retry-once logic implemented

### 📸 Expected State & Screenshots
Screenshot the browser console showing a full successful structured JSON response, and the loading state UI. Save as `day4-*.png`.

### ➡️ Handoff Notes for Day 5
The AI engine is live and returns the locked JSON schema above. This schema is now frozen — every subsequent day (report UI, offline engine, storage, comparison) must produce or consume exactly this shape. Next: build the full report UI that renders this JSON beautifully (Fit Score, category breakdown, Evidence Panel, Reasoning Panel, Apply Confidence Meter, Recommended Next Action).

---

# DAY 5 — Report UI: Fit Score, Evidence Panel & Reasoning Panel

### 🎯 Objective
Render the locked JSON schema from Day 4 into the full "career coach" report experience — this is the core value moment of the entire product and must look and feel like a polished SaaS output.

### 📖 What I'll Learn
- Building dynamic, data-driven UI components from a JSON payload
- Designing transparent/explainable AI interfaces (reasoning + evidence patterns)
- Micro-interaction and visual hierarchy techniques for score-based UIs

### 🛠 Features to Build
- Fit Score hero display (large circular/radial score visual)
- Category breakdown (7 categories) as horizontal bar or radar-style visual using Chart.js
- Strengths list with evidence tags
- Gaps/missing list with severity indicators and evidence tags
- Eligibility flags section with hard-blocker visual distinction
- Recommendations list
- "Why You're Still a Good Fit" highlighted callout section
- Apply Confidence Meter (4-tier color-coded gauge)
- Recommended Next Action button/badge
- AI Reasoning Panel (expandable, per-conclusion explanation + confidence tag)
- Evidence Panel (click a finding → see highlighted source text from resume/JD)
- Analysis Mode badge (shows "AI Analysis" — offline mode comes Day 6)

### 📝 Step-by-Step Implementation Plan
1. Add Chart.js via CDN to `analyze.html`.
2. Build `js/report.js` with a single entry function `renderReport(reportData)` that takes the Day 4 JSON schema and populates the DOM.
3. Fit Score hero: large number (60–72pt per design system) with a color that shifts by tier (red/orange/yellow/green matching Apply Confidence tiers) and a short verdict line underneath.
4. Category breakdown: use Chart.js horizontal bar chart, 7 bars, colored consistently with the design system accent, labeled with both category name and score.
5. Strengths/Gaps: render as card lists; each item shows the point text plus a small "View Evidence" toggle that reveals `evidenceResume`/`evidenceJD` text in a highlighted quote block.
6. Eligibility Flags: render with a distinct red/orange badge for `isHardBlocker: true` items vs. a neutral badge for soft flags.
7. "Why You're Still a Good Fit": styled as a distinct highlighted card (not a plain list) — this is meant to feel encouraging and human, not clinical.
8. Apply Confidence Meter: build as a horizontal 4-segment gauge; highlight the active segment based on `applyConfidence.tier`, with the label text next to it.
9. Recommended Next Action: large, clearly labeled button/badge mapping the 5 possible values to distinct colors and icons/emoji (🟢🟡🔵🟠🔴 per the PRD).
10. AI Reasoning Panel: collapsible section listing each `reasoning[]` entry with its explanation and a confidence badge (High/Medium/Low).
11. Evidence Panel: can be integrated inline with strengths/gaps (per step 5) rather than a separate page section — confirm this reads clearly, adjust if it feels cluttered.
12. Analysis Mode badge: small pill in the report header reading "✨ AI Analysis" with a tooltip/short explainer on hover/tap.
13. Wire `analyze.html`'s Analyze button flow: on successful `getAIAnalysis()` response, call `renderReport(data)` and scroll the user to the report section.

### 📂 Files to Create/Modify
Create `js/report.js`; modify `analyze.html` (add report DOM containers) and `css/styles.css` (score hero, gauge, evidence quote blocks, badges).

### 🔗 Libraries to Integrate
Chart.js (CDN) for the category breakdown visualization.

### 🧪 Testing Tasks
- Render a full report from a real AI response end-to-end and visually inspect every section
- Test with a very high-scoring and a very low-scoring result to confirm color/tier logic works both directions
- Test with an empty `eligibilityFlags` array to confirm the section hides or shows a clean "no issues found" state rather than breaking
- Test on mobile width to confirm the score hero, gauge, and charts remain readable

### 🐞 Common Issues & Debugging Tips
- **Chart.js chart not rendering:** canvas element must exist in the DOM before `new Chart()` is called — ensure `renderReport()` runs after the container HTML is injected, not before.
- **Report looks cluttered:** if Evidence + Reasoning + Strengths/Gaps all compete for attention, use progressive disclosure (collapsed by default, expand on click) rather than showing everything at once.
- **Long JD/resume evidence text breaking layout:** truncate evidence quotes to ~150 characters with a "show more" if needed.

### ✅ End-of-Day Checklist
- [ ] Full report renders from real AI JSON with no missing sections
- [ ] Fit Score, category breakdown, strengths, gaps, eligibility, recommendations, Why Good Fit, Apply Confidence, Next Action all visible and styled
- [ ] Evidence Panel reveals real resume/JD text per finding
- [ ] AI Reasoning Panel shows explanation + confidence per conclusion
- [ ] Analysis Mode badge visible

### 📸 Expected State & Screenshots
Screenshot the complete report for one high-scoring and one low/borderline-scoring analysis, plus a close-up of the Evidence Panel expanded. Save as `day5-*.png`.

### ➡️ Handoff Notes for Day 6
The report UI is complete and fully data-driven off the locked JSON schema — this means the offline engine only needs to produce the *same shape* to plug into this exact UI with zero changes. Next: build the offline rule-based engine and the automatic AI-to-offline fallback logic.

---

# DAY 6 — Offline Rule-Based Engine & Automatic Fallback

### 🎯 Objective
Build the deterministic offline analysis engine and the orchestration logic that automatically switches between AI and offline modes — guaranteeing the app never leaves a user without a report.

### 📖 What I'll Learn
- Rule-based NLP techniques: keyword extraction, skill matching, eligibility parsing
- Building resilient systems with automatic failure detection and graceful degradation
- Orchestration/controller design patterns (`analysisController.js` as the single decision point)

### 🛠 Features to Build
- `data/skillsTaxonomy.js`: a dictionary of common technical skills, tools, and their synonyms/equivalents (e.g., "JS" = "JavaScript")
- `js/offlineEngine.js`: produces the exact same locked JSON schema from Day 4, using deterministic logic instead of AI
- `js/analysisController.js`: tries AI first, catches `AIServiceError`, automatically falls back to offline engine, sets `analysisMode` accordingly
- Offline mode badge and a short explainer of what offline mode means
- Retry-when-back-online logic (basic connectivity listener)

### 📝 Step-by-Step Implementation Plan
1. Build `data/skillsTaxonomy.js`: an object/array covering common categories (languages, frameworks, tools, soft skills) with synonym mapping, sized reasonably (150–300 terms is enough for a strong MVP — don't over-invest here).
2. Build `offlineEngine.js` core functions:
   - `extractKeywords(text)`: lowercase, tokenize, match against the taxonomy
   - `matchSkills(resumeKeywords, jdKeywords)`: returns matched vs. missing skills using the synonym map
   - `checkEligibility(resumeText, jdText)`: regex-based detection of CGPA/percentage, graduation year, degree/branch mentions in both texts, flags mismatches
   - `computeCategoryScores(...)`: deterministic scoring per category based on match ratios (document the exact formula in code comments so you can explain it in interviews)
   - `computeOverallScore(categoryScores)`: weighted average (define and comment the weights)
   - `generateOfflineReport(resumeText, jdText)`: assembles all of the above into the exact locked JSON schema from Day 4, with `analysisMode: "offline"`, simpler (but still real) strengths/gaps/recommendations text, and a `reasoning[]` array explaining each rule that fired (e.g., "Matched because 'React' appears in both texts").
3. Build `js/analysisController.js` — the single orchestration entry point used by the UI going forward:
```
async function runAnalysis(resumeText, jdText) {
  try {
    return await getAIAnalysis(resumeText, jdText); // Day 4
  } catch (err) {
    console.warn("AI unavailable, falling back to offline analysis:", err);
    return generateOfflineReport(resumeText, jdText); // this day
  }
}
```
4. Update `analyze.html`'s Analyze button to call `runAnalysis()` instead of `getAIAnalysis()` directly.
5. Update the Analysis Mode badge logic in `report.js` to read `reportData.analysisMode` and render "✨ AI Analysis" or "📴 Offline Analysis" with an appropriate short explainer tooltip for each.
6. Add a simple `window.addEventListener('online', ...)` listener that, if the last analysis was offline, shows a subtle banner: "You're back online — re-run this analysis with AI for deeper insights?"
7. Manually test the fallback by temporarily breaking the proxy URL (typo it) and confirming the offline report still renders correctly through the exact same `report.js` UI.

### 📂 Files to Create/Modify
Create `data/skillsTaxonomy.js`, `js/offlineEngine.js`, `js/analysisController.js`; modify `analyze.html` and `js/report.js` (mode badge logic).

### 🔗 Tools/Libraries
None new — pure vanilla JS logic.

### 🧪 Testing Tasks
- Disconnect network entirely and confirm a full, sensible offline report renders
- Intentionally trigger an AI timeout and confirm automatic (not manual) fallback occurs
- Confirm the exact same `report.js` renders both AI and offline reports with no visual breakage
- Verify offline eligibility detection catches an obvious CGPA/graduation-year mismatch in test data

### 🐞 Common Issues & Debugging Tips
- **Offline scores feel too harsh/lenient:** tune category weight constants after testing 3–4 real resume/JD pairs; document your final formula in a code comment for interview-readiness.
- **Fallback doesn't trigger:** confirm `getAIAnalysis()` actually throws (not just logs) on failure — a swallowed error will prevent the catch block from running.
- **Offline and AI reports look inconsistent in tone:** keep offline `recommendations`/`whyGoodFit` text templates concise and coach-like, not robotic ("Consider highlighting your React experience more prominently" rather than "React: 0 matches").

### ✅ End-of-Day Checklist
- [ ] Offline engine produces the full locked JSON schema with real deterministic logic
- [ ] `analysisController.js` automatically falls back with no user action required
- [ ] Same report UI renders both modes correctly
- [ ] Mode badge accurately reflects which engine produced the report
- [ ] Manual full-offline test (network disabled) works end-to-end

### 📸 Expected State & Screenshots
Screenshot an offline-mode report next to an AI-mode report of the same resume/JD for comparison. Save as `day6-*.png`.

### ➡️ Handoff Notes for Day 7
The app is now fully offline-resilient — this is the core reliability guarantee of the product, complete. Next: build local storage persistence (save/list analyses) and the dashboard page.

---

# DAY 7 — Saved Analyses & Dashboard

### 🎯 Objective
Let users save completed analyses to `localStorage` and browse them on a clean dashboard — turning CareerIQ from a single-use tool into something users return to across their job search.

### 📖 What I'll Learn
- `localStorage` CRUD patterns and JSON serialization for structured data
- Building list/dashboard UIs with empty, populated, and error states
- Designing a simple, extensible local data schema (so v2 cloud sync stays possible)

### 🛠 Features to Build
- "Save Analysis" action on the report page (prompts for company name + job title if not already captured)
- `js/storage.js`: full CRUD (create, read, update status, delete) against `localStorage`
- Dashboard page (`dashboard.html`) listing all saved analyses as cards
- Application status field per saved analysis (simple: Interested / Applied / Not Applied)
- Delete individual analysis; Export All (JSON download); Delete All (with confirmation)

### 📝 Step-by-Step Implementation Plan
1. Design the storage schema in `js/storage.js`:
```json
{
  "id": "uuid",
  "companyName": "",
  "jobTitle": "",
  "dateAnalyzed": "ISO string",
  "overallFitScore": 0,
  "applyConfidenceTier": "",
  "status": "interested|applied|not_applied",
  "fullReport": { /* the entire locked JSON schema from Day 4 */ }
}
```
2. Implement `saveAnalysis(entry)`, `getAllAnalyses()`, `updateStatus(id, status)`, `deleteAnalysis(id)`, `exportAllAsJSON()`, `deleteAllAnalyses()` — all reading/writing a single `localStorage` key (e.g., `careeriq_analyses`) as a JSON array.
3. On the report page (Day 5 UI), add a "Save This Analysis" button; on click, if company/title weren't already captured during JD entry, show a small inline prompt for them, then call `saveAnalysis()`.
4. Build `dashboard.html` layout: grid of cards, each showing company, title, date, Fit Score (color-coded), status dropdown, and a "View Report" + "Delete" action.
5. Build `js/dashboard.js`: on load, call `getAllAnalyses()`, render cards; handle empty state ("No analyses yet — analyze your first job to get started" with a CTA button to `analyze.html`).
6. Wire the status dropdown on each card to call `updateStatus()` and re-render.
7. Add "Export All" (triggers a JSON file download via a Blob + temporary anchor tag) and "Delete All" (with a confirmation modal/dialog, not a bare `confirm()` — should match the design system).
8. "View Report" should re-render the full Day 5 report UI from the stored `fullReport` data (reuse `report.js`'s `renderReport()` — no duplicate rendering logic).

### 📂 Files to Create/Modify
Create `js/storage.js`, `js/dashboard.js`; build out `dashboard.html`; modify `analyze.html`/`report.js` to add the Save action.

### 🔗 Tools/Libraries
None new — native `localStorage` and Blob APIs.

### 🧪 Testing Tasks
- Save 3–5 real analyses and confirm they all persist after a page refresh
- Confirm status updates persist correctly
- Confirm delete removes only the intended entry
- Test Export All produces a valid, re-importable JSON file
- Test Delete All with confirmation flow, confirm dashboard returns to empty state
- Test `localStorage` quota isn't an issue with 10+ saved full reports (should be fine, but verify)

### 🐞 Common Issues & Debugging Tips
- **Data lost after browser cache clear:** this is expected behavior for `localStorage` — document it clearly in the UI (e.g., a small privacy note: "Your data stays on this device only — clearing browser data will remove it").
- **Duplicate saves:** guard against double-clicking "Save" by disabling the button immediately on click.
- **JSON parse errors on load:** wrap `getAllAnalyses()` in try/catch; if corrupted, don't crash the dashboard — show an error state with an option to reset storage.

### ✅ End-of-Day Checklist
- [ ] Analyses save and persist correctly across refresh
- [ ] Dashboard lists all saved analyses with working status, view, delete actions
- [ ] Empty state and populated state both look intentional, not broken
- [ ] Export All and Delete All work correctly with confirmation

### 📸 Expected State & Screenshots
Screenshot the populated dashboard (3+ cards) and the empty state. Save as `day7-*.png`.

### ➡️ Handoff Notes for Day 8
Saved analyses and the dashboard are complete and reuse the Day 5 report renderer directly — no logic duplication. Next: build the 2–3 job side-by-side comparison view using this same stored data.

---

# DAY 8 — Job Comparison & Recommended Next Action Polish

### 🎯 Objective
Build the side-by-side comparison feature (2–3 saved jobs) and finalize the Recommended Next Action feature across the whole app — completing all remaining core features before the final polish/testing/deployment days.

### 📖 What I'll Learn
- Comparative UI design patterns (side-by-side layouts, difference highlighting)
- Working with arrays of structured objects to build derived views
- Finishing feature work under deadline pressure without sacrificing quality

### 🛠 Features to Build
- Job selection UI on the dashboard (checkbox-select 2–3 analyses, "Compare Selected" button)
- `compare.html` full side-by-side comparison layout
- Comparison data: Fit Score, category scores, key strengths, missing skills, eligibility flags, Apply Confidence — all per selected job
- Visual "best fit" highlight (e.g., highest Fit Score gets a subtle badge)
- Recommended Next Action visible consistently on dashboard cards (not just the full report)

### 📝 Step-by-Step Implementation Plan
1. On `dashboard.html`, add a checkbox to each card and a sticky "Compare Selected (X/3)" button that enables once 2–3 are selected (disable selecting a 4th).
2. On click, pass selected analysis IDs to `compare.html` via `localStorage` (a temporary `careeriq_compare_selection` key) or URL query params — pick one approach and use it consistently.
3. Build `js/compare.js`: reads the selected IDs, pulls full report data via `storage.js`, renders a column-per-job layout.
4. Build `compare.html` layout: a header row (company/title/date per column), then aligned rows for Fit Score, each of the 7 category scores, top 3 strengths, top 3 missing skills, eligibility flags, and Apply Confidence tier — using a CSS grid so rows align across columns.
5. Add a "Best Fit" badge/highlight on the column with the highest Fit Score.
6. Add a "Recommended Next Action" badge to each dashboard card (Day 5 already computes this per report — just surface it in the card UI here for quick scanning).
7. Review the full app end-to-end today and list any small UX rough edges (button states, spacing, copy) to fix — keep a running "polish list" file for Day 9 rather than fixing everything ad hoc right now.

### 📂 Files to Create/Modify
Create `js/compare.js`; build out `compare.html`; modify `js/dashboard.js` (selection UI, Next Action badge) and `css/styles.css` (comparison grid, badges).

### 🔗 Tools/Libraries
None new.

### 🧪 Testing Tasks
- Select exactly 2 jobs and confirm comparison renders correctly
- Select exactly 3 jobs and confirm comparison renders correctly (no layout break)
- Attempt to select a 4th and confirm it's blocked with clear feedback
- Confirm "Best Fit" highlight correctly identifies the highest score
- Test comparison on mobile width — decide now whether to stack columns vertically on small screens or require horizontal scroll, and implement deliberately

### 🐞 Common Issues & Debugging Tips
- **Comparison grid misaligns on different content lengths:** use `align-items: start` and consistent card heights per row, or truncate long text consistently.
- **Selection state lost on navigation:** if using `localStorage` for the temporary selection, clear it after the comparison loads so stale selections don't leak into a future session.
- **Mobile comparison unreadable:** 3 columns rarely fit under ~600px — plan for horizontal scroll with visible scroll affordance, or a stacked accordion layout as an intentional mobile pattern.

### ✅ End-of-Day Checklist
- [ ] Comparison works correctly for both 2 and 3 selected jobs
- [ ] Best Fit highlighting is accurate
- [ ] Recommended Next Action visible on dashboard cards
- [ ] Mobile comparison view is a deliberate design choice, not a broken default
- [ ] Polish list documented for Day 9

### 📸 Expected State & Screenshots
Screenshot a 3-job comparison view (desktop) and the dashboard with Next Action badges visible. Save as `day8-*.png`.

### ➡️ Handoff Notes for Day 9
All core v1.0 features are now functionally complete: input, AI + offline analysis, full report with evidence/reasoning, save/dashboard, and comparison. Nothing new gets built after this point — Day 9 is dedicated entirely to testing, bug fixing, and UX/visual polish using today's polish list plus fresh end-to-end testing.

---

# DAY 9 — End-to-End Testing, Bug Fixing & UX Polish

### 🎯 Objective
Harden the entire application through systematic testing, fix every bug found, and elevate the UI from "functional" to "SaaS-quality" — this is the day that determines whether Day 10's demo feels flawless.

### 📖 What I'll Learn
- Systematic manual QA methodology (test plans, edge cases, cross-device testing)
- UI polish techniques: loading states, transitions, empty/error states, responsive fixes
- Debugging under time constraints by prioritizing high-visibility issues first

### 🛠 Features to Build
No new features today — this is a hardening and polish day only, protecting the scope lock from the PRD.

### 📝 Step-by-Step Implementation Plan
1. **Full end-to-end test pass** (do this first, before fixing anything — build a complete bug list):
   - Fresh browser session → upload real PDF resume → review/edit extracted text → paste real JD → run AI analysis → verify full report → save analysis → view on dashboard → update status → run 2nd and 3rd analyses on different jobs → compare all 3 → export data → delete one → delete all.
   - Repeat the same flow with network disabled to verify the full offline path end-to-end.
   - Repeat on a mobile-width browser window (or real device) for both flows.
2. Sort the resulting bug list by visibility/severity: broken core flow > incorrect data > visual glitch > minor copy issue.
3. Fix bugs in that priority order, re-testing each fix in isolation before moving to the next.
4. **Loading states pass:** confirm every async action (AI call, PDF parsing, save, export) has a visible, on-brand loading indicator — never a frozen-looking UI.
5. **Empty/error states pass:** confirm every list (dashboard, comparison, evidence panels) has a deliberate empty state and every failure path (parse error, AI error, storage error) has a clear, human-readable message with a next step.
6. **Transitions/micro-interactions pass:** add subtle CSS transitions (200–300ms ease) to buttons, card hovers, and panel expand/collapse — avoid anything flashy or slow.
7. **Responsive pass:** test at 375px (mobile), 768px (tablet), 1440px (desktop) widths for every page; fix any overflow, overlap, or cramped spacing.
8. **Accessibility pass:** verify color contrast on score/badge colors, confirm all interactive elements are reachable via keyboard Tab order, add `alt` text/`aria-label`s where missing.
9. **Copy pass:** read every piece of UI text out loud; fix anything robotic, unclear, or inconsistent in tone (should read like a helpful coach throughout).
10. Take a break, come back with fresh eyes, and do one final full run-through before calling the day done.

### 📂 Files to Create/Modify
Any/all files as needed based on the bug list — no new files expected.

### 🔗 Tools/Libraries
Browser DevTools (responsive mode, network throttling/offline mode, Lighthouse for a quick accessibility/performance sanity check).

### 🧪 Testing Tasks
This entire day *is* the testing task — see the step-by-step plan above. Maintain a simple bug list (a markdown checklist file `BUGLIST.md` works fine) and check items off as fixed.

### 🐞 Common Issues & Debugging Tips
- **"Just one more feature" temptation:** today is polish-only by design — if a gap feels like a missing feature rather than a bug, add it to the v2 roadmap list instead of building it now.
- **Fixing a bug introduces a new one:** re-run the full end-to-end flow after every meaningful fix, not just the specific broken step.
- **Running low on time:** prioritize the flawless-moment from the PRD's Definition of Done first (resume+JD → AI report in <30s) over secondary polish.

### ✅ End-of-Day Checklist
- [ ] Full end-to-end flow (AI mode) tested and bug-free
- [ ] Full end-to-end flow (offline mode) tested and bug-free
- [ ] Mobile responsive pass complete on all 4 pages
- [ ] All loading, empty, and error states are deliberate and polished
- [ ] Bug list fully resolved or explicitly deferred to v2 with reasoning noted

### 📸 Expected State & Screenshots
Screenshot the polished report view, dashboard, and comparison view on both desktop and mobile widths — these become your primary portfolio/LinkedIn screenshots. Save as `day9-*.png`.

### ➡️ Handoff Notes for Day 10
The application is feature-complete, tested, and polished. Nothing further should be built. Day 10 is deployment verification, documentation, and portfolio packaging only.

---

# DAY 10 — Final Deployment, Documentation & Portfolio Packaging

### 🎯 Objective
Confirm the live production deployment is flawless, write professional project documentation, and package everything for recruiters, interviews, GitHub, and LinkedIn — officially shipping CareerIQ v1.0.

### 📖 What I'll Learn
- Writing a professional technical README that documents architecture decisions
- Preparing a project for public/recruiter scrutiny
- Framing a capstone project's story for interviews and personal branding

### 🛠 Features to Build
No new features — deployment verification and documentation only.

### 📝 Step-by-Step Implementation Plan
1. **Final deployment verification:** open the live GitHub Pages URL in an incognito window (no cache, no dev tools open) and run the complete end-to-end flow one last time exactly as a first-time recruiter visitor would.
2. Confirm the Cloudflare Worker proxy is live and correctly reachable from the production GitHub Pages origin (not just `localhost`) — this is a common last-mile gap, test it explicitly.
3. Write the full `README.md`, including: project title + tagline, live demo link, problem statement (short), key features list, architecture overview (with a simple diagram — can be a clean text-based or drawn diagram embedded as an image), tech stack, screenshots, local setup instructions, how the AI-first/offline-fallback system works (this is your standout technical story), v1.0 vs v2 roadmap (pulled directly from the PRD), and credits/license.
4. Create a simple architecture diagram (a labeled box-and-arrow image showing: UI → analysisController → [AI Engine via Proxy] / [Offline Engine] → Storage/Report). This can be built as a quick diagram export and saved into `assets/screenshots/`.
5. Add a `LICENSE` file (MIT is a reasonable default for a portfolio project unless you prefer otherwise).
6. Clean up the repository: remove any console.logs used for debugging, remove dead/commented-out code, confirm folder structure matches the blueprint's target structure.
7. Final commit and push; tag the release as `v1.0` on GitHub (Releases → Draft a new release → tag `v1.0`).
8. Prepare your **LinkedIn/portfolio post**: 3–5 sentences on the problem, your approach (AI-first with offline reliability as the standout technical decision), and the live link + repo link, using your Day 9 screenshots.
9. Prepare your **interview talking points** (write these down for yourself, don't need to publish): why AI-first-with-fallback architecture, how the locked JSON schema decision made the whole build modular, what you'd build next in v2 and why you scoped it out of v1.0 — this shows product judgment, not just coding ability.
10. Do a final full read of the PRD's Definition of Done checklist (§9) and confirm every single item is genuinely, honestly complete.

### 📂 Files to Create/Modify
Finalize `README.md`, add `LICENSE`, clean all JS/HTML/CSS files, add architecture diagram to `assets/screenshots/`.

### 🔗 Tools/Services
GitHub Releases (tagging v1.0).

### 🧪 Testing Tasks
- Full incognito-window end-to-end test on the live production URL (AI mode)
- Full incognito-window end-to-end test on the live production URL with network disabled (offline mode)
- Click every link in the README (demo link, any anchor links) to confirm none are broken
- Have one other person (friend/classmate) run through the live app with zero guidance from you and note anywhere they get confused

### 🐞 Common Issues & Debugging Tips
- **Works on localhost but not on GitHub Pages:** almost always a relative-path or CORS issue specific to the production origin — this is exactly why step 2 tests the live proxy connection explicitly today, not just locally.
- **README screenshots broken:** use relative paths from the README's location (`assets/screenshots/...`) and confirm they render correctly on GitHub's own file preview, not just locally.
- **Last-minute nerves to add "just one more feature":** resist — the PRD's Definition of Done is the finish line; anything beyond it goes on the v2 roadmap slide instead.

### ✅ End-of-Day Checklist
- [ ] Live production app fully tested end-to-end in both AI and offline modes, incognito
- [ ] Professional README complete with architecture explanation, screenshots, setup instructions, roadmap
- [ ] Repository cleaned, LICENSE added, `v1.0` tagged as a GitHub Release
- [ ] LinkedIn/portfolio post drafted
- [ ] Every item in the PRD's Day 10 Definition of Done confirmed complete

### 📸 Expected State & Screenshots
Final hero screenshot for LinkedIn (polished report view), README as rendered on GitHub, and the GitHub Releases page showing `v1.0`. Save as `day10-*.png`.

### ➡️ Project Status at Completion
**CareerIQ v1.0 is live, documented, and portfolio-ready.** All PRD-scoped features are complete: PDF/text resume input, AI-first analysis with automatic offline fallback, full evidence-backed coach report with reasoning transparency, Apply Confidence Meter, Recommended Next Action, saved analyses dashboard, and 2–3 job comparison — deployed on GitHub Pages with a professional, interview-ready repository. The v2 roadmap (job board integration, analytics dashboard, favorites, full application pipeline, version history, hybrid rule+AI engine) is clearly documented for future development and forms the forward-looking close of the pitch deck.

---

## 🗓️ Day 2 Addendum — System Design Completed

Day 2 produced five companion documents that are now equally binding as this blueprint: `ARCHITECTURE.md`, `SCHEMA.md`, `API.md`, `UI-WIREFRAMES.md`, `PROJECT-STRUCTURE.md`. No conflicts were found between today's design work and the plan above — every Day 3–10 file target, JSON schema field, and feature scope described here was validated against those documents and confirmed unchanged. Two clarifications worth carrying forward into Day 3+ prompts:

- **`analyze.html` renders the report inline** (no separate `report.html`) — confirmed and documented in `UI-WIREFRAMES.md` §2, consistent with Day 5's plan.
- **Mobile comparison behavior is now decided in advance** (horizontal scroll with a swipe affordance, not a stacked accordion) — see `UI-WIREFRAMES.md` §4 — so Day 8 no longer needs to make this call live.

Repository is live at `github.com/ananyasingla529-bit/CareerIQ`, cloned locally, and scaffolded with the full target folder structure and empty placeholder files for every module listed below. Day 3 can begin writing real code immediately with zero setup overhead.

---

## 🗓️ Day 3 Addendum — Foundation Complete, Day-Numbering Clarified

Today's capstone "Day 3" covered environment setup, local project running, and foundation code (`css/styles.css`, `js/app.js`, and real `index.html` content) — this was necessarily separate from this Blueprint's originally-numbered "Day 3" (resume input feature), since a working local environment had to exist before any feature could be built or tested.

**No scope, timeline, or feature content has changed.** This is purely a labeling clarification: this Blueprint's **"Day 3" section (Resume Input: Upload, Parsing & Job Description Entry)** is what gets built on the **capstone's Day 4**, and every subsequent Blueprint day shifts forward by one capstone day in the same way. The Blueprint's internal day *numbers and content* below remain the single source of truth for *what* gets built and in *what order* — only the calendar-day label shifts by one. Total remaining build days (9 more capstone days after Day 1) is unaffected.

**Quick mapping for reference:**

| Capstone Day | Builds Blueprint Section |
|---|---|
| Day 3 (done) | Foundation setup (not a numbered Blueprint section — environment + `app.js`/`styles.css`) |
| Day 4 | Blueprint "Day 3" — Resume Input |
| Day 5 | Blueprint "Day 4" — AI Analysis Engine |
| Day 6 | Blueprint "Day 5" — Report UI |
| Day 7 | Blueprint "Day 6" — Offline Engine & Fallback |
| Day 8 | Blueprint "Day 7" — Saved Analyses & Dashboard |
| Day 9 | Blueprint "Day 8" — Comparison & Next Action Polish |
| Day 10 | Blueprint "Day 9" — Testing & Polish |
| *(Day 11 if needed)* | Blueprint "Day 10" — Final Deployment |

**Note:** this pushes final deployment to a potential capstone Day 11 if each Blueprint day takes a full calendar day. Given the 3–4 hr/day budget and that today's foundation work absorbed some of Blueprint Day 2's original scope already, the recommendation is to **treat Blueprint Days 9 and 10 (Testing/Polish and Final Deployment) as a single combined capstone Day 10** if time allows, keeping the original 10-day finish line — this will be assessed for real on the day itself based on actual pace, not decided prematurely today.

Repository confirmed running locally with zero errors. All foundation code verified against `ARCHITECTURE.md` and `PROJECT-STRUCTURE.md` with no drift. Day 4 (Blueprint's "Day 3") can begin immediately.

---

## 📋 Quick-Reference: Locked Decisions (do not revisit without explicit reason)

| Decision | Locked Choice |
|---|---|
| Stack | Vanilla HTML/CSS/JS, no framework, no build tools |
| Resume input | PDF (primary, via PDF.js) + plain text (secondary) |
| AI model | Claude API (`claude-sonnet-4-6`) via Cloudflare Worker proxy |
| Offline fallback | Automatic, rule-based, same JSON schema as AI path |
| Storage | `localStorage` only, no backend, no accounts |
| Comparison | 2–3 saved jobs, side by side |
| Deployment | GitHub Pages |
| Out of scope (v2) | Live job board integration, analytics dashboard, favorites/search/filter, full application pipeline, version history, DOCX parsing, cloud sync |
