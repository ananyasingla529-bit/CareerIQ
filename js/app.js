/**
 * app.js — Shared initialization for every CareerIQ page.
 * Responsibilities:
 *   1. Apply the saved theme preference immediately (before header renders)
 *   2. Inject the site header (logo + nav + theme toggle) and footer
 *   3. Highlight the active nav link based on the current page
 *   4. Handle the mobile nav toggle and the light/dark theme toggle
 *   5. Expose small shared utility functions used by other modules
 */

const THEME_STORAGE_KEY = "careeriq_theme";

/**
 * Applies the saved theme (or defaults to "dark") to <html> as early as
 * possible, so the page never flashes the wrong theme on load.
 */
function applySavedTheme() {
  let saved = "dark";
  try {
    saved = localStorage.getItem(THEME_STORAGE_KEY) || "dark";
  } catch (e) {
    // localStorage unavailable — fall back silently to dark
  }
  document.documentElement.setAttribute("data-theme", saved);
}

// Apply immediately, before DOMContentLoaded, to avoid a flash of the wrong theme.
applySavedTheme();

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
    const ariaCurrent = link.href === currentPage ? ' aria-current="page"' : "";
    return `<li><a href="${link.href}" class="${activeClass.trim()}"${ariaCurrent}>${link.label}</a></li>`;
  }).join("");

  const skipLinkHTML = `<a href="#main-content" class="skip-link">Skip to main content</a>`;

  const currentTheme = document.documentElement.getAttribute("data-theme") || "dark";
  const isLight = currentTheme === "light";

  const headerHTML = `
    <header class="site-header">
      <div class="container">
        <a href="index.html" class="site-logo">CareerIQ</a>
        <div class="site-header-right">
          <ul class="site-nav" id="siteNav">
            ${navItemsHTML}
          </ul>
          <button
            type="button"
            class="theme-toggle"
            id="themeToggle"
            role="switch"
            aria-checked="${isLight}"
            aria-label="Toggle light and dark theme"
          >
            <span class="theme-toggle-label" id="themeToggleLabel">${isLight ? "Light" : "Dark"}</span>
            <span class="theme-toggle-track">
              <span class="theme-toggle-thumb">${isLight ? "☀️" : "🌙"}</span>
            </span>
          </button>
          <button class="nav-toggle" id="navToggle" aria-label="Toggle navigation menu" aria-expanded="false">&#9776;</button>
        </div>
      </div>
    </header>
  `;

  document.body.insertAdjacentHTML("afterbegin", skipLinkHTML);
  document.body.querySelector(".skip-link").insertAdjacentHTML("afterend", headerHTML);

  // Ensure the main content area is reachable/focusable for the skip link
  const main = document.querySelector("main");
  if (main && !main.id) {
    main.id = "main-content";
    main.setAttribute("tabindex", "-1");
  }
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
    const isOpen = nav.classList.toggle("open");
    toggleBtn.setAttribute("aria-expanded", String(isOpen));
  });
}

/**
 * Wires up the light/dark theme toggle switch.
 * Must run AFTER renderHeader() since it needs #themeToggle to exist in the DOM.
 */
function initThemeToggle() {
  const toggleBtn = document.getElementById("themeToggle");
  const label = document.getElementById("themeToggleLabel");
  const thumb = toggleBtn ? toggleBtn.querySelector(".theme-toggle-thumb") : null;
  if (!toggleBtn) return;

  toggleBtn.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") || "dark";
    const next = current === "light" ? "dark" : "light";

    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch (e) {
      // localStorage unavailable — theme choice just won't persist across visits
    }

    toggleBtn.setAttribute("aria-checked", String(next === "light"));
    if (label) label.textContent = next === "light" ? "Light" : "Dark";
    if (thumb) thumb.textContent = next === "light" ? "☀️" : "🌙";
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
  initThemeToggle();
}

// Auto-run on every page as soon as the DOM is ready.
document.addEventListener("DOMContentLoaded", initApp);
