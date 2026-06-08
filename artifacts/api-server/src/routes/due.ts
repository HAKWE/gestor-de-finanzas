import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { createVerify } from "crypto";
import { getAuth, createClerkClient } from "@clerk/express";
import { z } from "zod/v4";
import { eq } from "drizzle-orm";
import { db, userProfilesTable } from "@workspace/db";
import { logger } from "../lib/logger";
import { dueClient } from "../lib/dueClient";
import { payoutRateLimiter, dueReadRateLimiter } from "../middlewares/rateLimiter";

const router: IRouter = Router();

// ── Constants ─────────────────────────────────────────────────────────────────

// Whether we're pointing at a sandbox/dev Due environment
const IS_DUE_SANDBOX = (process.env.DUE_BASE_URL ?? "").includes("sandbox");

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Redact all but last 6 chars of a Clerk userId for safe logging. */
function anonId(userId: string): string {
  return `***${userId.slice(-6)}`;
}

/**
 * In production (live Due), hide raw API error strings from clients.
 * In sandbox, surface full details to speed up development.
 */
function clientError(msg: string): string {
  if (IS_DUE_SANDBOX) return msg;
  return "Payout service error. Please contact support.";
}

/**
 * Due memos only allow [a-zA-Z0-9 - . /] — strip everything else and
 * collapse multiple spaces into a single hyphen so the string stays readable.
 */
function sanitizeMemo(raw: string): string {
  return raw
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9\-.\/]/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 200);
}

// ── Auth middleware ───────────────────────────────────────────────────────────

function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const auth = getAuth(req);
  if (!auth?.userId) {
    res.status(401).json({ error: "Unauthorized", code: "unauthorized" });
    return;
  }
  (req as any).userId = auth.userId;
  next();
}

async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const auth = getAuth(req);
  if (!auth?.userId) {
    res.status(401).json({ error: "Unauthorized", code: "unauthorized" });
    return;
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    res.status(403).json({ error: "ADMIN_EMAIL not configured", code: "forbidden" });
    return;
  }

  try {
    const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
    const user = await clerk.users.getUser(auth.userId);
    const email =
      user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
        ?.emailAddress ??
      user.emailAddresses[0]?.emailAddress ??
      "";

    const allowed = adminEmail.split(",").map((e) => e.trim().toLowerCase());
    if (!allowed.includes(email.toLowerCase())) {
      res.status(403).json({ error: "Admin access required", code: "forbidden" });
      return;
    }

    (req as any).userId = auth.userId;
    next();
  } catch (err: unknown) {
    logger.error({ err }, "Admin verification error");
    res.status(500).json({ error: "Admin verification failed", code: "server_error" });
  }
}

// ── Validation schemas ────────────────────────────────────────────────────────

const PayoutBodySchema = z.object({
  recipientId: z
    .string()
    .min(1, "recipientId is required")
    .regex(/^rcp_/, "recipientId must start with 'rcp_'"),
  source: z.object({
    amount: z
      .number({ error: "source.amount must be a number" })
      .min(5, "Minimum payout amount is 5 EUR")
      .max(200, "Maximum payout amount is 200 EUR"),
    currency: z.string().min(1, "source.currency is required"),
    rail: z.string().min(1, "source.rail is required"),
  }),
  destination: z.object({
    currency: z.string().min(1, "destination.currency is required"),
    rail: z.string().min(1, "destination.rail is required"),
  }),
  memo: z.string().max(200).optional(),
  metadata: z.record(z.string(), z.string()).optional(),
});

// ── GET /api/due/quote ────────────────────────────────────────────────────────
// Returns a live exchange quote for a given EUR amount and destination.
// Used by the frontend for real-time XOF/XAF/KES/NGN/GHS estimates.

