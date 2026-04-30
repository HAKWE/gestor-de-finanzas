import { Router, type IRouter } from "express";
import { getAuth, createClerkClient } from "@clerk/express";
import { db, userProfilesTable } from "@workspace/db";

const router: IRouter = Router();

// ── Middleware admin ──────────────────────────────────────────────────────────
// Vérifie que l'utilisateur authentifié est dans la liste ADMIN_EMAIL
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

    req.userId = auth.userId;
    next();
  } catch (err: any) {
    res.status(500).json({ error: "Erreur vérification admin : " + err.message });
  }
}

// ── GET /api/admin/stats ──────────────────────────────────────────────────────
// Retourne stats globales + liste de tous les utilisateurs (Clerk + DB + Stripe)
router.get("/admin/stats", requireAdmin, async (_req, res): Promise<void> => {
  try {
    const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

    // 1. Tous les profils en base
    const profiles = await db.select().from(userProfilesTable);

    // 2. Tous les utilisateurs Clerk (max 200)
    const clerkResponse = await clerk.users.getUserList({ limit: 200, orderBy: "-created_at" });
    const clerkUsers = clerkResponse.data;

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

      userMap.set(p.userId, {
        userId: p.userId,
        email,
        name,
        plan: p.subscriptionPlan ?? "free",
        stripeCustomerId: p.stripeCustomerId ?? null,
        stripeSubscriptionId: p.stripeSubscriptionId ?? null,
        periodEnd: p.subscriptionPeriodEnd?.toISOString() ?? null,
        onboardingCompleted: p.onboardingCompleted,
        createdAt: p.createdAt.toISOString(),
        // Clerk last sign-in (si disponible)
        lastSignIn: cu?.lastSignInAt ? new Date(cu.lastSignInAt).toISOString() : null,
      });
    }

    // 4. Ajouter les utilisateurs Clerk sans profil DB (inscrits mais pas encore utilisé l'app)
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
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          periodEnd: null,
          onboardingCompleted: false,
          createdAt: new Date(cu.createdAt).toISOString(),
          lastSignIn: cu.lastSignInAt ? new Date(cu.lastSignInAt).toISOString() : null,
        });
      }
    }

    const users = [...userMap.values()].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // 5. Calculer les statistiques
    const total   = users.length;
    const free    = users.filter(u => !u.plan || u.plan === "free").length;
    const starter = users.filter(u => u.plan === "starter").length;
    const pro     = users.filter(u => u.plan === "pro").length;
    const paid    = starter + pro;
    const convRate = total > 0 ? ((paid / total) * 100).toFixed(1) : "0.0";

    res.json({
      stats: { total, free, starter, pro, paid, convRate },
      users,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
