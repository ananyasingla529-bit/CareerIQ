/**
 * analysisController.js — Single orchestration entry point used by the UI.
 * Tries the AI engine first; on ANY failure (timeout, network, rate limit,
 * malformed response), automatically and silently falls back to the offline
 * engine. This function is designed to NEVER reject — it always resolves
 * with a valid AnalysisReport, which is the app's core reliability promise.
 *
 * Defense-in-depth: even if the offline engine itself unexpectedly threw
 * (a bug, an edge case in a future taxonomy update, etc.), a minimal but
 * valid fallback report is returned rather than letting the error escape
 * to the UI as an unhandled failure.
 */

/** Builds a minimal, schema-valid report used only if BOTH engines fail. */
function buildEmergencyFallbackReport() {
  return {
    overallFitScore: 50,
    analysisMode: "offline",
    categoryScores: {
      technicalSkills: 50, experience: 50, education: 50,
      projects: 50, softSkills: 50, eligibility: 50, keywords: 50,
    },
    strengths: [],
    gaps: [],
    eligibilityFlags: [],
    recommendations: [
      "We couldn't fully analyze this pairing due to an unexpected error. Please try again, or review the job description and resume manually for now.",
    ],
    whyGoodFit: [
      "Every application is a learning opportunity, regardless of a technical hiccup here.",
    ],
    applyConfidence: { tier: "borderline", label: "Borderline Match — Apply Only If Interested" },
    recommendedAction: "save_for_later",
    reasoning: [
      {
        conclusion: "This is a fallback result due to an unexpected error.",
        explanation: "Both the AI and offline engines encountered a problem processing this specific input. This is a rare, generic placeholder result — not a reflection of your actual fit.",
        confidence: "low",
      },
    ],
  };
}

async function runAnalysis(resumeText, jdText) {
  try {
    const aiReport = await getAIAnalysis(resumeText, jdText);
    return aiReport;
  } catch (aiErr) {
    console.warn("AI analysis unavailable, falling back to offline analysis:", aiErr.message);
    try {
      const offlineReport = generateOfflineReport(resumeText, jdText);
      return offlineReport;
    } catch (offlineErr) {
      // Extremely rare — both engines failed. Never let this reach the UI
      // as an unhandled rejection; return a safe, honest placeholder instead.
      console.error("Offline analysis also failed unexpectedly:", offlineErr);
      return buildEmergencyFallbackReport();
    }
  }
}
