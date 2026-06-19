// generate-brief.js — FX Morning Brief Generator
// Runs via GitHub Actions. Writes index.html and archives to archive/YYYYMMDD-forex.html

import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const TODAY = new Date()
  .toLocaleDateString("en-CA", { timeZone: "America/New_York" });
const NOW_UTC = new Date().toUTCString();

console.log(`Generating FX Morning Brief for ${TODAY}...`);

// ── SYSTEM PROMPT ──────────────────────────────────────────────────────────
const SYSTEM = `You are a senior FX analyst at TPTraders producing the daily pre-session FX Morning Brief.
Today's date is ${TODAY}. Use web search to gather current market data before writing.

Search for:
- Current FX rates and overnight moves for all 8 major currencies (USD, EUR, GBP, JPY, AUD, NZD, CAD, CHF)
- Latest central bank decisions, meeting dates, and policy stances for all 8 currencies
- Latest CFTC COT report (speculative positioning) for all 8 currencies
- Gold, WTI crude oil, and copper current prices and 24h moves
- Economic calendar events for the next 5 trading days
- Any significant overnight macro news (geopolitical, Fed speakers, data releases)

Your output must be a SINGLE complete HTML file — no markdown, no code fences, just raw HTML starting with <!DOCTYPE html>.
The file must be self-contained (all CSS and JS inline) and render correctly on GitHub Pages.`;

// ── USER PROMPT ─────────────────────────────────────────────────────────────
const USER = `Generate today's FX Morning Brief as a complete, self-contained HTML file.

REQUIRED SECTIONS (in this order):
1. Header bar: "FX/BRIEF ${TODAY} — TPTraders" | "Generated ${NOW_UTC}" | "Not financial advice"
2. Top summary row: RISK REGIME badge | USD BIAS badge | TOP CONVICTION pairs (top 3) | STRONGEST CURRENCIES (top 3)
3. Macro Environment — 2–3 paragraph narrative covering: dominant themes, key risk events, USD outlook, cross-currency dynamics
4. Central Banks — card for each of 8 currencies: flag emoji, currency, central bank name, STANCE badge (HAWKISH/NEUTRAL/DOVISH), current rate, next meeting date, 2-sentence stance summary
5. COT Positioning — table: Currency | Net Position | Bias arrow | Week Change | Note. Flag ⚠ for extreme readings (>2SD from 52wk avg).
6. Economic Calendar — next 5 trading days, format: DAY TIME | CCY | EVENT | Forecast vs Prior
7. Commodities — 3 cards: Gold (XAU/USD), WTI Crude, Copper — price, 24h % change, FX implication note
8. Currency Strength Ranking — ranked 1–8 with score bar and 24h % change
9. Top Pair Outliers table — top 7–8 high-conviction setups: Pair | LONG/SHORT | Conviction score (0–100) | Rationale | Key level
10. 28-Pair Conviction Matrix — all 28 major pairs in a grid: pair name | LONG/SHORT | score
11. Analyst Note — 1 substantive paragraph: dominant theme, top trade with entry rationale, key risk to thesis

DESIGN REQUIREMENTS:
- Background: #0a0e1a (dark navy)
- Text: #e2e8f0 (light)
- Accent colors: cyan #00d4ff for headers/highlights, amber for warnings, green for bullish, red for bearish
- Cards with #0f1629 background, 1px #1e2d4a border, 8px border-radius
- Monospace font (JetBrains Mono or Consolas) for data values
- HAWKISH badges: green background. DOVISH badges: red. NEUTRAL badges: gray.
- LONG badges: green. SHORT badges: red.
- Conviction scores: color-coded — 80+ = bright green, 60–79 = amber, below 60 = gray
- Fully responsive, mobile-friendly
- Print-friendly: @media print { background: white; color: black; hide non-essential chrome }
- Footer: "CLAUDE SONNET 4.6 · ${NOW_UTC} · TPTRADERS" | "Not financial advice · Verify all data before trading"

Start your response with <!DOCTYPE html> and nothing else. No preamble, no explanation.`;

// ── CALL API ────────────────────────────────────────────────────────────────
async function generateBrief() {
  try {
    console.log("Calling Anthropic API with web search...");

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8000,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      system: SYSTEM,
      messages: [{ role: "user", content: USER }],
    });

    // Extract all text blocks from the response (web search may produce multiple)
    const html = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("");

    if (!html.includes("<!DOCTYPE html>") && !html.includes("<html")) {
      throw new Error("Response does not appear to be valid HTML. Check API output.");
    }

    // Clean any accidental markdown fences
    const cleanHtml = html
      .replace(/^```html\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();

    // ── WRITE index.html ──
    fs.writeFileSync("index.html", cleanHtml, "utf8");
    console.log(`✓ Wrote index.html (${(cleanHtml.length / 1024).toFixed(1)} KB)`);

    // ── WRITE ARCHIVE COPY ──
    const archiveDir = path.join("archive");
    if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir);

    const archivePath = path.join(archiveDir, `${TODAY}-forex.html`);
    fs.writeFileSync(archivePath, cleanHtml, "utf8");
    console.log(`✓ Archived to ${archivePath}`);

  } catch (err) {
    console.error("Error generating brief:", err);
    process.exit(1);
  }
}

generateBrief();
