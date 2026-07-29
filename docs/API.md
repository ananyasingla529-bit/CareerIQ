# CareerIQ — API Design
**Day 2 Deliverable — No implementation yet, contract definitions only**

CareerIQ has **one real network endpoint** (the Cloudflare Worker proxy). Everything else in the product is a client-side JavaScript module contract — there is no REST backend for resumes, jobs, or users, because the PRD's architecture is intentionally local-storage-only for v1.0. To make this document genuinely useful for implementation, it treats each internal module's public functions as an "API" with the same rigor (purpose, request, response, validation, error cases) as the real HTTP endpoint — since these module contracts are exactly what Days 4–8 will implement against.

---

## Part A — Real Network Endpoint

### `POST /analyze` (Cloudflare Worker)

**Purpose:** Receives resume + JD text from the browser, forwards a structured prompt to the Claude API using the server-side secret key, and returns the AI's structured JSON report — without ever exposing the API key to the client.

**Request**
```
POST https://<your-worker-subdomain>.workers.dev/analyze
Content-Type: application/json

{
  "resumeText": "string (required, min 50 chars)",
  "jdText": "string (required, min 100 chars)"
}
```

**Response — Success (200)**
```json
{
  "success": true,
  "data": { "...": "AnalysisReport object — see SCHEMA.md, analysisMode: 'ai'" }
}
```

**Response — Failure (4xx/5xx)**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT | UPSTREAM_TIMEOUT | UPSTREAM_ERROR | RATE_LIMITED | MALFORMED_AI_RESPONSE",
    "message": "human-readable string"
  }
}
```

**Validation (server-side, in the Worker)**
- Reject if `resumeText` or `jdText` missing or below minimum length → `400 INVALID_INPUT`
- Reject requests without a JSON `Content-Type` → `400 INVALID_INPUT`
- Enforce a basic rate limit per IP if abuse is detected (optional hardening, not required for v1.0 demo scale)

**Authentication**
- No end-user authentication (v1.0 has no accounts).
- The Anthropic API key is authenticated **server-side only**, stored as a Cloudflare Worker secret, attached to the outbound Claude API call. It is never present in any request or response the browser sees.
- CORS restricted to the GitHub Pages origin in production (`Access-Control-Allow-Origin: https://<username>.github.io`).

**Error Cases**
| Code | Meaning | Client Behavior |
|---|---|---|
| `INVALID_INPUT` | Missing/too-short resume or JD text | Should not occur if client-side validation (Day 3) works correctly; treated as a bug if seen |
| `UPSTREAM_TIMEOUT` | Claude API did not respond within the Worker's internal timeout | `aiEngine.js` treats as `AIServiceError` → triggers offline fallback |
| `UPSTREAM_ERROR` | Claude API returned a non-200 (outage, invalid request) | Same — triggers offline fallback |
| `RATE_LIMITED` | Anthropic account rate limit hit | Same — triggers offline fallback; optionally shown as a distinct "high demand, using offline mode" message |
| `MALFORMED_AI_RESPONSE` | Claude responded but output failed JSON schema validation | Same — triggers offline fallback |
| Network failure (no response at all) | Client-side `fetch` throws before any status code | `aiEngine.js` catches directly → triggers offline fallback |

---

## Part B — Internal Module Contracts (Client-Side "APIs")

These are not network calls — they are the JavaScript function signatures each day's implementation must satisfy. Documented with the same rigor since they are the actual interfaces between modules.

### B1. `aiEngine.js` — `getAIAnalysis(resumeText, jdText)`
- **Purpose:** Primary analysis path; wraps the network call to the Worker.
- **Request (function params):** `resumeText: string`, `jdText: string`
- **Response:** `Promise<AnalysisReport>` (resolves) — see SCHEMA.md
- **Validation:** Throws synchronously if params are empty before attempting network call (defensive; UI-layer validation should already prevent this)
- **Auth:** None at this layer — handled entirely by the Worker
- **Error Cases:** Throws `AIServiceError` (custom error class) on timeout (>25s), network failure, non-200 response, or JSON schema validation failure. Never returns a partially-valid object — it's all-or-nothing.

