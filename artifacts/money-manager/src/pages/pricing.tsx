import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@clerk/react";
import { Button } from "@/components/ui/button";
import {
  Check, Loader2, ArrowLeft, Zap, Star, Gift, ShieldCheck, Lock, Crown, X, CreditCard,
} from "lucide-react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const EUR_TO_XOF = 655.957;

function formatXOF(cents: number): string {
  if (cents === 0) return "0";
  const eur = cents / 100;
  const xof = Math.ceil((eur * EUR_TO_XOF) / 100) * 100;
  return new Intl.NumberFormat("fr-FR").format(xof);
}

const PLANS = [
  {
    key: "free",
    name: "Gratuit",
    price: 0,
    currency: "eur",
    icon: Gift,
    recommended: false,
    cta: "Commencer gratuitement",
    features: [
      "Jusqu'à 50 transactions/mois",
      "1 wallet (Orange Money ou Wave)",
      "Tableau de bord basique",
      "Accès mobile (PWA)",
    ],
    limitations: [
      "Pas d'export PDF",
      "Pas de rapports avancés",
    ],
  },
  {
    key: "starter",
    name: "Starter",
    price: 500,
    currency: "eur",
    icon: Zap,
    recommended: false,
    cta: "Choisir Starter",
    features: [
      "Jusqu'à 500 transactions/mois",
      "3 wallets (Orange Money, Wave, espèces)",
      "Rapports mensuels",
      "Accès mobile (PWA)",
      "Support par e-mail",
    ],
    limitations: [],
  },
  {
    key: "pro",
    name: "Pro",
    price: 1100,
    currency: "eur",
    icon: Star,
    recommended: true,
    cta: "Choisir Pro",
    features: [
      "Transactions illimitées",
      "Wallets illimités",
      "Rapports avancés & exports PDF",
      "Import SMS / relevés bancaires",
      "Gestion des stocks",
      "Support prioritaire",
    ],
    limitations: [],
  },
] as const;

const PLAN_RANK: Record<string, number> = { free: 0, starter: 1, pro: 2, paid: 1 };

