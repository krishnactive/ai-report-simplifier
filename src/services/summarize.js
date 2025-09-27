import { runAI } from "./aiClient.js";
import { guardAgainstHallucination } from "../utils/guardrail.js";

export async function generateSummary(normalized, allowedNamesFromInput) {
  if (!normalized?.tests?.length) {
    return { status: "unprocessed", reason: "no tests provided" };
  }

  const hallucinationCheck = guardAgainstHallucination(normalized.tests, allowedNamesFromInput);
  if (hallucinationCheck) return hallucinationCheck;

  const prompt = `
Summarize these lab results in simple patient-friendly language.
Rules:
- Do NOT diagnose or recommend treatment.
- Mention ONLY the tests listed below.
- Be concise and clear.

Return strict JSON:
{
  "summary": "...",
  "explanations": ["...", "..."]
}

Tests:
${JSON.stringify(normalized.tests, null, 2)}
`;

  try {
    const result = await runAI(prompt, "json");
    if (!result.summary || !Array.isArray(result.explanations)) {
      return { status: "unprocessed", reason: "AI summary malformed" };
    }
    return result;
  } catch (err) {
    console.error("[generateSummary] Gemini failed:", err.message);
    return { status: "unprocessed", reason: "AI summary failed" };
  }
}
