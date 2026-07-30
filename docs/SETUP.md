# CareerIQ — Setup Guide
**How to get the project running locally, from a clean machine, in under 10 minutes.**

---

## 1. Prerequisites

Since CareerIQ is deliberately built with **no framework and no build tools** (per the PRD's locked architecture), the setup list is short:

| Tool | Version | Purpose |
|---|---|---|
| **VS Code** | Latest | Code editor |
| **Live Server** (VS Code extension by Ritwick Dey) | Latest | Local dev server with auto-reload |
| **Node.js** | LTS (v20+) | Used for occasional local verification scripts only — not for building/bundling the app |
| **Git** | Latest | Version control |

Nothing else is required — no `npm install`, no database, no framework CLI.

---

## 2. Install Steps

### 2.1 Install VS Code
1. Download from **https://code.visualstudio.com**
2. Run the installer, keep default options (ensure "Add to PATH" is checked)

### 2.2 Install the Live Server Extension
1. Open VS Code → Extensions panel (`Ctrl+Shift+X`)
2. Search **"Live Server"** → install the one by **Ritwick Dey**

### 2.3 Install Node.js
1. Download the **LTS** version from **https://nodejs.org**
2. Run the installer, keep defaults
3. Verify: open a terminal and run:
   ```powershell
   node --version
   ```
   Expect output like `v24.x.x`

### 2.4 Git
Already installed and configured as of Day 2 — no action needed. Verify anytime with:
```powershell
git --version
```

---

## 3. Getting the Project Running

### 3.1 Clone the Repository (skip if already done)
```powershell
cd Documents
git clone https://github.com/ananyasingla529-bit/CareerIQ.git
cd CareerIQ
```

### 3.2 Open in VS Code
**File → Open Folder...** → select the `CareerIQ` folder.

> **Known issue:** On some machines, VS Code's Explorer sidebar may not display all files immediately after opening a folder that was populated via an external terminal (a caching/rendering quirk, not a data-loss issue). If this happens: use **File → Open File...** and browse to the exact file path directly — this always works regardless of the sidebar. All files are still safely present on disk (verify anytime with `tree /F` in PowerShell from the project folder).

### 3.3 Run Locally
1. Open `index.html` (via sidebar or **File → Open File...**)
2. Right-click inside the editor → **"Open with Live Server"**
3. Browser opens automatically at `http://127.0.0.1:5500/index.html`

You should see the CareerIQ landing page with the navy header, hero section, and 3 feature cards. Live Server auto-refreshes the browser any time you save a file — no manual reload needed while developing.

### 3.4 Verify Everything Works
- [ ] Landing page (`index.html`) loads with header, hero, and feature cards
- [ ] Clicking **"Analyze"** in the nav goes to `analyze.html` (placeholder page)
- [ ] Clicking **"Dashboard"** in the nav goes to `dashboard.html` (placeholder page)
- [ ] Narrowing the browser window below ~640px reveals a hamburger (☰) menu that toggles the nav

---

## 4. No Environment Variables Required (Yet)

v1.0's only secret (the Anthropic API key) is stored **server-side only**, as a Cloudflare Worker secret — never in this repository or any local `.env` file. This will be configured on **Day 5**, when the Cloudflare Worker proxy is built (see `ENVIRONMENT.md` for full detail on what's coming and why nothing is needed locally today).

---

## 5. Troubleshooting

| Problem | Fix |
|---|---|
| Live Server option doesn't appear on right-click | Confirm the extension is installed and enabled (Extensions panel, search "Live Server") |
| Page loads blank/unstyled | Check the browser's DevTools Console (F12) for a 404 on `styles.css` or `app.js` — usually a relative path issue |
| VS Code sidebar not showing project files | See the "Known issue" note in §3.2 — use File → Open File... as a reliable workaround |
| `node --version` not recognized | Re-open your terminal after installing Node.js (PATH only updates in new terminal sessions) |
