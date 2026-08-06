/**
 * proxy/cloudflare-worker.js — CareerIQ's serverless AI proxy.
 * Deployed on Cloudflare Workers. Hides the Gemini API key from the browser.
 *
 * POST / with { type: "analyze", resumeText, jdText }
 *   -> { success: true, data: <AnalysisReport> }
 *
 * POST / with { type: "rewrite", resumeText, jdText, gaps: string[] }
 *   -> { success: true, data: { suggestions: [{ skillOrGap, suggestedBullet, placementHint }] } }
 *
 * Both -> { success: false, error: { code, message } } on failure.
 * "type" defaults to "analyze" if omitted, so existing clients keep working.
 */

const ANALYZE_SYSTEM_PROMPT = `You are an expert career coach AI. You will be given a candidate's resume text and a job description. Analyze the fit between them and respond with ONLY valid JSON (no markdown fences, no preamble, no explanation text outside the JSON) matching EXACTLY this schema:

{
  "overallFitScore": <integer 0-100>,
  "analysisMode": "ai",
  "categoryScores": {
    "technicalSkills": <integer 0-100>,
    "experience": <integer 0-100>,
    "education": <integer 0-100>,
    "projects": <integer 0-100>,
    "softSkills": <integer 0-100>,
    "eligibility": <integer 0-100>,
    "keywords": <integer 0-100>
  },
  "strengths": [{ "point": "<string>", "evidenceResume": "<short quote from resume>", "evidenceJD": "<short quote from JD>" }],
  "gaps": [{ "point": "<string>", "evidenceJD": "<short quote from JD>", "severity": "minor" | "major" }],
  "eligibilityFlags": [{ "issue": "<string>", "evidenceJD": "<short quote from JD>", "isHardBlocker": <true|false> }],
  "recommendations": ["<string>"],
  "whyGoodFit": ["<3 to 5 short strings highlighting transferable skills and strengths>"],
  "applyConfidence": { "tier": "apply_now" | "improve_first" | "borderline" | "upskill_first", "label": "<short human label>" },
  "recommendedAction": "apply_now" | "improve_resume" | "learn_skills" | "save_for_later" | "not_a_match",
  "reasoning": [{ "conclusion": "<string>", "explanation": "<string>", "confidence": "high" | "medium" | "low" }]
}

Scoring guide: applyConfidence.tier should be "apply_now" for overallFitScore 80-100, "improve_first" for 60-79, "borderline" for 40-59, "upskill_first" for below 40. Reason like a thoughtful, encouraging career coach — consider transferable skills and equivalent technologies, not just exact keyword matches. Every array may be empty if genuinely not applicable, but the keys must always be present. Return ONLY the JSON object, nothing else.`;

const REWRITE_SYSTEM_PROMPT = `You are an expert resume writer helping a candidate better reflect skills they already have. You will be given the candidate's resume text, a job description, and a list of specific skills or gaps the job requires that aren't clearly showing up on the resume.

For EACH item in the gaps list, decide honestly:
- If the candidate's resume shows real evidence of related experience with that skill (even under a different name, a related tool, or an adjacent project) that is just not phrased clearly, write a concrete, specific suggested resume bullet point they could add or edit to surface it. Ground the suggestion in something actually present in their resume — do not invent experience they don't have.
- If there is truly no evidence of that skill anywhere in the resume, do not fabricate a suggestion — instead set "suggestedBullet" to null and explain in "placementHint" that this looks like a genuine skill gap to learn, not a phrasing issue.

Respond with ONLY valid JSON (no markdown fences, no preamble) matching EXACTLY this schema:

{
  "suggestions": [
    {
      "skillOrGap": "<the skill or gap this addresses, from the provided list>",
      "suggestedBullet": "<a specific, resume-ready bullet point in the candidate's own voice, grounded in their real experience> or null if no real evidence exists",
      "placementHint": "<short guidance on where to add it, e.g. 'Add to your Projects section under X' or, if suggestedBullet is null, an honest note that this is a real skill gap to learn>"
    }
  ]
}

Keep each suggestedBullet under 200 characters, specific and metrics-oriented where possible. Return ONLY the JSON object, nothing else.`;

const ALLOWED_ORIGINS = [
  "https://ananyasingla529-bit.github.io",
  "http://127.0.0.1:5500",
  "http://localhost:5500",
];

function corsHeaders(origin) {
  const isAllowed = ALLOWED_ORIGINS.includes(origin);
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function jsonResponse(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
  });
}

/** Strips markdown code fences if the model adds them despite instructions. */
function cleanJSONText(text) {
  return text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
}

/** Validates the parsed object has every required key the analysis schema needs. */
function isValidReportShape(obj) {
  if (!obj || typeof obj !== "object") return false;
  const requiredTopLevel = [
    "overallFitScore", "analysisMode", "categoryScores", "strengths", "gaps",
    "eligibilityFlags", "recommendations", "whyGoodFit", "applyConfidence",
    "recommendedAction", "reasoning",
  ];
  for (const key of requiredTopLevel) {
    if (!(key in obj)) return false;
  }
  const requiredCategories = [
    "technicalSkills", "experience", "education", "projects",
    "softSkills", "eligibility", "keywords",
  ];
  for (const cat of requiredCategories) {
    if (!(cat in obj.categoryScores)) return false;
  }
  return true;
}

/** Validates the parsed object has the shape the rewrite endpoint needs. */
function isValidRewriteShape(obj) {
  if (!obj || typeof obj !== "object") return false;
  if (!Array.isArray(obj.suggestions)) return false;
  return obj.suggestions.every(
    (s) => s && typeof s === "object" && "skillOrGap" in s && "suggestedBullet" in s && "placementHint" in s
  );
}

