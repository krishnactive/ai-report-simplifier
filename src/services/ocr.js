import Tesseract from "tesseract.js";

// image → text
export async function ocrImageToText(filePath) {
  const { data } = await Tesseract.recognize(filePath, "eng");
  const text = (data?.text || "").trim();
  const confidence = ((data?.confidence ?? 80) / 100);
  return { text, confidence: Math.max(0, Math.min(1, confidence)) };
}
