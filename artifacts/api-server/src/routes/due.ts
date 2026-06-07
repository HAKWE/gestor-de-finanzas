import { Router, type IRouter } from "express";
import { createVerify } from "crypto";
import { getAuth, createClerkClient } from "@clerk/express";
import { logger } from "../lib/logger";
import { dueClient } from "../lib/dueClient";

const router: IRouter = Router();

// ── Helpers ───────────────────────────────────────────────────────────────────

function requireAuth(req: any, res: any, next: any) {
  const auth = getAuth(req);
  if (!auth?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.userId = auth.userId;
  next();
}

async function requireAdmin(req: any, res: any, next: any): Promise<void> {
  const auth = getAuth(req);
  if (!auth?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    res.status(403).json({ error: "ADMIN_EMAIL not configured" });
    return;
  }

  try {
    const clerk = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    const user = await clerk.users.getUser(auth.userId);
    const email =
      user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
        ?.emailAddress ??
      user.emailAddresses[0]?.emailAddress ??
      "";

    const allowed = adminEmail.split(",").map((e) => e.trim().toLowerCase());
    if (!allowed.includes(email.toLowerCase())) {
      res.status(403).json({ error: "Admin access required" });
      return;
    }

    req.userId = auth.userId;
    next();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: "Admin verification failed: " + msg });
  }
}

function verifyDueWebhookSignature(
  rawBody: Buffer,
  signatureHeader: string | undefined,
): boolean {
  const publicKey = process.env.DUE_WEBHOOK_PUBLIC_KEY;
  if (!publicKey) {
    logger.warn("DUE_WEBHOOK_PUBLIC_KEY not set — skipping signature verification");
    return true;
  }
  if (!signatureHeader) {
    logger.warn("Due webhook: missing x-due-signature header");
    return false;
  }

  try {
    // Due sends the Ed25519 signature as a base64-encoded string
    const signatureBuffer = Buffer.from(signatureHeader, "base64");
    const verify = createVerify("ed25519");
    verify.update(rawBody);
    return verify.verify(publicKey, signatureBuffer);
  } catch (err) {
    logger.error({ err }, "Due webhook: Ed25519 signature verification error");
    return false;
  }
}

// ── GET /api/due/account ──────────────────────────────────────────────────────
// Admin-only: returns Due KYC / account info.

router.get(
  "/due/account",
  requireAdmin,
  async (_req, res): Promise<void> => {
    const result = await dueClient.getAccountInfo();
    if (!result.ok) {
      res.status(502).json({ error: result.error });
      return;
    }
    res.json(result.data);
  },
);

// ── Helpers ───────────────────────────────────────────────────────────────────

// Due memos only allow [a-zA-Z0-9 - . /] — strip everything else and
// collapse multiple spaces into a single hyphen so the string stays readable.
function sanitizeMemo(raw: string): string {
  return raw
    .replace(/\s+/g, "-")            // spaces → hyphens
    .replace(/[^a-zA-Z0-9\-.\/]/g, "")  // strip remaining disallowed chars
    .replace(/-{2,}/g, "-")          // collapse double-hyphens
    .slice(0, 200);                   // respect Due's 200-char max
}

// ── POST /api/due/payout ──────────────────────────────────────────────────────
// Admin-only: create a Due payout (quote → transfer).
//
// Body:
//   source      { amount: number, currency: string, rail: string }
//   destination { currency: string, rail: string }
//   recipientId string
//   memo?       string
//   metadata?   Record<string, string>

router.post(
  "/due/payout",
  requireAdmin,
  async (req: any, res): Promise<void> => {
    const { source, destination, recipientId, memo: rawMemo, metadata } = req.body ?? {};
    const memo = rawMemo ? sanitizeMemo(String(rawMemo)) : undefined;

    if (!source || !destination || !recipientId) {
      res.status(400).json({
        error: "Missing required fields: source, destination, recipientId",
      });
      return;
    }

    if (typeof source.amount !== "number" || source.amount <= 0) {
      res.status(400).json({ error: "source.amount must be a positive number" });
      return;
    }

    for (const field of ["currency", "rail"] as const) {
      if (!source[field] || !destination[field === "rail" ? "rail" : field]) {
        res.status(400).json({ error: `Missing source.${field} or destination field` });
        return;
      }
    }

    logger.info(
      { source, destination, recipientId, adminId: req.userId },
      "Due payout initiated",
    );

    const result = await dueClient.sendPayout({
      source,
      destination,
      recipientId,
      memo,
      metadata,
    });

    if (!result.ok) {
      res.status(502).json({
        error: result.error,
        step: result.step,
      });
      return;
    }

    res.status(201).json({
      ok: true,
      quote: result.quote,
      transfer: result.transfer,
    });
  },
);

// ── POST /api/due/webhook ─────────────────────────────────────────────────────
// Exported as a standalone handler and registered in app.ts BEFORE
// express.json() so the raw Buffer body is intact for HMAC verification.

export function handleDueWebhook(req: any, res: any): void {
  const sig = req.headers["x-due-signature"] as string | undefined;

  if (!verifyDueWebhookSignature(req.body as Buffer, sig)) {
    logger.warn({ sig }, "Due webhook: invalid signature");
    res.status(400).json({ error: "Invalid signature" });
    return;
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse((req.body as Buffer).toString("utf8"));
  } catch {
    res.status(400).json({ error: "Invalid JSON body" });
    return;
  }

  const eventType = event.type as string | undefined;
  logger.info({ eventType, event }, "Due webhook received");

  switch (eventType) {
    case "transfer.completed": {
      const transfer = event.data as Record<string, unknown> | undefined;
      logger.info({ transferId: transfer?.id }, "Due transfer completed");
      break;
    }
    case "transfer.failed": {
      const transfer = event.data as Record<string, unknown> | undefined;
      logger.error(
        { transferId: transfer?.id, reason: transfer?.failure_reason },
        "Due transfer failed",
      );
      break;
    }
    case "transfer.pending": {
      const transfer = event.data as Record<string, unknown> | undefined;
      logger.info({ transferId: transfer?.id }, "Due transfer pending");
      break;
    }
    default:
      logger.info({ eventType }, "Due webhook: unhandled event type");
  }

  res.status(200).json({ received: true });
}

export default router;
