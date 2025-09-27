// Extract raw test segments from text
export function extractTestsRaw(inputText) {
  const chunks = inputText.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);

  const tests = [];
  for (const c of chunks) {
    const hasNumber = /\d/.test(c);
    const hasUnit = /(g\/dL|\/uL|mg\/dL|%)/i.test(c);
    if (hasNumber && hasUnit) {
      tests.push(c);
    }
  }

  return tests;
}
