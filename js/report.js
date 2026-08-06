/**
 * report.js — Renders an AnalysisReport object (see SCHEMA.md) into the
 * full "career coach" report UI. Works identically for AI and offline
 * reports since both produce the same JSON shape.
 *
 * Exposes: renderReport(report, containerEl)
 */

const TIER_META = {
  apply_now: { color: "success", emoji: "🟢", label: "Apply Now" },
  improve_first: { color: "warning", emoji: "🟡", label: "Apply, But Improve These Areas First" },
  borderline: { color: "orange", emoji: "🟠", label: "Borderline Match — Apply Only If Interested" },
  upskill_first: { color: "danger", emoji: "🔴", label: "Focus on Upskilling Before Applying" },
};

const ACTION_META = {
  apply_now: { emoji: "🟢", label: "Apply Now" },
  improve_resume: { emoji: "🟡", label: "Improve Resume First" },
  learn_skills: { emoji: "🔵", label: "Learn Missing Skills First" },
  save_for_later: { emoji: "🟠", label: "Save for Later" },
  not_a_match: { emoji: "🔴", label: "Not a Good Match Right Now" },
};

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

function renderModeBadge(mode) {
  if (mode === "ai") {
    return `<div class="badge badge-success">✨ AI Analysis</div>
      <p class="text-muted mt-1" style="font-size: 0.85rem;">This report was generated using live AI reasoning.</p>`;
  }
  return `<div class="badge badge-neutral">📴 Offline Analysis</div>
    <p class="text-muted mt-1" style="font-size: 0.85rem;">AI was unavailable, so this report was generated using our local rule-based engine. Reconnect and re-analyze anytime for deeper AI insights.</p>`;
}

function renderScoreHero(report) {
  const colorClass = scoreColorClass(report.overallFitScore);
  return `
    <div class="score-hero score-hero-${colorClass}">
      <div class="score-hero-number">${report.overallFitScore}</div>
      <div class="score-hero-label">out of 100</div>
    </div>
  `;
}

function renderApplyConfidence(report) {
  const tier = TIER_META[report.applyConfidence.tier] || TIER_META.borderline;
  const tiers = ["upskill_first", "borderline", "improve_first", "apply_now"];
  const activeIndex = tiers.indexOf(report.applyConfidence.tier);

  const segments = tiers.map((t, i) => {
    const meta = TIER_META[t];
    const isActive = i === activeIndex;
    return `<div class="confidence-segment confidence-${meta.color} ${isActive ? "active" : ""}"></div>`;
  }).join("");

  return `
    <div class="confidence-meter">
      <div class="confidence-track">${segments}</div>
      <div class="confidence-readout">
        <span class="badge badge-${tier.color}">${tier.emoji} ${escapeHTML(report.applyConfidence.label || tier.label)}</span>
      </div>
    </div>
  `;
}

function renderCategoryChart(categoryScores) {
  const rows = Object.keys(CATEGORY_LABELS).map((key) => {
    const score = categoryScores[key] ?? 0;
    const colorClass = scoreColorClass(score);
    return `
      <div class="category-row">
        <div class="category-label">${CATEGORY_LABELS[key]}</div>
        <div class="category-bar-track">
          <div class="category-bar-fill category-bar-${colorClass}" style="width: ${score}%;"></div>
        </div>
        <div class="category-value">${score}</div>
      </div>
    `;
  }).join("");

  return `<div class="category-chart">${rows}</div>`;
}

function renderEvidenceToggle(id, resumeText, jdText) {
  const hasResume = resumeText && resumeText.trim().length > 0;
  const hasJD = jdText && jdText.trim().length > 0;
  if (!hasResume && !hasJD) return "";

  return `
    <button type="button" class="evidence-toggle" data-evidence-target="${id}">View Evidence &darr;</button>
    <div class="evidence-panel hidden" id="${id}">
      ${hasResume ? `<div class="evidence-quote"><span class="evidence-source">From your resume:</span> "${escapeHTML(resumeText)}"</div>` : ""}
      ${hasJD ? `<div class="evidence-quote"><span class="evidence-source">From the job description:</span> "${escapeHTML(jdText)}"</div>` : ""}
    </div>
  `;
}

function renderStrengths(strengths) {
  if (!strengths || strengths.length === 0) {
    return `<p class="text-muted">No specific strengths were identified for this comparison.</p>`;
  }
  const items = strengths.map((s, i) => `
    <div class="finding-item finding-strength">
      <div class="finding-point">✅ ${escapeHTML(s.point)}</div>
      ${renderEvidenceToggle(`strength-evidence-${i}`, s.evidenceResume, s.evidenceJD)}
    </div>
  `).join("");
  return items;
}

