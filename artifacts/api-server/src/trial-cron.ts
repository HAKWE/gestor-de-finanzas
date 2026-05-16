import { db, userProfilesTable } from "@workspace/db";
import { sql, eq, isNotNull } from "drizzle-orm";
import { logger } from "./lib/logger";

const TRIAL_DAYS = 45;
const FROM = "MobileMoney Manager <noreply@mail.mobilemoneymanager.africa>";
const BASE_URL = "https://mobilemoneymanager.africa";

// ── Shared email chrome ──────────────────────────────────────────────────────
function emailWrapper(headerBg: string, headerContent: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MobileMoney Manager</title>
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f3f4f6;margin:0;padding:32px 16px;">
  <div style="max-width:540px;margin:0 auto;">

    <!-- Card -->
    <div style="background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 32px rgba(0,0,0,0.10);">

      <!-- Header -->
      <div style="background:${headerBg};padding:32px 36px 28px;">
        <div style="display:inline-flex;align-items:center;gap:8px;margin-bottom:16px;">
          <div style="width:32px;height:32px;background:rgba(255,255,255,0.25);border-radius:9px;display:inline-flex;align-items:center;justify-content:center;">
            <span style="font-size:16px;">💸</span>
          </div>
          <span style="color:rgba(255,255,255,0.85);font-size:13px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;">MobileMoney Manager</span>
        </div>
        ${headerContent}
      </div>

      <!-- Body -->
      <div style="padding:32px 36px;">
        ${bodyContent}
      </div>

      <!-- Footer -->
      <div style="border-top:1px solid #f3f4f6;padding:20px 36px;background:#fafafa;">
        <p style="font-size:12px;color:#9ca3af;margin:0;text-align:center;line-height:1.6;">
          © ${new Date().getFullYear()} MobileMoney Manager &nbsp;·&nbsp;
          <a href="${BASE_URL}" style="color:#f97316;text-decoration:none;">mobilemoneymanager.africa</a>
          <br>
          Vous recevez cet email car vous avez créé un compte MobileMoney Manager.
        </p>
      </div>
    </div>

  </div>
</body>
</html>`;
}

function ctaButton(label: string, href: string, bg = "#f97316", shadow = "rgba(249,115,22,0.35)"): string {
  return `<a href="${href}" style="display:block;background:${bg};color:#ffffff;text-decoration:none;text-align:center;padding:15px 28px;border-radius:14px;font-weight:800;font-size:15px;margin:24px 0 0;box-shadow:0 4px 16px ${shadow};letter-spacing:-0.01em;">${label}</a>`;
}

function featureRow(icon: string, title: string, desc: string): string {
  return `<tr>
    <td style="padding:10px 0;vertical-align:top;width:44px;">
      <div style="width:36px;height:36px;background:#fff7ed;border-radius:10px;text-align:center;line-height:36px;font-size:18px;">${icon}</div>
    </td>
    <td style="padding:10px 0 10px 12px;vertical-align:top;">
      <div style="font-size:14px;font-weight:700;color:#111827;">${title}</div>
      <div style="font-size:12px;color:#6b7280;margin-top:2px;line-height:1.5;">${desc}</div>
    </td>
  </tr>`;
}

function lossRow(text: string): string {
  return `<tr>
    <td style="padding:5px 0;vertical-align:top;width:24px;color:#dc2626;font-size:14px;">✗</td>
    <td style="padding:5px 0;vertical-align:top;font-size:13px;color:#374151;">${text}</td>
  </tr>`;
}

// ── Email 1: Welcome (Day 1) ─────────────────────────────────────────────────
function buildWelcomeEmail(): { subject: string; html: string } {
  const subject = "🎉 Bienvenue sur MobileMoney Manager — Démarrez en 2 minutes";
  const html = emailWrapper(
    "linear-gradient(135deg, #f97316 0%, #fb923c 100%)",
    `<h1 style="color:#ffffff;font-size:26px;font-weight:900;margin:0;line-height:1.3;">
      Bienvenue ! Votre essai de 45 jours commence maintenant 🚀
    </h1>`,
    `<p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 24px;">
      Bonjour,<br><br>
      Votre compte MobileMoney Manager est prêt. Vous avez <strong>45 jours d'accès complet gratuit</strong>
      à tous les outils dont vous avez besoin pour gérer votre activité comme un pro — transactions,
      rapports, inventaire et plus encore.
    </p>

    <div style="background:#fff7ed;border:1.5px solid #fed7aa;border-radius:16px;padding:22px 24px;margin-bottom:28px;">
      <p style="font-size:13px;font-weight:800;color:#92400e;margin:0 0 14px;text-transform:uppercase;letter-spacing:0.06em;">Par où commencer ?</p>
      <table style="width:100%;border-collapse:collapse;">
        ${featureRow("➕", "Ajoutez votre première transaction", "Revenus ou dépenses — enregistrez chaque entrée et sortie d'argent en quelques secondes.")}
        ${featureRow("📊", "Consultez votre tableau de bord", "Solde du jour, revenus de la semaine, graphiques — tout est visible en un coup d'œil.")}
        ${featureRow("📦", "Gérez votre inventaire", "Notez vos stocks (produits, quantités, unités) pour ne jamais manquer de rien.")}
      </table>
    </div>

    <div style="background:#eff6ff;border:1.5px solid #bfdbfe;border-radius:16px;padding:20px 24px;margin-bottom:8px;">
      <p style="font-size:13px;font-weight:800;color:#1e40af;margin:0 0 8px;">💡 Astuce du jour</p>
      <p style="font-size:13px;color:#1e3a8a;margin:0;line-height:1.6;">
        Pour importer vos transactions Orange Money ou Wave, allez dans
        <strong>Importer → SMS</strong> et collez vos messages reçus.
        MobileMoney Manager détecte automatiquement les montants, dates et références.
      </p>
    </div>

    ${ctaButton("Accéder à mon tableau de bord →", `${BASE_URL}/dashboard`)}

    <p style="font-size:12px;color:#9ca3af;text-align:center;margin:16px 0 0;line-height:1.6;">
      Questions ? Répondez directement à cet email — nous sommes là pour vous aider.
    </p>`
  );
  return { subject, html };
}

// ── Email 2: Value nudge (Day 10) ────────────────────────────────────────────
function buildValueEmail(): { subject: string; html: string } {
  const subject = "📈 Avez-vous essayé ces fonctionnalités ? (Jour 10 de votre essai)";
  const html = emailWrapper(
    "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)",
    `<h1 style="color:#ffffff;font-size:24px;font-weight:900;margin:0 0 8px;line-height:1.3;">
      Vous avez déjà 10 jours d'avance sur votre activité 💪
    </h1>
    <p style="color:rgba(255,255,255,0.80);font-size:14px;margin:0;">Voici ce que vous pourriez encore débloquer.</p>`,
    `<p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 24px;">
      Bonjour,<br><br>
      Vous utilisez MobileMoney Manager depuis 10 jours — félicitations !
      Beaucoup d'utilisateurs passent à un plan payant autour du jour 15 pour
      <strong>ne pas perdre leurs données et rapports</strong> accumulés.
      Voici quelques fonctionnalités que vous n'avez peut-être pas encore explorées :
    </p>

    <div style="background:#f9fafb;border:1.5px solid #e5e7eb;border-radius:16px;padding:22px 24px;margin-bottom:28px;">
      <p style="font-size:13px;font-weight:800;color:#374151;margin:0 0 14px;text-transform:uppercase;letter-spacing:0.06em;">Fonctionnalités à découvrir</p>
      <table style="width:100%;border-collapse:collapse;">
        ${featureRow("📄", "Export PDF professionnel", "Générez un rapport mensuel de votre activité, partageable avec votre comptable ou vos clients.")}
        ${featureRow("📱", "Import SMS automatique", "Importez vos relevés Orange Money, Wave et MTN MoMo depuis vos messages en un clic.")}
        ${featureRow("📈", "Rapports hebdomadaires", "Visualisez vos revenus vs dépenses semaine par semaine avec des graphiques clairs.")}
        ${featureRow("🗂️", "Catégories personnalisées", "Organisez vos transactions par type d'activité pour mieux comprendre vos marges.")}
      </table>
    </div>

    <div style="background:#f0fdf4;border:1.5px solid #86efac;border-radius:16px;padding:20px 24px;margin-bottom:8px;">
      <p style="font-size:13px;font-weight:800;color:#15803d;margin:0 0 8px;">✨ Histoire vraie</p>
      <p style="font-size:13px;color:#166534;margin:0;line-height:1.6;">
        <em>"Avant, je notais tout dans un carnet et je perdais des semaines entières de données.
        Maintenant, j'exporte mon rapport PDF chaque fin de mois et je vois exactement
        quels produits me rapportent le plus."</em>
        <br><strong style="color:#15803d;">— Aminata, gérante de salon de beauté, Dakar</strong>
      </p>
    </div>

    ${ctaButton("Découvrir toutes les fonctionnalités →", `${BASE_URL}/dashboard`)}

    <p style="font-size:12px;color:#9ca3af;text-align:center;margin:16px 0 0;line-height:1.6;">
      Il vous reste encore <strong>35 jours d'essai gratuit</strong>. Profitez-en !
    </p>`
  );
  return { subject, html };
}

// ── Email 3: Urgency (Day 30, ~15 days left) ─────────────────────────────────
function buildUrgencyEmail(daysLeft: number): { subject: string; html: string } {
  const subject = `⏳ Votre essai se termine dans ${daysLeft} jours — Offre spéciale incluse`;
  const html = emailWrapper(
    "linear-gradient(135deg, #ea580c 0%, #f97316 100%)",
    `<h1 style="color:#ffffff;font-size:24px;font-weight:900;margin:0 0 8px;line-height:1.3;">
      Plus que ${daysLeft} jours — ne perdez pas vos données 📅
    </h1>
    <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:0;">Votre essai gratuit de 45 jours arrive à mi-parcours.</p>`,
    `<p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 24px;">
      Bonjour,<br><br>
      Il vous reste <strong>${daysLeft} jours</strong> sur votre essai gratuit MobileMoney Manager.
      Après cette date, votre compte passera en mode limité et vous perdrez l'accès à :
    </p>

    <div style="background:#fef2f2;border:1.5px solid #fca5a5;border-radius:16px;padding:20px 24px;margin-bottom:24px;">
      <p style="font-size:13px;font-weight:800;color:#991b1b;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.06em;">Ce que vous perdrez</p>
      <table style="width:100%;border-collapse:collapse;">
        ${lossRow("L'historique complet de toutes vos transactions")}
        ${lossRow("L'export PDF de vos rapports financiers")}
        ${lossRow("Les graphiques et statistiques avancées")}
        ${lossRow("L'import SMS depuis Orange Money, Wave et MTN MoMo")}
        ${lossRow("Les transactions illimitées (limité à 10/mois)")}
      </table>
    </div>

    <div style="background:linear-gradient(135deg,#fff7ed,#ffedd5);border:2px solid #fed7aa;border-radius:16px;padding:22px 24px;margin-bottom:8px;">
      <div style="display:inline-block;background:#f97316;color:#fff;font-size:11px;font-weight:800;padding:4px 12px;border-radius:999px;margin-bottom:12px;letter-spacing:0.06em;text-transform:uppercase;">🎁 Offre de lancement</div>
      <p style="font-size:18px;font-weight:900;color:#9a3412;margin:0 0 6px;">Starter à <span style="color:#f97316;">3,99 €</span>/mois</p>
      <p style="font-size:13px;color:#92400e;margin:0 0 14px;line-height:1.6;">
        Pendant les <strong>3 premiers mois</strong> (au lieu de 5 €/mois) —
        sans engagement, annulable à tout moment.
      </p>
      <table style="width:100%;border-collapse:collapse;">
        ${featureRow("✅", "Transactions illimitées", "Enregistrez autant de revenus et dépenses que vous voulez.")}
        ${featureRow("📄", "Export PDF mensuel", "Rapport professionnel prêt à partager.")}
        ${featureRow("📊", "Rapports & graphiques avancés", "Comprenez votre activité en profondeur.")}
      </table>
    </div>

    ${ctaButton("Passer au plan Starter — 3,99 €/mois →", `${BASE_URL}/pricing`, "linear-gradient(135deg,#f97316,#ea580c)")}

    <p style="font-size:12px;color:#9ca3af;text-align:center;margin:16px 0 0;line-height:1.6;">
      Sans CB obligatoire pendant l'essai · Annulable à tout moment · Aucun remboursement demandé
    </p>`
  );
  return { subject, html };
}

