/**
 * analysisController.js — Single orchestration entry point used by the UI.
 * Tries the AI engine first; on ANY failure (timeout, network, rate limit,
 * malformed response), automatically and silently falls back to the offline
 * engine. This function is designed to NEVER reject — it always resolves
 * with a valid AnalysisReport, which is the app's core reliability promise.
 *
 * Exposes: runAnalysis(resumeText, jdText) -> Promise<AnalysisReport>
 */

async function runAnalysis(resumeText, jdText) {
  try {
    const aiReport = await getAIAnalysis(resumeText, jdText);
    return aiReport;
  } catch (err) {
    console.warn("AI analysis unavailable, falling back to offline analysis:", err.message);
    const offlineReport = generateOfflineReport(resumeText, jdText);
    return offlineReport;
  }
}
