import { runAI } from "./aiClient.js";

/**
 * Fallback heuristic parser in case Gemini fails.
 * Tries to catch obvious test lines from messy OCR.
 */
function heuristicExtract(rawText) {
  // normalize spacing and symbols
  const normalized = rawText
    .replace(/[^\S\r\n]+/g, " ")
    .replace(/\u00B5|µ|μ/g, "u");

  // split into candidate lines
  const lines = normalized
    .split(/\r?\n|[,;]/)
    .map(line => line.trim())
    .filter(Boolean);

  const results = [];

  for (let line of lines) {
    // skip obvious metadata
    if (/^(name|age|sex|address|registered|reported|sample|instrument|interpretation|clinical)/i.test(line)) {
      continue;
    }

    // fix common OCR mistakes
    line = line
      .replace(/\bHemglobin\b/gi, "Hemoglobin")
      .replace(/\bREC\b/gi, "RBC")
      .replace(/\bumm\b/gi, "/cumm")
      .replace(/\bmillcumm\b/gi, "mill/cumm")
      .replace(/\bHgh\b/gi, "High");

    // standardize status markers
    line = line
      .replace(/\bLow\b/gi, "(Low)")
      .replace(/\bHigh\b/gi, "(High)")
      .replace(/\bBorderline\b/gi, "(Borderline)");

    const hasNumber = /\d/.test(line);
    const hasUnit = /(g\/dL|\/uL|\/cumm|mill\/cumm|%|mg\/dL|mmol\/L|10\^\d+\/[a-zA-Z]+)/i.test(line);
    const hasWord = /[A-Za-z]{3,}/.test(line);

    if (hasNumber && hasUnit && hasWord) {
      results.push(line);
    }
  }

  // remove duplicates
  return [...new Set(results)];
}

/**
 * Build a prompt for Gemini to clean OCR text.
 */
function buildExtractionPrompt(ocrText) {
  return `
You are cleaning OCR output of a lab report.
- Extract only lab test result lines.
- Fix common typos (Hemglobin → Hemoglobin, REC → RBC, etc.).
- Each item must look like: "Name Value Unit (Status?)".
- Add (Low)/(High)/(Borderline) only if clearly present.
- Do not invent tests.

Return JSON exactly like this:
{"tests_raw": ["...","..."]}

OCR INPUT:
"""${ocrText.slice(0, 8000)}"""`;
}

/**
 * Step 1: OCR/Text Extraction with Gemini, with fallback to regex heuristics.
 */
export async function extractFromText(rawText) {
  try {
    const prompt = buildExtractionPrompt(rawText);
    const aiResult = await runAI(prompt, "json");

    let tests = Array.isArray(aiResult.tests_raw) ? aiResult.tests_raw : [];

    // post-cleaning: drop junk
    tests = tests
      .map(t => t.trim())
      .filter(Boolean)
      .filter(line => /\d/.test(line) && /(g\/dL|\/uL|\/cumm|mill\/cumm|%|mg\/dL|mmol\/L|10\^\d+\/[a-zA-Z]+)/i.test(line));

    // fallback if Gemini returns nothing useful
    if (tests.length === 0) {
      tests = heuristicExtract(rawText);
    }

    const confidence = tests.length ? 0.9 : 0.6;
    return { tests_raw: tests, confidence: Number(confidence.toFixed(2)) };

  } catch (err) {
    console.error("[extractFromText] Gemini failed:", err.message);

    const fallback = heuristicExtract(rawText);
    const confidence = fallback.length ? 0.75 : 0.5;

    return { tests_raw: fallback, confidence: Number(confidence.toFixed(2)) };
  }
}
