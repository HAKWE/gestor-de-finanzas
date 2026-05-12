import { db, userProfilesTable } from "@workspace/db";
import { sql, and, eq, isNotNull } from "drizzle-orm";
import { logger } from "./lib/logger";

const TRIAL_DAYS = 45;

async function sendTrialReminderEmail(
  email: string,
  daysLeft: number,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    logger.warn({ email, daysLeft }, "[trial-cron] RESEND_API_KEY not set — skipping email");
    return;
  }
  const subject =
    daysLeft <= 7
      ? `⏰ Plus que ${daysLeft} jour${daysLeft > 1 ? "s" : ""} pour votre essai MobileMoney Manager`
      : `📅 Votre essai MobileMoney Manager se termine dans ${daysLeft} jours`;

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;margin:0;padding:32px 16px;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#f97316,#fb923c);padding:28px 32px;">
      <p style="color:#fff7ed;font-size:12px;font-weight:600;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.08em;">MobileMoney Manager</p>
      <h1 style="color:#fff;font-size:22px;font-weight:800;margin:0;line-height:1.3;">
        ${daysLeft <= 7
          ? `⏰ Plus que ${daysLeft} jour${daysLeft > 1 ? "s" : ""} d'essai`
          : `📅 Votre essai se termine dans ${daysLeft} jours`}
      </h1>
    </div>
    <div style="padding:28px 32px;">
      <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 20px;">
        Bonjour,<br><br>
        Votre période d'essai gratuite de <strong>${TRIAL_DAYS} jours</strong> se terminera dans
        <strong>${daysLeft} jour${daysLeft > 1 ? "s" : ""}</strong>.
        ${daysLeft <= 7
          ? " Il est temps de choisir un plan pour continuer à gérer votre activité sans interruption."
          : " Profitez de tous les avantages premium pendant les jours restants !"}
      </p>

      <div style="background:#fff7ed;border:1.5px solid #fed7aa;border-radius:14px;padding:18px 20px;margin-bottom:24px;">
        <p style="font-size:13px;font-weight:700;color:#92400e;margin:0 0 12px;">Après la période d'essai :</p>
        <ul style="margin:0;padding:0 0 0 16px;color:#374151;font-size:13px;line-height:1.8;">
          <li>Accès limité aux 14 derniers jours de transactions</li>
          <li>Maximum 10 transactions par mois</li>
          <li>Pas d'export PDF ni de rapports avancés</li>
        </ul>
      </div>

      <a href="https://mobilemoneymanager.africa/pricing"
        style="display:block;background:#f97316;color:#fff;text-decoration:none;text-align:center;padding:14px 24px;border-radius:12px;font-weight:800;font-size:15px;margin-bottom:16px;">
        Choisir mon plan dès maintenant →
      </a>
      <p style="font-size:12px;color:#9ca3af;text-align:center;margin:0;">
        Plan Starter à partir de 5 €/mois · Annulable à tout moment
      </p>
    </div>
    <div style="border-top:1px solid #f3f4f6;padding:16px 32px;">
      <p style="font-size:11px;color:#9ca3af;margin:0;text-align:center;">
        © ${new Date().getFullYear()} MobileMoney Manager · <a href="https://mobilemoneymanager.africa" style="color:#f97316;text-decoration:none;">mobilemoneymanager.africa</a>
      </p>
    </div>
  </div>
</body>
</html>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "MobileMoney Manager <noreply@mobilemoneymanager.africa>",
        to: [email],
        subject,
        html,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      logger.error({ email, daysLeft, err }, "[trial-cron] Failed to send email via Resend");
    } else {
      logger.info({ email, daysLeft }, "[trial-cron] Trial reminder email sent");
    }
  } catch (err: any) {
    logger.error({ err, email }, "[trial-cron] Email send exception");
  }
}

async function runTrialReminderCheck(): Promise<void> {
  try {
    const now = new Date();

    const profiles = await db
      .select()
      .from(userProfilesTable)
      .where(isNotNull(userProfilesTable.trialEndsAt));

    for (const profile of profiles) {
      if (!profile.trialEndsAt) continue;

      const trialEnd = new Date(profile.trialEndsAt);
      const msLeft = trialEnd.getTime() - now.getTime();
      const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));

      if (daysLeft <= 7 && daysLeft > 0 && !profile.trialReminder7dSent) {
        const emailRes = await (await import("./lib/getUserEmail")).getUserEmail(profile.userId);
        if (emailRes) {
          await sendTrialReminderEmail(emailRes, daysLeft);
          await db.update(userProfilesTable)
            .set({ trialReminder7dSent: true })
            .where(eq(userProfilesTable.userId, profile.userId));
        }
      } else if (daysLeft <= 30 && daysLeft > 7 && !profile.trialReminder30dSent) {
        const emailRes = await (await import("./lib/getUserEmail")).getUserEmail(profile.userId);
        if (emailRes) {
          await sendTrialReminderEmail(emailRes, daysLeft);
          await db.update(userProfilesTable)
            .set({ trialReminder30dSent: true })
            .where(eq(userProfilesTable.userId, profile.userId));
        }
      }
    }

    logger.info("[trial-cron] Trial reminder check complete");
  } catch (err: any) {
    logger.error({ err }, "[trial-cron] Error during trial reminder check");
  }
}

export function startTrialCron(): void {
  const INTERVAL_MS = 24 * 60 * 60 * 1000;
  setTimeout(() => {
    runTrialReminderCheck();
    setInterval(runTrialReminderCheck, INTERVAL_MS);
  }, 60_000);
  logger.info("[trial-cron] Trial reminder cron scheduled (daily, starting in 60s)");
}

export async function backfillTrialDates(): Promise<void> {
  try {
    await db.execute(sql`
      UPDATE user_profiles
      SET trial_ends_at = GREATEST(created_at + INTERVAL '${sql.raw(String(TRIAL_DAYS))} days', NOW() + INTERVAL '1 day')
      WHERE trial_ends_at IS NULL
    `);
    logger.info("[trial-cron] Trial dates backfilled for existing users");
  } catch (err: any) {
    logger.error({ err }, "[trial-cron] Failed to backfill trial dates");
  }
}
