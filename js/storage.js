/**
 * storage.js — localStorage CRUD for saved analyses.
 * Storage key: "careeriq_analyses" — a JSON array of Analysis objects.
 * See SCHEMA.md for the full Analysis / AnalysisReport shape.
 *
 * Exposes: saveAnalysis, getAllAnalyses, getAnalysisById, updateStatus,
 *          deleteAnalysis, deleteAllAnalyses, exportAllAsJSON
 */

const STORAGE_KEY = "careeriq_analyses";

function generateId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return "id-" + Date.now() + "-" + Math.random().toString(36).slice(2, 10);
}

/** Reads the raw array from localStorage, safely handling corruption. */
function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn("CareerIQ storage: could not read saved analyses, resetting.", err);
    return [];
  }
}

function writeStore(analyses) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(analyses));
    return true;
  } catch (err) {
    console.error("CareerIQ storage: failed to write to localStorage.", err);
    return false;
  }
}

/** Validates a full AnalysisReport has the required fields before saving. */
function isValidReport(report) {
  if (!report || typeof report !== "object") return false;
  const required = ["overallFitScore", "analysisMode", "categoryScores", "applyConfidence", "recommendedAction"];
  return required.every((key) => key in report);
}

/**
 * Saves a new analysis.
 * @param {Object} entry - { companyName, jobTitle, fullReport }
 * @returns {{success: boolean, id?: string, error?: string}}
 */
function saveAnalysis(entry) {
  if (!entry || !entry.companyName || !entry.jobTitle || !isValidReport(entry.fullReport)) {
    return { success: false, error: "Missing required fields." };
  }

  const analyses = readStore();
  const newEntry = {
    id: generateId(),
    companyName: entry.companyName.trim().slice(0, 100),
    jobTitle: entry.jobTitle.trim().slice(0, 150),
    dateAnalyzed: new Date().toISOString(),
    overallFitScore: entry.fullReport.overallFitScore,
    applyConfidenceTier: entry.fullReport.applyConfidence.tier,
    status: "interested",
    fullReport: entry.fullReport,
  };

  analyses.unshift(newEntry); // newest first
  const ok = writeStore(analyses);
  return ok ? { success: true, id: newEntry.id } : { success: false, error: "Could not save to local storage." };
}

/** Returns all saved analyses, newest first. */
function getAllAnalyses() {
  return readStore();
}

/** Returns a single saved analysis by id, or null. */
function getAnalysisById(id) {
  const analyses = readStore();
  return analyses.find((a) => a.id === id) || null;
}

/**
 * Updates the application status of a saved analysis.
 * @param {string} id
 * @param {"interested"|"applied"|"not_applied"} status
 */
function updateStatus(id, status) {
  const validStatuses = ["interested", "applied", "not_applied", "not_interested"];
  if (!validStatuses.includes(status)) return { success: false };

  const analyses = readStore();
  const index = analyses.findIndex((a) => a.id === id);
  if (index === -1) return { success: false };

  analyses[index].status = status;
  const ok = writeStore(analyses);
  return { success: ok };
}

/** Deletes a single saved analysis by id. */
function deleteAnalysis(id) {
  const analyses = readStore();
  const filtered = analyses.filter((a) => a.id !== id);
  if (filtered.length === analyses.length) return { success: false };
  const ok = writeStore(filtered);
  return { success: ok };
}

/** Deletes all saved analyses. */
function deleteAllAnalyses() {
  const ok = writeStore([]);
  return { success: ok };
}

/** Triggers a browser download of all saved analyses as a JSON file. */
function exportAllAsJSON() {
  const analyses = readStore();
  const blob = new Blob([JSON.stringify(analyses, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `careeriq-analyses-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return { success: true, count: analyses.length };
}
