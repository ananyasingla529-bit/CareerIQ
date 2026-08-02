/**
 * offlineEngine.js — Deterministic, rule-based fallback analysis.
 * Produces the exact same locked JSON schema as aiEngine.js (see SCHEMA.md),
 * so report.js can render either output identically. This is the guaranteed
 * "always succeeds" path — the app's core reliability promise.
 *
 * Exposes: generateOfflineReport(resumeText, jdText) -> AnalysisReport
 */

/**
 * Scoring formula (documented for interview-readiness):
 * - Skill match ratio = (skills found in BOTH resume & JD) / (skills found in JD)
 * - technicalSkills, keywords categories both derive from this same ratio
 *   (technicalSkills weights slightly higher on hard/technical taxonomy terms;
 *   for this MVP's compact taxonomy they are treated equivalently)
 * - experience: heuristic based on presence of common experience-indicating
 *   terms (years, "experience", job titles) in the resume relative to JD asks
 * - education/eligibility: regex-based detection of degree/CGPA/graduation year
 * - projects: heuristic based on presence of "project"-related keywords
 * - softSkills: match ratio against the soft-skills subset of the taxonomy
 * - overallFitScore: weighted average of all 7 category scores
 */
const CATEGORY_WEIGHTS = {
  technicalSkills: 0.25,
  experience: 0.15,
  education: 0.10,
  projects: 0.15,
  softSkills: 0.10,
  eligibility: 0.15,
  keywords: 0.10,
};

const SOFT_SKILL_NAMES = ["communication", "leadership", "teamwork", "problem solving", "time management", "self-motivated"];

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function computeSkillMatch(resumeText, jdText) {
  const jdSkills = extractSkillsFromText(jdText);
  const resumeSkills = extractSkillsFromText(resumeText);
  const matched = jdSkills.filter((s) => resumeSkills.includes(s));
  const missing = jdSkills.filter((s) => !resumeSkills.includes(s));
  const ratio = jdSkills.length > 0 ? matched.length / jdSkills.length : 0.5;
  return { jdSkills, resumeSkills, matched, missing, ratio };
}

function computeExperienceScore(resumeText) {
  const lower = resumeText.toLowerCase();
  let score = 40; // baseline
  if (/\b\d+\+?\s*(years?|yrs?)\b/.test(lower)) score += 25;
  if (/intern|internship/.test(lower)) score += 15;
  if (/experience|worked at|employed/.test(lower)) score += 15;
  if (/led|managed|founded|built/.test(lower)) score += 5;
  return clamp(score, 0, 100);
}

function computeEducationEligibilityScore(resumeText, jdText) {
  const flags = [];
  let score = 70; // baseline — assume fine unless a clear mismatch is detected

  const jdCgpaMatch = jdText.match(/(\d\.\d{1,2})\s*(cgpa|gpa)/i);
  const resumeCgpaMatch = resumeText.match(/(\d\.\d{1,2})\s*(cgpa|gpa)/i);
  if (jdCgpaMatch) {
    const required = parseFloat(jdCgpaMatch[1]);
    if (resumeCgpaMatch) {
      const actual = parseFloat(resumeCgpaMatch[1]);
      if (actual < required) {
        score -= 30;
        flags.push({
          issue: `Job requires a minimum CGPA of ${required}, resume shows ${actual}.`,
          evidenceJD: jdCgpaMatch[0],
          isHardBlocker: true,
        });
      }
    }
  }

  const jdYearMatch = jdText.match(/graduat(?:ion|ing)?\s*(?:year|in)?\s*(\d{4})/i);
  if (jdYearMatch) {
    const resumeHasYear = resumeText.includes(jdYearMatch[1]);
    if (!resumeHasYear) {
      flags.push({
        issue: `Job mentions a graduation year requirement (${jdYearMatch[1]}) that could not be confirmed on the resume.`,
        evidenceJD: jdYearMatch[0],
        isHardBlocker: false,
      });
      score -= 10;
    }
  }

  const degreeTerms = ["bachelor", "b.tech", "b.e.", "master", "m.tech", "degree", "diploma"];
  const jdMentionsDegree = degreeTerms.some((t) => jdText.toLowerCase().includes(t));
  const resumeMentionsDegree = degreeTerms.some((t) => resumeText.toLowerCase().includes(t));
  if (jdMentionsDegree && !resumeMentionsDegree) {
    score -= 15;
    flags.push({
      issue: "Job description mentions a degree requirement that isn't clearly stated on the resume.",
      evidenceJD: "degree/education requirement mentioned in job description",
      isHardBlocker: false,
    });
  }

  return { score: clamp(score, 0, 100), flags };
}

function computeProjectsScore(resumeText) {
  const lower = resumeText.toLowerCase();
  let score = 40;
  const projectMentions = (lower.match(/project/g) || []).length;
  score += Math.min(projectMentions * 10, 40);
  if (/github\.com|portfolio/.test(lower)) score += 15;
  return clamp(score, 0, 100);
}

function computeSoftSkillsScore(resumeText, jdText) {
  const jdSoft = extractSkillsFromText(jdText).filter((s) => SOFT_SKILL_NAMES.includes(s));
  const resumeSoft = extractSkillsFromText(resumeText).filter((s) => SOFT_SKILL_NAMES.includes(s));
  if (jdSoft.length === 0) return 70; // JD didn't specify soft skills — neutral-positive default
  const matched = jdSoft.filter((s) => resumeSoft.includes(s));
  return clamp(Math.round((matched.length / jdSoft.length) * 100), 0, 100);
}

