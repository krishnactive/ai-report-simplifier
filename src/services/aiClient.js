import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY in .env");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: process.env.GEMINI_MODEL || "gemini-1.5-flash"
});

function cleanOutput(output) {
  return output
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
}

export async function runAI(prompt, format = "text") {
  const result = await model.generateContent(prompt);
  const output = result.response.text();

  if (format === "json") {
    try {
      const cleaned = cleanOutput(output);
      return JSON.parse(cleaned);
    } catch (err) {
      throw new Error("Gemini output is not valid JSON: " + output);
    }
  }

  return cleanOutput(output);
}
