import { Request, Response } from "express";
import Stripe from "stripe";
import { eq, sql } from "drizzle-orm";
import { db, userProfilesTable } from "@workspace/db";
import { logger } from "../lib/logger";
import { getUncachableStripeClient } from "../stripeClient";

async function upsertCustomerLink(userId: string, customerId: string): Promise<void> {
  await db.execute(sql`
    INSERT INTO user_profiles (user_id, stripe_customer_id)
    VALUES (${userId}, ${customerId})
    ON CONFLICT (user_id) DO UPDATE SET stripe_customer_id = ${customerId}
  `);
}

function getPlanFromProductName(name: string): "starter" | "pro" | null {
  const lower = name.toLowerCase();
  if (lower.includes("pro")) return "pro";
  if (lower.includes("starter")) return "starter";
  return null;
}

async function updateUserSubscription(
  customerId: string,
  subscriptionId: string,
  priceId: string,
  status: string,
  currentPeriodEnd: number | null
) {
  const profiles = await db
    .select()
    .from(userProfilesTable)
    .where(eq(userProfilesTable.stripeCustomerId, customerId))
    .limit(1);

  if (!profiles[0]) {
    logger.warn({ customerId }, "[stripe-webhook] No user found for customer");
    return;
  }

  const stripe = await getUncachableStripeClient();
  let planName: "starter" | "pro" | null = null;

  try {
    const price = await stripe.prices.retrieve(priceId, { expand: ["product"] });
    const product = price.product as Stripe.Product;
    planName = getPlanFromProductName(product.name || "");
  } catch (err) {
    logger.error({ err, priceId }, "[stripe-webhook] Failed to retrieve price/product");
  }

  const periodEnd = currentPeriodEnd
    ? new Date(currentPeriodEnd * 1000)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const isActive = status === "active" || status === "trialing";

  await db
    .update(userProfilesTable)
    .set({
      stripeSubscriptionId: subscriptionId,
      stripePriceId: priceId,
      subscriptionPlan: isActive ? (planName ?? "paid") : null,
      subscriptionPeriodEnd: isActive ? periodEnd : null,
    })
    .where(eq(userProfilesTable.stripeCustomerId, customerId));

  logger.info(
    { customerId, subscriptionId, plan: planName, status, periodEnd },
    "[stripe-webhook] User subscription updated"
  );
}

async function clearUserSubscription(customerId: string) {
  const result = await db
    .update(userProfilesTable)
    .set({
      subscriptionPlan: null,
      subscriptionPeriodEnd: null,
    })
    .where(eq(userProfilesTable.stripeCustomerId, customerId));

  logger.info({ customerId }, "[stripe-webhook] Subscription cleared (deleted/cancelled)");
  return result;
}

export async function handleStripeWebhook(req: Request, res: Response): Promise<void> {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig) {
    logger.warn("[stripe-webhook] Missing stripe-signature header");
    res.status(400).json({ error: "Missing stripe-signature" });
    return;
  }

  let event: Stripe.Event;

  if (!webhookSecret) {
    logger.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET not set — cannot verify signature");
    res.status(500).json({ error: "Webhook secret not configured" });
    return;
  }

  try {
    const stripe = await getUncachableStripeClient();
    event = stripe.webhooks.constructEvent(
      req.body as Buffer,
      Array.isArray(sig) ? sig[0] : sig,
      webhookSecret
    );
  } catch (err: any) {
    logger.error({ err }, "[stripe-webhook] Signature verification failed");
    res.status(400).json({ error: `Webhook signature error: ${err.message}` });
    return;
  }

  logger.info({ type: event.type, id: event.id }, "[stripe-webhook] Received event");

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;
        const customerId = session.customer as string;
        logger.info(
          { sessionId: session.id, customerId, subscriptionId: session.subscription, userId },
          "[stripe-webhook] checkout.session.completed"
        );

        // Link the Clerk userId → Stripe customerId if client_reference_id was set
        if (userId && customerId) {
          await upsertCustomerLink(userId, customerId);
          logger.info({ userId, customerId }, "[stripe-webhook] Customer linked to user");
        }

        if (session.mode === "subscription" && session.subscription && customerId) {
          const stripe = await getUncachableStripeClient();
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          const item = subscription.items.data[0];
          if (item) {
            const periodEnd = (subscription as any).current_period_end
              ?? (subscription as any).cancel_at
              ?? null;
            await updateUserSubscription(
              customerId,
              subscription.id,
              item.price.id,
              subscription.status,
              periodEnd
            );
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        logger.info(
          { subscriptionId: sub.id, customerId: sub.customer, status: sub.status },
          "[stripe-webhook] customer.subscription.updated"
        );

        const item = sub.items.data[0];
        if (item) {
          await updateUserSubscription(
            sub.customer as string,
            sub.id,
            item.price.id,
            sub.status,
            (sub as any).current_period_end ?? null
          );
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        logger.info(
          { subscriptionId: sub.id, customerId: sub.customer },
          "[stripe-webhook] customer.subscription.deleted"
        );
        await clearUserSubscription(sub.customer as string);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const subscriptionId = (invoice as any).subscription as string | null;
        logger.info(
          { invoiceId: invoice.id, customerId, subscriptionId },
          "[stripe-webhook] invoice.payment_succeeded"
        );
        if (subscriptionId && customerId) {
          const stripe = await getUncachableStripeClient();
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const item = subscription.items.data[0];
          if (item) {
            const periodEnd = (subscription as any).current_period_end
              ?? (subscription as any).cancel_at
              ?? null;
            await updateUserSubscription(
              customerId,
              subscription.id,
              item.price.id,
              subscription.status,
              periodEnd
            );
          }
        }
        break;
      }

      default:
        logger.info({ type: event.type }, "[stripe-webhook] Unhandled event type (ignored)");
    }

    res.status(200).json({ received: true, type: event.type });
  } catch (err: any) {
    logger.error({ err, eventType: event.type }, "[stripe-webhook] Handler error");
    res.status(500).json({ error: "Internal webhook processing error" });
  }
}
