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

  // ---------- Analyze button click (temporary — real engine wired Day 5/6) ----------
  analyzeBtn.addEventListener("click", () => {
    const resumeText = resumeTextArea.value.trim();
    const jdText = jdTextArea.value.trim();
    console.log("Ready to analyze. Captured input:", { resumeText, jdText });
    alert(
      "Input captured successfully! Check the browser console (F12) to see the resume and JD text.\n\n" +
      "The real AI analysis engine will be wired up on Day 5."
    );
  });
}

document.addEventListener("DOMContentLoaded", initAnalyzePage);
