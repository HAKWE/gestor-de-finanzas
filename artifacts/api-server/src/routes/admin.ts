import { Router, type IRouter } from "express";
import { getAuth, createClerkClient } from "@clerk/express";
import { eq, sql } from "drizzle-orm";
import { db, userProfilesTable } from "@workspace/db";
import { getUncachableStripeClient } from "../stripeClient";
import Stripe from "stripe";

const router: IRouter = Router();

// ── Middleware admin ──────────────────────────────────────────────────────────
async function requireAdmin(req: any, res: any, next: any): Promise<void> {
  const auth = getAuth(req);
  if (!auth?.userId) {
    res.status(401).json({ error: "Non authentifié" });
    return;
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    res.status(403).json({ error: "ADMIN_EMAIL non configuré sur le serveur" });
    return;
  }

  try {
    const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
    const user = await clerk.users.getUser(auth.userId);
    const email =
      user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress
      ?? user.emailAddresses[0]?.emailAddress
      ?? "";

    const allowed = adminEmail.split(",").map(e => e.trim().toLowerCase());
    if (!allowed.includes(email.toLowerCase())) {
      res.status(403).json({ error: "Accès refusé — compte non autorisé" });
      return;
    }

    (req as any).adminEmail = email;
    (req as any).userId = auth.userId;
    next();
  } catch (err: any) {
    res.status(500).json({ error: "Erreur vérification admin : " + err.message });
  }
}

// ── Dériver le statut d'abonnement ────────────────────────────────────────────
function deriveSubscriptionStatus(
  plan: string | null,
  stripeSubscriptionId: string | null,
  periodEnd: Date | null,
  trialEndsAt: Date | null,
): "active" | "trial" | "cancelled" | "expired" | "free" {
  // Paid plan with an active subscription
  if (plan && plan !== "free" && plan !== "limited_free") {
    if (!stripeSubscriptionId && !periodEnd) return "active";
    if (!periodEnd) return "active";
    const now = new Date();
    return periodEnd > now ? "active" : "expired";
  }
  // No paid plan — check if still within free trial
  if (trialEndsAt && trialEndsAt > new Date()) return "trial";
  // Trial expired, no paid plan
  return "free";
}

