export const CONFUSION_KEYS = [
  "truePositive",
  "trueNegative",
  "falsePositive",
  "falseNegative",
  "inconclusive",
  "unavailable",
  "error",
] as const;

export type ConfusionKey = typeof CONFUSION_KEYS[number];
export type ConfusionCounts = Record<ConfusionKey, number> & { total: number };

const CLASSIFICATION_TO_KEY: Record<string, ConfusionKey> = {
  true_positive: "truePositive",
  true_negative: "trueNegative",
  false_positive: "falsePositive",
  false_negative: "falseNegative",
  inconclusive: "inconclusive",
  unavailable: "unavailable",
  error: "error",
};

export function classificationToConfusionKey(classification: string): ConfusionKey {
  const key = CLASSIFICATION_TO_KEY[classification];
  if (!key) throw new Error(`Unknown ground-truth classification: ${classification}`);
  return key;
}

export function createConfusionCounts(): ConfusionCounts {
  return {
    truePositive: 0,
    trueNegative: 0,
    falsePositive: 0,
    falseNegative: 0,
    inconclusive: 0,
    unavailable: 0,
    error: 0,
    total: 0,
  };
}

export function addClassification(counts: ConfusionCounts, classification: string): void {
  counts[classificationToConfusionKey(classification)] += 1;
  counts.total += 1;
}
