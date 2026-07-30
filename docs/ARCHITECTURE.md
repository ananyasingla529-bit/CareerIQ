# CareerIQ — System Architecture
**Day 2 Deliverable — Source of truth for all technical structure decisions**

---

## 1. Architecture Overview

CareerIQ is a **static, client-heavy web application** with exactly one server-side component: a serverless proxy that hides the Claude API key. Everything else — UI rendering, PDF parsing, offline analysis, data storage, comparison logic — runs entirely in the user's browser. This directly satisfies the PRD's offline-first and privacy-by-design principles: the app shell never depends on a live backend to function.

**Architecture style:** Static frontend + single serverless function (Backend-for-Frontend pattern, minimal).

---

## 2. Component Diagram

```mermaid
graph TB
    subgraph "User's Browser (Client)"
        UI[UI Layer<br/>index / analyze / dashboard / compare .html]
        APP[app.js<br/>Shared nav & init]
        PARSER[pdfParser.js<br/>PDF.js wrapper]
        CTRL[analysisController.js<br/>Orchestration]
        AIENG[aiEngine.js<br/>Claude API client]
        OFFENG[offlineEngine.js<br/>Rule-based engine]
        TAXO[skillsTaxonomy.js<br/>Skill dictionary]
        REPORT[report.js<br/>Report renderer]
        STORAGE[storage.js<br/>localStorage CRUD]
        DASH[dashboard.js]
        COMP[compare.js]
        LS[(localStorage)]
    end

    subgraph "Cloudflare (Serverless)"
        WORKER[Cloudflare Worker<br/>proxy/cloudflare-worker.js]
        SECRET[(API Key<br/>stored as Worker secret)]
    end

    subgraph "External Service"
        CLAUDE[Anthropic Claude API<br/>claude-sonnet-4-6]
    end

    UI --> APP
    UI --> PARSER
    UI --> CTRL
    CTRL --> AIENG
    CTRL --> OFFENG
    OFFENG --> TAXO
    AIENG -->|HTTPS POST| WORKER
    WORKER --> SECRET
    WORKER -->|HTTPS POST| CLAUDE
    CLAUDE -->|JSON response| WORKER
    WORKER -->|JSON response| AIENG
    CTRL --> REPORT
    REPORT --> STORAGE
    STORAGE --> LS
    DASH --> STORAGE
    COMP --> STORAGE

    style WORKER fill:#173F3D,stroke:#3FD0C9,color:#fff
    style CLAUDE fill:#1E2761,stroke:#3FD0C9,color:#fff
    style LS fill:#4A3B12,stroke:#F9E795,color:#fff
```

**Key architectural decision — why the proxy exists:** GitHub Pages serves static files only; any API key embedded in client JS would be publicly visible in the page source. The Cloudflare Worker is the *only* place the Anthropic API key ever exists, stored as an encrypted Worker secret, never in a repository file.

---

## 3. Data Flow — Primary Analysis Journey

```mermaid
sequenceDiagram
    actor User
    participant UI as analyze.html
    participant Parser as pdfParser.js
    participant Ctrl as analysisController.js
    participant AI as aiEngine.js
    participant Worker as Cloudflare Worker
    participant Claude as Claude API
    participant Offline as offlineEngine.js
    participant Report as report.js
    participant Storage as storage.js

    User->>UI: Upload PDF resume
    UI->>Parser: extractTextFromPDF(file)
    Parser-->>UI: extracted text (editable)
    User->>UI: Review/edit text, paste JD
    User->>UI: Click "Analyze"
    UI->>Ctrl: runAnalysis(resumeText, jdText)
    Ctrl->>AI: getAIAnalysis(resumeText, jdText)
    AI->>Worker: POST /analyze { resumeText, jdText }
    Worker->>Claude: POST /v1/messages (with secret key)

    alt AI call succeeds
        Claude-->>Worker: structured JSON report
        Worker-->>AI: structured JSON report
        AI-->>Ctrl: report (analysisMode: "ai")
    else AI call fails (timeout / rate limit / offline)
        Claude--xWorker: error / no response
        Worker--xAI: error
        AI--xCtrl: throws AIServiceError
        Ctrl->>Offline: generateOfflineReport(resumeText, jdText)
        Offline-->>Ctrl: report (analysisMode: "offline")
    end

    Ctrl->>Report: renderReport(report)
    Report-->>User: Full coach-style report displayed
    User->>Report: Click "Save Analysis"
    Report->>Storage: saveAnalysis(entry)
    Storage->>Storage: write to localStorage
```