// ── GET /api/admin/stats ──────────────────────────────────────────────────────
router.get("/admin/stats", requireAdmin, async (_req, res): Promise<void> => {
  try {
    const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

    // 1. Load all profiles + live Stripe subscription data in one query
    //    Uses the stripe schema (kept current by stripe-replit-sync) so no webhook dependency.
    const [profiles, stripeRows, clerkPage1, clerkPage2] = await Promise.all([
      db.select().from(userProfilesTable),
      db.execute(sql`
        SELECT
          up.user_id,
          up.stripe_customer_id,
          s.id            AS subscription_id,
          s.status        AS sub_status,
          s.billing_cycle_anchor AS period_anchor,
          s.current_period_end   AS period_end,
          LOWER(pr._raw_data->>'name') AS product_name
        FROM user_profiles up
        JOIN stripe.subscriptions s ON s.customer = up.stripe_customer_id
        LEFT JOIN stripe.prices pi2 ON pi2.id = (s._raw_data->'items'->'data'->0->'price'->>'id')
        LEFT JOIN stripe.products pr ON pr.id = (pi2._raw_data->>'product')
        WHERE up.stripe_customer_id IS NOT NULL
          AND s.status IN ('active', 'trialing', 'past_due')
        ORDER BY s.created DESC
      `),
      clerk.users.getUserList({ limit: 500, offset: 0, orderBy: "-created_at" }),
      clerk.users.getUserList({ limit: 500, offset: 500, orderBy: "-created_at" }),
    ]);

    // Map stripe_customer_id → best active subscription
    const stripeSubMap = new Map<string, {
      subscriptionId: string; status: string; plan: string; periodEnd: string | null;
    }>();
    for (const row of stripeRows.rows as any[]) {
      if (stripeSubMap.has(row.stripe_customer_id)) continue; // keep first (most recent)
      const productName: string = row.product_name ?? "";
      const plan = productName.includes("pro") ? "pro"
        : productName.includes("starter") ? "starter"
        : "paid";
      const rawEnd = row.period_end ?? row.period_anchor;
      const periodEnd = rawEnd ? new Date(Number(rawEnd) * 1000).toISOString() : null;
      stripeSubMap.set(row.stripe_customer_id, {
        subscriptionId: row.subscription_id,
        status: row.sub_status,
        plan,
        periodEnd,
      });
    }

    const clerkUsers = [...clerkPage1.data, ...clerkPage2.data];
    const clerkMap = new Map(clerkUsers.map(u => [u.id, u]));

    // 2. Build enriched user list — subscription truth comes from Stripe schema
    const userMap = new Map<string, any>();

    for (const p of profiles) {
      const cu = clerkMap.get(p.userId);
      const email =
        cu?.emailAddresses.find(e => e.id === cu.primaryEmailAddressId)?.emailAddress
        ?? cu?.emailAddresses[0]?.emailAddress ?? "—";
      const name = [cu?.firstName, cu?.lastName].filter(Boolean).join(" ").trim() || email.split("@")[0];

      // Prefer live Stripe data; fall back to DB fields for cancelled/expired
      const stripeSub = p.stripeCustomerId ? stripeSubMap.get(p.stripeCustomerId) : null;
      const trialEndsAt = p.trialEndsAt ?? null;

      let plan: string;
      let subscriptionStatus: string;
      let periodEnd: string | null;
      let stripeSubscriptionId: string | null;

      if (stripeSub) {
        plan = stripeSub.plan;
        subscriptionStatus = stripeSub.status === "active" || stripeSub.status === "trialing" ? "active" : "expired";
        periodEnd = stripeSub.periodEnd;
        stripeSubscriptionId = stripeSub.subscriptionId;
      } else {
        // No live Stripe sub — use DB fields (handles cancelled/expired correctly)
        plan = p.subscriptionPlan ?? "free";
        stripeSubscriptionId = p.stripeSubscriptionId ?? null;
        const dbPeriodEnd = p.subscriptionPeriodEnd ?? null;
        periodEnd = dbPeriodEnd?.toISOString() ?? null;
        subscriptionStatus = deriveSubscriptionStatus(
          plan, stripeSubscriptionId, dbPeriodEnd, trialEndsAt
        );
      }

      userMap.set(p.userId, {
        userId: p.userId,
        email,
        name,
        plan,
        subscriptionStatus,
        trialEndsAt: trialEndsAt?.toISOString() ?? null,
        trialDaysLeft: trialEndsAt ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / 86400000)) : 0,
        stripeCustomerId: p.stripeCustomerId ?? null,
        stripeSubscriptionId,
        periodEnd,
        currency: p.currency ?? "XOF",
        onboardingCompleted: p.onboardingCompleted,
        createdAt: p.createdAt.toISOString(),
        lastSignIn: cu?.lastSignInAt ? new Date(cu.lastSignInAt).toISOString() : null,
      });
    }

    // 3. Clerk users without a DB profile
    for (const cu of clerkUsers) {
      if (userMap.has(cu.id)) continue;
      const email =
        cu.emailAddresses.find(e => e.id === cu.primaryEmailAddressId)?.emailAddress
        ?? cu.emailAddresses[0]?.emailAddress ?? "—";
      const name = [cu.firstName, cu.lastName].filter(Boolean).join(" ").trim() || email.split("@")[0];
      userMap.set(cu.id, {
        userId: cu.id, email, name,
        plan: "free", subscriptionStatus: "free",
        trialEndsAt: null, trialDaysLeft: 0,
        stripeCustomerId: null, stripeSubscriptionId: null, periodEnd: null,
        currency: "XOF", onboardingCompleted: false,
        createdAt: new Date(cu.createdAt).toISOString(),
        lastSignIn: cu.lastSignInAt ? new Date(cu.lastSignInAt).toISOString() : null,
      });
    }

    const users = [...userMap.values()].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const total    = users.length;
    const trial    = users.filter(u => u.subscriptionStatus === "trial").length;
    const free     = users.filter(u => u.subscriptionStatus === "free").length;
    const starter  = users.filter(u => u.plan === "starter").length;
    const pro      = users.filter(u => u.plan === "pro").length;
    const paid     = users.filter(u => u.plan !== "free" && u.subscriptionStatus === "active").length;
    const active   = users.filter(u => u.subscriptionStatus === "active").length;
    const convRate = total > 0 ? ((paid / total) * 100).toFixed(1) : "0.0";
    const trialConv = trial > 0 ? ((paid / trial) * 100).toFixed(1) : "0.0";

    res.json({
      stats: { total, trial, free, starter, pro, paid, active, convRate, trialConv },
      users,
      generatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/admin/sync-subscription ────────────────────────────────────────
// Re-syncs a user's subscription from Stripe into the DB using their Stripe customer ID.
router.post("/admin/sync-subscription", requireAdmin, async (req: any, res: any): Promise<void> => {
  const { stripeCustomerId } = req.body as { stripeCustomerId?: string };
  if (!stripeCustomerId) {
    res.status(400).json({ error: "stripeCustomerId is required" });
    return;
  }

  try {
    const stripe = await getUncachableStripeClient();

    // Find the profile by customer ID
    const profiles = await db
      .select()
      .from(userProfilesTable)
      .where(eq(userProfilesTable.stripeCustomerId, stripeCustomerId))
      .limit(1);

    if (!profiles[0]) {
      res.status(404).json({ error: "No user profile found for this Stripe customer ID" });
      return;
    }

    // Fetch active subscriptions from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: "active",
      limit: 1,
    });

    if (!subscriptions.data.length) {
      res.status(404).json({ error: "No active Stripe subscription found for this customer" });
      return;
    }

    const sub = subscriptions.data[0];
    const item = sub.items.data[0];
    if (!item) {
      res.status(400).json({ error: "Subscription has no price items" });
      return;
    }

    // Resolve plan name from product
    let planName: "starter" | "pro" | "paid" = "paid";
    try {
      const price = await stripe.prices.retrieve(item.price.id, { expand: ["product"] });
      const productName = ((price.product as Stripe.Product).name ?? "").toLowerCase();
      if (productName.includes("pro")) planName = "pro";
      else if (productName.includes("starter")) planName = "starter";
    } catch { /* keep "paid" fallback */ }

    const periodEndRaw = (sub as any).current_period_end ?? (sub as any).billing_cycle_anchor ?? null;
    const periodEnd = periodEndRaw
      ? new Date(periodEndRaw * 1000)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await db
      .update(userProfilesTable)
      .set({
        stripeSubscriptionId: sub.id,
        stripePriceId: item.price.id,
        subscriptionPlan: planName,
        subscriptionPeriodEnd: periodEnd,
      })
      .where(eq(userProfilesTable.stripeCustomerId, stripeCustomerId));

    res.json({
      ok: true,
      userId: profiles[0].userId,
      subscriptionId: sub.id,
      plan: planName,
      periodEnd: periodEnd.toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
