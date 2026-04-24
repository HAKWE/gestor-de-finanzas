import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useLanguage } from "../lib/language-context";
import { Button } from "@/components/ui/button";
import { Check, Loader2, ArrowLeft, Zap, Star } from "lucide-react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

interface LivePrice {
  unit_amount: number;
  currency: string;
}

const PLANS = [
  {
    key: "starter",
    name: "Starter",
    defaultPrice: { amount: 500, currency: "eur" },
    icon: Zap,
    features: [
      "Jusqu'à 500 transactions/mois",
      "3 wallets (Orange Money, Wave, espèces)",
      "Rapports mensuels",
      "Accès mobile (PWA)",
      "Support par e-mail",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    defaultPrice: { amount: 1100, currency: "eur" },
    icon: Star,
    recommended: true,
    features: [
      "Transactions illimitées",
      "Wallets illimités",
      "Rapports avancés & exports PDF",
      "Import SMS / relevés bancaires",
      "Gestion des stocks",
      "Support prioritaire",
    ],
  },
] as const;

function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
  }).format(amount / 100);
}

async function startCheckout(planName: string): Promise<string> {
  const res = await fetch(`${basePath}/api/stripe/checkout-by-plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ planName }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Erreur de paiement");
  return data.url;
}

export default function Pricing() {
  const { language } = useLanguage();
  const fr = language === "fr";
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [livePrices, setLivePrices] = useState<Record<string, LivePrice>>({});

  useEffect(() => {
    fetch(`${basePath}/api/stripe/products`, { credentials: "include" })
      .then((r) => r.json())
      .then((d: { data: any[] }) => {
        const map: Record<string, LivePrice> = {};
        for (const product of d.data ?? []) {
          const price = product.prices?.[0];
          if (price) {
            const key = product.name.toLowerCase().includes("pro") ? "pro" : "starter";
            map[key] = { unit_amount: price.unit_amount, currency: price.currency };
          }
        }
        setLivePrices(map);
      })
      .catch(() => {});
  }, []);

  const handleUpgrade = async (planKey: string) => {
    setLoadingPlan(planKey);
    try {
      const url = await startCheckout(planKey);
      window.location.href = url;
    } catch (err: any) {
      alert(err.message);
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="max-w-4xl mx-auto space-y-10">
        <div className="text-center space-y-3">
          <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft className="w-4 h-4" />
            {fr ? "Retour au tableau de bord" : "Back to dashboard"}
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold">
            {fr ? "Choisissez votre offre" : "Choose your plan"}
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {fr
              ? "Commencez gratuitement. Passez à Pro quand vous en avez besoin."
              : "Start free. Upgrade to Pro when you need it."}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {PLANS.map((plan) => {
            const PlanIcon = plan.icon;
            const live = livePrices[plan.key];
            const displayAmount = live?.unit_amount ?? plan.defaultPrice.amount;
            const displayCurrency = live?.currency ?? plan.defaultPrice.currency;
            const isLoading = loadingPlan === plan.key;

            return (
              <div
                key={plan.key}
                className={`relative rounded-2xl border p-8 space-y-6 flex flex-col ${
                  plan.recommended
                    ? "border-primary bg-primary/5 shadow-lg"
                    : "border-border bg-card"
                }`}
              >
                {plan.recommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      {fr ? "Recommandé" : "Recommended"}
                    </span>
                  </div>
                )}

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <PlanIcon className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-bold">{plan.name}</h2>
                  </div>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-4xl font-bold">
                      {formatPrice(displayAmount, displayCurrency)}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      /{fr ? "mois" : "month"}
                    </span>
                  </div>
                </div>

                <ul className="space-y-3 flex-1">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full rounded-xl h-12 text-base font-semibold"
                  variant={plan.recommended ? "default" : "outline"}
                  disabled={!!loadingPlan}
                  onClick={() => handleUpgrade(plan.key)}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  {fr ? `Choisir ${plan.name}` : `Choose ${plan.name}`}
                </Button>
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          {fr
            ? "Paiement sécurisé via Stripe. Annulez à tout moment."
            : "Secure payment via Stripe. Cancel anytime."}
        </p>
      </div>
    </div>
  );
}
