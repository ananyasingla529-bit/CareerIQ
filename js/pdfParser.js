/**
 * pdfParser.js — Client-side PDF text extraction using PDF.js.
 * Exposes: extractTextFromPDF(file) -> Promise<string>
 * Throws: PDFParseError if the file can't be read or contains no extractable text
 *         (e.g. a scanned/image-only PDF) — caller should catch this and fall
 *         back to the plain-text paste UI.
 */

class PDFParseError extends Error {
  constructor(message) {
    super(message);
    this.name = "PDFParseError";
  }
}

// Point PDF.js at the matching worker script (must match the CDN version in analyze.html).
if (typeof pdfjsLib !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
}

/**
 * Extracts text content from a PDF File object.
 * @param {File} file - a File from an <input type="file"> or drag-drop event
 * @returns {Promise<string>} the extracted, whitespace-cleaned text
 */
async function extractTextFromPDF(file) {
  if (!file || file.type !== "application/pdf") {
    throw new PDFParseError("The selected file is not a PDF.");
  }

  const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024; // 8MB
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new PDFParseError(
      "This PDF is larger than 8MB, which is too big to process reliably in the browser. Please try a smaller file or paste your resume text instead."
    );
  }

  let pdf;
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    pdf = await loadingTask.promise;
  } catch (err) {
    throw new PDFParseError("This PDF could not be opened. It may be corrupted or password-protected.");
  }

  let fullText = "";
  try {
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item) => item.str).join(" ");
      fullText += pageText + "\n\n";
    }
  } catch (err) {
    throw new PDFParseError("An error occurred while reading the PDF's text content.");
  }

  const cleanedText = fullText.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();

  // Image-only / scanned PDFs produce little to no extractable text — treat as a failure
  // so the UI can offer the plain-text fallback instead of showing a near-empty box.
  if (cleanedText.length < 50) {
    throw new PDFParseError(
      "We couldn't find readable text in this PDF (it may be a scanned image). Please paste your resume text instead."
    );
  }

  return cleanedText;
}
