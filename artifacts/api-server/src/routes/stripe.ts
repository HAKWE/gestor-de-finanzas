import { Router, type IRouter } from "express";
import { getAuth, createClerkClient } from "@clerk/express";
import { eq, sql } from "drizzle-orm";
import { db, userProfilesTable } from "@workspace/db";
import { getUncachableStripeClient } from "../stripeClient";

async function getClerkUserEmail(userId: string): Promise<string | null> {
  try {
    const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
    const user = await clerk.users.getUser(userId);
    const email = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress
      ?? user.emailAddresses[0]?.emailAddress ?? null;
    return email;
  } catch {
    return null;
  }
}

async function upsertStripeCustomerId(userId: string, customerId: string): Promise<void> {
  await db.execute(sql`
    INSERT INTO user_profiles (user_id, stripe_customer_id)
    VALUES (${userId}, ${customerId})
    ON CONFLICT (user_id) DO UPDATE SET stripe_customer_id = ${customerId}
  `);
}

const router: IRouter = Router();

function computeTrialInfo(profile: { trialEndsAt: Date | null } | undefined | null) {
  if (!profile?.trialEndsAt) {
    return { effectivePlan: "limited_free" as const, trialEndsAt: null as null, trialDaysLeft: 0 };
  }
  const now = new Date();
  const trialEnd = new Date(profile.trialEndsAt);
  const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysLeft > 0) {
    return { effectivePlan: "trial" as const, trialEndsAt: trialEnd.toISOString(), trialDaysLeft: daysLeft };
  }
  return { effectivePlan: "limited_free" as const, trialEndsAt: trialEnd.toISOString(), trialDaysLeft: 0 };
}

/**
 * Resolve the correct domain for Stripe success/cancel URLs.
 * Priority: Origin header (reflects actual browsing domain) → APP_DOMAIN env →
 * first entry in REPLIT_DOMAINS → Host header.
 * This ensures custom domains (mobilemoneymanager.africa, admin subdomain)
 * are handled correctly regardless of server-side env variables.
 */
function resolveCheckoutDomain(req: any): string {
  const origin = req.get("origin") as string | undefined;
  if (origin) {
    try {
      return new URL(origin).hostname;
    } catch {}
  }
  const referer = req.get("referer") as string | undefined;
  if (referer) {
    try {
      const h = new URL(referer).hostname;
      // Prefer the root domain over any admin subdomain for success/cancel URLs
      // since dashboard and pricing pages live on the main domain.
      return h.replace(/^admin\./, "");
    } catch {}
  }
  return (
    process.env.APP_DOMAIN ||
    process.env.REPLIT_DOMAINS?.split(",")[0] ||
    (req.get("host") as string | undefined) ||
    ""
  );
}

function requireAuth(req: any, res: any, next: any) {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Non autorisé" });
    return;
  }
  req.userId = userId;
  next();
}

router.get("/stripe/products", async (_req, res): Promise<void> => {
  try {
    // First try the synced DB
    const rows = await db.execute(sql`
      SELECT
        p.id AS product_id,
        p.name AS product_name,
        p.description AS product_description,
        pr.id AS price_id,
        pr.unit_amount,
        pr.currency,
        pr.recurring
      FROM stripe.products p
      LEFT JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
      WHERE p.active = true
      ORDER BY pr.unit_amount ASC NULLS LAST
    `);

    const productsMap = new Map<string, any>();
    for (const row of rows.rows) {
      if (!productsMap.has(row.product_id as string)) {
        productsMap.set(row.product_id as string, {
          id: row.product_id,
          name: row.product_name,
          description: row.product_description,
          prices: [],
        });
      }
      if (row.price_id) {
        productsMap.get(row.product_id as string).prices.push({
          id: row.price_id,
          unit_amount: row.unit_amount,
          currency: row.currency,
          recurring: row.recurring,
        });
      }
    }

    // If DB is empty (sync hasn't run yet), fetch directly from Stripe API
    if (productsMap.size === 0) {
      const stripe = await getUncachableStripeClient();
      const stripeProducts = await stripe.products.list({ active: true, limit: 10 });

      for (const product of stripeProducts.data) {
        const prices = await stripe.prices.list({
          product: product.id,
          active: true,
          limit: 5,
        });
        productsMap.set(product.id, {
          id: product.id,
          name: product.name,
          description: product.description,
          prices: prices.data
            .filter((p) => p.type === "recurring")
            .sort((a, b) => (a.unit_amount ?? 0) - (b.unit_amount ?? 0))
            .map((p) => ({
              id: p.id,
              unit_amount: p.unit_amount,
              currency: p.currency,
              recurring: p.recurring,
            })),
        });
      }

      // Sort by price ascending
      const sorted = Array.from(productsMap.values()).sort((a, b) => {
        const aPrice = a.prices[0]?.unit_amount ?? 0;
        const bPrice = b.prices[0]?.unit_amount ?? 0;
        return aPrice - bPrice;
      });
      res.json({ data: sorted });
      return;
    }

    res.json({ data: Array.from(productsMap.values()) });
  } catch (err: any) {
    console.error("Error fetching products:", err.message);
    res.status(500).json({ error: "Erreur lors de la récupération des offres" });
  }
});