---

## 4. Request Lifecycle — AI Analysis Call

```mermaid
flowchart TD
    A[User clicks Analyze] --> B{Input valid?<br/>resume + JD present}
    B -->|No| C[Show validation message<br/>Analyze button stays disabled]
    B -->|Yes| D[Show loading state:<br/>'Analyzing your fit...']
    D --> E[aiEngine.js sends POST to<br/>Cloudflare Worker]
    E --> F{Response within<br/>25s timeout?}
    F -->|No| G[Throw AIServiceError: timeout]
    F -->|Yes| H{HTTP 200 +<br/>valid JSON schema?}
    H -->|No| I[Throw AIServiceError: malformed response]
    H -->|Yes| J[Return structured report<br/>analysisMode: 'ai']
    G --> K[analysisController catches error]
    I --> K
    K --> L{Retry once<br/>already attempted?}
    L -->|No| E
    L -->|Yes| M[Fallback to offlineEngine.js<br/>generateOfflineReport]
    M --> N[Return structured report<br/>analysisMode: 'offline']
    J --> O[report.js renders full UI]
    N --> O
    O --> P[User sees complete report<br/>with correct mode badge]
```

---

## 5. AI Interaction Design

**Prompt strategy:** `aiEngine.js` sends the raw resume text and JD text to the Worker along with a system instruction telling Claude to act as an expert career coach and return **only** valid JSON matching the locked schema (see `SCHEMA.md`) — no markdown fences, no preamble text.

**Reliability layer around the AI call:**
- 25-second client-side timeout
- One automatic retry on network/timeout failure
- Strict JSON-shape validation on the client before accepting the response as valid
- Any failure at any of these stages triggers the offline fallback automatically — the user never sees a raw error

**Why this satisfies "Transparent AI" (PRD architecture principle):** the same prompt explicitly requires a `reasoning[]` array (explanation + confidence per conclusion) and evidence pointers back into the source text, so the AI's output is inherently structured for the Reasoning Panel and Evidence Panel — no separate "explain yourself" call is needed.

---

## 6. External Services

| Service | Purpose | Cost | Failure Handling |
|---|---|---|---|
| **Anthropic Claude API** | Primary analysis reasoning engine | Free tier / pay-as-you-go (routed through your own Anthropic account) | Automatic offline fallback (see §4) |
| **Cloudflare Workers** | Serverless proxy hiding the API key | Free tier (100k req/day) | If Worker itself is unreachable, same fallback path triggers |
| **GitHub Pages** | Static site hosting | Free | N/A — this *is* the app; no external dependency once loaded |
| **PDF.js (CDN)** | Client-side PDF parsing | Free, no key required | Parse failure → graceful UI fallback to plain-text paste (no dependency on this service for offline mode) |
| **Chart.js (CDN)** | Category breakdown visualization | Free, no key required | If CDN fails to load, category data still displays as plain text/numbers (progressive enhancement) |

---

## 7. Modularity & Future Extensibility

The architecture is deliberately layered so v2 features (PRD §5.2) can be added without touching unrelated modules:

- **New AI provider?** Only `aiEngine.js` changes — `analysisController.js`'s contract (`report JSON in, same shape out`) stays identical.
- **Cloud sync?** Only `storage.js` changes internally (swap `localStorage` calls for API calls) — every module that calls `storage.js` (`report.js`, `dashboard.js`, `compare.js`) is unaffected.
- **New analysis modules (e.g., rule+AI hybrid merge)?** Slot into `analysisController.js` as a third path alongside AI/offline, without altering `report.js`'s rendering contract.
- **Backend migration (Netlify/Vercel)?** Only the Worker/proxy layer and hosting config change — the entire client-side app is host-agnostic static files.

This is the concrete implementation of the PRD's "Modular & Scalable Architecture" and "Future-Ready Roadmap" requirements.
