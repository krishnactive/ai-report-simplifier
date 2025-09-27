import Tesseract from "tesseract.js";

// image → text
export async function ocrImageToText(filePath) {
  const { data } = await Tesseract.recognize(filePath, "eng");
  const text = data.text || "";
  const confidence = (data.confidence ?? 80) / 100;
  return { text, confidence };
}
