import { Router } from "express";
import { getAuth } from "@clerk/express";
import { eq, and } from "drizzle-orm";
import { db, referralCodesTable, referralsTable, userProfilesTable } from "@workspace/db";

const router = Router();

function generateCode(): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function requireAuth(req: any, res: any, next: any) {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  req.userId = userId;
  next();
}

router.get("/referral/me", requireAuth, async (req: any, res): Promise<void> => {
  const userId: string = req.userId;
  try {
    let codeRow = await db
      .select()
      .from(referralCodesTable)
      .where(eq(referralCodesTable.userId, userId))
      .limit(1)
      .then((r) => r[0]);

    if (!codeRow) {
      let code = generateCode();
      for (let attempt = 0; attempt < 10; attempt++) {
        const clash = await db
          .select()
          .from(referralCodesTable)
          .where(eq(referralCodesTable.code, code))
          .limit(1);
        if (clash.length === 0) break;
        code = generateCode();
      }
      [codeRow] = await db
        .insert(referralCodesTable)
        .values({ userId, code })
        .returning();
    }

    const referrals = await db
      .select()
      .from(referralsTable)
      .where(eq(referralsTable.referrerUserId, userId));

    const rewarded = referrals.filter((r) => r.status === "rewarded").length;
    const pending = referrals.filter((r) => r.status === "pending").length;

    res.json({
      code: codeRow.code,
      totalReferrals: referrals.length,
      successfulReferrals: rewarded,
      pendingReferrals: pending,
      rewardsEarned: rewarded,
    });
  } catch (err) {
    req.log.error({ err }, "[referral] GET /api/referral/me error");
    res.status(500).json({ error: "Internal error" });
  }
});

router.post("/referral/claim", requireAuth, async (req: any, res): Promise<void> => {
  const userId: string = req.userId;
  const { code } = req.body as { code?: string };

  if (!code || typeof code !== "string") {
    res.status(400).json({ error: "Missing code" });
    return;
  }

  try {
    const codeRow = await db
      .select()
      .from(referralCodesTable)
      .where(eq(referralCodesTable.code, code.toLowerCase().trim()))
      .limit(1)
      .then((r) => r[0]);

    if (!codeRow) {
      res.status(404).json({ error: "Invalid referral code" });
      return;
    }

    if (codeRow.userId === userId) {
      res.status(400).json({ error: "Cannot use your own referral code" });
      return;
    }

    const existing = await db
      .select()
      .from(referralsTable)
      .where(eq(referralsTable.referredUserId, userId))
      .limit(1);

    if (existing.length > 0) {
      res.json({ success: true, message: "Already claimed" });
      return;
    }

    await db.insert(referralsTable).values({
      referrerUserId: codeRow.userId,
      referredUserId: userId,
      status: "pending",
    });

    req.log.info(
      { referrerUserId: codeRow.userId, referredUserId: userId },
      "[referral] Referral claimed"
    );
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "[referral] POST /api/referral/claim error");
    res.status(500).json({ error: "Internal error" });
  }
});

export default router;
