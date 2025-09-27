import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { ocrImageToText } from "./services/ocr.js";
import { extractFromText } from "./services/extract.js";
import { normalizeTests } from "./services/normalize.js";
import { generateSummary } from "./services/summarize.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* Step 1: /extract */
router.post("/extract", upload.single("file"), async (req, res) => {
  try {
    if (req.file) {
      const fp = path.resolve(__dirname, "..", req.file.path);
      const { text, confidence: baseConf } = await ocrImageToText(fp);
      fs.unlink(fp, () => {});
      const { tests_raw, confidence } = await extractFromText(text);
      // blend OCR baseConf if helpful
      const blended = Number(Math.max(0, Math.min(1, (confidence * 0.7 + baseConf * 0.3))).toFixed(2));
      return res.json({ tests_raw, confidence: blended });
    } else {
      const { data } = req.body;
      if (typeof data !== "string" || !data.trim()) {
        return res.status(400).json({ error: "Provide 'data' (string) or upload 'file' image" });
      }
      const result = await extractFromText(data);
      return res.json(result);
    }
  } catch (e) {
    return res.status(500).json({ error: "extraction failed", details: e.message });
  }
});

/* Step 2: /normalize */
router.post("/normalize", async (req, res) => {
  try {
    const { tests_raw } = req.body;
    if (!Array.isArray(tests_raw) || !tests_raw.length) {
      return res.status(400).json({ error: "tests_raw must be a non-empty array of strings" });
    }
    const result = normalizeTests(tests_raw);
    return res.json(result);
  } catch (e) {
    return res.status(500).json({ error: "normalization failed", details: e.message });
  }
});

/* Step 3: /summarize */
router.post("/summarize", async (req, res) => {
  try {
    const { tests, provenance } = req.body; // provenance optional but preferred
    if (!Array.isArray(tests)) {
      return res.status(400).json({ error: "tests must be an array" });
    }
    const allowed = Array.isArray(provenance) ? provenance.map(p => p.name) : tests.map(t => t.name);
    const result = await generateSummary({ tests }, allowed);
    return res.json(result);
  } catch (e) {
    return res.status(500).json({ error: "summarization failed", details: e.message });
  }
});

/* Step 4: /process (full pipeline) */
router.post("/process", upload.single("file"), async (req, res) => {
  try {
    // Step 1: extract
    let tests_raw = [], extractConf = 0.8;
    if (req.file) {
      const fp = path.resolve(__dirname, "..", req.file.path);
      const { text, confidence: baseConf } = await ocrImageToText(fp);
      fs.unlink(fp, () => {});
      const out = await extractFromText(text);
      tests_raw = out.tests_raw; extractConf = out.confidence * 0.7 + baseConf * 0.3;
    } else {
      const { data } = req.body;
      if (typeof data !== "string" || !data.trim()) {
        return res.status(400).json({ error: "Provide 'data' (string) or upload 'file' image" });
      }
      const out = await extractFromText(data);
      tests_raw = out.tests_raw; extractConf = out.confidence;
    }

    // Step 2: normalize
    const { tests, normalization_confidence, provenance } = normalizeTests(tests_raw);
    if (!tests.length) {
      return res.json({ status: "unprocessed", reason: "no recognizable tests in input" });
    }

    // Step 3: summarize + guardrail
    const sum = await generateSummary({ tests }, provenance.map(p => p.name));
    if (sum?.status === "unprocessed") return res.json(sum);

    // Step 4: final
    return res.json({
      tests,
      summary: sum.summary,
      explanations: sum.explanations,
      status: "ok",
      meta: {
        extraction_confidence: Number(extractConf.toFixed(2)),
        normalization_confidence: Number(normalization_confidence.toFixed(2))
      }
    });
  } catch (e) {
    return res.status(500).json({ error: "pipeline failed", details: e.message });
  }
});

export default router;
