import { Router, type IRouter } from "express";
import { getAuth, createClerkClient } from "@clerk/express";
import { db, userProfilesTable } from "@workspace/db";

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

    // 1. Tous les profils en base
    const profiles = await db.select().from(userProfilesTable);

    // 2. Tous les utilisateurs Clerk (max 500)
    const [page1, page2] = await Promise.all([
      clerk.users.getUserList({ limit: 500, offset: 0, orderBy: "-created_at" }),
      clerk.users.getUserList({ limit: 500, offset: 500, orderBy: "-created_at" }),
    ]);
    const clerkUsers = [...page1.data, ...page2.data];

    // Map userId → clerk user pour jointure rapide
    const clerkMap = new Map(clerkUsers.map(u => [u.id, u]));

    // 3. Construire la liste enrichie depuis les profils DB
    const userMap = new Map<string, any>();

    for (const p of profiles) {
      const cu = clerkMap.get(p.userId);
      const email =
        cu?.emailAddresses.find(e => e.id === cu.primaryEmailAddressId)?.emailAddress
        ?? cu?.emailAddresses[0]?.emailAddress
        ?? "—";
      const name =
        [cu?.firstName, cu?.lastName].filter(Boolean).join(" ").trim()
        || email.split("@")[0];

      const plan = p.subscriptionPlan ?? "free";
      const periodEnd = p.subscriptionPeriodEnd ?? null;
      const trialEndsAt = p.trialEndsAt ?? null;
      const subscriptionStatus = deriveSubscriptionStatus(plan, p.stripeSubscriptionId ?? null, periodEnd, trialEndsAt);

      userMap.set(p.userId, {
        userId: p.userId,
        email,
        name,
        plan,
        subscriptionStatus,
        trialEndsAt: trialEndsAt?.toISOString() ?? null,
        trialDaysLeft: trialEndsAt ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0,
        stripeCustomerId: p.stripeCustomerId ?? null,
        stripeSubscriptionId: p.stripeSubscriptionId ?? null,
        periodEnd: periodEnd?.toISOString() ?? null,
        currency: p.currency ?? "XOF",
        onboardingCompleted: p.onboardingCompleted,
        createdAt: p.createdAt.toISOString(),
        lastSignIn: cu?.lastSignInAt ? new Date(cu.lastSignInAt).toISOString() : null,
      });
    }

    // 4. Utilisateurs Clerk sans profil DB
    for (const cu of clerkUsers) {
      if (!userMap.has(cu.id)) {
        const email =
          cu.emailAddresses.find(e => e.id === cu.primaryEmailAddressId)?.emailAddress
          ?? cu.emailAddresses[0]?.emailAddress
          ?? "—";
        const name = [cu.firstName, cu.lastName].filter(Boolean).join(" ").trim() || email.split("@")[0];
        userMap.set(cu.id, {
          userId: cu.id,
          email,
          name,
          plan: "free",
          subscriptionStatus: "free",
          trialEndsAt: null,
          trialDaysLeft: 0,
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          periodEnd: null,
          currency: "XOF",
          onboardingCompleted: false,
          createdAt: new Date(cu.createdAt).toISOString(),
          lastSignIn: cu.lastSignInAt ? new Date(cu.lastSignInAt).toISOString() : null,
        });
      }
    }

    const users = [...userMap.values()].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const total       = users.length;
    const trial       = users.filter(u => u.subscriptionStatus === "trial").length;
    const free        = users.filter(u => u.subscriptionStatus === "free").length;
    const starter     = users.filter(u => u.plan === "starter").length;
    const pro         = users.filter(u => u.plan === "pro").length;
    const paid        = starter + pro;
    const active      = users.filter(u => u.subscriptionStatus === "active").length;
    const convRate    = total > 0 ? ((paid / total) * 100).toFixed(1) : "0.0";
    const trialConv   = trial > 0 ? ((paid / trial) * 100).toFixed(1) : "0.0";

    res.json({
      stats: { total, trial, free, starter, pro, paid, active, convRate, trialConv },
      users,
      generatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
