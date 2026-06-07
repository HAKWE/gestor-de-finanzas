import { dueClient } from "./lib/dueClient.js";

async function main() {
  console.log("=== Due Payout Test ===");
  console.log("Base URL :", process.env.DUE_BASE_URL ?? "(not set)");
  console.log("API key  :", process.env.DUE_API_KEY ? "✓ set" : "✗ MISSING");
  console.log("");

  // ── Step 1: verify account ────────────────────────────────────────────────
  console.log("Step 1 — Fetching account info…");
  const account = await dueClient.getAccountInfo();
  console.log("Account result:", JSON.stringify(account, null, 2));
  console.log("");

  if (!account.ok) {
    console.error("❌ Cannot reach Due API. Check DUE_API_KEY and DUE_BASE_URL.");
    process.exit(1);
  }

  // ── Step 2: get a quote ───────────────────────────────────────────────────
  // Source: base-sepolia USDC (blockchain rail, so currency = token = USDC)
  // Destination: xof_local (the correct Due rail for XOF mobile money payouts)
  // 1000 XOF ≈ 1.50 USD ≈ 1.5 USDC — using 2 USDC gives comfortable headroom.
  console.log("Step 2 — Creating quote (USDC/base-sepolia → XOF/xof_local)…");
  const quote = await dueClient.createQuote({
    source: {
      amount: 2,
      currency: "USDC",
      rail:     "base-sepolia",
    },
    destination: {
      currency: "XOF",
      rail:     "xof_local",
    },
  });
  console.log("Quote result:", JSON.stringify(quote, null, 2));
  console.log("");

  if (!quote.ok) {
    console.error("❌ Quote failed — stopping before transfer.");
    process.exit(1);
  }

  // ── Step 3: full sendPayout (quote + transfer) ────────────────────────────
  console.log("Step 3 — Sending payout via sendPayout()…");
  const payout = await dueClient.sendPayout({
    source: {
      amount: 2,
      currency: "USDC",
      rail:     "base-sepolia",
    },
    destination: {
      currency: "XOF",
      rail:     "xof_local",
    },
    recipientId: "rcp_fZBBPcTqmJjPAVeW",
    memo:        "Test payout - 1000 XOF",
    metadata:    { test: "true" },
  });

  console.log("Payout result:", JSON.stringify(payout, null, 2));
  console.log("");

  if (payout.ok) {
    console.log("✅ Payout succeeded!");
    console.log("   Transfer ID :", (payout.transfer as any)?.id ?? "—");
    console.log("   Status      :", (payout.transfer as any)?.status ?? "—");
  } else {
    console.error(`❌ Payout failed at step: ${payout.step}`);
    console.error("   Error:", payout.error);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