router.get(
  "/due/quote",
  dueReadRateLimiter,
  requireAdmin,
  async (req: any, res): Promise<void> => {
    const { amount: amountStr, to_currency, to_rail } =
      req.query as Record<string, string>;

    const amount = parseFloat(amountStr);
    if (!Number.isFinite(amount) || amount < 5 || !to_currency || !to_rail) {
      res.status(400).json({
        error: "amount (≥5), to_currency, and to_rail are required",
        code: "validation_error",
      });
      return;
    }

    req.log.info(
      { userId: anonId(req.userId), amount, to_currency, to_rail },
      "Due quote requested",
    );

    const result = await dueClient.createQuote({
      source: { amount, currency: "USDC", rail: "base-sepolia" },
      destination: { currency: to_currency, rail: to_rail },
    });

    if (!result.ok) {
      req.log.warn({ status: result.status }, "Due quote failed");
      res.status(502).json({ error: clientError(result.error), code: "quote_failed" });
      return;
    }

    // Due does not return a fxRate field — compute it from source/destination amounts
    const rawQuote = result.data as Record<string, unknown>;
    const srcAmt  = (rawQuote.source      as Record<string, unknown> | undefined)?.amount as number | undefined;
    const destAmt = (rawQuote.destination as Record<string, unknown> | undefined)?.amount as number | undefined;
    const computedFxRate = srcAmt && destAmt ? parseFloat((destAmt / srcAmt).toFixed(4)) : null;

    res.json({ ok: true, quote: { ...rawQuote, fxRate: computedFxRate } });
  },
);

// ── GET /api/due/account ──────────────────────────────────────────────────────

router.get(
  "/due/account",
  dueReadRateLimiter,
  requireAdmin,
  async (req: any, res): Promise<void> => {
    req.log.info({ userId: anonId(req.userId) }, "Due account info requested");
    const result = await dueClient.getAccountInfo();
    if (!result.ok) {
      req.log.error({ status: result.status }, "Due account fetch failed");
      res.status(502).json({ error: clientError(result.error), code: "upstream_error" });
      return;
    }
    res.json(result.data);
  },
);

// ── POST /api/due/payout ──────────────────────────────────────────────────────
// Admin-only: create a Due payout (quote → transfer).

router.post(
  "/due/payout",
  payoutRateLimiter,
  requireAdmin,
  async (req: any, res): Promise<void> => {
    // Validate body
    const parsed = PayoutBodySchema.safeParse(req.body);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i: z.core.$ZodIssue) => ({
        field: i.path.join("."),
        message: i.message,
      }));
      req.log.warn({ issues, userId: anonId(req.userId) }, "Payout validation failed");
      res.status(400).json({
        error: "Validation failed",
        code: "validation_error",
        details: issues,
      });
      return;
    }

    const { recipientId, source, destination, memo: rawMemo, metadata } = parsed.data;
    const memo = rawMemo ? sanitizeMemo(rawMemo) : undefined;

    req.log.info(
      {
        userId: anonId(req.userId),
        recipientId,
        source: { amount: source.amount, currency: source.currency, rail: source.rail },
        destination,
      },
      "Due payout initiated",
    );

    // Due sandbox only supports USDC/base-sepolia as source channel.
    // Convert the user-facing EUR amount to USDC (1 EUR ≈ 1.08 USDC) for the quote+transfer.
    const EUR_USD_RATE = 1.08;
    const sandboxSource = {
      amount: parseFloat((source.amount * EUR_USD_RATE).toFixed(2)),
      currency: "USDC",
      rail: "base-sepolia",
    };

    const result = await dueClient.sendPayout({
      source: sandboxSource,
      destination,
      recipientId,
      memo,
      metadata,
    });

    if (!result.ok) {
      const code = result.step === "quote" ? "quote_failed" : "transfer_failed";
      req.log.error(
        { userId: anonId(req.userId), step: result.step, rawError: result.error },
        "Due payout failed",
      );
      res.status(502).json({
        error: clientError(result.error),
        code,
        step: result.step,
      });
      return;
    }

    req.log.info(
      {
        userId: anonId(req.userId),
        transferId: result.transfer.id,
        status: result.transfer.status,
        destinationAmount: (result.quote.destination as any)?.amount,
        destinationCurrency: (result.quote.destination as any)?.currency,
      },
      "Due payout created",
    );

    res.status(201).json({
      ok: true,
      transferId: result.transfer.id,
      status: result.transfer.status,
      quote: {
        source: result.quote.source,
        destination: result.quote.destination,
        fxRate: result.quote.fxRate,
        expiresAt: result.quote.expiresAt,
      },
      transfer: result.transfer,
    });
  },
);

// ── GET /api/due/transfers/:transferId ────────────────────────────────────────

