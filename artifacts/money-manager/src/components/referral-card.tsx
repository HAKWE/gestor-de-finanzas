import { useState, useEffect } from "react";
import { Copy, Check, Gift, Users, Star, Mail } from "lucide-react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

interface ReferralStats {
  code: string;
  totalReferrals: number;
  successfulReferrals: number;
  pendingReferrals: number;
  rewardsEarned: number;
}

const ORANGE = "#f97316";
const DARK_ORANGE = "#ea580c";

function ShareButton({
  icon,
  label,
  bg,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  bg: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: "11px 6px",
        background: bg,
        border: "none",
        borderRadius: 14,
        cursor: "pointer",
        minWidth: 0,
      }}
    >
      {icon}
      <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", letterSpacing: "0.02em", whiteSpace: "nowrap" }}>
        {label}
      </span>
    </button>
  );
}

export function ReferralCard() {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`${basePath}/api/referral/me`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setStats(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const referralUrl = stats
    ? `${window.location.origin}${basePath}/ref/${stats.code}`
    : "";

  const shareText = encodeURIComponent(
    `Gérez votre Orange Money, Wave et MTN MoMo comme un pro avec MobileMoney Manager — 45 jours gratuits ! ${referralUrl}`
  );

  async function handleCopy() {
    if (!referralUrl) return;
    try {
      await navigator.clipboard.writeText(referralUrl);
    } catch {
      const el = document.createElement("textarea");
      el.value = referralUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function shareWhatsApp() {
    window.open(`https://wa.me/?text=${shareText}`, "_blank");
  }

  function shareTelegram() {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralUrl)}&text=${encodeURIComponent("Gérez votre Orange Money, Wave et MTN MoMo comme un pro — 45 jours gratuits !")}`, "_blank");
  }

  function shareEmail() {
    const subject = encodeURIComponent("Je t'invite sur MobileMoney Manager — 1 mois gratuit pour toi !");
    const body = encodeURIComponent(
      `Bonjour,\n\nJ'utilise MobileMoney Manager pour gérer mon activité et je t'invite à l'essayer gratuitement pendant 45 jours.\n\nAvec mon lien, tu obtiens un accès complet — et on gagne tous les deux 1 mois gratuit quand tu t'abonnes !\n\n${referralUrl}\n\nÀ bientôt !`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  }

  return (
    <div style={{
      borderRadius: 22,
      overflow: "hidden",
      border: "1.5px solid #fed7aa",
      background: "#fff",
      boxShadow: "0 4px 24px rgba(249,115,22,0.12)",
    }}>

      {/* ── Hero header ──────────────────────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(135deg, #431407 0%, #9a3412 60%, #c2410c 100%)",
        padding: "24px 22px 20px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Decorative circles */}
        <div style={{ position: "absolute", top: -24, right: -24, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
        <div style={{ position: "absolute", bottom: -16, right: 32, width: 60, height: 60, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />

        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 16, flexShrink: 0,
              background: "rgba(255,255,255,0.18)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 12px rgba(0,0,0,0.20)",
            }}>
              <Gift style={{ width: 26, height: 26, color: "#fed7aa" }} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#fdba74", textTransform: "uppercase", letterSpacing: "0.10em" }}>
                Programme de parrainage
              </p>
              <p style={{ margin: "3px 0 0", fontSize: 18, fontWeight: 900, color: "#fff7ed", lineHeight: 1.25 }}>
                Invitez un ami &rarr; vous gagnez<br />tous les deux 1 mois gratuit 🎁
              </p>
            </div>
          </div>

          {/* Social proof */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            background: "rgba(255,255,255,0.13)", borderRadius: 99,
            padding: "6px 12px",
          }}>
            <span style={{ fontSize: 14 }}>🌍</span>
            <span style={{ fontSize: 12, color: "#fed7aa", fontWeight: 600, lineHeight: 1.3 }}>
              +500 entrepreneurs parrainent déjà leurs amis
            </span>
          </div>
        </div>
      </div>

      <div style={{ padding: "20px 20px 22px", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* ── Referral link ───────────────────────────────────────────────── */}
        <div>
          <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 800, color: "#374151", textTransform: "uppercase", letterSpacing: "0.07em" }}>
            Votre lien personnel
          </p>
          {loading ? (
            <div style={{ height: 54, background: "#f3f4f6", borderRadius: 14, animation: "shimmer 1.5s infinite" }} />
          ) : (
            <div style={{
              display: "flex", alignItems: "center", gap: 0,
              background: "#fff7ed", border: "2px solid #fed7aa", borderRadius: 16,
              overflow: "hidden",
            }}>
              <div style={{
                flex: 1, padding: "13px 16px",
                fontSize: 13, color: "#92400e", fontFamily: "monospace", fontWeight: 600,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {referralUrl}
              </div>
              <button
                onClick={handleCopy}
                style={{
                  flexShrink: 0,
                  padding: "13px 18px",
                  background: copied ? "#16a34a" : ORANGE,
                  border: "none",
                  color: "#fff", fontWeight: 800, fontSize: 13,
                  cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 7,
                  transition: "background 0.2s",
                  whiteSpace: "nowrap",
                }}
              >
                {copied
                  ? <><Check style={{ width: 15, height: 15 }} /> Copié !</>
                  : <><Copy style={{ width: 15, height: 15 }} /> Copier</>}
              </button>
            </div>
          )}
        </div>

        {/* ── Share buttons ───────────────────────────────────────────────── */}
        {!loading && stats && (
          <div>
            <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 800, color: "#374151", textTransform: "uppercase", letterSpacing: "0.07em" }}>
              Partager via
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              {/* WhatsApp */}
              <ShareButton
                bg="#25d366"
                label="WhatsApp"
                onClick={shareWhatsApp}
                icon={
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                }
              />

              {/* Telegram */}
              <ShareButton
                bg="#229ED9"
                label="Telegram"
                onClick={shareTelegram}
                icon={
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                }
              />

              {/* Email */}
              <ShareButton
                bg="#6b7280"
                label="Email"
                onClick={shareEmail}
                icon={<Mail style={{ width: 22, height: 22, color: "#fff" }} />}
              />

              {/* Copy */}
              <ShareButton
                bg={copied ? "#16a34a" : DARK_ORANGE}
                label={copied ? "Copié !" : "Copier lien"}
                onClick={handleCopy}
                icon={
                  copied
                    ? <Check style={{ width: 22, height: 22, color: "#fff" }} />
                    : <Copy style={{ width: 22, height: 22, color: "#fff" }} />
                }
              />
            </div>
          </div>
        )}

        {/* ── Comment ça marche ───────────────────────────────────────────── */}
        <div style={{ background: "#fafaf9", border: "1.5px solid #f0ede9", borderRadius: 16, padding: "16px 18px" }}>
          <p style={{ margin: "0 0 13px", fontSize: 12, fontWeight: 800, color: "#374151", textTransform: "uppercase", letterSpacing: "0.07em" }}>
            Comment ça marche
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { num: "1", emoji: "🔗", title: "Partagez votre lien", desc: "Envoyez-le par WhatsApp, Telegram ou email à vos amis entrepreneurs." },
              { num: "2", emoji: "✍️", title: "Votre ami s'inscrit et s'abonne", desc: "Il crée son compte via votre lien et choisit un plan payant." },
              { num: "3", emoji: "🎁", title: "Vous gagnez 1 mois gratuit chacun", desc: "La récompense est créditée automatiquement sur vos deux comptes." },
            ].map((step) => (
              <div key={step.num} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                  background: "linear-gradient(135deg, #f97316, #ea580c)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(249,115,22,0.30)",
                }}>
                  <span style={{ fontSize: 15 }}>{step.emoji}</span>
                </div>
                <div style={{ flex: 1, paddingTop: 1 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#111827" }}>{step.title}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6b7280", lineHeight: 1.5 }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Stats ───────────────────────────────────────────────────────── */}
        {!loading && stats && (
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{
              flex: 1, padding: "14px 12px", borderRadius: 14,
              background: "#fff", border: "1.5px solid #e5e7eb", textAlign: "center",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, marginBottom: 5 }}>
                <Users style={{ width: 15, height: 15, color: ORANGE }} />
                <span style={{ fontSize: 26, fontWeight: 900, color: "#111", lineHeight: 1 }}>{stats.totalReferrals}</span>
              </div>
              <p style={{ margin: 0, fontSize: 11, color: "#6b7280", fontWeight: 600 }}>
                Ami{stats.totalReferrals !== 1 ? "s" : ""} invité{stats.totalReferrals !== 1 ? "s" : ""}
              </p>
            </div>

            <div style={{
              flex: 1, padding: "14px 12px", borderRadius: 14,
              background: stats.rewardsEarned > 0 ? "#f0fdf4" : "#fff",
              border: `1.5px solid ${stats.rewardsEarned > 0 ? "#bbf7d0" : "#e5e7eb"}`,
              textAlign: "center",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, marginBottom: 5 }}>
                <Star style={{ width: 15, height: 15, color: stats.rewardsEarned > 0 ? "#16a34a" : "#9ca3af" }} />
                <span style={{ fontSize: 26, fontWeight: 900, color: stats.rewardsEarned > 0 ? "#16a34a" : "#111", lineHeight: 1 }}>{stats.rewardsEarned}</span>
              </div>
              <p style={{ margin: 0, fontSize: 11, color: "#6b7280", fontWeight: 600 }}>
                Mois gratuit{stats.rewardsEarned !== 1 ? "s" : ""} gagné{stats.rewardsEarned !== 1 ? "s" : ""}
              </p>
            </div>

            {stats.pendingReferrals > 0 && (
              <div style={{
                flex: 1, padding: "14px 12px", borderRadius: 14,
                background: "#fffbeb", border: "1.5px solid #fde68a", textAlign: "center",
              }}>
                <span style={{ fontSize: 26, fontWeight: 900, color: "#b45309", lineHeight: 1, display: "block", marginBottom: 5 }}>{stats.pendingReferrals}</span>
                <p style={{ margin: 0, fontSize: 11, color: "#92400e", fontWeight: 600 }}>En attente</p>
              </div>
            )}
          </div>
        )}

        {/* ── Bottom CTA copy ──────────────────────────────────────────────── */}
        <p style={{ margin: 0, fontSize: 12, color: "#6b7280", textAlign: "center", lineHeight: 1.6 }}>
          Partagez et gagnez 1 mois gratuit pour chaque ami qui s'abonne.
          <br />La récompense est créditée dès que votre ami active son abonnement.
        </p>

      </div>

      <style>{`
        @keyframes shimmer {
          0%   { opacity: 1; }
          50%  { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