function renderGaps(gaps) {
  if (!gaps || gaps.length === 0) {
    return `<p class="text-muted">No significant gaps were identified.</p>`;
  }
  const items = gaps.map((g, i) => {
    const severityBadge = g.severity === "major"
      ? `<span class="badge badge-danger">Major</span>`
      : `<span class="badge badge-warning">Minor</span>`;
    return `
      <div class="finding-item finding-gap">
        <div class="finding-point">⚠️ ${escapeHTML(g.point)} ${severityBadge}</div>
        ${renderEvidenceToggle(`gap-evidence-${i}`, "", g.evidenceJD)}
      </div>
    `;
  }).join("");
  return items;
}

function renderEligibilityFlags(flags) {
  if (!flags || flags.length === 0) {
    return `<p class="text-muted">✓ No eligibility issues found.</p>`;
  }
  const items = flags.map((f, i) => {
    const badge = f.isHardBlocker
      ? `<span class="badge badge-danger">Hard Blocker</span>`
      : `<span class="badge badge-warning">Soft Flag</span>`;
    return `
      <div class="finding-item ${f.isHardBlocker ? "finding-blocker" : "finding-gap"}">
        <div class="finding-point">🚩 ${escapeHTML(f.issue)} ${badge}</div>
        ${renderEvidenceToggle(`eligibility-evidence-${i}`, "", f.evidenceJD)}
      </div>
    `;
  }).join("");
  return items;
}

function renderList(items) {
  if (!items || items.length === 0) return "";
  return `<ul class="finding-list">${items.map((i) => `<li>${escapeHTML(i)}</li>`).join("")}</ul>`;
}

function renderReasoningPanel(reasoning) {
  if (!reasoning || reasoning.length === 0) return "";
  const confidenceBadge = { high: "badge-success", medium: "badge-warning", low: "badge-neutral" };
  const items = reasoning.map((r) => `
    <div class="reasoning-item">
      <div class="reasoning-conclusion">${escapeHTML(r.conclusion)}
        <span class="badge ${confidenceBadge[r.confidence] || "badge-neutral"}">${escapeHTML(r.confidence)} confidence</span>
      </div>
      <div class="reasoning-explanation text-muted">${escapeHTML(r.explanation)}</div>
    </div>
  `).join("");

  return `
    <details class="reasoning-panel">
      <summary>🧠 AI Reasoning Panel — how these conclusions were reached</summary>
      <div class="reasoning-content">${items}</div>
    </details>
  `;
}

function renderNextAction(report) {
  const action = ACTION_META[report.recommendedAction] || ACTION_META.save_for_later;
  return `
    <div class="next-action-card">
      <div class="text-muted" style="font-size: 0.85rem;">RECOMMENDED NEXT ACTION</div>
      <div class="next-action-label">${action.emoji} ${action.label}</div>
    </div>
  `;
}

/**
 * Main entry point — renders a full report into the given container element.
 * @param {Object} report - AnalysisReport (see SCHEMA.md)
 * @param {HTMLElement} containerEl
 * @param {Object} [options] - { resumeText, jdText } — when both are provided
 *   (i.e. right after a fresh analysis, not when viewing a saved report),
 *   a "Get Resume Rewrite Suggestions" button is shown. Saved reports don't
 *   retain the full original resume/JD text, so this feature only appears
 *   in that fresh-analysis context — an intentional, honest scope boundary.
 */
function renderReport(report, containerEl, options = {}) {
  const { resumeText, jdText } = options;

  containerEl.innerHTML = `
    <div class="report card">
      ${renderModeBadge(report.analysisMode)}

      <div class="report-hero-row mt-3">
        ${renderScoreHero(report)}
        <div class="report-hero-side">
          ${renderApplyConfidence(report)}
          ${renderNextAction(report)}
        </div>
      </div>

      <h3 class="mt-4">Category Breakdown</h3>
      ${renderCategoryChart(report.categoryScores)}

      <div class="findings-grid mt-4">
        <div>
          <h3>✅ Matching Strengths</h3>
          ${renderStrengths(report.strengths)}
        </div>
        <div>
          <h3>⚠️ Missing Skills &amp; Gaps</h3>
          ${renderGaps(report.gaps)}
        </div>
      </div>

      <h3 class="mt-4">🚩 Eligibility Flags</h3>
      ${renderEligibilityFlags(report.eligibilityFlags)}

      ${renderRewriteSection(report, resumeText, jdText)}

      <div class="why-good-fit-card mt-4">
        <h3>🌟 Why You're Still a Good Fit</h3>
        ${renderList(report.whyGoodFit)}
      </div>

      <h3 class="mt-4">💡 Recommendations</h3>
      ${renderList(report.recommendations)}

      <div class="mt-4">
        ${renderReasoningPanel(report.reasoning)}
      </div>
    </div>
  `;

  // Wire up evidence toggle buttons (delegated per-render since content is fresh HTML)
  containerEl.querySelectorAll(".evidence-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-evidence-target");
      const panel = document.getElementById(targetId);
      if (panel) {
        panel.classList.toggle("hidden");
        btn.textContent = panel.classList.contains("hidden") ? "View Evidence ↓" : "Hide Evidence ↑";
      }
    });
  });

  // Wire up the Rewrite Assistant button, if present
  const rewriteBtn = containerEl.querySelector("#rewriteSuggestBtn");
  if (rewriteBtn) {
    rewriteBtn.addEventListener("click", () => handleRewriteButtonClick(report, resumeText, jdText, containerEl));
  }
}

