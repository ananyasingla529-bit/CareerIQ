# CareerIQ — Day 5 Summary
**AI Analysis Engine**
(Corresponds to Blueprint's "Day 4" section — see Day 3's addendum for day-numbering mapping)

---

## ⚠️ Architecture Adaptation: Free AI Provider Instead of Claude API

Today's plan required flagging an important adaptation before any code was written: **the Anthropic Claude API requires billing** and is not a free tool, so building today's AI engine against it directly would have violated the explicit "free tools only" requirement for this session.

**Resolution:** Since `aiEngine.js` was always the single, isolated point of AI-provider integration (per `ARCHITECTURE.md` §7's modularity principle), swapping providers required no architectural changes — only the concrete implementation inside `aiEngine.js` and the Cloudflare Worker. **Google Gemini API** was selected: genuinely free tier, no credit card required, and strong structured-JSON output. The locked `AnalysisReport` JSON schema (`SCHEMA.md`) is completely unaffected — every downstream file (report UI, storage, comparison) will consume identical data regardless of which AI produced it.

**Documentation impact:** `ENVIRONMENT.md` §3 (previously noted `ANTHROPIC_API_KEY` as the planned Day 5 secret) needs updating to `GEMINI_API_KEY` — see the Documentation Updates section below.

---

## ✅ What Was Built Today

### Milestone 1 — Free API Key
- Created a Google AI Studio account and generated a free Gemini API key
- Practiced good security hygiene: an accidentally-screenshotted key was immediately revoked and regenerated

### Milestone 2 — Cloudflare Worker Proxy
- Created a free Cloudflare account and deployed a Worker (`black-river-885d.ananyasingla529.workers.dev`)
- Stored the Gemini API key as an encrypted Worker **secret** (`GEMINI_API_KEY`) — never committed to the repository, never visible to the browser
- Wrote `proxy/cloudflare-worker.js`: validates incoming requests, forwards a structured prompt to Gemini, parses and validates the response against the locked JSON schema, returns a consistent `{ success, data }` / `{ success, error }` contract with CORS handling

### Milestone 3 — Client-Side AI Engine
- Built `js/aiEngine.js`: `getAIAnalysis(resumeText, jdText)` — calls the proxy with a 27s timeout, validates the response shape defensively (defense in depth alongside the Worker's own validation), throws a typed `AIServiceError` on any failure
- Wired the real AI call into `analyze.html`'s Analyze button (replacing yesterday's placeholder alert), with a loading state and a temporary result display (full styled report UI is tomorrow's work)

---

## 🐞 Issues Encountered & Resolved

Google has retired/renamed Gemini models multiple times recently (a known, actively-discussed issue in their developer community). We hit this directly:

1. First attempt: `gemini-1.5-flash` → **404** (model retired)
2. Second attempt: `gemini-2.5-flash-lite` → **404** (wrong exact name)
3. Third attempt: `gemini-2.5-flash` → **404**, with a very clear Google error message: *"This model...is no longer available to new users. Please update your code to use a newer model."*
4. **Final fix:** switched to **`gemini-flash-latest`** — Google's official, non-versioned alias that always points to whichever Flash model is currently recommended. This is the *robust* choice: it won't break again the next time Google retires a specific model version, which directly protects tomorrow's and future days' work from repeating this debugging cycle.

Also improved the Worker's error handling mid-debugging to surface Gemini's actual error text back to the UI — this was what let us diagnose the exact 404 cause in one step instead of guessing further, and stays in the code permanently as a genuine reliability improvement (easier debugging if this ever happens again).

---

## Verification Checklist
- [x] Cloudflare Worker deployed and reachable
- [x] Gemini API key stored securely as a Worker secret (never in repo)
- [x] Full pipeline (browser → Worker → Gemini → browser) works end-to-end
- [x] AI response validated against the locked JSON schema on both server and client
- [x] Real, varying Fit Scores confirmed across two different job descriptions (not cached/static)
- [x] Loading state displays during the ~15-20s AI call
- [x] All Day 3 and Day 4 functionality re-verified working (home page, nav, placeholder pages, resume upload, JD input)

---

## 📄 Documentation Updates Required
`ENVIRONMENT.md` §3 should be updated: replace `ANTHROPIC_API_KEY` (Cloudflare Worker secret) with `GEMINI_API_KEY`, and note the Worker URL is `black-river-885d.ananyasingla529.workers.dev`. (Full updated file provided alongside this summary.)

---

## 🚧 Ready for Tomorrow (Day 6)
The AI engine is fully functional and returns real, validated, schema-compliant reports. Nothing is blocking Day 6.

## 🎯 Day 6 Objective
Build the **full styled Report UI** (Blueprint's "Day 5"): Fit Score hero, category breakdown chart, Evidence Panel, AI Reasoning Panel, Apply Confidence Meter, and Recommended Next Action badge — replacing today's temporary plain-text result card with the polished "career coach" experience defined in the PRD.
