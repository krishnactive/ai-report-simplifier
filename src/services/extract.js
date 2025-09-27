// Improved extractor for lab tests
export function extractTestsRaw(inputText) {
  const lines = inputText.split(/\r?\n/).map(s => s.trim()).filter(Boolean);

  const tests = [];

  for (let line of lines) {
    // Skip obvious noise
    if (/^(Name|Age|Sex|Sample|Ref\.|Registered|Reported|Address|Interpretation|End of Report)/i.test(line)) {
      continue;
    }

  
    if (!/\d/.test(line)) continue;
    if (!/(g\/dL|\/uL|cumm|%|pg|fL|10\^|mmol|mg\/dL|platelet|count)/i.test(line)) continue;

 
    line = line.replace(/(\d)(\d{2})(\s*Low)/, "$1.$2$3"); 
    line = line.replace(/(\d),(\d{3})/, "$1$2");          
    line = line.replace(/\s+/g, " ");                   

   
    line = line.replace(/\bLow\b/i, "(Low)")
               .replace(/\bHigh\b/i, "(High)")
               .replace(/\bBorderline\b/i, "(Borderline)");

    tests.push(line);
  }

  return [...new Set(tests)];
}