/**
 * Renders the "Resume Rewrite Assistant" section — a button that, when
 * clicked, calls the AI for grounded phrasing suggestions on the report's
 * top gaps. Only rendered when we have the original resumeText/jdText
 * (fresh analysis) and there's at least one gap to address.
 */
function renderRewriteSection(report, resumeText, jdText) {
  const hasContext = resumeText && jdText;
  const hasGaps = report.gaps && report.gaps.length > 0;
  if (!hasContext || !hasGaps) return "";

  return `
    <div class="rewrite-section mt-4">
      <h3>✍️ Resume Rewrite Assistant</h3>
      <p class="text-muted" style="font-size: 0.9rem;">
        Get AI-suggested phrasing for skills you may already have but that aren't clearly showing up on your resume.
      </p>
      <button type="button" id="rewriteSuggestBtn" class="btn btn-secondary">Get Rewrite Suggestions</button>
      <div id="rewriteResultArea" class="mt-3"></div>
    </div>
  `;
}

/**
 * Handles the Rewrite Assistant button click: calls the AI, shows a loading
 * state, and renders results or a clear error. No offline fallback — this
 * feature requires live AI reasoning, so failure is explained honestly
 * rather than faked.
 */
async function handleRewriteButtonClick(report, resumeText, jdText, containerEl) {
  const btn = containerEl.querySelector("#rewriteSuggestBtn");
  const resultArea = containerEl.querySelector("#rewriteResultArea");
  if (!btn || !resultArea) return;

  const gapPoints = (report.gaps || []).slice(0, 6).map((g) => g.point);

  btn.disabled = true;
  resultArea.innerHTML = `
    <div class="loading-row" role="status" aria-live="polite">
      <span class="spinner" aria-hidden="true"></span>
      <p style="margin: 0;">Thinking through your resume for grounded suggestions...</p>
    </div>
  `;

  try {
    const result = await getRewriteSuggestions(resumeText, jdText, gapPoints);
    renderRewriteSuggestions(result.suggestions, resultArea);
    btn.textContent = "Regenerate Suggestions";
    btn.disabled = false;
  } catch (err) {
    resultArea.innerHTML = `
      <div class="alert alert-error">
        <strong>Couldn't generate suggestions:</strong> ${escapeHTML(err.message || "Unknown error")}
        <br /><span class="text-muted">This feature requires an AI connection — try again once you're back online.</span>
      </div>
    `;
    btn.disabled = false;
  }
}

/** Renders the list of rewrite suggestions returned by the AI. */
function renderRewriteSuggestions(suggestions, resultArea) {
  if (!suggestions || suggestions.length === 0) {
    resultArea.innerHTML = `<p class="text-muted">No suggestions were generated.</p>`;
    return;
  }

  const items = suggestions.map((s) => {
    if (!s.suggestedBullet) {
      // Honest "real gap, not a phrasing issue" case
      return `
        <div class="rewrite-item rewrite-item-honest">
          <div class="rewrite-skill">🎯 ${escapeHTML(s.skillOrGap)}</div>
          <div class="text-muted" style="font-size: 0.88rem;">${escapeHTML(s.placementHint)}</div>
        </div>
      `;
    }
    return `
      <div class="rewrite-item">
        <div class="rewrite-skill">✏️ ${escapeHTML(s.skillOrGap)}</div>
        <div class="rewrite-bullet">"${escapeHTML(s.suggestedBullet)}"</div>
        <div class="text-muted" style="font-size: 0.82rem;">${escapeHTML(s.placementHint)}</div>
      </div>
    `;
  }).join("");

  resultArea.innerHTML = `<div class="rewrite-results">${items}</div>`;
}
