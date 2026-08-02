/**
 * skillsTaxonomy.js — Skill/keyword dictionary with synonym mapping,
 * used only by offlineEngine.js. Kept deliberately compact (breadth over
 * exhaustiveness) — sufficient for a strong MVP without over-investing
 * engineering time here.
 */

const SKILLS_TAXONOMY = {
  // Languages
  "javascript": ["js", "javascript", "ecmascript"],
  "typescript": ["ts", "typescript"],
  "python": ["python", "py"],
  "java": ["java"],
  "c++": ["c++", "cpp"],
  "c#": ["c#", "csharp"],
  "sql": ["sql", "mysql", "postgresql", "postgres", "t-sql", "pl/sql"],
  "html": ["html", "html5"],
  "css": ["css", "css3"],
  "go": ["go", "golang"],
  "ruby": ["ruby"],
  "php": ["php"],
  "r": ["r language", " r "],
  "swift": ["swift"],
  "kotlin": ["kotlin"],

  // Frameworks / Libraries
  "react": ["react", "react.js", "reactjs"],
  "angular": ["angular", "angular.js", "angularjs"],
  "vue": ["vue", "vue.js", "vuejs"],
  "node.js": ["node", "node.js", "nodejs"],
  "express": ["express", "express.js"],
  "django": ["django"],
  "flask": ["flask"],
  "spring": ["spring", "spring boot"],
  ".net": [".net", "dotnet", "asp.net"],
  "next.js": ["next.js", "nextjs"],
  "tensorflow": ["tensorflow"],
  "pytorch": ["pytorch"],

  // Tools / Platforms
  "git": ["git", "github", "gitlab", "version control"],
  "docker": ["docker", "containerization"],
  "kubernetes": ["kubernetes", "k8s"],
  "aws": ["aws", "amazon web services"],
  "azure": ["azure", "microsoft azure"],
  "gcp": ["gcp", "google cloud"],
  "rest api": ["rest api", "restful", "rest", "api development"],
  "graphql": ["graphql"],
  "ci/cd": ["ci/cd", "continuous integration", "continuous deployment", "jenkins"],
  "linux": ["linux", "unix"],
  "agile": ["agile", "scrum", "kanban"],
  "figma": ["figma"],
  "postman": ["postman"],

  // Data / AI
  "machine learning": ["machine learning", "ml"],
  "data structures": ["data structures", "dsa"],
  "algorithms": ["algorithms", "dsa"],
  "pandas": ["pandas"],
  "numpy": ["numpy"],
  "data analysis": ["data analysis", "data analytics"],
  "excel": ["excel", "ms excel", "microsoft excel"],
  "power bi": ["power bi", "powerbi"],
  "tableau": ["tableau"],

  // Soft skills
  "communication": ["communication", "communication skills"],
  "leadership": ["leadership"],
  "teamwork": ["teamwork", "team player", "collaboration"],
  "problem solving": ["problem solving", "problem-solving", "analytical thinking"],
  "time management": ["time management"],
  "self-motivated": ["self-motivated", "self motivated", "independent worker"],
};

/**
 * Extracts which canonical skills from the taxonomy appear in a given text.
 * Case-insensitive, checks all synonyms per skill.
 * @param {string} text
 * @returns {string[]} array of canonical skill names found
 */
function extractSkillsFromText(text) {
  if (!text) return [];
  const lowerText = text.toLowerCase();
  const found = [];

  for (const [canonicalName, synonyms] of Object.entries(SKILLS_TAXONOMY)) {
    const matched = synonyms.some((syn) => lowerText.includes(syn.toLowerCase()));
    if (matched) found.push(canonicalName);
  }

  return found;
}
