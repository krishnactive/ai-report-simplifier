export function guardAgainstHallucination(normalizedTests, allowedNames) {
  const allowed = new Set((allowedNames || []).map(n => n.toLowerCase()));
  const anyUnknown = normalizedTests.some(t => !allowed.has(t.name.toLowerCase()));
  if (anyUnknown) {
    return { status: "unprocessed", reason: "hallucinated tests not present in input" };
  }
  return null;
}
