import { REF_RANGES } from "../utils/refRanges.js";

// conservative numeric cleanups for common OCR slips
function cleanValue(name, value) {
  if (name === "Hemoglobin") {
    if (value > 100) return value / 10; // 125 -> 12.5
    if (value < 5)   return value * 10; // 1.25 -> 12.5
  }
  if (name === "RBC" && value > 10) return value / 10; // 52 -> 5.2
  return value;
}

function canonicalName(raw) {
  const s = raw.toLowerCase();
  if (s.includes("hemoglobin") || s.includes("hb")) return "Hemoglobin";
  if (s.includes("wbc") || s.includes("total wbc")) return "WBC";
  if (s.includes("platelet")) return "Platelet";
  if (s.includes("pcv") || s.includes("packed cell volume")) return "PCV";
  if (s.includes("rbc") || s.includes("rec")) return "RBC";
  if (s.includes("neutro")) return "Neutrophils";
  if (s.includes("lympho")) return "Lymphocytes";
  if (s.includes("eosino")) return "Eosinophils";
  if (s.includes("mono")) return "Monocytes";
  if (s.includes("baso")) return "Basophils";
  return null;
}

export function normalizeTests(tests_raw) {
  const results = [];
  const provenance = []; // to enforce guardrail later

  for (let seg of tests_raw) {
    const nameCand = canonicalName(seg);
    if (!nameCand || !REF_RANGES[nameCand]) continue;

    const ref = REF_RANGES[nameCand];
    const numMatch = seg.match(/(\d+(?:\.\d+)?)/);
    if (!numMatch) continue;

    let value = parseFloat(numMatch[1]);
    value = cleanValue(nameCand, value);

    let status = null;
    if (/\(low\)/i.test(seg)) status = "low";
    else if (/\(high\)/i.test(seg)) status = "high";
    else if (/\(borderline\)/i.test(seg)) status = "borderline";
    else {
      if (value < ref.low) status = "low";
      else if (value > ref.high) status = "high";
      else status = "normal";
    }

    results.push({
      name: nameCand,
      value,
      unit: ref.unit,
      status,
      ref_range: { low: ref.low, high: ref.high }
    });
    provenance.push({ raw: seg, name: nameCand });
  }

  const normalization_confidence = results.length ? 0.84 : 0.0;
  return { tests: results, normalization_confidence, provenance };
}
