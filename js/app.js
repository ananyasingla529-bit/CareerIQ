/**
 * app.js — Shared initialization for every CareerIQ page.
 * Responsibilities:
 *   1. Inject the site header (logo + nav) and footer into every page
 *   2. Highlight the active nav link based on the current page
 *   3. Handle the mobile nav toggle
 *   4. Expose small shared utility functions used by other modules
 */

/** Pages and their nav labels — single source of truth for the nav menu. */
const NAV_LINKS = [
  { href: "index.html", label: "Home" },
  { href: "analyze.html", label: "Analyze" },
  { href: "dashboard.html", label: "Dashboard" },
];

/**
 * Builds and inserts the <header> nav bar at the top of <body>.
 * Runs on every page via initApp().
 */
function renderHeader() {
  const currentPage = window.location.pathname.split("/").pop() || "index.html";

  const navItemsHTML = NAV_LINKS.map((link) => {
    const activeClass = link.href === currentPage ? " active" : "";
    return `<li><a href="${link.href}" class="${activeClass.trim()}">${link.label}</a></li>`;
  }).join("");

  const headerHTML = `
    <header class="site-header">
      <div class="container">
        <a href="index.html" class="site-logo">CareerIQ</a>
        <button class="nav-toggle" id="navToggle" aria-label="Toggle navigation">&#9776;</button>
        <ul class="site-nav" id="siteNav">
          ${navItemsHTML}
        </ul>
      </div>
    </header>
  `;

  document.body.insertAdjacentHTML("afterbegin", headerHTML);
}

/**
 * Builds and inserts the <footer> at the bottom of <body>.
 */
function renderFooter() {
  const footerHTML = `
    <footer class="site-footer">
      <div class="container">
        <p>CareerIQ — Smarter Job Decisions Start Here.</p>
        <p class="challenge-footer-note">Built with Claude as part of the AB Talks 60-Day Claude AI Challenge.</p>
      </div>
    </footer>
  `;
  document.body.insertAdjacentHTML("beforeend", footerHTML);
}

/**
 * Wires up the mobile hamburger menu toggle.
 * Must run AFTER renderHeader() since it needs #navToggle to exist in the DOM.
 */
function initMobileNav() {
  const toggleBtn = document.getElementById("navToggle");
  const nav = document.getElementById("siteNav");
  if (!toggleBtn || !nav) return;

  toggleBtn.addEventListener("click", () => {
    nav.classList.toggle("open");
  });
}

/**
 * Shared utility: escape a string for safe insertion into innerHTML,
 * used by later modules (report.js, dashboard.js) when rendering
 * user-provided or AI-provided text to prevent broken markup.
 */
function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

/**
 * Shared utility: format an ISO date string into a short readable date,
 * e.g. "2026-07-30T10:00:00Z" -> "Jul 30, 2026".
 * Used by dashboard.js and compare.js.
 */
function formatDate(isoString) {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch (e) {
    return isoString;
  }
}

/**
 * Entry point — call this once at the bottom of every page's inline script.
 */
function initApp() {
  renderHeader();
  renderFooter();
  initMobileNav();
}

// Auto-run on every page as soon as the DOM is ready.
document.addEventListener("DOMContentLoaded", initApp);
