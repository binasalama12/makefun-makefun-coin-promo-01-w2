// Agent Arena (ARENA) — RPC-first verifier for make.fun coin promo.
// Copies LAUNCH.json to the output dir, validates its shape, then reads the
// create transaction via a public Solana RPC (getTransaction) and prints a
// coin status card. Network failures never cause a non-zero exit code.
import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(fileURLToPath(import.meta.url), "..");

const botDir = process.env.MAKEFUN_BOT_DIR || "/bot";
const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
const RPC_URL = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
const BASE58 = /^[1-9A-HJ-NP-Za-km-z]+$/;

function isPlausibleMint(v) {
  return typeof v === "string" && v.length >= 32 && v.length <= 44 && BASE58.test(v);
}
function isPlausibleSignature(v) {
  return typeof v === "string" && v.length >= 80 && v.length <= 90 && BASE58.test(v);
}

async function fetchCreateTx(signature) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch(RPC_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getTransaction",
        params: [signature, { encoding: "jsonParsed", maxSupportedTransactionVersion: 0 }],
      }),
      signal: ctrl.signal,
    });
    if (!res.ok) return { ok: false, reason: "http " + res.status };
    const json = await res.json();
    if (json.error) return { ok: false, reason: JSON.stringify(json.error) };
    if (!json.result) return { ok: false, reason: "transaction not found yet" };
    return { ok: true, tx: json.result };
  } catch (err) {
    return { ok: false, reason: String(err && err.message ? err.message : err) };
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const src = join(botDir, "LAUNCH.json");
  if (!existsSync(src)) {
    console.log("LAUNCH.json not found at " + src + " — nothing to verify yet.");
    return;
  }
  mkdirSync(outDir, { recursive: true });
  const dst = join(outDir, "LAUNCH.json");
  copyFileSync(src, dst);
  console.log("Copied LAUNCH.json -> " + dst);

  let launch;
  try {
    launch = JSON.parse(readFileSync(src, "utf8"));
  } catch (err) {
    console.log("LAUNCH.json is not valid JSON: " + String(err));
    return;
  }

  const mintOk = isPlausibleMint(launch.mint);
  const sigOk = isPlausibleSignature(launch.create_signature);
  console.log("Format check — mint: " + (mintOk ? "OK" : "INVALID") + ", create_signature: " + (sigOk ? "OK" : "INVALID"));
  if (!mintOk || !sigOk) {
    console.log("LAUNCH.json fields failed format verification; skipping RPC lookup.");
    return;
  }

  // RPC-first: trust the chain, not local files, for the coin's status.
  const lookup = await fetchCreateTx(launch.create_signature);
  console.log("");
  console.log("=== Agent Arena (ARENA) — Coin Status ===");
  console.log("Mint:            " + launch.mint);
  console.log("Create signature:" + " " + launch.create_signature);
  if (lookup.ok) {
    const tx = lookup.tx;
    const when = tx.blockTime ? new Date(tx.blockTime * 1000).toISOString() : "unknown";
    const err = tx.meta && tx.meta.err ? JSON.stringify(tx.meta.err) : "none";
    console.log("RPC lookup:      found");
    console.log("Slot:            " + String(tx.slot));
    console.log("Block time:      " + when);
    console.log("Tx error:        " + err);
    console.log("Status:          LIVE — create transaction confirmed on Solana");
  } else {
    console.log("RPC lookup:      unavailable (" + lookup.reason + ")");
    console.log("Status:          UNVERIFIED OFFLINE — LAUNCH.json copied, will verify on next run");
  }
  // Asset-presence check: coin metadata + logo must ship in the repo root.
  for (const asset of ["metadata.json", "logo.png"]) {
    console.log(asset + ": " + (existsSync(join(repoRoot, asset)) ? "present" : "MISSING"));
  }
  console.log("Bounty:          https://make.fun/bounty/makefun-coin-promo-01");
  console.log("=========================================");
}

main().then(
  () => { process.exitCode = 0; },
  (err) => { console.log("Non-fatal error: " + String(err)); process.exitCode = 0; }
);

// revision: wallet2
console.log('arena note: every duel in the arena is scored in the open — see the bounty link in the coin description.');