### B2. `offlineEngine.js` — `generateOfflineReport(resumeText, jdText)`
- **Purpose:** Deterministic fallback analysis path.
- **Request:** `resumeText: string`, `jdText: string`
- **Response:** `AnalysisReport` (synchronous or near-synchronous — no network call, so no Promise strictly required, but kept `async` for interface consistency with `getAIAnalysis`)
- **Validation:** Same minimum-length checks as B1, for defensive consistency
- **Auth:** None
- **Error Cases:** Should not throw under normal operation (it's local, deterministic logic) — this function is the guaranteed "always succeeds" path, which is precisely why it's the fallback.

### B3. `analysisController.js` — `runAnalysis(resumeText, jdText)`
- **Purpose:** Single orchestration entry point the UI calls — decides AI vs. offline, never exposes that decision complexity to `analyze.html`.
- **Request:** `resumeText: string`, `jdText: string`
- **Response:** `Promise<AnalysisReport>` — always resolves (never rejects) because the offline fallback guarantees a result
- **Validation:** Delegates to B1/B2
- **Auth:** None
- **Error Cases:** By design, this function should never throw to its caller — any AI failure is caught internally and silently redirected to the offline path, with only the `analysisMode` field telling the UI which path was taken.

### B4. `storage.js` — `saveAnalysis(entry)`
- **Purpose:** Persist a completed analysis to `localStorage`.
- **Request:** `entry: { companyName, jobTitle, overallFitScore, applyConfidenceTier, fullReport }` (id, dateAnalyzed, status auto-generated)
- **Response:** `{ success: true, id: string }` or `{ success: false, error: string }`
- **Validation:** Runs full schema validation (SCHEMA.md §5) before writing; rejects if `fullReport` is missing required fields
- **Auth:** None
- **Error Cases:** `localStorage` quota exceeded (unlikely at v1.0 scale, but handled) → returns `success: false`; malformed `entry` → returns `success: false` without writing

### B5. `storage.js` — `getAllAnalyses()`
- **Purpose:** Retrieve all saved analyses for the dashboard.
- **Request:** none
- **Response:** `Analysis[]` (empty array if none saved, never `null`/`undefined`)
- **Validation:** N/A (read-only)
- **Auth:** None
- **Error Cases:** Corrupted `localStorage` JSON → caught internally, returns `[]` and logs a warning rather than crashing the dashboard

### B6. `storage.js` — `updateStatus(id, status)`
- **Purpose:** Update the application-tracking status of a saved analysis.
- **Request:** `id: string`, `status: "interested" | "applied" | "not_applied"`
- **Response:** `{ success: boolean }`
- **Validation:** `status` must be one of the 3 enum values; `id` must exist in storage
- **Auth:** None
- **Error Cases:** `id` not found → `success: false`, no-op

### B7. `storage.js` — `deleteAnalysis(id)` / `deleteAllAnalyses()`
- **Purpose:** Remove one or all saved analyses.
- **Request:** `id: string` (for single delete)
- **Response:** `{ success: boolean }`
- **Validation:** `id` must exist for single delete
- **Auth:** None (UI-level confirmation dialog is the only safeguard, per Day 7 plan)
- **Error Cases:** `id` not found → `success: false`, no-op

### B8. `storage.js` — `exportAllAsJSON()`
- **Purpose:** Produce a downloadable JSON file of all saved analyses (privacy/data-portability feature).
- **Request:** none
- **Response:** Triggers a browser file download; returns `{ success: boolean }`
- **Validation:** N/A
- **Auth:** None
- **Error Cases:** No data to export → still generates a valid empty-array JSON file rather than failing

### B9. `pdfParser.js` — `extractTextFromPDF(file)`
- **Purpose:** Client-side PDF text extraction.
- **Request:** `file: File` (from file input or drag-drop)
- **Response:** `Promise<string>` (extracted text)
- **Validation:** File must be `application/pdf` MIME type; rejected otherwise before attempting extraction
- **Auth:** None
- **Error Cases:** Corrupted PDF, image-only/scanned PDF (near-empty extraction), or unsupported PDF version → throws `PDFParseError`, caught by the UI layer to trigger the plain-text-paste fallback (per Day 3 plan)

---

## Summary Table — All v1.0 "Endpoints"

| # | Endpoint / Function | Type | Auth | Primary Consumer |
|---|---|---|---|---|
| A1 | `POST /analyze` | Real HTTP (Cloudflare Worker) | Server-side key only | `aiEngine.js` |
| B1 | `getAIAnalysis()` | Internal JS | None | `analysisController.js` |
| B2 | `generateOfflineReport()` | Internal JS | None | `analysisController.js` |
| B3 | `runAnalysis()` | Internal JS | None | `analyze.html` |
| B4 | `saveAnalysis()` | Internal JS | None | Report page ("Save" button) |
| B5 | `getAllAnalyses()` | Internal JS | None | `dashboard.js`, `compare.js` |
| B6 | `updateStatus()` | Internal JS | None | `dashboard.js` |
| B7 | `deleteAnalysis()` / `deleteAllAnalyses()` | Internal JS | None | `dashboard.js` |
| B8 | `exportAllAsJSON()` | Internal JS | None | `dashboard.js` |
| B9 | `extractTextFromPDF()` | Internal JS | None | `analyze.html` (upload flow) |

This is the complete v1.0 interface surface — no additional endpoints are needed to satisfy any PRD functional requirement.
