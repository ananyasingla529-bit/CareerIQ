# CareerIQ — Environment Configuration
**All tools, variables, and configuration values used across the project.**

---

## 1. Local Development — No Environment Variables Required

CareerIQ's frontend is a **static site** — plain HTML/CSS/JS with no build step — so there is no `.env` file, no local secrets, and nothing to configure to run the app on your machine today. This is intentional per the PRD's architecture and keeps Day 3 setup friction at zero.

---

## 2. Tools Installed Today (Day 3)

| Tool | Version Installed | Where It Runs | Required For |
|---|---|---|---|
| VS Code | Latest | Local machine | Editing all project files |
| Live Server extension | 5.7.10 (Ritwick Dey) | Local machine, inside VS Code | Serving the site locally at `127.0.0.1:5500` |
| Node.js | v24.18.1 (LTS) | Local machine | Running verification/utility scripts only — not a build dependency |
| Git | Already installed (Day 2) | Local machine | Version control |

---

## 3. Configuration Set Up on Day 5 (AI Analysis Engine)

**Adaptation note:** the PRD/Blueprint originally planned the Anthropic Claude API as the primary AI engine. Since the Claude API requires billing and this session required free tools only, **Google Gemini API** was substituted — a genuinely free-tier AI provider. This only changed the concrete implementation inside `js/aiEngine.js` and the Worker; the architecture, JSON schema, and every downstream file are unaffected (see `DAY5-SUMMARY.md` for full detail).

| Variable / Secret | Where It Lives | Set On | Purpose |
|---|---|---|---|
| `GEMINI_API_KEY` | Cloudflare Worker **secret** (server-side only — never in this repo, never in any committed file) | Day 5 | Authenticates the Worker's server-side calls to the Gemini API |
| Worker deployment URL: `https://black-river-885d.ananyasingla529.workers.dev` | Hardcoded as a constant inside `js/aiEngine.js` (public, safe to expose — it's just an endpoint address, not a credential) | Day 5 | Tells the browser where to send analysis requests |
| Gemini model | `gemini-flash-latest` (Google's self-updating alias — chosen specifically to avoid breakage when Google retires specific model versions, which happened multiple times during today's setup) | Day 5 | The AI model used for analysis |

**Why this matters for security:** the Gemini API key must never appear in any file inside this Git repository, because the repository is public and GitHub Pages serves these files directly to anyone's browser. The Cloudflare Worker is the *only* place this key will ever exist, configured directly in the Cloudflare dashboard as an encrypted secret — never committed to version control. `.gitignore` already excludes common secret-file patterns as a safety net, even though our architecture doesn't use local `.env` files at all.

---

## 4. Browser Requirements

No special configuration needed — the app targets modern evergreen browsers (Chrome, Edge, Firefox, Safari, all recent versions) using standard ES6+ JavaScript, CSS custom properties, and the Fetch API. No polyfills or transpilation required, consistent with the no-build-tools architecture decision.

---

## 5. Deployment Environment (Reference — Built on Day 10)

| Environment | Host | URL Pattern | Configured |
|---|---|---|---|
| Production | GitHub Pages | `https://ananyasingla529-bit.github.io/CareerIQ/` | Day 10 |
| AI Proxy | Cloudflare Workers | `https://<worker-name>.<subdomain>.workers.dev/analyze` | Day 5 |

No staging environment is planned for v1.0 — consistent with the PRD's lean, single-environment scope for a 10-day capstone.