/**
 * Generates a complete offline AnalysisReport (same shape as the AI engine).
 * @param {string} resumeText
 * @param {string} jdText
 * @returns {Object} AnalysisReport
 */
function generateOfflineReport(resumeText, jdText) {
  const skillMatch = computeSkillMatch(resumeText, jdText);
  const experienceScore = computeExperienceScore(resumeText);
  const { score: eduScore, flags: eligibilityFlags } = computeEducationEligibilityScore(resumeText, jdText);
  const projectsScore = computeProjectsScore(resumeText);
  const softSkillsScore = computeSoftSkillsScore(resumeText, jdText);
  const skillScorePercent = clamp(Math.round(skillMatch.ratio * 100), 0, 100);

  const categoryScores = {
    technicalSkills: skillScorePercent,
    experience: experienceScore,
    education: eduScore,
    projects: projectsScore,
    softSkills: softSkillsScore,
    eligibility: eduScore,
    keywords: skillScorePercent,
  };

  const overallFitScore = clamp(
    Math.round(
      Object.entries(categoryScores).reduce(
        (sum, [key, score]) => sum + score * CATEGORY_WEIGHTS[key],
        0
      )
    ),
    0,
    100
  );

  const strengths = skillMatch.matched.slice(0, 6).map((skill) => ({
    point: `Your resume shows experience with ${skill}, which this job requires.`,
    evidenceResume: `mentions "${skill}"`,
    evidenceJD: `mentions "${skill}"`,
  }));

  const gaps = skillMatch.missing.slice(0, 6).map((skill) => ({
    point: `This job lists "${skill}" as a requirement, which wasn't found on your resume.`,
    evidenceJD: `mentions "${skill}"`,
    severity: skillMatch.missing.indexOf(skill) < 3 ? "major" : "minor",
  }));

  const recommendations = [];
  if (skillMatch.missing.length > 0) {
    recommendations.push(`Consider adding or highlighting: ${skillMatch.missing.slice(0, 3).join(", ")}.`);
  }
  if (projectsScore < 60) {
    recommendations.push("Add more detail about relevant projects, including a link to your GitHub or portfolio.");
  }
  if (experienceScore < 60) {
    recommendations.push("Quantify your experience more clearly (e.g., years, specific roles, measurable outcomes).");
  }
  if (recommendations.length === 0) {
    recommendations.push("Your resume looks well-aligned with this role — consider tailoring your summary to mirror the JD's key terms.");
  }

  const whyGoodFit = [];
  if (skillMatch.matched.length > 0) {
    whyGoodFit.push(`You already have ${skillMatch.matched.length} of the skills this job is looking for.`);
  }
  if (softSkillsScore >= 50) {
    whyGoodFit.push("Your resume reflects strong soft skills that align with what this role values.");
  }
  whyGoodFit.push("Skills are learnable — a strong foundation and willingness to grow often matter as much as a perfect keyword match.");
  if (projectsScore >= 50) {
    whyGoodFit.push("Your project experience demonstrates practical, hands-on ability beyond just listed skills.");
  }
  whyGoodFit.push("Every gap identified here is an opportunity — not a disqualifier — especially early in a career.");

  let tier, recommendedAction;
  if (overallFitScore >= 80) { tier = "apply_now"; recommendedAction = "apply_now"; }
  else if (overallFitScore >= 60) { tier = "improve_first"; recommendedAction = "improve_resume"; }
  else if (overallFitScore >= 40) { tier = "borderline"; recommendedAction = "save_for_later"; }
  else { tier = "upskill_first"; recommendedAction = "learn_skills"; }

  const hasHardBlocker = eligibilityFlags.some((f) => f.isHardBlocker);
  if (hasHardBlocker) {
    recommendedAction = "not_a_match";
  }

  const tierLabels = {
    apply_now: "Apply Now",
    improve_first: "Apply, But Improve These Areas First",
    borderline: "Borderline Match — Apply Only If Interested",
    upskill_first: "Focus on Upskilling Before Applying",
  };

  const reasoning = [
    {
      conclusion: `Overall fit score of ${overallFitScore} was calculated from a weighted average of 7 categories.`,
      explanation: `Technical skills and keyword matching contributed most heavily (25% + 10% weight), based on ${skillMatch.matched.length} matched and ${skillMatch.missing.length} missing skills out of ${skillMatch.jdSkills.length} detected in the job description.`,
      confidence: skillMatch.jdSkills.length >= 3 ? "medium" : "low",
    },
    {
      conclusion: `Eligibility score of ${eduScore} was based on rule-based detection.`,
      explanation: eligibilityFlags.length > 0
        ? `${eligibilityFlags.length} eligibility flag(s) were detected via pattern matching (CGPA, graduation year, or degree mentions).`
        : "No CGPA, graduation year, or degree mismatches were detected via pattern matching.",
      confidence: "medium",
    },
  ];

  return {
    overallFitScore,
    analysisMode: "offline",
    categoryScores,
    strengths,
    gaps,
    eligibilityFlags,
    recommendations,
    whyGoodFit,
    applyConfidence: { tier, label: tierLabels[tier] },
    recommendedAction,
    reasoning,
  };
}
