// regenerate-archive.js — Rebuilds archive.html from files in archive/
// Works for both forex and equities repos. Detects which by filename pattern.

import fs from "fs";
import path from "path";

const archiveDir = "archive";

if (!fs.existsSync(archiveDir)) {
  console.log("No archive directory found — skipping archive regeneration.");
  process.exit(0);
}

// Get all dated HTML files, sort newest first
const files = fs
  .readdirSync(archiveDir)
  .filter((f) => f.endsWith(".html") && /^\d{4}-\d{2}-\d{2}/.test(f))
  .sort()
  .reverse();

// Detect brief type from filenames
const isEquities = files.some((f) => f.includes("equities"));
const briefType = isEquities ? "EQUITIES" : "FX";
const briefTitle = isEquities ? "Equities Brief Archive" : "FX Brief Archive";
const accentColor = isEquities ? "#22c55e" : "#00d4ff";
const repoUrl = isEquities
  ? "https://cbell0920.github.io/equities-brief"
  : "https://cbell0920.github.io/forex-brief";

// Build list items
const listItems = files
  .map((f) => {
    const dateMatch = f.match(/^(\d{4}-\d{2}-\d{2})/);
    const date = dateMatch ? dateMatch[1] : f.replace(".html", "");
    return `        <li><a href="archive/${f}">${date}</a></li>`;
  })
  .join("\n");

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${briefTitle} — TPTraders</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0a0e1a;
      color: #e2e8f0;
      font-family: 'Consolas', 'JetBrains Mono', monospace;
      min-height: 100vh;
      padding: 2rem;
    }
    header {
      border-bottom: 1px solid #1e2d4a;
      padding-bottom: 1rem;
      margin-bottom: 2rem;
    }
    h1 {
      font-size: 1.4rem;
      color: ${accentColor};
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }
    .sub {
      color: #64748b;
      font-size: 0.8rem;
      margin-top: 0.25rem;
    }
    .today-link {
      display: inline-block;
      margin-bottom: 1.5rem;
      padding: 0.5rem 1rem;
      background: ${accentColor};
      color: #0a0e1a;
      text-decoration: none;
      font-weight: bold;
      font-size: 0.85rem;
      border-radius: 4px;
      letter-spacing: 0.05em;
    }
    .today-link:hover { opacity: 0.85; }
    h2 {
      font-size: 0.9rem;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 0.75rem;
    }
    ul { list-style: none; }
    li { margin-bottom: 0.4rem; }
    a {
      color: #94a3b8;
      text-decoration: none;
      font-size: 0.9rem;
    }
    a:hover { color: ${accentColor}; }
    footer {
      margin-top: 3rem;
      color: #334155;
      font-size: 0.75rem;
      border-top: 1px solid #1e2d4a;
      padding-top: 1rem;
    }
  </style>
</head>
<body>
  <header>
    <h1>TPTRADERS / ${briefType} BRIEF</h1>
    <div class="sub">Daily Intelligence Archive · Not financial advice</div>
  </header>

  <a class="today-link" href="${repoUrl}/index.html">▶ VIEW TODAY'S BRIEF</a>

  <h2>Archive (${files.length} brief${files.length !== 1 ? "s" : ""})</h2>
  <ul>
${listItems}
  </ul>

  <footer>
    Auto-generated · TPTraders · Verify all data before trading
  </footer>
</body>
</html>`;

fs.writeFileSync("archive.html", html, "utf8");
console.log(`✓ Rebuilt archive.html with ${files.length} entries`);