// ── Email 4: Final reminder (Day 40, ~5 days left) ───────────────────────────
function buildFinalEmail(daysLeft: number): { subject: string; html: string } {
  const subject = `🚨 Plus que ${daysLeft} jours — Votre dernier rappel`;
  const html = emailWrapper(
    "linear-gradient(135deg, #991b1b 0%, #dc2626 100%)",
    `<h1 style="color:#ffffff;font-size:24px;font-weight:900;margin:0 0 8px;line-height:1.3;">
      ⚠️ Dernière chance — votre essai se termine dans ${daysLeft} jours
    </h1>
    <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:0;">Upgradez maintenant pour ne rien perdre.</p>`,
    `<p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 20px;">
      Bonjour,<br><br>
      C'est votre dernier rappel. Dans <strong style="color:#dc2626;">${daysLeft} jour${daysLeft > 1 ? "s" : ""}</strong>,
      votre essai gratuit prend fin et votre accès sera automatiquement limité.
      Toutes vos données sont en sécurité — mais vous n'aurez plus accès à l'essentiel
      sans un plan actif.
    </p>

    <!-- Countdown pill -->
    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-block;background:#fef2f2;border:2px solid #fca5a5;border-radius:16px;padding:16px 32px;">
        <div style="font-size:42px;font-weight:900;color:#dc2626;line-height:1;">${daysLeft}</div>
        <div style="font-size:13px;font-weight:700;color:#b91c1c;text-transform:uppercase;letter-spacing:0.08em;">jour${daysLeft > 1 ? "s" : ""} restant${daysLeft > 1 ? "s" : ""}</div>
      </div>
    </div>

    <div style="background:#fef2f2;border:1.5px solid #fca5a5;border-radius:16px;padding:20px 24px;margin-bottom:24px;">
      <p style="font-size:13px;font-weight:800;color:#991b1b;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.06em;">Sans abonnement, vous perdez</p>
      <table style="width:100%;border-collapse:collapse;">
        ${lossRow("Tout votre historique de transactions (au-delà de 14 jours)")}
        ${lossRow("Vos rapports PDF et graphiques avancés")}
        ${lossRow("L'import SMS Orange Money, Wave et MTN MoMo")}
        ${lossRow("Les transactions illimitées")}
      </table>
    </div>

    <div style="background:#fff7ed;border:1.5px solid #fed7aa;border-radius:16px;padding:18px 24px;margin-bottom:8px;">
      <p style="font-size:14px;font-weight:800;color:#9a3412;margin:0 0 4px;">Plan Starter à 3,99 €/mois</p>
      <p style="font-size:13px;color:#92400e;margin:0;line-height:1.6;">
        Moins qu'un café par mois pour garder le contrôle total sur votre activité.
        <strong>Aucun engagement — annulable à tout moment.</strong>
      </p>
    </div>

    ${ctaButton("🚀 Upgrade maintenant — dès 3,99 €/mois →", `${BASE_URL}/pricing`, "linear-gradient(135deg,#dc2626,#b91c1c)", "rgba(220,38,38,0.40)")}

    <p style="font-size:12px;color:#9ca3af;text-align:center;margin:16px 0 0;line-height:1.6;">
      Vous pouvez annuler à tout moment depuis votre page Abonnement.<br>
      Aucune carte bancaire n'est requise pendant l'essai.
    </p>`
  );
  return { subject, html };
}

