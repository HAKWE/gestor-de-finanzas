import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { eq, sql } from "drizzle-orm";
import { db, userProfilesTable } from "@workspace/db";
import { getUncachableStripeClient } from "../stripeClient";

const router: IRouter = Router();

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
  const { planName } = req.body as { planName: string };

  if (!planName) {
    res.status(400).json({ error: "planName requis (starter | pro)" });
    return;
  }

  try {
    const stripe = await getUncachableStripeClient();

    console.log(`[checkout-by-plan] Fetching products for plan: ${planName}`);
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
      const customer = await stripe.customers.create({ metadata: { userId } });
      customerId = customer.id;
      await db
        .update(userProfilesTable)
        .set({ stripeCustomerId: customerId })
        .where(eq(userProfilesTable.userId, userId));
    }

    const domain = process.env.APP_DOMAIN || process.env.REPLIT_DOMAINS?.split(",")[0] || req.get("host");
    console.log(`[checkout-by-plan] Using domain: ${domain}`);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
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
  const { priceId } = req.body;

  if (!priceId) {
    res.status(400).json({ error: "priceId requis" });
    return;
  }

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
      const customer = await stripe.customers.create({
        metadata: { userId },
      });
      customerId = customer.id;

      await db
        .update(userProfilesTable)
        .set({ stripeCustomerId: customerId })
        .where(eq(userProfilesTable.userId, userId));
    }

    const domain = process.env.APP_DOMAIN || process.env.REPLIT_DOMAINS?.split(",")[0] || req.get("host");

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
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
    const profiles = await db
      .select()
      .from(userProfilesTable)
      .where(eq(userProfilesTable.userId, userId))
      .limit(1);

    const profile = profiles[0];

    if (!profile?.stripeCustomerId) {
      res.json({ plan: "free", planLabel: "Gratuit" });
      return;
    }

    const rows = await db.execute(sql`
      SELECT
        s.id AS subscription_id,
        s.status,
        s.cancel_at_period_end,
        p.name AS product_name,
        pr.unit_amount,
        pr.currency,
        s.current_period_end
      FROM stripe.subscriptions s
      JOIN stripe.subscription_items si ON si.subscription = s.id
      JOIN stripe.prices pr ON pr.id = si.price
      JOIN stripe.products p ON p.id = pr.product
      WHERE s.customer = ${profile.stripeCustomerId}
        AND s.status IN ('active', 'trialing')
      ORDER BY pr.unit_amount DESC
      LIMIT 1
    `);

    if (rows.rows.length === 0) {
      res.json({ plan: "free", planLabel: "Gratuit" });
      return;
    }

    const row = rows.rows[0] as any;
    const name: string = row.product_name || "";
    const plan = name.toLowerCase().includes("pro") ? "pro"
      : name.toLowerCase().includes("starter") ? "starter"
      : "paid";

    // current_period_end is a Unix timestamp (integer) in the stripe schema
    const rawEnd = row.current_period_end;
    const currentPeriodEnd = rawEnd
      ? (typeof rawEnd === "number" ? new Date(rawEnd * 1000).toISOString() : new Date(rawEnd).toISOString())
      : (profile.subscriptionPeriodEnd ? profile.subscriptionPeriodEnd.toISOString() : null);

    res.json({
      plan,
      planLabel: name,
      status: row.status,
      cancelAtPeriodEnd: row.cancel_at_period_end === true || row.cancel_at_period_end === "true" || row.cancel_at_period_end === 1,
      subscriptionId: row.subscription_id,
      currentPeriodEnd,
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

    await stripe.subscriptions.update(subscriptions.data[0].id, {
      cancel_at_period_end: true,
    });

    res.json({ success: true });
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
    const domain = process.env.APP_DOMAIN || process.env.REPLIT_DOMAINS?.split(",")[0] || req.get("host");

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
