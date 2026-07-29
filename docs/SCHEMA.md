# CareerIQ — Data Schema
**Day 2 Deliverable — Source of truth for all stored data structures**

CareerIQ has no traditional database. All persistent data lives in the browser's `localStorage` as JSON, managed exclusively through `js/storage.js`. This document defines every data structure as if it were a database schema, so the design is rigorous and portable to a real database in v2 without rethinking the shape.

---

## 1. Storage Overview

| Storage Key | Purpose | Written By | Read By |
|---|---|---|---|
| `careeriq_analyses` | Array of all saved analyses (the core "table") | `storage.js` | `dashboard.js`, `compare.js`, `report.js` |
| `careeriq_compare_selection` | Temporary array of IDs selected for comparison | `dashboard.js` | `compare.js` (cleared after read) |
| `careeriq_user_prefs` | Lightweight local preferences (e.g., dismissed tooltips) — optional, v1.0 minimal use | `app.js` | `app.js` |

---

## 2. Core Entity: `Analysis`

This is the primary "table" — one record per saved resume-vs-JD analysis.

```json
{
  "id": "uuid-v4-string",
  "companyName": "string",
  "jobTitle": "string",
  "dateAnalyzed": "ISO 8601 string",
  "overallFitScore": 0,
  "applyConfidenceTier": "apply_now | improve_first | borderline | upskill_first",
  "status": "interested | applied | not_applied",
  "fullReport": { "...": "see AnalysisReport entity below" }
}
```

### Field Definitions & Constraints

| Field | Type | Required | Constraints |
|---|---|---|---|
| `id` | string (UUID v4) | Yes | Primary key. Generated client-side on save (`crypto.randomUUID()`). Must be unique within the array. |
| `companyName` | string | Yes | 1–100 characters. Captured via prompt if not entered during JD input. |
| `jobTitle` | string | Yes | 1–150 characters. |
| `dateAnalyzed` | string (ISO 8601) | Yes | Set automatically at save time; immutable after creation. |
| `overallFitScore` | integer | Yes | Range: 0–100. Denormalized copy of `fullReport.overallFitScore` for fast dashboard list rendering without deep object access. |
| `applyConfidenceTier` | enum string | Yes | One of the 4 fixed values. Denormalized from `fullReport.applyConfidence.tier` for the same performance reason. |
| `status` | enum string | Yes | Defaults to `"interested"` on save. User-editable via dashboard dropdown. |
| `fullReport` | object (`AnalysisReport`) | Yes | The complete locked AI/offline output — see entity below. Never mutated after save (immutability preserves the "what did the AI actually say" record). |

**Relationship:** One `Analysis` record embeds exactly one `AnalysisReport` object (1:1, embedded — not normalized, since `localStorage` has no join capability and this data is never queried independently of its parent analysis).

---

## 3. Embedded Entity: `AnalysisReport`

This is the exact locked JSON contract produced by **both** `aiEngine.js` and `offlineEngine.js` — the single shape `report.js` renders, regardless of which engine produced it.

```json
{
  "overallFitScore": 0,
  "analysisMode": "ai | offline",
  "categoryScores": {
    "technicalSkills": 0,
    "experience": 0,
    "education": 0,
    "projects": 0,
    "softSkills": 0,
    "eligibility": 0,
    "keywords": 0
  },
  "strengths": [
    { "point": "string", "evidenceResume": "string", "evidenceJD": "string" }
  ],
  "gaps": [
    { "point": "string", "evidenceJD": "string", "severity": "minor | major" }
  ],
  "eligibilityFlags": [
    { "issue": "string", "evidenceJD": "string", "isHardBlocker": true }
  ],
  "recommendations": ["string"],
  "whyGoodFit": ["string"],
  "applyConfidence": {
    "tier": "apply_now | improve_first | borderline | upskill_first",
    "label": "string"
  },
  "recommendedAction": "apply_now | improve_resume | learn_skills | save_for_later | not_a_match",
  "reasoning": [
    { "conclusion": "string", "explanation": "string", "confidence": "high | medium | low" }
  ]
}
```

### Field Definitions & Constraints