// ── Send via Resend ──────────────────────────────────────────────────────────
async function sendEmail(
  email: string,
  subject: string,
  html: string,
  tag: string,
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    logger.warn({ email, tag }, "[trial-cron] RESEND_API_KEY not set — skipping");
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to: [email], subject, html }),
    });
    if (!res.ok) {
      const err = await res.text();
      logger.error({ email, tag, err }, "[trial-cron] Resend error");
      return false;
    }
    logger.info({ email, tag }, "[trial-cron] Email sent");
    return true;
  } catch (err: any) {
    logger.error({ err, email, tag }, "[trial-cron] Send exception");
    return false;
  }
}

// ── Core cron logic ──────────────────────────────────────────────────────────
async function runTrialEmailCheck(): Promise<void> {
  try {
    const now = new Date();

    const profiles = await db
      .select()
      .from(userProfilesTable)
      .where(isNotNull(userProfilesTable.trialEndsAt));

    let sent = 0;

    for (const profile of profiles) {
      if (!profile.trialEndsAt) continue;

      // Skip users already on a paid plan
      if (
        profile.subscriptionPlan &&
        profile.subscriptionPlan !== "trial" &&
        profile.subscriptionPlan !== "limited_free"
      ) continue;

      const trialStart = new Date(profile.createdAt);
      const trialEnd   = new Date(profile.trialEndsAt);
      const msElapsed  = now.getTime() - trialStart.getTime();
      const msLeft     = trialEnd.getTime() - now.getTime();
      const daysElapsed = Math.floor(msElapsed / (1000 * 60 * 60 * 24));
      const daysLeft    = Math.ceil(msLeft   / (1000 * 60 * 60 * 24));

      // Only send if trial is still active or just expired (for final notice)
      if (daysLeft < 0) continue;

      const userId = profile.userId;
      let email: string | null = null;

      const getEmail = async () => {
        if (!email) {
          email = await (await import("./lib/getUserEmail")).getUserEmail(userId);
        }
        return email;
      };

      // ── Email 1: Welcome (Day 1 = elapsed >= 0 days, i.e. same day or next) ──
      if (!profile.emailDay1Sent) {
        const addr = await getEmail();
        if (addr) {
          const { subject, html } = buildWelcomeEmail();
          const ok = await sendEmail(addr, subject, html, "welcome");
          if (ok) {
            await db.update(userProfilesTable).set({ emailDay1Sent: true }).where(eq(userProfilesTable.userId, userId));
            sent++;
          }
        }
        continue; // one email per user per run
      }

      // ── Email 2: Value nudge (Day 10) ────────────────────────────────────────
      if (!profile.emailDay10Sent && daysElapsed >= 10) {
        const addr = await getEmail();
        if (addr) {
          const { subject, html } = buildValueEmail();
          const ok = await sendEmail(addr, subject, html, "value-day10");
          if (ok) {
            await db.update(userProfilesTable).set({ emailDay10Sent: true }).where(eq(userProfilesTable.userId, userId));
            sent++;
          }
        }
        continue;
      }

      // ── Email 3: Urgency (Day 30, ~15 days left) ─────────────────────────────
      if (!profile.trialReminder30dSent && daysLeft <= 15 && daysLeft > 7) {
        const addr = await getEmail();
        if (addr) {
          const { subject, html } = buildUrgencyEmail(daysLeft);
          const ok = await sendEmail(addr, subject, html, "urgency-day30");
          if (ok) {
            await db.update(userProfilesTable).set({ trialReminder30dSent: true }).where(eq(userProfilesTable.userId, userId));
            sent++;
          }
        }
        continue;
      }

      // ── Email 4: Final reminder (Day 40, ~5 days left) ───────────────────────
      if (!profile.trialReminder7dSent && daysLeft <= 5 && daysLeft > 0) {
        const addr = await getEmail();
        if (addr) {
          const { subject, html } = buildFinalEmail(daysLeft);
          const ok = await sendEmail(addr, subject, html, "final-day40");
          if (ok) {
            await db.update(userProfilesTable).set({ trialReminder7dSent: true }).where(eq(userProfilesTable.userId, userId));
            sent++;
          }
        }
        continue;
      }
    }

    logger.info({ sent, total: profiles.length }, "[trial-cron] Email check complete");
  } catch (err: any) {
    logger.error({ err }, "[trial-cron] Error during email check");
  }
}

// ── Public API ───────────────────────────────────────────────────────────────
export function startTrialCron(): void {
  const INTERVAL_MS = 6 * 60 * 60 * 1000; // every 6 h for timely delivery
  setTimeout(() => {
    runTrialEmailCheck();
    setInterval(runTrialEmailCheck, INTERVAL_MS);
  }, 30_000); // wait 30 s after boot
  logger.info("[trial-cron] Trial email cron scheduled (every 6 h, starting in 30s)");
}

export async function backfillTrialDates(): Promise<void> {
  try {
    await db.execute(sql`
      UPDATE user_profiles
      SET trial_ends_at = GREATEST(created_at + INTERVAL '${sql.raw(String(TRIAL_DAYS))} days', NOW() + INTERVAL '1 day')
      WHERE trial_ends_at IS NULL
    `);
    logger.info("[trial-cron] Trial dates backfilled");
  } catch (err: any) {
    logger.error({ err }, "[trial-cron] Failed to backfill trial dates");
  }
}