router.post("/stripe/checkout-by-plan", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.userId;
  const { planName, paymentMethod } = req.body as { planName: string; paymentMethod?: string };

  if (!planName) {
    res.status(400).json({ error: "planName requis (starter | pro)" });
    return;
  }

  const resolvedPaymentMethod = paymentMethod === "paypal" ? "paypal" : "card";

  try {
    const stripe = await getUncachableStripeClient();

    console.log(`[checkout-by-plan] Fetching products for plan: ${planName}, paymentMethod: ${resolvedPaymentMethod}`);
    const products = await stripe.products.list({ active: true, limit: 20 });
    console.log(`[checkout-by-plan] Found ${products.data.length} products: ${products.data.map(p => p.name).join(', ')}`);

    const match = products.data.find((p) =>
      p.name.toLowerCase().includes(planName.toLowerCase())
    );

    if (!match) {
      console.error(`[checkout-by-plan] No product found matching "${planName}". Available: ${products.data.map(p => p.name).join(', ')}`);
      res.status(404).json({ error: `Offre "${planName}" introuvable dans Stripe. Vérifiez que le produit existe dans votre compte Stripe.` });
      return;
    }

    console.log(`[checkout-by-plan] Matched product: ${match.name} (${match.id})`);

    const prices = await stripe.prices.list({
      product: match.id,
      active: true,
      type: "recurring",
      currency: "eur",
      limit: 5,
    });

    console.log(`[checkout-by-plan] Found ${prices.data.length} EUR prices for product`);

    const price = prices.data.sort(
      (a, b) => (a.unit_amount ?? 0) - (b.unit_amount ?? 0)
    )[0];

    if (!price) {
      console.error(`[checkout-by-plan] No active recurring price for product ${match.id}`);
      res.status(404).json({ error: "Aucun prix actif trouvé pour cette offre" });
      return;
    }

    console.log(`[checkout-by-plan] Using price: ${price.id} (${price.unit_amount} ${price.currency})`);

    const profiles = await db
      .select()
      .from(userProfilesTable)
      .where(eq(userProfilesTable.userId, userId))
      .limit(1);

    const profile = profiles[0];
    let customerId = profile?.stripeCustomerId;

    if (!customerId) {
      const email = await getClerkUserEmail(userId);
      const customer = await stripe.customers.create({
        email: email ?? undefined,
        metadata: { userId },
      });
      customerId = customer.id;
      await upsertStripeCustomerId(userId, customerId);
    }

    const domain = resolveCheckoutDomain(req);
    console.log(`[checkout-by-plan] Using domain: ${domain}`);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      client_reference_id: userId,
      payment_method_types: ["card", "paypal"],
      line_items: [{ price: price.id, quantity: 1 }],
      mode: "subscription",
      success_url: `https://${domain}/dashboard?success=true`,
      cancel_url: `https://${domain}/pricing`,
    });

    console.log(`[checkout-by-plan] Session created: ${session.id}`);
    res.json({ url: session.url });
  } catch (err: any) {
    console.error("Checkout-by-plan error:", err.message);
    res.status(500).json({ error: "Erreur lors de la création de la session de paiement" });
  }
});

router.post("/stripe/checkout", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.userId;
  const { priceId, paymentMethod } = req.body;

  if (!priceId) {
    res.status(400).json({ error: "priceId requis" });
    return;
  }

  const resolvedPaymentMethod = paymentMethod === "paypal" ? "paypal" : "card";

  try {
    const profiles = await db
      .select()
      .from(userProfilesTable)
      .where(eq(userProfilesTable.userId, userId))
      .limit(1);

    const profile = profiles[0];
    const stripe = await getUncachableStripeClient();

    let customerId = profile?.stripeCustomerId;

    if (!customerId) {
      const email = await getClerkUserEmail(userId);
      const customer = await stripe.customers.create({
        email: email ?? undefined,
        metadata: { userId },
      });
      customerId = customer.id;
      await upsertStripeCustomerId(userId, customerId);
    }

    const domain = resolveCheckoutDomain(req);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      client_reference_id: userId,
      payment_method_types: ["card", "paypal"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `https://${domain}/dashboard?success=true`,
      cancel_url: `https://${domain}/pricing`,
    });

    res.json({ url: session.url });
  } catch (err: any) {
    console.error("Checkout error:", err.message);
    res.status(500).json({ error: "Erreur lors de la création de la session de paiement" });
  }
});

