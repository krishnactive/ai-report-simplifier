function normalizeTests(tests_raw) {
  const REF_RANGES = {
    Hemoglobin: { unit: "g/dL", low: 13.0, high: 17.0 },
    RBC: { unit: "mill/cumm", low: 4.5, high: 5.5 },
    PCV: { unit: "%", low: 40, high: 50 },
    WBC: { unit: "/cumm", low: 4000, high: 11000 },
    Platelet: { unit: "/cumm", low: 150000, high: 410000 },
    Neutrophils: { unit: "%", low: 50, high: 62 },
    Lymphocytes: { unit: "%", low: 20, high: 40 },
    Eosinophils: { unit: "%", low: 0, high: 6 },
    Monocytes: { unit: "%", low: 0, high: 10 },
    Basophils: { unit: "%", low: 0, high: 2 }
  };

  function cleanValue(name, value) {
    if (name === "Hemoglobin" && value > 100) return value / 10;
    if (name === "RBC" && value > 10) return value / 10;
    return value;
  }

  const results = [];

  for (let raw of tests_raw) {
    let name = null, value = null, unit = null, status = null;

    if (/hemoglobin/i.test(raw)) {
      name = "Hemoglobin";
      value = parseFloat(raw.match(/[\d.]+/)[0]);
      value = cleanValue(name, value);
      unit = REF_RANGES[name].unit;
    } else if (/rbc|rec/i.test(raw)) {
      name = "RBC";
      value = parseFloat(raw.match(/[\d.]+/)[0]);
      value = cleanValue(name, value);
      unit = REF_RANGES[name].unit;
    } else if (/pcv|packed cell volume/i.test(raw)) {
      name = "PCV";
      value = parseFloat(raw.match(/[\d.]+/)[0]);
      unit = REF_RANGES[name].unit;
    } else if (/wbc/i.test(raw)) {
      name = "WBC";
      value = parseFloat(raw.match(/[\d.]+/)[0]);
      unit = REF_RANGES[name].unit;
    } else if (/platelet/i.test(raw)) {
      name = "Platelet";
      value = parseInt(raw.match(/\d+/)[0]);
      unit = REF_RANGES[name].unit;
      if (/borderline/i.test(raw)) status = "borderline";
    } else if (/neutrophil/i.test(raw)) {
      name = "Neutrophils";
      value = parseFloat(raw.match(/[\d.]+/)[0]);
      unit = REF_RANGES[name].unit;
    } else if (/lymphocyte/i.test(raw)) {
      name = "Lymphocytes";
      value = parseFloat(raw.match(/[\d.]+/)[0]);
      unit = REF_RANGES[name].unit;
    } else if (/eosinophil/i.test(raw)) {
      name = "Eosinophils";
      value = parseFloat(raw.match(/[\d.]+/)[0]);
      unit = REF_RANGES[name].unit;
    } else if (/monocyte/i.test(raw)) {
      name = "Monocytes";
      value = parseFloat(raw.match(/[\d.]+/)[0]);
      unit = REF_RANGES[name].unit;
    } else if (/basophil/i.test(raw)) {
      name = "Basophils";
      value = parseFloat(raw.match(/[\d.]+/)[0]);
      unit = REF_RANGES[name].unit;
    }

    if (!name || !value) continue;

    const ref = REF_RANGES[name];
    if (!status) {
      if (value < ref.low) status = "low";
      else if (value > ref.high) status = "high";
      else status = "normal";
    }

    results.push({
      name,
      value,
      unit,
      status,
      ref_range: { low: ref.low, high: ref.high }
    });
  }

  return {
    tests: results,
    normalization_confidence: results.length ? 0.85 : 0
  };
}

export { normalizeTests };
