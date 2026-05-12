import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { eq } from "drizzle-orm";
import { db, userProfilesTable } from "@workspace/db";

const router: IRouter = Router();

function requireAuth(req: any, res: any, next: any) {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.userId = userId;
  next();
}

router.get("/profile", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.userId;
  const rows = await db
    .select()
    .from(userProfilesTable)
    .where(eq(userProfilesTable.userId, userId))
    .limit(1);

  if (rows.length === 0) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }

  res.json(rows[0]);
});

router.post("/profile", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.userId;
  const { accountType, currency, mobileMoneyProvider, onboardingCompleted } = req.body;

  const existing = await db
    .select()
    .from(userProfilesTable)
    .where(eq(userProfilesTable.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    const updated = await db
      .update(userProfilesTable)
      .set({
        accountType: accountType ?? existing[0].accountType,
        currency: currency ?? existing[0].currency,
        mobileMoneyProvider: mobileMoneyProvider ?? existing[0].mobileMoneyProvider,
        onboardingCompleted: onboardingCompleted ?? existing[0].onboardingCompleted,
      })
      .where(eq(userProfilesTable.userId, userId))
      .returning();
    res.json(updated[0]);
  } else {
    const inserted = await db
      .insert(userProfilesTable)
      .values({
        userId,
        accountType: accountType ?? "personal",
        currency: currency ?? "XOF",
        mobileMoneyProvider: mobileMoneyProvider ?? null,
        onboardingCompleted: onboardingCompleted ?? false,
        trialEndsAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      })
      .returning();
    res.json(inserted[0]);
  }
});

export default router;
