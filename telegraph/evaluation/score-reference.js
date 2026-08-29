// Reference implementation for local development and test-vector generation.
// The production validator artifact must use the same semantics but be compiled
// to Telegraph's freestanding WASM ABI.
const STATES = new Set(['active', 'not_detected', 'unknown']);
const CAPS = ['ownership', 'upgradeability', 'pause', 'mint'];

export function score(groundTruth, answer) {
  let total = 0;
  for (const cap of CAPS) {
    const g = groundTruth?.[cap];
    const a = answer?.[cap];
    if (!STATES.has(a)) continue;
    if (a === g) total += 1;
    else if (g === 'unknown' && a === 'unknown') total += 1;
    else if (g === 'unknown' && a !== 'unknown') total += 0.25;
  }
  return Math.max(0, Math.min(1, total / CAPS.length));
}
