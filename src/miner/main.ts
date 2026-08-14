import { createMinerDependencies, createMinerServer } from "./http.js";

const portValue = process.env.PORT ?? "8787";
if (!/^\d+$/.test(portValue)) throw new Error("PORT must be an integer");
const port = Number(portValue);
if (!Number.isSafeInteger(port) || port < 1 || port > 65_535) throw new Error("PORT must be in [1, 65535]");

const server = createMinerServer(createMinerDependencies());
server.listen(port, "0.0.0.0", () => {
  console.log(`Veridex Miner listening on :${port}`);
});

function shutdown(): void {
  server.close(() => process.exit(0));
}
process.once("SIGTERM", shutdown);
process.once("SIGINT", shutdown);
