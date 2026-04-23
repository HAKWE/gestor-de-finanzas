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
    const rows = await db.execute(sql`
      SELECT
        p.id AS product_id,
        p.name AS product_name,
        p.description AS product_description,
        p.active AS product_active,
        p.metadata AS product_metadata,
        pr.id AS price_id,
        pr.unit_amount,
        pr.currency,
        pr.recurring,
        pr.active AS price_active
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

    res.json({ data: Array.from(productsMap.values()) });
  } catch (err: any) {
    console.error("Error fetching products:", err.message);
    res.status(500).json({ error: "Erreur lors de la récupération des offres" });
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

    const domain =
      process.env.REPLIT_DOMAINS?.split(",")[0] ||
      req.get("host");

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `https://${domain}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://${domain}/pricing`,
    });

    res.json({ url: session.url });
  } catch (err: any) {
    console.error("Checkout error:", err.message);
    res.status(500).json({ error: "Erreur lors de la création de la session de paiement" });
  }
});

router.get("/stripe/subscription", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.userId;
  try {
    const profiles = await db
      .select()
      .from(userProfilesTable)
      .where(eq(userProfilesTable.userId, userId))
      .limit(1);

    const profile = profiles[0];
    if (!profile?.stripeSubscriptionId) {
      res.json({ subscription: null });
      return;
    }

    const rows = await db.execute(sql`
      SELECT * FROM stripe.subscriptions WHERE id = ${profile.stripeSubscriptionId}
    `);
    res.json({ subscription: rows.rows[0] || null });
  } catch (err: any) {
    console.error("Subscription error:", err.message);
    res.status(500).json({ error: "Erreur lors de la récupération de l'abonnement" });
  }
});

export default router;
