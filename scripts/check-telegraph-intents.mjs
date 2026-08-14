#!/usr/bin/env node

const endpoint = process.env.TELEGRAPH_INTENTS_URL ?? "https://devnode.telegraphprotocol.com/engine/v1/intents";
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 8_000);

try {
  const response = await fetch(endpoint, {
    headers: { accept: "application/json" },
    signal: controller.signal,
  });

  if (!response.ok) {
    throw new Error(`Telegraph intent endpoint returned HTTP ${response.status}`);
  }

  const body = await response.json();
  const intents = Array.isArray(body) ? body : Array.isArray(body.intents) ? body.intents : null;
  if (!intents) throw new Error("Unexpected Telegraph intent-list response shape");

  console.log(JSON.stringify({ endpoint, checkedAt: new Date().toISOString(), intents }, null, 2));
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Unable to verify live Telegraph intents: ${message}`);
  process.exitCode = 1;
} finally {
  clearTimeout(timeout);
}