/**
 * Calls Gemini with a given full prompt text, handling timeout/network/HTTP
 * errors uniformly. Returns either { ok: true, text } or
 * { ok: false, response: Response } (a ready-to-return error Response).
 */
async function callGemini(promptText, apiKey, origin) {
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

  const requestPayload = {
    contents: [{ role: "user", parts: [{ text: promptText }] }],
    generationConfig: { temperature: 0.4, maxOutputTokens: 4096 },
  };

  let geminiResponse;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);
    geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestPayload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
  } catch (err) {
    const code = err.name === "AbortError" ? "UPSTREAM_TIMEOUT" : "UPSTREAM_ERROR";
    return { ok: false, response: jsonResponse({ success: false, error: { code, message: "Could not reach the AI service." } }, 502, origin) };
  }

  if (!geminiResponse.ok) {
    const status = geminiResponse.status === 429 ? "RATE_LIMITED" : "UPSTREAM_ERROR";
    let detail = "";
    try {
      const errBody = await geminiResponse.text();
      detail = ` Details: ${errBody.slice(0, 300)}`;
    } catch (e) {
      // ignore — detail stays empty
    }
    return { ok: false, response: jsonResponse({ success: false, error: { code: status, message: `AI service returned status ${geminiResponse.status}.${detail}` } }, 502, origin) };
  }

  let geminiJson;
  try {
    geminiJson = await geminiResponse.json();
  } catch (err) {
    return { ok: false, response: jsonResponse({ success: false, error: { code: "MALFORMED_AI_RESPONSE", message: "AI service returned invalid JSON." } }, 502, origin) };
  }

  const textOutput = geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textOutput) {
    return { ok: false, response: jsonResponse({ success: false, error: { code: "MALFORMED_AI_RESPONSE", message: "AI service returned an unexpected response shape." } }, 502, origin) };
  }

  return { ok: true, text: textOutput };
}

async function handleAnalyze(body, apiKey, origin) {
  const { resumeText, jdText } = body || {};

  if (!resumeText || resumeText.length < 50 || !jdText || jdText.length < 100) {
    return jsonResponse({ success: false, error: { code: "INVALID_INPUT", message: "resumeText (50+ chars) and jdText (100+ chars) are required." } }, 400, origin);
  }

  const fullPrompt = `${ANALYZE_SYSTEM_PROMPT}\n\n---RESUME---\n${resumeText}\n\n---JOB DESCRIPTION---\n${jdText}`;
  const result = await callGemini(fullPrompt, apiKey, origin);
  if (!result.ok) return result.response;

  let parsedReport;
  try {
    parsedReport = JSON.parse(cleanJSONText(result.text));
  } catch (err) {
    return jsonResponse({ success: false, error: { code: "MALFORMED_AI_RESPONSE", message: "Could not parse the AI's JSON output." } }, 502, origin);
  }

  if (!isValidReportShape(parsedReport)) {
    return jsonResponse({ success: false, error: { code: "MALFORMED_AI_RESPONSE", message: "AI output did not match the required schema." } }, 502, origin);
  }

  parsedReport.analysisMode = "ai";
  return jsonResponse({ success: true, data: parsedReport }, 200, origin);
}

async function handleRewrite(body, apiKey, origin) {
  const { resumeText, jdText, gaps } = body || {};

  if (!resumeText || resumeText.length < 50 || !jdText || jdText.length < 50) {
    return jsonResponse({ success: false, error: { code: "INVALID_INPUT", message: "resumeText and jdText are required." } }, 400, origin);
  }
  if (!Array.isArray(gaps) || gaps.length === 0) {
    return jsonResponse({ success: false, error: { code: "INVALID_INPUT", message: "gaps must be a non-empty array of skill/gap strings." } }, 400, origin);
  }

  // Cap at 6 gaps per request — keeps the prompt focused and the response fast.
  const limitedGaps = gaps.slice(0, 6);

  const fullPrompt = `${REWRITE_SYSTEM_PROMPT}\n\n---RESUME---\n${resumeText}\n\n---JOB DESCRIPTION---\n${jdText}\n\n---GAPS TO ADDRESS---\n${limitedGaps.map((g) => `- ${g}`).join("\n")}`;
  const result = await callGemini(fullPrompt, apiKey, origin);
  if (!result.ok) return result.response;

  let parsedRewrite;
  try {
    parsedRewrite = JSON.parse(cleanJSONText(result.text));
  } catch (err) {
    return jsonResponse({ success: false, error: { code: "MALFORMED_AI_RESPONSE", message: "Could not parse the AI's JSON output." } }, 502, origin);
  }

  if (!isValidRewriteShape(parsedRewrite)) {
    return jsonResponse({ success: false, error: { code: "MALFORMED_AI_RESPONSE", message: "AI output did not match the required schema." } }, 502, origin);
  }

  return jsonResponse({ success: true, data: parsedRewrite }, 200, origin);
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin");

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(origin) });
    }

    if (request.method !== "POST") {
      return jsonResponse({ success: false, error: { code: "INVALID_METHOD", message: "Only POST is supported." } }, 405, origin);
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return jsonResponse({ success: false, error: { code: "INVALID_INPUT", message: "Request body must be valid JSON." } }, 400, origin);
    }

    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
      return jsonResponse({ success: false, error: { code: "SERVER_MISCONFIGURED", message: "API key not configured." } }, 500, origin);
    }

    const requestType = body?.type === "rewrite" ? "rewrite" : "analyze";

    if (requestType === "rewrite") {
      return handleRewrite(body, apiKey, origin);
    }
    return handleAnalyze(body, apiKey, origin);
  },
};
