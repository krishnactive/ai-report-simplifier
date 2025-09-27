import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { ocrImageToText } from "./services/ocr.js";
import { extractTestsRaw } from "./services/extract.js";
import { normalizeTests } from "./services/normalize.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// OCR + Extraction
router.post("/extract", upload.single("file"), async (req, res) => {
  try {
    let text = "";
    let confidence = 0.9;

    if (req.file) {
      const fp = path.resolve(req.file.path);
      const { text: t, confidence: c } = await ocrImageToText(fp);
      text = t;
      confidence = c;
      fs.unlink(fp, () => {});
    } else if (req.body.input_type === "text") {
      text = req.body.data || "";
    } else {
      return res.status(400).json({ error: "Send input_type:text with data OR upload an image file." });
    }

    const tests_raw = extractTestsRaw(text);
    res.json({ tests_raw, confidence: Number(confidence.toFixed(2)) });
  } catch (err) {
    res.status(500).json({ error: "Extraction failed", details: err.message });
  }
});

router.post("/normalize", (req, res) => {
  try {
    const { tests_raw } = req.body;
    if (!Array.isArray(tests_raw) || !tests_raw.length) {
      return res.status(400).json({ error: "tests_raw must be a non-empty array" });
    }

    const result = normalizeTests(tests_raw);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Normalization failed", details: err.message });
  }
});

export default router;
