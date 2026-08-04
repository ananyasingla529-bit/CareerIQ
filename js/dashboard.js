/**
 * dashboard.js — Renders the list of saved analyses on dashboard.html.
 * Handles status updates, viewing a saved report, deleting, export/delete-all.
 */

const TIER_COLOR = {
  apply_now: "success",
  improve_first: "warning",
  borderline: "orange",
  upskill_first: "danger",
};

const MAX_COMPARE = 3;
const MIN_COMPARE = 2;
let selectedIds = new Set();

function scoreColor(score) {
  if (score >= 85) return "success";  // Excellent = Neon Lime
  if (score >= 70) return "warning";  // Good = Emerald Green
  if (score >= 50) return "orange";   // Average = Amber
  return "danger";                    // Poor = Crimson Red
}

function statusLabel(status) {
  const map = { interested: "Interested", applied: "Applied", not_applied: "Not Applied", not_interested: "Not Interested" };
  return map[status] || "Interested";
}

function initDashboard() {
  renderDashboard();
}

function renderDashboard() {
  const grid = document.getElementById("dashboardGrid");
  const emptyState = document.getElementById("emptyState");
  const countLabel = document.getElementById("analysisCount");
  const analyses = getAllAnalyses();

  countLabel.textContent = `(${analyses.length})`;

  if (analyses.length === 0) {
    grid.innerHTML = "";
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");
  grid.innerHTML = analyses.map((a) => renderJobCard(a)).join("");

  // Wire up per-card interactions
  analyses.forEach((a) => {
    const statusSelect = document.getElementById(`status-${a.id}`);
    if (statusSelect) {
      statusSelect.addEventListener("change", (e) => {
        updateStatus(a.id, e.target.value);
      });
    }

    const deleteBtn = document.getElementById(`delete-${a.id}`);
    if (deleteBtn) {
      deleteBtn.addEventListener("click", () => confirmDeleteOne(a.id, a.companyName));
    }

    const viewBtn = document.getElementById(`view-${a.id}`);
    if (viewBtn) {
      viewBtn.addEventListener("click", () => viewSavedReport(a.id));
    }

    const checkbox = document.getElementById(`select-${a.id}`);
    if (checkbox) {
      checkbox.addEventListener("change", (e) => handleSelectionChange(a.id, e.target.checked));
    }
  });

  renderCompareBar();
}

/** Handles a checkbox toggle, enforcing the max-3 selection limit. */
function handleSelectionChange(id, isChecked) {
  if (isChecked) {
    if (selectedIds.size >= MAX_COMPARE) {
      // Revert the checkbox and inform the user instead of silently allowing a 4th
      const checkbox = document.getElementById(`select-${id}`);
      if (checkbox) checkbox.checked = false;
      const bar = document.getElementById("compareBar");
      if (bar) {
        bar.classList.add("compare-bar-shake");
        setTimeout(() => bar.classList.remove("compare-bar-shake"), 400);
      }
      return;
    }
    selectedIds.add(id);
  } else {
    selectedIds.delete(id);
  }
  renderCompareBar();
}

/** Renders/updates the sticky "Compare Selected" action bar. */
function renderCompareBar() {
  let bar = document.getElementById("compareBar");
  const count = selectedIds.size;

  if (!bar) {
    bar = document.createElement("div");
    bar.id = "compareBar";
    bar.className = "compare-bar";
    document.body.appendChild(bar);
  }

  if (count === 0) {
    bar.classList.remove("compare-bar-visible");
    document.body.classList.remove("has-compare-bar");
    return;
  }

  bar.classList.add("compare-bar-visible");
  document.body.classList.add("has-compare-bar");
  const canCompare = count >= MIN_COMPARE;
  bar.innerHTML = `
    <div class="compare-bar-inner">
      <span>${count} of ${MAX_COMPARE} selected</span>
      <button type="button" id="compareSelectedBtn" class="btn btn-primary" ${canCompare ? "" : "disabled"}>
        Compare Selected ${canCompare ? "" : `(select ${MIN_COMPARE - count} more)`}
      </button>
      <button type="button" id="clearSelectionBtn" class="btn-link">Clear</button>
    </div>
  `;

  const compareBtn = document.getElementById("compareSelectedBtn");
  if (compareBtn && canCompare) {
    compareBtn.addEventListener("click", goToCompare);
  }
  document.getElementById("clearSelectionBtn").addEventListener("click", () => {
    selectedIds.clear();
    renderDashboard();
  });
}

/** Stores the selection and navigates to the comparison page. */
function goToCompare() {
  localStorage.setItem("careeriq_compare_selection", JSON.stringify(Array.from(selectedIds)));
  window.location.href = "compare.html";
}

function renderJobCard(analysis) {
  const colorClass = scoreColor(analysis.overallFitScore);
  const modeIcon = analysis.fullReport.analysisMode === "ai" ? "✨" : "📴";
  const isSelected = selectedIds.has(analysis.id);

  return `
    <div class="job-card ${isSelected ? "job-card-selected" : ""}" id="card-${analysis.id}">
      <div class="job-card-top">
        <div class="job-card-select">
          <input type="checkbox" id="select-${analysis.id}" class="compare-checkbox" ${isSelected ? "checked" : ""}
            aria-label="Select ${escapeHTML(analysis.companyName)} for comparison" />
          <div>
            <div class="job-card-company">${escapeHTML(analysis.companyName)}</div>
            <div class="job-card-title">${escapeHTML(analysis.jobTitle)}</div>
          </div>
        </div>
        <div class="job-card-score" style="color: var(--tier-${colorClass === "warning" ? "yellow" : colorClass === "orange" ? "orange" : colorClass === "danger" ? "red" : "green"});">
          ${analysis.overallFitScore}
        </div>
      </div>

      <div class="badge badge-${colorClass} mt-2">${modeIcon} ${escapeHTML(analysis.fullReport.applyConfidence.label)}</div>
      <div class="job-card-date">Analyzed ${formatDate(analysis.dateAnalyzed)}</div>

      <div class="job-card-status-row">
        <label class="text-muted" style="font-size: 0.85rem;">Status:</label>
        <select class="status-select" id="status-${analysis.id}">
          <option value="interested" ${analysis.status === "interested" ? "selected" : ""}>Interested</option>
          <option value="applied" ${analysis.status === "applied" ? "selected" : ""}>Applied</option>
          <option value="not_applied" ${analysis.status === "not_applied" ? "selected" : ""}>Not Applied</option>
          <option value="not_interested" ${analysis.status === "not_interested" ? "selected" : ""}>Not Interested</option>
        </select>
      </div>

      <div class="job-card-actions">
        <button type="button" id="view-${analysis.id}" class="btn btn-secondary">View Report</button>
        <button type="button" id="delete-${analysis.id}" class="btn btn-danger">Delete</button>
      </div>
    </div>
  `;
}

function viewSavedReport(id) {
  const analysis = getAnalysisById(id);
  if (!analysis) return;

  const triggerEl = document.activeElement;
  const modalBackdrop = document.createElement("div");
  modalBackdrop.className = "modal-backdrop";
  modalBackdrop.setAttribute("role", "dialog");
  modalBackdrop.setAttribute("aria-modal", "true");
  modalBackdrop.setAttribute("aria-label", `Report for ${analysis.companyName}`);
  modalBackdrop.innerHTML = `
    <div class="modal-box" style="max-width: 760px; max-height: 85vh; overflow-y: auto; text-align: left;">
      <div class="text-center mb-2">
        <button type="button" id="closeReportModal" class="btn-link">Close ✕</button>
      </div>
      <div id="savedReportContainer"></div>
    </div>
  `;
  document.body.appendChild(modalBackdrop);

  renderReport(analysis.fullReport, document.getElementById("savedReportContainer"));

  const closeBtn = document.getElementById("closeReportModal");
  closeBtn.focus();

  function closeModal() {
    document.body.removeChild(modalBackdrop);
    document.removeEventListener("keydown", onKeydown);
    if (triggerEl && typeof triggerEl.focus === "function") triggerEl.focus();
  }

  function onKeydown(e) {
    if (e.key === "Escape") closeModal();
  }

  closeBtn.addEventListener("click", closeModal);
  modalBackdrop.addEventListener("click", (e) => {
    if (e.target === modalBackdrop) closeModal();
  });
  document.addEventListener("keydown", onKeydown);
}

function confirmDeleteOne(id, companyName) {
  showConfirmModal(
    `Delete the analysis for ${companyName}? This can't be undone.`,
    () => {
      deleteAnalysis(id);
      renderDashboard();
    }
  );
}

function showConfirmModal(message, onConfirm) {
  const triggerEl = document.activeElement;
  const modalBackdrop = document.createElement("div");
  modalBackdrop.className = "modal-backdrop";
  modalBackdrop.setAttribute("role", "dialog");
  modalBackdrop.setAttribute("aria-modal", "true");
  modalBackdrop.innerHTML = `
    <div class="modal-box">
      <p style="margin: 0;">${escapeHTML(message)}</p>
      <div class="modal-actions">
        <button type="button" id="confirmCancel" class="btn btn-secondary">Cancel</button>
        <button type="button" id="confirmOk" class="btn btn-danger">Delete</button>
      </div>
    </div>
  `;
  document.body.appendChild(modalBackdrop);
  document.getElementById("confirmCancel").focus();

  function closeModal() {
    document.body.removeChild(modalBackdrop);
    document.removeEventListener("keydown", onKeydown);
    if (triggerEl && typeof triggerEl.focus === "function") triggerEl.focus();
  }

  function onKeydown(e) {
    if (e.key === "Escape") closeModal();
  }

  document.getElementById("confirmCancel").addEventListener("click", closeModal);
  document.getElementById("confirmOk").addEventListener("click", () => {
    onConfirm();
    closeModal();
  });
  document.addEventListener("keydown", onKeydown);
}

function initDashboardActions() {
  const exportBtn = document.getElementById("exportAllBtn");
  const deleteAllBtn = document.getElementById("deleteAllBtn");

  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      exportAllAsJSON();
    });
  }

  if (deleteAllBtn) {
    deleteAllBtn.addEventListener("click", () => {
      const count = getAllAnalyses().length;
      if (count === 0) return;
      showConfirmModal(
        `Delete all ${count} saved ${count === 1 ? "analysis" : "analyses"}? This can't be undone.`,
        () => {
          deleteAllAnalyses();
          renderDashboard();
        }
      );
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initDashboard();
  initDashboardActions();
});
