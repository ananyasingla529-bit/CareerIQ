/**
 * aiEngine.js — Primary (AI) analysis path.
 * Calls the Cloudflare Worker proxy, which forwards to Gemini and returns
 * the locked AnalysisReport JSON schema (see SCHEMA.md).
 *
 * Exposes: getAIAnalysis(resumeText, jdText) -> Promise<AnalysisReport>
 * Throws: AIServiceError on any failure (timeout, network, bad response,
 *         malformed schema) — analysisController.js (built Day 6) will
 *         catch this and fall back to the offline engine.
 */

class AIServiceError extends Error {
  constructor(message, code) {
    super(message);
    this.name = "AIServiceError";
    this.code = code || "UNKNOWN";
  }
}

// Cloudflare Worker proxy URL — public and safe to expose (it's just an
// endpoint address, not a credential; the real secret lives server-side).
const AI_PROXY_URL = "https://black-river-885d.ananyasingla529.workers.dev";

const AI_REQUEST_TIMEOUT_MS = 27000; // slightly above the Worker's own 25s timeout

/**
 * Calls the AI proxy with resume + JD text and returns a validated report.
 * @param {string} resumeText
 * @param {string} jdText
 * @returns {Promise<Object>} AnalysisReport (see SCHEMA.md)
 */
async function getAIAnalysis(resumeText, jdText) {
  if (!resumeText || resumeText.trim().length < 50) {
    throw new AIServiceError("Resume text is too short.", "INVALID_INPUT");
  }
  if (!jdText || jdText.trim().length < 100) {
    throw new AIServiceError("Job description text is too short.", "INVALID_INPUT");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_REQUEST_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(AI_PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeText, jdText }),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new AIServiceError("The AI analysis timed out.", "UPSTREAM_TIMEOUT");
    }
    throw new AIServiceError("Could not reach the AI service (network error).", "NETWORK_ERROR");
  }
  clearTimeout(timeoutId);

  let body;
  try {
    body = await response.json();
  } catch (err) {
    throw new AIServiceError("AI service returned an invalid response.", "MALFORMED_AI_RESPONSE");
  }

  if (!response.ok || !body.success) {
    const code = body?.error?.code || "UPSTREAM_ERROR";
    const message = body?.error?.message || "The AI service returned an error.";
    throw new AIServiceError(message, code);
  }

  if (!validateReportShape(body.data)) {
    throw new AIServiceError("AI response did not match the expected format.", "MALFORMED_AI_RESPONSE");
  }

  return body.data;
}

/**
 * Calls the AI proxy's rewrite endpoint to get suggested resume phrasing
 * for a list of missing skills/gaps. Unlike getAIAnalysis(), there is NO
 * offline fallback for this feature — generating grounded, honest resume
 * phrasing requires real AI reasoning, so a rule-based engine can't
 * meaningfully replace it. Callers should handle this error and explain
 * that the feature needs an internet connection, rather than silently
 * falling back to something fake.
 *
 * @param {string} resumeText
 * @param {string} jdText
 * @param {string[]} gaps - up to ~6 skill/gap description strings
 * @returns {Promise<{suggestions: Array<{skillOrGap: string, suggestedBullet: string|null, placementHint: string}>}>}
 */
async function getRewriteSuggestions(resumeText, jdText, gaps) {
  if (!resumeText || resumeText.trim().length < 50) {
    throw new AIServiceError("Resume text is too short.", "INVALID_INPUT");
  }
  if (!jdText || jdText.trim().length < 50) {
    throw new AIServiceError("Job description text is too short.", "INVALID_INPUT");
  }
  if (!Array.isArray(gaps) || gaps.length === 0) {
    throw new AIServiceError("No gaps provided to generate suggestions for.", "INVALID_INPUT");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_REQUEST_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(AI_PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "rewrite", resumeText, jdText, gaps }),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new AIServiceError("The rewrite request timed out.", "UPSTREAM_TIMEOUT");
    }
    throw new AIServiceError("Could not reach the AI service (network error).", "NETWORK_ERROR");
  }
  clearTimeout(timeoutId);

  let body;
  try {
    body = await response.json();
  } catch (err) {
    throw new AIServiceError("AI service returned an invalid response.", "MALFORMED_AI_RESPONSE");
  }

  if (!response.ok || !body.success) {
    const code = body?.error?.code || "UPSTREAM_ERROR";
    const message = body?.error?.message || "The AI service returned an error.";
    throw new AIServiceError(message, code);
  }

  if (!body.data || !Array.isArray(body.data.suggestions)) {
    throw new AIServiceError("AI response did not match the expected format.", "MALFORMED_AI_RESPONSE");
  }

  return body.data;
}

/**
 * Validates that a report object has every field required by the locked
 * schema (SCHEMA.md). Used defensively even though the Worker already
 * validates server-side — defense in depth.
 */
function validateReportShape(report) {
  if (!report || typeof report !== "object") return false;

  const requiredTop = [
    "overallFitScore", "analysisMode", "categoryScores", "strengths", "gaps",
    "eligibilityFlags", "recommendations", "whyGoodFit", "applyConfidence",
    "recommendedAction", "reasoning",
  ];
  for (const key of requiredTop) {
    if (!(key in report)) return false;
  }

  const requiredCategories = [
    "technicalSkills", "experience", "education", "projects",
    "softSkills", "eligibility", "keywords",
  ];
  for (const cat of requiredCategories) {
    if (!(cat in report.categoryScores)) return false;
  }

  if (typeof report.overallFitScore !== "number") return false;
  if (!Array.isArray(report.strengths)) return false;
  if (!Array.isArray(report.gaps)) return false;
  if (!Array.isArray(report.eligibilityFlags)) return false;
  if (!Array.isArray(report.recommendations)) return false;
  if (!Array.isArray(report.whyGoodFit)) return false;
  if (!Array.isArray(report.reasoning)) return false;

  return true;
}