router.get(
  "/due/transfers/:transferId",
  dueReadRateLimiter,
  requireAdmin,
  async (req: any, res): Promise<void> => {
    const { transferId } = req.params as { transferId: string };

    if (!transferId || !/^tf_[a-zA-Z0-9]+$/.test(transferId)) {
      res.status(400).json({
        error: "Invalid transferId format. Expected: tf_<alphanumeric>",
        code: "validation_error",
      });
      return;
    }

    req.log.info({ userId: anonId(req.userId), transferId }, "Due transfer status requested");

    const result = await dueClient.getTransfer(transferId);
    if (!result.ok) {
      const httpStatus = result.status === 404 ? 404 : 502;
      req.log.warn({ transferId, status: result.status }, "Due transfer fetch failed");
      res.status(httpStatus).json({
        error: httpStatus === 404 ? "Transfer not found" : clientError(result.error),
        code: httpStatus === 404 ? "not_found" : "upstream_error",
      });
      return;
    }

    res.json(result.data);
  },
);

// ── GET /api/due/recipients ───────────────────────────────────────────────────

router.get(
  "/due/recipients",
  dueReadRateLimiter,
  requireAdmin,
  async (req: any, res): Promise<void> => {
    const rawLimit = req.query.limit;
    const limit = Math.min(
      100,
      Math.max(1, Number.isFinite(Number(rawLimit)) ? Number(rawLimit) : 50),
    );

    req.log.info({ userId: anonId(req.userId), limit }, "Due recipients list requested");

    const result = await dueClient.listRecipients(limit);
    if (!result.ok) {
      req.log.warn({ status: result.status, error: result.error }, "Due recipients list failed");
      res.status(502).json({ error: clientError(result.error), code: "upstream_error" });
      return;
    }

    // Normalize Due's response — the API may return an array directly, a paginated
    // envelope ({ data: [...] }, { items: [...] }, etc.), or a single object.
    const raw = result.data as unknown;
    let items: unknown[] = [];
    if (Array.isArray(raw)) {
      items = raw;
    } else if (raw !== null && typeof raw === "object") {
      const obj = raw as Record<string, unknown>;
      for (const key of ["data", "items", "results", "recipients", "content"]) {
        if (Array.isArray(obj[key])) { items = obj[key] as unknown[]; break; }
      }
      // Single-object fallback (Due returns one recipient, not a list)
      if (items.length === 0 && "id" in obj) items = [obj];
    }

    req.log.info(
      { count: items.length, topLevelKeys: raw !== null && typeof raw === "object" ? Object.keys(raw as object) : typeof raw },
      "Due recipients fetched",
    );

    res.json({ recipients: items, total: items.length });
  },
);

// ── GET /api/due/transfers ────────────────────────────────────────────────────

router.get(
  "/due/transfers",
  dueReadRateLimiter,
  requireAdmin,
  async (req: any, res): Promise<void> => {
    const rawLimit = req.query.limit;
    const limit = Math.min(
      100,
      Math.max(1, Number.isFinite(Number(rawLimit)) ? Number(rawLimit) : 20),
    );

    req.log.info({ userId: anonId(req.userId), limit }, "Due transfers list requested");

    const result = await dueClient.listTransfers(limit);
    if (!result.ok) {
      req.log.warn({ status: result.status }, "Due transfers list failed");
      res.status(502).json({
        error: clientError(result.error),
        code: "upstream_error",
      });
      return;
    }

    res.json(result.data);
  },
);

// ── POST /api/due/webhook ─────────────────────────────────────────────────────

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
    const signatureBuffer = Buffer.from(signatureHeader, "base64");
    const verify = createVerify("ed25519");
    verify.update(rawBody);
    return verify.verify(publicKey, signatureBuffer);
  } catch (err) {
    logger.error({ err }, "Due webhook: Ed25519 signature verification error");
    return false;
  }
}

// ── Subscription renewal via Mobile Money ─────────────────────────────────────

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