router.get("/stripe/subscription-status", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.userId;
  try {
    const stripe = await getUncachableStripeClient();

    // Step 1: get stripeCustomerId from user_profiles
    const profiles = await db
      .select()
      .from(userProfilesTable)
      .where(eq(userProfilesTable.userId, userId))
      .limit(1);

    let customerId = profiles[0]?.stripeCustomerId ?? null;

    // Step 2: if no customerId saved, try to find by Clerk email in Stripe
    if (!customerId) {
      const email = await getClerkUserEmail(userId);
      if (email) {
        const customers = await stripe.customers.list({ email, limit: 5 });
        const live = customers.data.find(c => c.livemode);
        if (live) {
          customerId = live.id;
          await upsertStripeCustomerId(userId, customerId);
          console.log(`[subscription-status] Auto-linked ${userId} → ${customerId} via email ${email}`);
        }
      }
    }

    if (!customerId) {
      const trialInfo = computeTrialInfo(profiles[0]);
      res.json({ plan: "free", planLabel: "Gratuit", ...trialInfo });
      return;
    }

    // Step 3: query live Stripe API directly for accurate subscription data
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 10,
      expand: ["data.items.data.price.product"],
    });

    const active = subscriptions.data.find(s => s.status === "active" || s.status === "trialing");

    if (!active) {
      const trialInfo = computeTrialInfo(profiles[0]);
      res.json({ plan: "free", planLabel: "Gratuit", ...trialInfo });
      return;
    }

    const item = active.items.data[0];
    const product = item?.price?.product as any;
    const name: string = product?.name || "";
    const plan = name.toLowerCase().includes("pro") ? "pro"
      : name.toLowerCase().includes("starter") ? "starter"
      : "paid";

    // Resolve access end date: prefer current_period_end, fall back to cancel_at,
    // then fall back to subscriptionPeriodEnd saved in user_profiles (written on cancel)
    const rawEnd = (active as any).current_period_end ?? (active as any).cancel_at ?? null;
    const currentPeriodEnd = rawEnd
      ? new Date(rawEnd * 1000).toISOString()
      : (profiles[0]?.subscriptionPeriodEnd ? profiles[0].subscriptionPeriodEnd.toISOString() : null);

    // Also sync to user_profiles for future quick lookups
    if (active.status === "active" || active.status === "trialing") {
      const periodEnd = rawEnd ? new Date(rawEnd * 1000) : null;
      await db
        .update(userProfilesTable)
        .set({
          stripeSubscriptionId: active.id,
          stripePriceId: item?.price?.id ?? null,
          subscriptionPlan: plan,
          subscriptionPeriodEnd: periodEnd,
        })
        .where(eq(userProfilesTable.userId, userId));
    }

    res.json({
      plan,
      planLabel: name,
      status: active.status,
      cancelAtPeriodEnd: active.cancel_at_period_end === true,
      subscriptionId: active.id,
      currentPeriodEnd,
      effectivePlan: plan,
      trialEndsAt: profiles[0]?.trialEndsAt ? profiles[0].trialEndsAt.toISOString() : null,
      trialDaysLeft: 0,
    });
  } catch (err: any) {
    console.error("Subscription status error:", err.message);
    res.status(500).json({ error: "Erreur lors de la récupération du statut" });
  }
});

router.post("/stripe/cancel-subscription", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.userId;
  try {
    const profiles = await db
      .select()
      .from(userProfilesTable)
      .where(eq(userProfilesTable.userId, userId))
      .limit(1);

    const profile = profiles[0];
    if (!profile?.stripeCustomerId) {
      res.status(400).json({ error: "Aucun abonnement actif trouvé" });
      return;
    }

    const stripe = await getUncachableStripeClient();

    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripeCustomerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      res.status(404).json({ error: "Aucun abonnement actif trouvé" });
      return;
    }

    const updated = await stripe.subscriptions.update(subscriptions.data[0].id, {
      cancel_at_period_end: true,
    });

    // Stripe sets cancel_at to the period-end date after enable cancel_at_period_end
    const rawEnd = (updated as any).cancel_at
      ?? (updated as any).current_period_end
      ?? null;
    const currentPeriodEnd = rawEnd ? new Date(rawEnd * 1000).toISOString() : null;

    // Sync the period end to user_profiles so the status endpoint can use it as fallback
    if (currentPeriodEnd) {
      await db
        .update(userProfilesTable)
        .set({ subscriptionPeriodEnd: new Date(currentPeriodEnd) })
        .where(eq(userProfilesTable.userId, userId));
    }

    res.json({ success: true, currentPeriodEnd });
  } catch (err: any) {
    console.error("Cancel subscription error:", err.message);
    res.status(500).json({ error: "Impossible d'annuler l'abonnement. Réessayez." });
  }
});

router.post("/stripe/portal", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.userId;
  try {
    const profiles = await db
      .select()
      .from(userProfilesTable)
      .where(eq(userProfilesTable.userId, userId))
      .limit(1);

    const profile = profiles[0];
    if (!profile?.stripeCustomerId) {
      res.status(400).json({ error: "Aucun abonnement actif trouvé" });
      return;
    }

    const stripe = await getUncachableStripeClient();
    const domain = resolveCheckoutDomain(req);

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripeCustomerId,
      return_url: `https://${domain}/subscription`,
    });

    res.json({ url: session.url });
  } catch (err: any) {
    console.error("Portal error:", err.message);
    res.status(500).json({ error: "Impossible d'ouvrir le portail de facturation. Vérifiez que le portail client Stripe est configuré." });
  }
});

export default router;
