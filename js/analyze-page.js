/**
 * analyze-page.js — UI wiring specific to analyze.html.
 * Handles: drag-and-drop / click upload, PDF parsing trigger, paste-instead
 * toggle, JD character validation, and enabling/disabling the Analyze button.
 * Does NOT perform any analysis itself — that begins Day 5 (AI engine) and
 * Day 6 (offline engine), orchestrated later by analysisController.js.
 */

const MIN_JD_LENGTH = 100;
const MIN_RESUME_LENGTH = 50;

let resumeTextValue = "";

function initAnalyzePage() {
  const dropzone = document.getElementById("dropzone");
  const pdfInput = document.getElementById("pdfInput");
  const pasteInsteadBtn = document.getElementById("pasteInsteadBtn");
  const parseError = document.getElementById("parseError");
  const resumeReview = document.getElementById("resumeReview");
  const resumeStatus = document.getElementById("resumeStatus");
  const resumeStatusText = document.getElementById("resumeStatusText");
  const resumeTextArea = document.getElementById("resumeTextArea");
  const jdTextArea = document.getElementById("jdTextArea");
  const jdCharCounter = document.getElementById("jdCharCounter");
  const analyzeBtn = document.getElementById("analyzeBtn");

  // ---------- Dropzone click-to-browse ----------
  dropzone.addEventListener("click", () => pdfInput.click());

  // ---------- Dropzone keyboard accessibility ----------
  dropzone.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      pdfInput.click();
    }
  });

  // ---------- Dropzone drag-and-drop ----------
  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.classList.add("dragover");
  });

  dropzone.addEventListener("dragleave", () => {
    dropzone.classList.remove("dragover");
  });

  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.classList.remove("dragover");
    const file = e.dataTransfer.files[0];
    if (file) handlePDFFile(file);
  });

  // ---------- File input change (click-to-browse result) ----------
  pdfInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) handlePDFFile(file);
  });

  // ---------- "Paste text instead" toggle ----------
  pasteInsteadBtn.addEventListener("click", () => {
    dropzone.classList.add("hidden");
    parseError.classList.add("hidden");
    resumeReview.classList.remove("hidden");
    resumeStatus.classList.add("hidden");
    resumeTextArea.value = "";
    resumeTextArea.focus();
    updateAnalyzeButtonState();
  });

  // ---------- Handle a dropped/selected PDF file ----------
  async function handlePDFFile(file) {
    parseError.classList.add("hidden");
    dropzone.classList.add("hidden");
    resumeReview.classList.remove("hidden");
    resumeStatus.classList.remove("hidden");
    resumeStatus.classList.remove("error");
    resumeStatusText.textContent = "Reading your resume...";
    resumeTextArea.value = "";

    try {
      const extractedText = await extractTextFromPDF(file);
      resumeStatusText.textContent = `Extracted from ${escapeHTML(file.name)}`;
      resumeTextArea.value = extractedText;
      updateAnalyzeButtonState();
    } catch (err) {
      // Parsing failed — show the error and fall back to plain-text paste,
      // per the PRD's graceful-degradation requirement (FR-1.4).
      resumeReview.classList.add("hidden");
      dropzone.classList.remove("hidden");
      parseError.textContent = err.message || "We couldn't read this PDF. Please paste your resume text instead.";
      parseError.classList.remove("hidden");
    }
  }

  // ---------- Resume textarea live updates ----------
  resumeTextArea.addEventListener("input", () => {
    resumeTextValue = resumeTextArea.value;
    updateAnalyzeButtonState();
  });

  // ---------- JD textarea live validation ----------
  jdTextArea.addEventListener("input", () => {
    const length = jdTextArea.value.length;
    jdCharCounter.textContent = `${length} / ${MIN_JD_LENGTH} characters minimum`;
    jdCharCounter.classList.toggle("valid", length >= MIN_JD_LENGTH);
    updateAnalyzeButtonState();
  });

  // ---------- Enable/disable Analyze button based on both inputs ----------
  function updateAnalyzeButtonState() {
    const resumeReady = resumeTextArea.value.trim().length >= MIN_RESUME_LENGTH;
    const jdReady = jdTextArea.value.trim().length >= MIN_JD_LENGTH;
    analyzeBtn.disabled = !(resumeReady && jdReady);
  }

  // ---------- Analyze button click — calls the real AI engine ----------
  analyzeBtn.addEventListener("click", async () => {
    const resumeText = resumeTextArea.value.trim();
    const jdText = jdTextArea.value.trim();
    const resultArea = document.getElementById("resultArea");
    const reportContainer = document.getElementById("reportContainer");
    const analyzeHint = document.getElementById("analyzeHint");

    analyzeBtn.disabled = true;
    reportContainer.innerHTML = "";
    analyzeHint.textContent = "Analyzing your fit... this takes about 15-20 seconds.";
    resultArea.innerHTML = `
      <div class="card-flat text-center loading-row" role="status" aria-live="polite">
        <span class="spinner" aria-hidden="true"></span>
        <p style="margin: 0;">Analyzing your resume against this job description...</p>
      </div>
    `;

    try {
      const report = await runAnalysis(resumeText, jdText);
      console.log("Analysis complete:", report);
      resultArea.innerHTML = "";
      renderReport(report, reportContainer);
      renderSaveArea(report);
      reportContainer.scrollIntoView({ behavior: "smooth", block: "start" });
      analyzeHint.textContent = "Analysis complete — see your full report below.";
    } catch (err) {
      // Should be extremely rare — runAnalysis() (Milestone 2) always
      // resolves via the offline fallback. This catch is a final safety net.
      console.error("Analysis failed unexpectedly:", err);
      resultArea.innerHTML = `
        <div class="alert alert-error">
          <strong>Something went wrong:</strong> ${escapeHTML(err.message || "Unknown error")}
        </div>
      `;
      analyzeHint.textContent = "Something went wrong — see the message above.";
    } finally {
      analyzeBtn.disabled = false;
    }
  });
  /**
   * Renders the "Save This Analysis" action below the report, using the
   * company/title fields (prompting inline if they're empty).
   */
  function renderSaveArea(report) {
    const saveArea = document.getElementById("saveArea");
    saveArea.classList.remove("hidden");
    saveArea.innerHTML = `
      <button type="button" id="saveAnalysisBtn" class="btn btn-secondary">💾 Save This Analysis</button>
      <div id="saveStatus" class="mt-2"></div>
    `;

    document.getElementById("saveAnalysisBtn").addEventListener("click", () => {
      const companyInput = document.getElementById("companyNameInput");
      const titleInput = document.getElementById("jobTitleInput");
      const saveStatus = document.getElementById("saveStatus");

      let companyName = companyInput.value.trim();
      let jobTitle = titleInput.value.trim();

      if (!companyName || !jobTitle) {
        companyInput.scrollIntoView({ behavior: "smooth", block: "center" });
        companyInput.focus();
        saveStatus.innerHTML = `<div class="alert alert-error">Please fill in the Company &amp; Role fields above (Step 3) before saving.</div>`;
        return;
      }

      const result = saveAnalysis({ companyName, jobTitle, fullReport: report });
      if (result.success) {
        saveStatus.innerHTML = `<div class="alert alert-info">✓ Saved! View it anytime on your <a href="dashboard.html">Dashboard</a>.</div>`;
        document.getElementById("saveAnalysisBtn").disabled = true;
        document.getElementById("saveAnalysisBtn").textContent = "✓ Saved";
      } else {
        saveStatus.innerHTML = `<div class="alert alert-error">Could not save: ${escapeHTML(result.error || "unknown error")}</div>`;
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", initAnalyzePage);