async function renewMobileMoneySubscription(
  userId: string,
  planKey: string,
  transferId: string,
): Promise<void> {
  const profiles = await db
    .select()
    .from(userProfilesTable)
    .where(eq(userProfilesTable.userId, userId))
    .limit(1);

  const profile = profiles[0];
  if (!profile) {
    logger.warn(
      { userId: anonId(userId), transferId },
      "[due-webhook] No user profile found for Mobile Money renewal — skipping",
    );
    return;
  }

  const now = new Date();
  // Extend from current period end when it's still in the future; otherwise from now
  const base =
    profile.subscriptionPeriodEnd && profile.subscriptionPeriodEnd > now
      ? profile.subscriptionPeriodEnd
      : now;
  const newPeriodEnd = new Date(base.getTime() + THIRTY_DAYS_MS);

  // Use metadata planKey if it's a known plan; fall back to the user's existing plan
  const plan =
    ["starter", "pro"].includes(planKey)
      ? planKey
      : (profile.subscriptionPlan ?? "starter");

  await db
    .update(userProfilesTable)
    .set({ subscriptionPlan: plan, subscriptionPeriodEnd: newPeriodEnd })
    .where(eq(userProfilesTable.userId, userId));

  logger.info(
    { userId: anonId(userId), transferId, plan, newPeriodEnd },
    "[due-webhook] ✅ Mobile Money subscription renewed",
  );
}

// ── Webhook handler ────────────────────────────────────────────────────────────

export async function handleDueWebhook(req: any, res: any): Promise<void> {
  const sig = req.headers["x-due-signature"] as string | undefined;

  if (!verifyDueWebhookSignature(req.body as Buffer, sig)) {
    logger.warn({ sig }, "Due webhook: invalid signature");
    res.status(400).json({ error: "Invalid signature", code: "invalid_signature" });
    return;
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse((req.body as Buffer).toString("utf8"));
  } catch {
    res.status(400).json({ error: "Invalid JSON body", code: "invalid_body" });
    return;
  }

  const eventType = event.type as string | undefined;
  logger.info({ eventType }, "[due-webhook] Event received");

  /** Process a transfer that has reached "completed" status. */
  async function onTransferCompleted(transfer: Record<string, unknown> | undefined): Promise<void> {
    if (!transfer) return;
    const transferId = String(transfer.id ?? "unknown");
    const metadata = (transfer.metadata ?? {}) as Record<string, string>;

    logger.info({ transferId, paymentType: metadata.paymentType }, "[due-webhook] Transfer completed");

    if (metadata.paymentType === "subscription_renewal" && metadata.userId) {
      logger.info(
        { transferId, userId: anonId(metadata.userId), planKey: metadata.planKey },
        "[due-webhook] Subscription renewal triggered",
      );
      await renewMobileMoneySubscription(
        metadata.userId,
        metadata.planKey ?? "starter",
        transferId,
      );
    } else {
      logger.info(
        { transferId, paymentType: metadata.paymentType ?? "(none)" },
        "[due-webhook] Transfer completed — not a subscription renewal, no action taken",
      );
    }
  }

  try {
    switch (eventType) {
      case "transfer.completed": {
        const transfer = event.data as Record<string, unknown> | undefined;
        await onTransferCompleted(transfer);
        break;
      }

      // Some Due environments fire status_changed instead of (or alongside) transfer.completed
      case "transfer.status_changed": {
        const transfer = event.data as Record<string, unknown> | undefined;
        if (transfer?.status === "completed") {
          await onTransferCompleted(transfer);
        } else {
          logger.info(
            { transferId: transfer?.id, status: transfer?.status },
            "[due-webhook] Transfer status changed (not completed — ignored)",
          );
        }
        break;
      }

      case "transfer.failed": {
        const transfer = event.data as Record<string, unknown> | undefined;
        logger.error(
          { transferId: transfer?.id, reason: transfer?.failure_reason },
          "[due-webhook] Transfer failed",
        );
        break;
      }

      case "transfer.pending": {
        const transfer = event.data as Record<string, unknown> | undefined;
        logger.info({ transferId: transfer?.id }, "[due-webhook] Transfer pending");
        break;
      }

      default:
        logger.info({ eventType }, "[due-webhook] Unhandled event type — ignored");
    }

    res.status(200).json({ received: true, type: eventType });
  } catch (err: unknown) {
    logger.error({ err, eventType }, "[due-webhook] Handler error");
    res.status(500).json({ error: "Internal webhook processing error" });
  }
}

export default router;