| Field | Type | Required | Constraints |
|---|---|---|---|
| `overallFitScore` | integer | Yes | 0–100. |
| `analysisMode` | enum string | Yes | `"ai"` or `"offline"`. Drives the mode badge in the UI. |
| `categoryScores.*` | integer (×7) | Yes, all 7 | Each 0–100. All seven PRD-defined categories must be present — missing any one fails schema validation (see §5). |
| `strengths[]` | array of objects | Yes (may be empty) | Each item requires `point`; `evidenceResume`/`evidenceJD` may be empty strings if not applicable but keys must exist. |
| `gaps[]` | array of objects | Yes (may be empty) | `severity` constrained to `minor`/`major`. |
| `eligibilityFlags[]` | array of objects | Yes (may be empty) | `isHardBlocker: true` items render with the red/hard-blocker treatment; `false` items render as soft flags. |
| `recommendations[]` | array of strings | Yes (may be empty) | Free text, coach-toned. |
| `whyGoodFit[]` | array of strings | Yes | 3–5 items per PRD requirement (enforced by prompt instruction for AI mode; enforced by template logic in offline mode). |
| `applyConfidence.tier` | enum string | Yes | Maps directly to PRD's 4 score bands (80–100 / 60–79 / 40–59 / <40). |
| `applyConfidence.label` | string | Yes | Human-readable label matching the tier (e.g., "Apply Now"). |
| `recommendedAction` | enum string | Yes | One of the 5 PRD-defined actions. |
| `reasoning[]` | array of objects | Yes (may be empty in offline mode edge cases, but should generally be populated) | Powers the AI Reasoning Panel; `confidence` constrained to 3 values. |

---

## 4. Temporary Entity: `CompareSelection`

```json
{
  "selectedIds": ["uuid-1", "uuid-2", "uuid-3"]
}
```

Written by `dashboard.js` when the user clicks "Compare Selected," read once by `compare.js` on page load, then deleted from `localStorage` immediately after read to avoid stale state leaking into a future session.

**Constraint:** `selectedIds.length` must be 2 or 3 (enforced in UI before this object is ever written — the dashboard disables selecting a 4th item and disables "Compare" below 2 selections).

---

## 5. Schema Validation Rules

Applied in `storage.js` (`saveAnalysis()`) and in `analysisController.js` (validating both AI and offline engine output before handing off to `report.js`):

1. Every field marked **Required** above must exist on the object (even if the value is an empty array/string) — a missing key is treated as a validation failure, not a rendering edge case to handle downstream.
2. `overallFitScore` and all `categoryScores` values must be integers in range 0–100 — out-of-range values are clamped, not silently accepted.
3. Enum fields (`analysisMode`, `severity`, `confidence`, `applyConfidence.tier`, `recommendedAction`, `status`) must match one of their defined values exactly — any other string is treated as invalid data.
4. A record failing validation is never written to `localStorage` and never passed to `report.js` — the calling code surfaces a clear error state instead ("This analysis couldn't be completed correctly — please try again").

---

## 6. User Story → Schema Validation Check

Every PRD functional requirement involving data is confirmed covered by the schema above:

| PRD User Story / Requirement | Schema Coverage |
|---|---|
| FR-4.1–4.9: Full report with score, categories, strengths, gaps, eligibility, recommendations, Why Good Fit, Apply Confidence, Next Action | `AnalysisReport` entity — every field present |
| FR-4.10: AI Reasoning Panel with explanation + confidence | `reasoning[]` array |
| FR-4.11: Evidence Panel linking findings to source text | `evidenceResume`/`evidenceJD` fields on `strengths[]`/`gaps[]`/`eligibilityFlags[]` |
| FR-5.1–5.2: Save analysis with company, title, date, score, status | `Analysis` entity top-level fields |
| FR-5.3: Dashboard list view | `Analysis` array read via `storage.js` |
| FR-5.4–5.5: Compare 2–3 jobs with score/category/strengths/gaps/eligibility/confidence | `CompareSelection` + full `AnalysisReport` embed provides every field the comparison view needs |
| FR-5.6: Delete individual / export / delete all | Supported directly — array operations on `careeriq_analyses` |
| Analysis Mode badge (AI vs Offline) | `analysisMode` field |

No gaps identified — schema fully satisfies the PRD's v1.0 functional requirements.

---

## 7. v2 Migration Note

This schema is written to translate directly to a real database with minimal rework: `Analysis` becomes a table/collection, `AnalysisReport` becomes either a JSON column (simplest) or a normalized set of child tables (`strengths`, `gaps`, `eligibility_flags`, `reasoning` as separate tables with a foreign key to `analyses.id`) if v2 needs to query across analyses (e.g., "most common missing skill across all my analyses" — the resume-improvement-analytics v2 feature). The current embedded/denormalized shape is the right choice for v1.0's `localStorage`-only, single-user context.
