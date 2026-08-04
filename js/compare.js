/**
 * compare.js — Renders 2-3 saved analyses side by side on compare.html.
 * Reads the temporary selection from localStorage (written by dashboard.js),
 * clears it after reading so stale selections don't leak into future visits.
 */

const CATEGORY_LABELS = {
  technicalSkills: "Technical Skills",
  experience: "Experience",
  education: "Education",
  projects: "Projects",
  softSkills: "Soft Skills",
  eligibility: "Eligibility",
  keywords: "Keywords",
};

function scoreColorClass(score) {
  if (score >= 85) return "success";  // Excellent = Neon Lime
  if (score >= 70) return "warning";  // Good = Emerald Green
  if (score >= 50) return "orange";   // Average = Amber
  return "danger";                    // Poor = Crimson Red
}

function initCompare() {
  const container = document.getElementById("compareContainer");
  const emptyState = document.getElementById("compareEmptyState");

  let selectedIds = [];
  try {
    const raw = localStorage.getItem("careeriq_compare_selection");
    selectedIds = raw ? JSON.parse(raw) : [];
  } catch (e) {
    selectedIds = [];
  }
  // Clear immediately so a page refresh or future visit doesn't reuse a stale selection
  localStorage.removeItem("careeriq_compare_selection");

  if (!Array.isArray(selectedIds) || selectedIds.length < 2) {
    container.classList.add("hidden");
    emptyState.classList.remove("hidden");
    return;
  }

  const analyses = selectedIds.map((id) => getAnalysisById(id)).filter(Boolean);

  if (analyses.length < 2) {
    container.classList.add("hidden");
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");
  container.classList.remove("hidden");
  renderComparison(analyses, container);
}

function renderComparison(analyses, container) {
  const bestScore = Math.max(...analyses.map((a) => a.overallFitScore));

  const columns = analyses.map((a) => renderColumn(a, a.overallFitScore === bestScore)).join("");

  container.innerHTML = `
    <div class="compare-table">
      <div class="compare-scroll">
        ${columns}
      </div>
    </div>
  `;
}

function renderColumn(analysis, isBest) {
  const report = analysis.fullReport;
  const colorClass = scoreColorClass(analysis.overallFitScore);
  const modeIcon = report.analysisMode === "ai" ? "✨" : "📴";

  const categoryRows = Object.keys(CATEGORY_LABELS).map((key) => {
    const score = report.categoryScores[key] ?? 0;
    return `
      <div class="compare-row">
        <span class="compare-row-label">${CATEGORY_LABELS[key]}</span>
        <span class="compare-row-value badge badge-${scoreColorClass(score)}">${score}</span>
      </div>
    `;
  }).join("");

  const strengthsHTML = (report.strengths || []).slice(0, 3).map((s) =>
    `<li>${escapeHTML(s.point)}</li>`
  ).join("") || `<li class="text-muted">None identified</li>`;

  const gapsHTML = (report.gaps || []).slice(0, 3).map((g) =>
    `<li>${escapeHTML(g.point)}</li>`
  ).join("") || `<li class="text-muted">None identified</li>`;

  const eligibilityHTML = (report.eligibilityFlags || []).length > 0
    ? report.eligibilityFlags.map((f) => `<li>${f.isHardBlocker ? "🚩" : "⚠️"} ${escapeHTML(f.issue)}</li>`).join("")
    : `<li class="text-muted">✓ No issues found</li>`;

  return `
    <div class="compare-column ${isBest ? "compare-column-best" : ""}">
      ${isBest ? `<div class="best-fit-badge">🏆 Best Fit</div>` : ""}
      <div class="compare-column-header">
        <div class="job-card-company">${escapeHTML(analysis.companyName)}</div>
        <div class="job-card-title">${escapeHTML(analysis.jobTitle)}</div>
      </div>

      <div class="compare-score score-hero-${colorClass}" style="margin: var(--space-3) auto;">
        <div class="score-hero-number">${analysis.overallFitScore}</div>
        <div class="score-hero-label">out of 100</div>
      </div>

      <div class="badge badge-${colorClass}">${modeIcon} ${escapeHTML(report.applyConfidence.label)}</div>

      <h3 class="mt-3" style="font-size: 1rem;">Category Scores</h3>
      ${categoryRows}

      <h3 class="mt-3" style="font-size: 1rem;">Top Strengths</h3>
      <ul class="finding-list">${strengthsHTML}</ul>

      <h3 class="mt-3" style="font-size: 1rem;">Top Gaps</h3>
      <ul class="finding-list">${gapsHTML}</ul>

      <h3 class="mt-3" style="font-size: 1rem;">Eligibility</h3>
      <ul class="finding-list">${eligibilityHTML}</ul>
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", initCompare);
