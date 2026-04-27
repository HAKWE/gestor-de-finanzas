import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Layout } from "../components/layout";
import { Crown, Star, ExternalLink, ArrowLeft, CalendarDays, ShieldCheck, Loader2, AlertCircle, Check, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

interface SubStatus {
  plan: "free" | "starter" | "pro" | "paid";
  planLabel: string;
  status?: string;
  subscriptionId?: string;
  currentPeriodEnd?: string | null;
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));
}

export default function Subscription() {
  const [sub, setSub] = useState<SubStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${basePath}/api/stripe/subscription-status`, { credentials: "include" })
      .then(r => r.json())
      .then(d => { setSub(d); setLoading(false); })
      .catch(() => { setSub({ plan: "free", planLabel: "Gratuit" }); setLoading(false); });
  }, []);

  const handlePortal = async () => {
    setPortalLoading(true);
    setPortalError(null);
    try {
      const res = await fetch(`${basePath}/api/stripe/portal`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      window.location.href = data.url;
    } catch (err: any) {
      setPortalError(err.message);
      setPortalLoading(false);
    }
  };

  const isPro = sub?.plan === "pro";
  const isPaid = sub && sub.plan !== "free";

  return (
    <Layout>
      <div style={{ maxWidth: 560, margin: "0 auto" }} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/dashboard">
            <button style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "none", border: "none", cursor: "pointer",
              color: "hsl(var(--muted-foreground))", fontSize: 14, fontWeight: 500,
              padding: "6px 0",
            }}>
              <ArrowLeft style={{ width: 15, height: 15 }} />
              Tableau de bord
            </button>
          </Link>
        </div>

        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>Mon abonnement</h1>
          <p style={{ color: "hsl(var(--muted-foreground))", marginTop: 4, fontSize: 14 }}>
            Gérez votre plan et vos informations de facturation.
          </p>
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
            <Loader2 style={{ width: 28, height: 28, color: "hsl(var(--primary))", animation: "spin 1s linear infinite" }} />
            <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
          </div>
        ) : isPaid ? (
          <>
            {/* Plan card */}
            <div style={{
              borderRadius: 20,
              background: isPro
                ? "linear-gradient(135deg, #431407 0%, #7c2d12 50%, #9a3412 100%)"
                : "linear-gradient(135deg, #431407 0%, #c2410c 100%)",
              boxShadow: "0 4px 24px rgba(249,115,22,0.28)",
              padding: "28px 28px 24px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 16,
                  background: "rgba(255,255,255,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {isPro
                    ? <Crown style={{ width: 26, height: 26, color: "#fed7aa" }} />
                    : <Star style={{ width: 26, height: 26, color: "#fed7aa" }} />
                  }
                </div>
                <div>
                  <p style={{ color: "#fed7aa", fontSize: 12, fontWeight: 600, margin: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}>Plan actif</p>
                  <p style={{ color: "#fff7ed", fontSize: 22, fontWeight: 800, margin: "2px 0 0" }}>{sub?.planLabel}</p>
                </div>
                <span style={{
                  marginLeft: "auto", background: "rgba(74,222,128,0.20)",
                  border: "1.5px solid rgba(74,222,128,0.40)", borderRadius: 999,
                  padding: "4px 12px", fontSize: 12, fontWeight: 700, color: "#4ade80",
                }}>
                  ✓ Actif
                </span>
              </div>

              {sub?.currentPeriodEnd && (
                <div style={{
                  background: "rgba(0,0,0,0.20)", borderRadius: 12,
                  padding: "12px 16px", display: "flex", alignItems: "center", gap: 10,
                }}>
                  <CalendarDays style={{ width: 16, height: 16, color: "#fdba74", flexShrink: 0 }} />
                  <p style={{ color: "#fed7aa", fontSize: 13, margin: 0 }}>
                    Prochain renouvellement : <strong style={{ color: "#fff7ed" }}>{formatDate(sub.currentPeriodEnd)}</strong>
                  </p>
                </div>
              )}
            </div>

            {/* Portal action */}
            <div style={{
              border: "1.5px solid hsl(var(--border))",
              borderRadius: 16, padding: "20px 22px",
              background: "hsl(var(--card))",
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                  background: "hsl(var(--primary)/0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <ShieldCheck style={{ width: 18, height: 18, color: "hsl(var(--primary))" }} />
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>Gérer via Stripe</p>
                  <p style={{ fontSize: 13, color: "hsl(var(--muted-foreground))", margin: "4px 0 0", lineHeight: 1.5 }}>
                    Modifiez votre moyen de paiement, téléchargez vos factures ou annulez votre abonnement depuis le portail sécurisé Stripe.
                  </p>
                </div>
              </div>

              {portalError && (
                <div style={{
                  background: "#fef2f2", border: "1.5px solid #fca5a5", borderRadius: 10,
                  padding: "10px 14px", display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 12,
                }}>
                  <AlertCircle style={{ width: 15, height: 15, color: "#dc2626", flexShrink: 0, marginTop: 1 }} />
                  <p style={{ fontSize: 13, color: "#dc2626", margin: 0 }}>{portalError}</p>
                </div>
              )}

              <Button
                onClick={handlePortal}
                disabled={portalLoading}
                style={{ width: "100%", height: 44, borderRadius: 12, fontWeight: 600, fontSize: 14 }}
              >
                {portalLoading
                  ? <><Loader2 style={{ width: 15, height: 15, marginRight: 8, animation: "spin 1s linear infinite" }} />Ouverture en cours…</>
                  : <><ExternalLink style={{ width: 15, height: 15, marginRight: 8 }} />Ouvrir le portail de facturation</>
                }
              </Button>
            </div>

            {/* Starter → Pro upgrade */}
            {!isPro && (
              <div style={{
                borderRadius: 20, overflow: "hidden",
                border: "1.5px solid #f97316",
                boxShadow: "0 4px 20px rgba(249,115,22,0.10)",
              }}>
                <div style={{
                  background: "linear-gradient(135deg, #431407 0%, #9a3412 100%)",
                  padding: "18px 22px",
                  display: "flex", alignItems: "center", gap: 12,
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: "rgba(255,255,255,0.15)",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <Crown style={{ width: 20, height: 20, color: "#fed7aa" }} />
                  </div>
                  <div>
                    <p style={{ fontWeight: 800, fontSize: 16, color: "#fff7ed", margin: 0 }}>
                      Passez au plan Pro
                    </p>
                    <p style={{ fontSize: 12, color: "#fdba74", margin: "2px 0 0" }}>
                      Seulement +6 €/mois de plus — annulable à tout moment
                    </p>
                  </div>
                  <div style={{
                    marginLeft: "auto", textAlign: "right", flexShrink: 0,
                  }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: "#fff7ed", lineHeight: 1 }}>11 €</div>
                    <div style={{ fontSize: 11, color: "#fdba74" }}>/mois</div>
                  </div>
                </div>

                <div style={{ background: "#fff", padding: "18px 22px" }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 12px" }}>
                    Ce que Pro débloque pour vous
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
                    {[
                      { icon: "📄", label: "Export PDF professionnel", sub: "Rapport brandé à partager avec votre comptable" },
                      { icon: "📊", label: "Graphiques avancés", sub: "Revenus vs dépenses par semaine ou par jour" },
                      { icon: "🔢", label: "Transactions illimitées", sub: "Aucune limite mensuelle sur vos enregistrements" },
                      { icon: "📱", label: "Import SMS & relevés", sub: "Importez vos relevés Orange Money, Wave, MTN" },
                      { icon: "⚡", label: "Support prioritaire", sub: "Réponse en moins de 24 h garanti" },
                    ].map(({ icon, label, sub }) => (
                      <div key={label} style={{
                        display: "flex", alignItems: "flex-start", gap: 10,
                        padding: "10px 12px", background: "#fff7ed", borderRadius: 10,
                      }}>
                        <span style={{ fontSize: 18, flexShrink: 0, lineHeight: 1.2 }}>{icon}</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>{label}</div>
                          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{sub}</div>
                        </div>
                        <Check style={{ width: 14, height: 14, color: "#f97316", flexShrink: 0, marginTop: 2, marginLeft: "auto" }} />
                      </div>
                    ))}
                  </div>

                  <Link href="/pricing">
                    <button style={{
                      width: "100%", background: "#f97316", color: "#fff",
                      border: "none", borderRadius: 13, padding: "13px 24px",
                      fontWeight: 800, fontSize: 14, cursor: "pointer",
                      boxShadow: "0 2px 12px rgba(249,115,22,0.30)",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                    }}>
                      <Zap style={{ width: 16, height: 16 }} />
                      Passer au Pro maintenant →
                    </button>
                  </Link>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Free plan state */
          <div style={{
            border: "1.5px solid hsl(var(--border))",
            borderRadius: 20, padding: "40px 28px",
            background: "hsl(var(--card))", textAlign: "center",
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: 20, margin: "0 auto 16px",
              background: "hsl(var(--primary)/0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Star style={{ width: 30, height: 30, color: "hsl(var(--primary))" }} />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>Plan Gratuit</h2>
            <p style={{ fontSize: 14, color: "hsl(var(--muted-foreground))", margin: "0 0 24px", lineHeight: 1.6 }}>
              Vous utilisez le plan gratuit. Passez à Starter ou Pro pour accéder aux fonctionnalités avancées.
            </p>
            <Link href="/pricing">
              <Button style={{ borderRadius: 12, fontWeight: 600 }}>
                Voir les offres
              </Button>
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
}