function formatPrice(cents: number, currency: string) {
  if (cents === 0) return "0 €";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

async function startCheckout(planKey: string, paymentMethod: "card" | "paypal"): Promise<string> {
  const res = await fetch(`${basePath}/api/stripe/checkout-by-plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ planName: planKey, paymentMethod }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Erreur de paiement");
  return data.url;
}

// ── PayPal logo SVG ────────────────────────────────────────────────────────────
function PayPalLogo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7.144 19.532l1.049-6.871.066-.428H16.1c3.409 0 5.744-1.644 6.332-4.526.045-.218.076-.431.097-.64C21.752 9.8 20.086 11 17.434 11H9.25L7.144 19.532z" fill="#009CDE"/>
      <path d="M18.33 7.524c-.092.595-.283 1.145-.565 1.63C16.95 11.055 14.89 12 12.34 12H8.498l-1.355 8.532L6.1 23h4.22l1.05-6.871H15.6c3.41 0 5.745-1.644 6.332-4.526.442-2.144-.435-3.89-3.602-4.079z" fill="#003087"/>
      <path d="M4.178 1h7.8c1.94 0 3.57.497 4.721 1.355.947.697 1.543 1.682 1.723 2.838.025.16.043.323.055.49-.584-2.897-3.048-4.683-7.033-4.683H3.165L1 13.532h3.178L6.1 3.532 7.144 1H4.178z" fill="#001C64"/>
      <path d="M18.477 5.683C17.327 4.826 15.695 4.33 13.756 4.33H5.955l-1.776 11.2H7.357l1.355-8.532h3.845c2.55 0 4.61-.945 5.425-2.846.282-.485.473-1.035.565-1.63a5.3 5.3 0 00-.07-.839z" fill="#009CDE"/>
    </svg>
  );
}

// ── Payment method picker modal ────────────────────────────────────────────────
function PaymentPickerModal({
  plan,
  onClose,
  onSelect,
  isLoading,
}: {
  plan: typeof PLANS[number];
  onClose: () => void;
  onSelect: (method: "card" | "paypal") => void;
  isLoading: "card" | "paypal" | null;
}) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff", borderRadius: "24px 24px 0 0",
          width: "100%", maxWidth: 480, padding: "28px 24px 40px",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.18)",
          position: "relative",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div style={{ width: 40, height: 4, background: "#e5e7eb", borderRadius: 99, margin: "0 auto 20px" }} />

        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 16, right: 16,
            background: "#f3f4f6", border: "none", borderRadius: 99,
            width: 32, height: 32, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <X style={{ width: 15, height: 15, color: "#6b7280" }} />
        </button>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ margin: "0 0 4px", fontSize: 13, color: "#9ca3af", fontWeight: 600 }}>
            Finaliser votre abonnement
          </p>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#111827" }}>
            Plan {plan.name} — {formatPrice(plan.price, plan.currency)}/mois
          </h2>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: "#6b7280" }}>
            ≈ {formatXOF(plan.price)} FCFA/mois · Annulable à tout moment
          </p>
        </div>

        {/* Divider with label */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: "#f3f4f6" }} />
          <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600, whiteSpace: "nowrap" }}>
            Choisissez votre moyen de paiement
          </span>
          <div style={{ flex: 1, height: 1, background: "#f3f4f6" }} />
        </div>

        {/* Payment options */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Card option */}
          <button
            disabled={isLoading !== null}
            onClick={() => onSelect("card")}
            style={{
              width: "100%", padding: "16px 20px",
              background: isLoading === "card" ? "#f9fafb" : "#fff",
              border: "2px solid #111827",
              borderRadius: 16, cursor: isLoading ? "default" : "pointer",
              display: "flex", alignItems: "center", gap: 14,
              transition: "all 0.15s", opacity: isLoading === "paypal" ? 0.5 : 1,
            }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: "#111827", display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              {isLoading === "card"
                ? <Loader2 style={{ width: 20, height: 20, color: "#fff", animation: "spin 1s linear infinite" }} />
                : <CreditCard style={{ width: 20, height: 20, color: "#fff" }} />
              }
            </div>
            <div style={{ textAlign: "left" }}>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#111827" }}>
                Payer par carte bancaire
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6b7280" }}>
                Visa, Mastercard, American Express
              </p>
            </div>
            <div style={{ marginLeft: "auto", flexShrink: 0 }}>
              <div style={{ display: "flex", gap: 4 }}>
                {["#1434CB", "#EB001B", "#F79E1B"].map((c, i) => (
                  <div key={i} style={{ width: 28, height: 18, borderRadius: 4, background: c, opacity: 0.85 }} />
                ))}
              </div>
            </div>
          </button>

          {/* PayPal option */}
          <button
            disabled={isLoading !== null}
            onClick={() => onSelect("paypal")}
            style={{
              width: "100%", padding: "16px 20px",
              background: isLoading === "paypal" ? "#fafbff" : "#fff",
              border: "2px solid #003087",
              borderRadius: 16, cursor: isLoading ? "default" : "pointer",
              display: "flex", alignItems: "center", gap: 14,
              transition: "all 0.15s", opacity: isLoading === "card" ? 0.5 : 1,
            }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: "linear-gradient(135deg, #003087 0%, #009CDE 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              {isLoading === "paypal"
                ? <Loader2 style={{ width: 20, height: 20, color: "#fff", animation: "spin 1s linear infinite" }} />
                : <PayPalLogo size={22} />
              }
            </div>
            <div style={{ textAlign: "left" }}>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#003087" }}>
                Payer avec PayPal
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6b7280" }}>
                Compte PayPal ou carte via PayPal
              </p>
            </div>
            <div style={{ marginLeft: "auto", flexShrink: 0 }}>
              <div style={{
                background: "#FFC439", borderRadius: 6, padding: "3px 10px",
                fontSize: 13, fontWeight: 800, color: "#003087", letterSpacing: "-0.01em",
              }}>
                Pay<span style={{ color: "#009CDE" }}>Pal</span>
              </div>
            </div>
          </button>
        </div>

        {/* Security note */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 20 }}>
          <ShieldCheck style={{ width: 14, height: 14, color: "#9ca3af" }} />
          <span style={{ fontSize: 12, color: "#9ca3af" }}>
            Paiement sécurisé · Chiffré par Stripe · Annulable à tout moment
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Pricing() {
  const { isSignedIn, isLoaded } = useAuth();
  const [, setLocation] = useLocation();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [loadingMethod, setLoadingMethod] = useState<"card" | "paypal" | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [currentLabel, setCurrentLabel] = useState<string>("");
  const [pendingPlan, setPendingPlan] = useState<typeof PLANS[number] | null>(null);

  useEffect(() => {
    if (!isSignedIn) return;
    fetch(`${basePath}/api/stripe/subscription-status`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) {
          setCurrentPlan(d.plan || "free");
          setCurrentLabel(d.planLabel || "");
        }
      })
      .catch(() => {});
  }, [isSignedIn]);

  const handlePlanClick = (planKey: string) => {
    if (planKey === "free") {
      setLocation("/sign-up");
      return;
    }
    if (!isSignedIn) {
      setLocation("/sign-in");
      return;
    }
    const plan = PLANS.find(p => p.key === planKey);
    if (plan) setPendingPlan(plan);
  };

  const handlePaymentMethodSelect = async (method: "card" | "paypal") => {
    if (!pendingPlan) return;
    setLoadingMethod(method);
    setLoadingPlan(pendingPlan.key);
    try {
      const url = await startCheckout(pendingPlan.key, method);
      window.location.href = url;
    } catch (err: any) {
      alert(err.message);
      setLoadingMethod(null);
      setLoadingPlan(null);
      setPendingPlan(null);
    }
  };

  const userRank = currentPlan ? (PLAN_RANK[currentPlan] ?? 0) : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
          </Link>
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="MobileMoney" className="w-6 h-6" />
            <span className="font-semibold text-sm text-foreground hidden sm:inline">MobileMoney Manager</span>
          </div>
          {isLoaded && !isSignedIn && (
            <Link href="/sign-in" className="text-sm text-primary font-medium hover:underline">
              Se connecter
            </Link>
          )}
          {isLoaded && isSignedIn && (
            <Link href="/dashboard" className="text-sm text-primary font-medium hover:underline">
              Mon tableau de bord
            </Link>
          )}
        </div>
      </header>

      <main className="px-4 py-12 md:py-20">
        <div className="max-w-5xl mx-auto space-y-12">

          {/* Hero */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full">
              <ShieldCheck className="w-4 h-4" />
              Paiement 100 % sécurisé via Stripe
            </div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
              Choisissez votre offre
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Commencez gratuitement. Passez à une offre payante quand votre activité grandit.
            </p>

            {/* Payment methods accepted */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 500 }}>Méthodes de paiement acceptées :</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4, background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "4px 10px" }}>
                  <CreditCard style={{ width: 14, height: 14, color: "#374151" }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Carte bancaire</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5, background: "#f0f5ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "4px 10px" }}>
                  <PayPalLogo size={14} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#003087" }}>Pay<span style={{ color: "#009CDE" }}>Pal</span></span>
                </div>
              </div>
            </div>

            {/* Active plan notice for signed-in paid users */}
            {currentPlan && currentPlan !== "free" && (
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "linear-gradient(135deg,#fff7ed,#ffedd5)",
                border: "1.5px solid #f97316", borderRadius: 999,
                padding: "8px 18px", fontSize: 14, fontWeight: 600, color: "#9a3412",
              }}>
                <Crown style={{ width: 15, height: 15, color: "#f97316" }} />
                Votre plan actuel&nbsp;: <span style={{ color: "#f97316" }}>{currentLabel}</span>
              </div>
            )}
          </div>

          {/* Plans grid */}
          <div className="grid md:grid-cols-3 gap-6 items-stretch">
            {PLANS.map((plan) => {
              const PlanIcon = plan.icon;
              const isLoading = loadingPlan === plan.key;
              const isFree = plan.key === "free";
              const isCurrentPlan = currentPlan === plan.key;
              const planRank = PLAN_RANK[plan.key] ?? 0;
              const isDowngrade = userRank > planRank;
              const isDisabled = isCurrentPlan || isDowngrade;

              return (
                <div
                  key={plan.key}
                  className={`relative rounded-2xl border flex flex-col transition-shadow ${
                    plan.recommended
                      ? "border-primary bg-primary/5 shadow-xl ring-2 ring-primary/20"
                      : "border-border bg-card shadow-sm hover:shadow-md"
                  }`}
                  style={isCurrentPlan ? { borderColor: "#f97316", boxShadow: "0 0 0 3px rgba(249,115,22,0.15)" } : {}}
                >
                  {/* Recommended badge */}
                  {plan.recommended && !isCurrentPlan && (
                    <div className="absolute -top-4 inset-x-0 flex justify-center">
                      <span className="bg-primary text-white text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-md">
                        <Star className="w-3 h-3 fill-white" />
                        Recommandé
                      </span>
                    </div>
                  )}

                  {/* "Plan actuel" badge */}
                  {isCurrentPlan && (
                    <div className="absolute -top-4 inset-x-0 flex justify-center">
                      <span style={{
                        background: "#f97316", color: "white",
                        fontSize: 11, fontWeight: 700, padding: "5px 14px",
                        borderRadius: 999, display: "inline-flex", alignItems: "center", gap: 5,
                        boxShadow: "0 2px 8px rgba(249,115,22,0.40)",
                      }}>
                        <Check style={{ width: 11, height: 11 }} />
                        Votre plan actuel
                      </span>
                    </div>
                  )}

                  <div className="p-7 space-y-6 flex flex-col flex-1">
                    {/* Plan header */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          plan.recommended ? "bg-primary text-white" : "bg-primary/10 text-primary"
                        }`}>
                          <PlanIcon className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-foreground">{plan.name}</h2>
                      </div>
                      <div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-extrabold text-foreground">
                            {formatPrice(plan.price, plan.currency)}
                          </span>
                          {!isFree && <span className="text-muted-foreground text-sm font-medium">/mois</span>}
                          {isFree && <span className="text-muted-foreground text-sm font-medium">pour toujours</span>}
                        </div>
                        {!isFree && (
                          <div style={{
                            marginTop: 4,
                            display: "inline-flex", alignItems: "center", gap: 5,
                            background: "#fff7ed", border: "1px solid #fed7aa",
                            borderRadius: 8, padding: "3px 9px",
                          }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#c2410c" }}>
                              ≈&nbsp;{formatXOF(plan.price)}&nbsp;FCFA
                            </span>
                            <span style={{ fontSize: 10, color: "#9ca3af", fontWeight: 500 }}>/mois</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Features */}
                    <ul className="space-y-2.5 flex-1">
                      {plan.features.map((feat) => (
                        <li key={feat} className="flex items-start gap-2.5 text-sm">
                          <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          <span className="text-foreground">{feat}</span>
                        </li>
                      ))}
                      {plan.limitations.map((lim) => (
                        <li key={lim} className="flex items-start gap-2.5 text-sm opacity-50">
                          <Lock className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>{lim}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Payment method icons for paid plans */}
                    {!isFree && !isCurrentPlan && !isDowngrade && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, paddingTop: 2 }}>
                        <span style={{ fontSize: 11, color: "#9ca3af" }}>Accepté :</span>
                        <div style={{ display: "flex", gap: 4 }}>
                          <div style={{ background: "#f3f4f6", borderRadius: 5, padding: "2px 7px", fontSize: 10, fontWeight: 600, color: "#374151", display: "flex", alignItems: "center", gap: 3 }}>
                            <CreditCard style={{ width: 10, height: 10 }} /> Carte
                          </div>
                          <div style={{ background: "#eff6ff", borderRadius: 5, padding: "2px 7px", fontSize: 10, fontWeight: 700, color: "#003087", display: "flex", alignItems: "center", gap: 3 }}>
                            <PayPalLogo size={10} /> PayPal
                          </div>
                        </div>
                      </div>
                    )}

                    {/* CTA */}
                    {isCurrentPlan ? (
                      <div style={{
                        width: "100%", height: 48, borderRadius: 12,
                        background: "linear-gradient(135deg,#fff7ed,#ffedd5)",
                        border: "2px solid #f97316",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        gap: 8, fontWeight: 700, fontSize: 14, color: "#c2410c",
                      }}>
                        <Check style={{ width: 16, height: 16 }} />
                        Plan actif
                      </div>
                    ) : isDowngrade ? (
                      <div style={{
                        width: "100%", height: 48, borderRadius: 12,
                        background: "#f3f4f6", border: "1.5px solid #e5e7eb",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        gap: 8, fontWeight: 600, fontSize: 13, color: "#9ca3af",
                        cursor: "not-allowed",
                      }}>
                        Plan inférieur
                      </div>
                    ) : (
                      <Button
                        size="lg"
                        className={`w-full h-12 text-base font-semibold rounded-xl ${
                          plan.recommended
                            ? ""
                            : isFree
                            ? "border-2 border-border bg-background text-foreground hover:bg-muted"
                            : ""
                        }`}
                        variant={plan.recommended ? "default" : "outline"}
                        disabled={!!loadingPlan || !isLoaded}
                        onClick={() => handlePlanClick(plan.key)}
                      >
                        {isLoading
                          ? <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          : <PlanIcon className="w-4 h-4 mr-2" />
                        }
                        {plan.cta}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Currency note */}
          <div style={{
            textAlign: "center", marginTop: -8,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            flexWrap: "wrap",
          }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              fontSize: 12, color: "#6b7280", fontWeight: 500,
              background: "#f9fafb", border: "1px solid #e5e7eb",
              borderRadius: 8, padding: "5px 12px",
            }}>
              💱 Prix en EUR&nbsp;•&nbsp;Converti approximativement en FCFA (1 € ≈ 656 FCFA)
            </span>
          </div>

          {/* Comparison table */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-border">
              <h3 className="font-semibold text-lg text-foreground">Comparaison détaillée</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="text-left px-6 py-3 font-medium text-muted-foreground w-1/2">Fonctionnalité</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Gratuit</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Starter</th>
                    <th className="text-center px-4 py-3 font-semibold text-primary">Pro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { label: "Transactions/mois", free: "50", starter: "500", pro: "Illimité" },
                    { label: "Wallets", free: "1", starter: "3", pro: "Illimité" },
                    { label: "Accès mobile (PWA)", free: "✓", starter: "✓", pro: "✓" },
                    { label: "Tableau de bord", free: "Basique", starter: "Complet", pro: "Avancé" },
                    { label: "Rapports mensuels", free: "—", starter: "✓", pro: "✓" },
                    { label: "Export PDF", free: "—", starter: "—", pro: "✓" },
                    { label: "Import SMS / relevés", free: "—", starter: "—", pro: "✓" },
                    { label: "Gestion des stocks", free: "—", starter: "—", pro: "✓" },
                    { label: "Support", free: "—", starter: "E-mail", pro: "Prioritaire" },
                  ].map((row) => (
                    <tr key={row.label} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-3 text-foreground font-medium">{row.label}</td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{row.free}</td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{row.starter}</td>
                      <td className="px-4 py-3 text-center font-semibold text-primary">{row.pro}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-primary" />Paiement sécurisé via Stripe</div>
            <div className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" />Annulez à tout moment</div>
            <div className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" />Aucune carte requise pour le plan gratuit</div>
          </div>

        </div>
      </main>

      <footer className="border-t border-border/50 text-center py-6 px-4 text-xs text-muted-foreground">
        © {new Date().getFullYear()} MobileMoney Manager — Tous droits réservés.
      </footer>

      {/* Payment method picker modal */}
      {pendingPlan && (
        <PaymentPickerModal
          plan={pendingPlan}
          onClose={() => { if (!loadingMethod) setPendingPlan(null); }}
          onSelect={handlePaymentMethodSelect}
          isLoading={loadingMethod}
        />
      )}
    </div>
  );
}
