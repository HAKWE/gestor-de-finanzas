import { useState, useEffect } from "react";
import { Copy, Check, Gift, Users, Star } from "lucide-react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

interface ReferralStats {
  code: string;
  totalReferrals: number;
  successfulReferrals: number;
  pendingReferrals: number;
  rewardsEarned: number;
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

  async function handleCopy() {
    if (!referralUrl) return;
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement("textarea");
      el.value = referralUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div style={{
      borderRadius: 20,
      overflow: "hidden",
      border: "1px solid #fed7aa",
      background: "linear-gradient(145deg, #fff7ed 0%, #ffffff 60%, #fef3c7 100%)",
      boxShadow: "0 2px 16px rgba(249,115,22,0.10)",
    }}>
      {/* Header */}
      <div style={{
        padding: "18px 20px 14px",
        borderBottom: "1px solid #fed7aa",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <div style={{
          width: 42, height: 42, borderRadius: 13, flexShrink: 0,
          background: "linear-gradient(135deg, #f97316, #ea580c)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 3px 10px rgba(249,115,22,0.35)",
        }}>
          <Gift style={{ width: 20, height: 20, color: "#fff" }} />
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#111" }}>
            Programme de parrainage
          </p>
          <p style={{ margin: 0, fontSize: 12, color: "#9a3412", fontWeight: 500, marginTop: 1 }}>
            Invitez un ami → Vous gagnez tous les deux 1 mois gratuit
          </p>
        </div>
      </div>

      <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* How it works */}
        <div style={{ display: "flex", gap: 0, background: "#fff8f3", borderRadius: 12, border: "1px solid #fed7aa", overflow: "hidden" }}>
          {[
            { step: "1", icon: "🔗", text: "Partagez votre lien unique" },
            { step: "2", icon: "✍️", text: "Votre ami s'inscrit et s'abonne" },
            { step: "3", icon: "🎁", text: "Vous gagnez 1 mois gratuit chacun" },
          ].map((item, i) => (
            <div key={i} style={{
              flex: 1, padding: "10px 8px", textAlign: "center",
              borderRight: i < 2 ? "1px solid #fed7aa" : "none",
            }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{item.icon}</div>
              <p style={{ margin: 0, fontSize: 11, color: "#7c2d12", fontWeight: 600, lineHeight: 1.35 }}>{item.text}</p>
            </div>
          ))}
        </div>

        {/* Referral link */}
        <div>
          <p style={{ margin: "0 0 7px", fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Votre lien de parrainage
          </p>
          {loading ? (
            <div style={{ height: 46, background: "#f3f4f6", borderRadius: 12, animation: "shimmer 1.5s infinite" }} />
          ) : (
            <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
              <div style={{
                flex: 1, padding: "10px 14px", background: "#fff",
                border: "1.5px solid #fed7aa", borderRadius: 12,
                fontSize: 13, color: "#374151", fontFamily: "monospace",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                lineHeight: 1.6,
              }}>
                {referralUrl}
              </div>
              <button
                onClick={handleCopy}
                style={{
                  flexShrink: 0, padding: "10px 16px",
                  background: copied ? "#16a34a" : "#f97316",
                  border: "none", borderRadius: 12,
                  color: "#fff", fontWeight: 700, fontSize: 13,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                  transition: "background 0.2s",
                  whiteSpace: "nowrap",
                }}
              >
                {copied
                  ? <><Check style={{ width: 14, height: 14 }} /> Copié !</>
                  : <><Copy style={{ width: 14, height: 14 }} /> Copier</>
                }
              </button>
            </div>
          )}
        </div>

        {/* Stats */}
        {!loading && stats && (
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{
              flex: 1, padding: "12px 14px", borderRadius: 12,
              background: "#fff", border: "1px solid #e5e7eb",
              textAlign: "center",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, marginBottom: 4 }}>
                <Users style={{ width: 14, height: 14, color: "#f97316" }} />
                <span style={{ fontSize: 22, fontWeight: 900, color: "#111" }}>{stats.totalReferrals}</span>
              </div>
              <p style={{ margin: 0, fontSize: 11, color: "#6b7280", fontWeight: 600 }}>
                Ami{stats.totalReferrals !== 1 ? "s" : ""} invité{stats.totalReferrals !== 1 ? "s" : ""}
              </p>
            </div>
            <div style={{
              flex: 1, padding: "12px 14px", borderRadius: 12,
              background: stats.rewardsEarned > 0 ? "#f0fdf4" : "#fff",
              border: `1px solid ${stats.rewardsEarned > 0 ? "#bbf7d0" : "#e5e7eb"}`,
              textAlign: "center",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, marginBottom: 4 }}>
                <Star style={{ width: 14, height: 14, color: stats.rewardsEarned > 0 ? "#16a34a" : "#9ca3af" }} />
                <span style={{ fontSize: 22, fontWeight: 900, color: stats.rewardsEarned > 0 ? "#16a34a" : "#111" }}>{stats.rewardsEarned}</span>
              </div>
              <p style={{ margin: 0, fontSize: 11, color: "#6b7280", fontWeight: 600 }}>
                Mois gratuit{stats.rewardsEarned !== 1 ? "s" : ""} gagné{stats.rewardsEarned !== 1 ? "s" : ""}
              </p>
            </div>
            {stats.pendingReferrals > 0 && (
              <div style={{
                flex: 1, padding: "12px 14px", borderRadius: 12,
                background: "#fffbeb", border: "1px solid #fde68a",
                textAlign: "center",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, marginBottom: 4 }}>
                  <span style={{ fontSize: 22, fontWeight: 900, color: "#b45309" }}>{stats.pendingReferrals}</span>
                </div>
                <p style={{ margin: 0, fontSize: 11, color: "#92400e", fontWeight: 600 }}>
                  En attente
                </p>
              </div>
            )}
          </div>
        )}

        {/* Share hint */}
        <p style={{ margin: 0, fontSize: 11, color: "#9ca3af", textAlign: "center", lineHeight: 1.5 }}>
          Partagez ce lien par WhatsApp, SMS ou e-mail. La récompense est créditée dès que votre ami souscrit à une offre payante.
        </p>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
