import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@clerk/react";
import { Button } from "@/components/ui/button";
import {
  Check, Loader2, ArrowLeft, Zap, Star, Gift, ShieldCheck, Lock, Crown,
} from "lucide-react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

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

async function startCheckout(planKey: string): Promise<string> {
  const res = await fetch(`${basePath}/api/stripe/checkout-by-plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ planName: planKey }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Erreur de paiement");
  return data.url;
}

export default function Pricing() {
  const { isSignedIn, isLoaded } = useAuth();
  const [, setLocation] = useLocation();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [currentLabel, setCurrentLabel] = useState<string>("");

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

  const handlePlanClick = async (planKey: string) => {
    if (planKey === "free") {
      setLocation("/sign-up");
      return;
    }
    if (!isSignedIn) {
      setLocation("/sign-in");
      return;
    }
    setLoadingPlan(planKey);
    try {
      const url = await startCheckout(planKey);
      window.location.href = url;
    } catch (err: any) {
      alert(err.message);
      setLoadingPlan(null);
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
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-extrabold text-foreground">
                          {formatPrice(plan.price, plan.currency)}
                        </span>
                        {!isFree && <span className="text-muted-foreground text-sm font-medium">/mois</span>}
                        {isFree && <span className="text-muted-foreground text-sm font-medium">pour toujours</span>}
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

                    {/* CTA */}
                    {isCurrentPlan ? (
                      /* Current plan — show active state, no action */
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
                      /* Lower than current — greyed out */
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
    </div>
  );
}
