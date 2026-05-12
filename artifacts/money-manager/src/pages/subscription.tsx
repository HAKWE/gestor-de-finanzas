import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Layout } from "../components/layout";
import {
  Crown, Star, ExternalLink, ArrowLeft, CalendarDays,
  ShieldCheck, Loader2, AlertCircle, Check, Zap, X, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const ORANGE = "#f97316";
const RED = "#ef4444";

interface SubStatus {
  plan: "free" | "starter" | "pro" | "paid";
  planLabel: string;
  status?: string;
  cancelAtPeriodEnd?: boolean;
  subscriptionId?: string;
  currentPeriodEnd?: string | null;
  effectivePlan?: "trial" | "limited_free" | "starter" | "pro" | "paid";
  trialEndsAt?: string | null;
  trialDaysLeft?: number;
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));
}

export default function Subscription() {
  const [sub, setSub] = useState<SubStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState(false);

  const loadStatus = () => {
    setLoading(true);
    fetch(`${basePath}/api/stripe/subscription-status`, { credentials: "include" })
      .then(r => r.json())
      .then(d => { setSub(d); setLoading(false); })
      .catch(() => { setSub({ plan: "free", planLabel: "Gratuit" }); setLoading(false); });
  };

  useEffect(() => { loadStatus(); }, []);

  const handlePortal = async () => {
    setPortalLoading(true);
    setPortalError(null);
    try {
      const res = await fetch(`${basePath}/api/stripe/portal`, { method: "POST", credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      window.location.href = data.url;
    } catch (err: any) {
      setPortalError(err.message);
      setPortalLoading(false);
    }
  };

  const handleCancel = async () => {
    setCancelLoading(true);
    setCancelError(null);
    try {
      const res = await fetch(`${basePath}/api/stripe/cancel-subscription`, { method: "POST", credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setCancelSuccess(true);
      setShowCancelModal(false);
      // Merge returned date so the UI shows the exact end date immediately
      setSub(prev => prev ? {
        ...prev,
        cancelAtPeriodEnd: true,
        currentPeriodEnd: data.currentPeriodEnd ?? prev.currentPeriodEnd,
      } : prev);
    } catch (err: any) {
      setCancelError(err.message);
    } finally {
      setCancelLoading(false);
    }
  };

  const isPro = sub?.plan === "pro";
  const isPaid = sub && sub.plan !== "free";
  const isCancelled = sub?.cancelAtPeriodEnd === true;

  return (
    <Layout>
      {/* ─── Cancel confirmation modal ─── */}
      {showCancelModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: "rgba(0,0,0,0.50)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
        }}>
          <div style={{
            background: "#fff", borderRadius: 20, padding: "32px 28px",
            maxWidth: 440, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.20)",
          }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 20 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <AlertTriangle style={{ width: 24, height: 24, color: RED }} />
              </div>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 800, color: "#111", margin: "0 0 4px" }}>
                  Annuler mon abonnement ?
                </h2>
                <p style={{ fontSize: 13, color: "#6b7280", margin: 0, lineHeight: 1.5 }}>
                  Votre accès restera disponible jusqu'à la fin de la période.
                </p>
              </div>
              <button
                onClick={() => { setShowCancelModal(false); setCancelError(null); }}
                style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 4 }}
              >
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            {/* Warning box */}
            <div style={{
              background: "#fff7ed", border: "1.5px solid #fed7aa",
              borderRadius: 12, padding: "14px 16px", marginBottom: 20,
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <CalendarDays style={{ width: 15, height: 15, color: ORANGE, flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 13, color: "#92400e", margin: 0, lineHeight: 1.6 }}>
                  Votre abonnement <strong>{sub?.planLabel}</strong> restera actif jusqu'à la fin de la période en cours
                  {sub?.currentPeriodEnd ? <> (<strong>{formatDate(sub.currentPeriodEnd)}</strong>)</> : null}.{" "}
                  Aucun remboursement ne sera effectué.
                </p>
              </div>
            </div>

            {/* What you lose */}
            <p style={{ fontSize: 12, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 10px" }}>
              Vous perdrez l'accès à :
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 24 }}>
              {["Export PDF & rapports avancés", "Graphiques et statistiques Pro", "Transactions illimitées"].map(f => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <X style={{ width: 12, height: 12, color: RED, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: "#374151" }}>{f}</span>
                </div>
              ))}
            </div>

            {cancelError && (
              <div style={{
                background: "#fef2f2", border: "1.5px solid #fca5a5", borderRadius: 10,
                padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, marginBottom: 16,
              }}>
                <AlertCircle style={{ width: 14, height: 14, color: RED, flexShrink: 0 }} />
                <p style={{ fontSize: 13, color: RED, margin: 0 }}>{cancelError}</p>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                onClick={handleCancel}
                disabled={cancelLoading}
                style={{
                  width: "100%", padding: "13px 24px", borderRadius: 12,
                  background: cancelLoading ? "#fca5a5" : RED, color: "#fff",
                  border: "none", fontWeight: 700, fontSize: 14, cursor: cancelLoading ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  opacity: cancelLoading ? 0.8 : 1,
                }}
              >
                {cancelLoading
                  ? <><Loader2 style={{ width: 15, height: 15, animation: "spin 1s linear infinite" }} />Annulation en cours…</>
                  : "Confirmer l'annulation"
                }
                <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
              </button>
              <button
                onClick={() => { setShowCancelModal(false); setCancelError(null); }}
                style={{
                  width: "100%", padding: "11px 24px", borderRadius: 12,
                  background: "#f9fafb", color: "#374151",
                  border: "1.5px solid #e5e7eb", fontWeight: 600, fontSize: 14, cursor: "pointer",
                }}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 560, margin: "0 auto" }} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* Back nav */}
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

        {/* Title */}
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>Mon abonnement</h1>
          <p style={{ color: "hsl(var(--muted-foreground))", marginTop: 4, fontSize: 14 }}>
            Consultez votre statut et gérez votre plan.
          </p>
        </div>

        {/* Cancel success banner */}
        {cancelSuccess && (
          <div style={{
            background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 14,
            padding: "14px 18px", display: "flex", alignItems: "flex-start", gap: 10,
          }}>
            <Check style={{ width: 16, height: 16, color: "#16a34a", flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#15803d", margin: "0 0 2px" }}>
                Annulation confirmée
              </p>
              <p style={{ fontSize: 13, color: "#166534", margin: 0, lineHeight: 1.5 }}>
                Votre abonnement reste actif jusqu'au <strong>{sub?.currentPeriodEnd ? formatDate(sub.currentPeriodEnd) : "—"}</strong>. Aucun renouvellement ne sera effectué.
              </p>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
            <Loader2 style={{ width: 28, height: 28, color: "hsl(var(--primary))", animation: "spin 1s linear infinite" }} />
          </div>
        ) : isPaid ? (
          <>
            {/* ─── Status card ─── */}
            <div style={{
              borderRadius: 20,
              background: isCancelled
                ? "linear-gradient(135deg, #374151 0%, #4b5563 100%)"
                : "linear-gradient(135deg, #431407 0%, #9a3412 100%)",
              boxShadow: isCancelled
                ? "0 4px 20px rgba(0,0,0,0.20)"
                : "0 4px 24px rgba(249,115,22,0.28)",
              padding: "28px 28px 24px",
            }}>
              {/* Plan name + badge */}
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
                  <p style={{ color: "#fed7aa", fontSize: 12, fontWeight: 600, margin: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    {isCancelled ? "Abonnement annulé" : "Plan actif"}
                  </p>
                  <p style={{ color: "#fff7ed", fontSize: 22, fontWeight: 800, margin: "2px 0 0" }}>{sub?.planLabel}</p>
                </div>
                {isCancelled ? (
                  <span style={{
                    marginLeft: "auto", background: "rgba(251,191,36,0.20)",
                    border: "1.5px solid rgba(251,191,36,0.40)", borderRadius: 999,
                    padding: "4px 12px", fontSize: 12, fontWeight: 700, color: "#fbbf24",
                  }}>
                    ⚠ Annulé
                  </span>
                ) : (
                  <span style={{
                    marginLeft: "auto", background: "rgba(74,222,128,0.20)",
                    border: "1.5px solid rgba(74,222,128,0.40)", borderRadius: 999,
                    padding: "4px 12px", fontSize: 12, fontWeight: 700, color: "#4ade80",
                  }}>
                    ✓ Actif
                  </span>
                )}
              </div>

              {/* Date pill */}
              {sub?.currentPeriodEnd && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{
                    background: "rgba(0,0,0,0.20)", borderRadius: 12,
                    padding: "12px 16px", display: "flex", alignItems: "center", gap: 10,
                  }}>
                    <CalendarDays style={{ width: 16, height: 16, color: "#fdba74", flexShrink: 0 }} />
                    <p style={{ color: "#fed7aa", fontSize: 13, margin: 0, lineHeight: 1.5 }}>
                      {isCancelled
                        ? <>Annulé — Accès jusqu'au <strong style={{ color: "#fff7ed" }}>{formatDate(sub.currentPeriodEnd)}</strong></>
                        : <>Prochain renouvellement : <strong style={{ color: "#fff7ed" }}>{formatDate(sub.currentPeriodEnd)}</strong></>
                      }
                    </p>
                  </div>
                  {isCancelled && (
                    <div style={{
                      background: "rgba(255,255,255,0.08)", borderRadius: 10,
                      padding: "10px 14px", display: "flex", alignItems: "flex-start", gap: 8,
                    }}>
                      <Check style={{ width: 13, height: 13, color: "#4ade80", flexShrink: 0, marginTop: 1 }} />
                      <p style={{ color: "#d1d5db", fontSize: 12, margin: 0, lineHeight: 1.5 }}>
                        Vous pouvez continuer à utiliser les fonctionnalités {sub.planLabel} jusqu'à la fin de la période.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ─── Cancel button (only if still active) ─── */}
            {!isCancelled && !cancelSuccess && (
              <div style={{
                border: "1.5px solid #fecaca", borderRadius: 16,
                padding: "20px 22px", background: "#fff",
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                    background: "#fef2f2",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <X style={{ width: 18, height: 18, color: RED }} />
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 15, margin: 0, color: "#111" }}>Annuler mon abonnement</p>
                    <p style={{ fontSize: 13, color: "#6b7280", margin: "4px 0 0", lineHeight: 1.5 }}>
                      Vous conservez l'accès jusqu'à la fin de votre période en cours. Aucun remboursement.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCancelModal(true)}
                  style={{
                    width: "100%", padding: "12px 24px", borderRadius: 12,
                    background: "#fff", color: RED,
                    border: `1.5px solid ${RED}`, fontWeight: 700, fontSize: 14, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#fef2f2")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
                >
                  <X style={{ width: 15, height: 15 }} />
                  Annuler mon abonnement
                </button>
              </div>
            )}

            {/* ─── Stripe portal (secondary) ─── */}
            <details style={{ border: "1.5px solid hsl(var(--border))", borderRadius: 16, background: "hsl(var(--card))", overflow: "hidden" }}>
              <summary style={{
                padding: "16px 22px", cursor: "pointer", userSelect: "none",
                display: "flex", alignItems: "center", gap: 10, listStyle: "none",
                fontWeight: 600, fontSize: 14, color: "hsl(var(--muted-foreground))",
              }}>
                <ShieldCheck style={{ width: 16, height: 16, color: "hsl(var(--primary))" }} />
                Gérer via le portail Stripe
                <span style={{ marginLeft: "auto", fontSize: 12 }}>▾</span>
              </summary>
              <div style={{ padding: "0 22px 20px", borderTop: "1px solid hsl(var(--border))" }}>
                <p style={{ fontSize: 13, color: "hsl(var(--muted-foreground))", margin: "14px 0 16px", lineHeight: 1.6 }}>
                  Modifiez votre moyen de paiement, téléchargez vos factures ou gérez vos informations de facturation depuis le portail sécurisé Stripe.
                </p>

                {portalError && (
                  <div style={{
                    background: "#fef2f2", border: "1.5px solid #fca5a5", borderRadius: 10,
                    padding: "10px 14px", display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 12,
                  }}>
                    <AlertCircle style={{ width: 14, height: 14, color: RED, flexShrink: 0, marginTop: 1 }} />
                    <p style={{ fontSize: 13, color: RED, margin: 0 }}>{portalError}</p>
                  </div>
                )}

                <Button
                  onClick={handlePortal}
                  disabled={portalLoading}
                  variant="outline"
                  style={{ width: "100%", height: 42, borderRadius: 12, fontWeight: 600, fontSize: 14 }}
                >
                  {portalLoading
                    ? <><Loader2 style={{ width: 14, height: 14, marginRight: 8, animation: "spin 1s linear infinite" }} />Ouverture…</>
                    : <><ExternalLink style={{ width: 14, height: 14, marginRight: 8 }} />Ouvrir le portail de facturation</>
                  }
                </Button>
              </div>
            </details>

            {/* ─── Starter → Pro upgrade ─── */}
            {!isPro && (
              <div style={{ borderRadius: 20, overflow: "hidden", border: "1.5px solid #f97316", boxShadow: "0 4px 20px rgba(249,115,22,0.10)" }}>
                <div style={{ background: "linear-gradient(135deg, #431407 0%, #9a3412 100%)", padding: "18px 22px", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Crown style={{ width: 20, height: 20, color: "#fed7aa" }} />
                  </div>
                  <div>
                    <p style={{ fontWeight: 800, fontSize: 16, color: "#fff7ed", margin: 0 }}>Passez au plan Pro</p>
                    <p style={{ fontSize: 12, color: "#fdba74", margin: "2px 0 0" }}>Seulement +6 €/mois de plus — annulable à tout moment</p>
                  </div>
                  <div style={{ marginLeft: "auto", textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: "#fff7ed", lineHeight: 1 }}>11 €</div>
                    <div style={{ fontSize: 11, color: "#fdba74" }}>/mois</div>
                  </div>
                </div>
                <div style={{ background: "#fff", padding: "18px 22px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
                    {[
                      { icon: "📄", label: "Export PDF professionnel", sub: "Rapport brandé à partager avec votre comptable" },
                      { icon: "📊", label: "Graphiques avancés", sub: "Revenus vs dépenses par semaine ou par jour" },
                      { icon: "🔢", label: "Transactions illimitées", sub: "Aucune limite mensuelle sur vos enregistrements" },
                      { icon: "📱", label: "Import SMS & relevés", sub: "Importez vos relevés Orange Money, Wave, MTN" },
                      { icon: "⚡", label: "Support prioritaire", sub: "Réponse en moins de 24 h garanti" },
                    ].map(({ icon, label, sub }) => (
                      <div key={label} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", background: "#fff7ed", borderRadius: 10 }}>
                        <span style={{ fontSize: 18, flexShrink: 0, lineHeight: 1.2 }}>{icon}</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>{label}</div>
                          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{sub}</div>
                        </div>
                        <Check style={{ width: 14, height: 14, color: ORANGE, flexShrink: 0, marginTop: 2, marginLeft: "auto" }} />
                      </div>
                    ))}
                  </div>
                  <Link href="/pricing">
                    <button style={{
                      width: "100%", background: ORANGE, color: "#fff",
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
        ) : sub?.effectivePlan === "trial" ? (
          /* Trial active */
          <>
            <div style={{ borderRadius: 20, overflow: "hidden", border: "1.5px solid #bfdbfe", background: "#eff6ff", boxShadow: "0 4px 20px rgba(37,99,235,0.10)" }}>
              <div style={{ height: 4, background: "linear-gradient(90deg,#2563eb,#3b82f6)" }} />
              <div style={{ padding: "24px 24px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 16, background: "rgba(37,99,235,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 26 }}>🎁</span>
                  </div>
                  <div>
                    <p style={{ color: "#1d4ed8", fontSize: 12, fontWeight: 700, margin: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}>Essai gratuit en cours</p>
                    <p style={{ color: "#1e3a8a", fontSize: 20, fontWeight: 800, margin: "2px 0 0" }}>
                      {(sub.trialDaysLeft ?? 0) > 0
                        ? `${sub.trialDaysLeft} jour${(sub.trialDaysLeft ?? 0) > 1 ? "s" : ""} restant${(sub.trialDaysLeft ?? 0) > 1 ? "s" : ""}`
                        : "Accès complet"}
                    </p>
                  </div>
                  <span style={{ marginLeft: "auto", background: "rgba(37,99,235,0.15)", border: "1.5px solid rgba(37,99,235,0.30)", borderRadius: 999, padding: "4px 12px", fontSize: 12, fontWeight: 700, color: "#1d4ed8" }}>
                    ✓ Actif
                  </span>
                </div>
                {sub.trialEndsAt && (
                  <div style={{ background: "rgba(37,99,235,0.10)", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                    <CalendarDays style={{ width: 16, height: 16, color: "#2563eb", flexShrink: 0 }} />
                    <p style={{ color: "#1e3a8a", fontSize: 13, margin: 0, lineHeight: 1.5 }}>
                      Essai se termine le <strong style={{ color: "#1d4ed8" }}>{formatDate(sub.trialEndsAt)}</strong>
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div style={{ border: "1.5px solid #e5e7eb", borderRadius: 14, padding: "16px 18px", background: "#fafafa" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#374151", margin: "0 0 10px" }}>Accès complet pendant votre essai :</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {["Transactions illimitées", "Rapports & graphiques avancés", "Export PDF", "Import SMS & relevés"].map(f => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Check style={{ width: 13, height: 13, color: "#2563eb", flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: "#374151" }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ borderRadius: 20, overflow: "hidden", border: "1.5px solid #fed7aa", boxShadow: "0 4px 20px rgba(249,115,22,0.10)" }}>
              <div style={{ background: "linear-gradient(135deg, #431407 0%, #9a3412 100%)", padding: "18px 22px", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Crown style={{ width: 20, height: 20, color: "#fed7aa" }} />
                </div>
                <div>
                  <p style={{ fontWeight: 800, fontSize: 15, color: "#fff7ed", margin: 0 }}>Continuez après votre essai</p>
                  <p style={{ fontSize: 12, color: "#fdba74", margin: "2px 0 0" }}>À partir de 5 €/mois · Annulable à tout moment</p>
                </div>
              </div>
              <div style={{ background: "#fff", padding: "16px 22px" }}>
                <Link href="/pricing">
                  <button style={{ width: "100%", background: ORANGE, color: "#fff", border: "none", borderRadius: 12, padding: "13px 24px", fontWeight: 800, fontSize: 14, cursor: "pointer", boxShadow: "0 2px 12px rgba(249,115,22,0.30)", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                    <Zap style={{ width: 16, height: 16 }} />
                    Choisir mon plan →
                  </button>
                </Link>
              </div>
            </div>
          </>
        ) : sub?.effectivePlan === "limited_free" ? (
          /* Trial expired — Limited Free */
          <>
            <div style={{ borderRadius: 20, overflow: "hidden", border: "1.5px solid #fca5a5", background: "#fef2f2", boxShadow: "0 4px 20px rgba(220,38,38,0.10)" }}>
              <div style={{ height: 4, background: "linear-gradient(90deg,#dc2626,#ef4444)" }} />
              <div style={{ padding: "24px 24px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 16, background: "rgba(220,38,38,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 26 }}>🔒</span>
                  </div>
                  <div>
                    <p style={{ color: "#b91c1c", fontSize: 12, fontWeight: 700, margin: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}>Essai terminé</p>
                    <p style={{ color: "#991b1b", fontSize: 20, fontWeight: 800, margin: "2px 0 0" }}>Plan Limité</p>
                  </div>
                  <span style={{ marginLeft: "auto", background: "rgba(220,38,38,0.12)", border: "1.5px solid rgba(220,38,38,0.25)", borderRadius: 999, padding: "4px 12px", fontSize: 12, fontWeight: 700, color: "#dc2626" }}>
                    Limité
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { icon: "📅", text: "Accès aux 14 derniers jours de transactions uniquement" },
                    { icon: "🔢", text: "Maximum 10 transactions par mois" },
                    { icon: "🚫", text: "Export PDF désactivé" },
                    { icon: "🚫", text: "Rapports avancés désactivés" },
                  ].map(({ icon, text }) => (
                    <div key={text} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>
                      <span style={{ fontSize: 13, color: "#6b7280" }}>{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ borderRadius: 20, overflow: "hidden", border: "1.5px solid #f97316", boxShadow: "0 4px 20px rgba(249,115,22,0.12)" }}>
              <div style={{ background: "linear-gradient(135deg, #431407 0%, #9a3412 100%)", padding: "18px 22px", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Crown style={{ width: 20, height: 20, color: "#fed7aa" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 800, fontSize: 15, color: "#fff7ed", margin: 0 }}>Débloquez l'accès complet</p>
                  <p style={{ fontSize: 12, color: "#fdba74", margin: "2px 0 0" }}>Récupérez toutes vos données · Dès 5 €/mois</p>
                </div>
              </div>
              <div style={{ background: "#fff", padding: "16px 22px", display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { icon: "📊", label: "Historique complet de transactions" },
                  { icon: "📄", label: "Export PDF & rapports avancés" },
                  { icon: "♾️", label: "Transactions illimitées" },
                ].map(({ icon, label }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Check style={{ width: 13, height: 13, color: ORANGE, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: "#374151" }}>{label}</span>
                  </div>
                ))}
                <Link href="/pricing">
                  <button style={{ width: "100%", background: ORANGE, color: "#fff", border: "none", borderRadius: 12, padding: "13px 24px", fontWeight: 800, fontSize: 14, cursor: "pointer", boxShadow: "0 2px 12px rgba(249,115,22,0.30)", marginTop: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                    <Zap style={{ width: 16, height: 16 }} />
                    S'abonner maintenant →
                  </button>
                </Link>
              </div>
            </div>
          </>
        ) : (
          /* Free plan (legacy / no trial data) */
          <div style={{ border: "1.5px solid hsl(var(--border))", borderRadius: 20, padding: "40px 28px", background: "hsl(var(--card))", textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, margin: "0 auto 16px", background: "hsl(var(--primary)/0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Star style={{ width: 30, height: 30, color: "hsl(var(--primary))" }} />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>Plan Gratuit</h2>
            <p style={{ fontSize: 14, color: "hsl(var(--muted-foreground))", margin: "0 0 24px", lineHeight: 1.6 }}>
              Vous utilisez le plan gratuit. Passez à Starter ou Pro pour accéder aux fonctionnalités avancées.
            </p>
            <Link href="/pricing">
              <Button style={{ borderRadius: 12, fontWeight: 600 }}>Voir les offres</Button>
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
}
