import { useState } from "react";
import { Link } from "wouter";
import { useLanguage } from "../lib/language-context";
import { Button } from "@/components/ui/button";
import { Check, Loader2, ArrowLeft, Zap, Star } from "lucide-react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Price {
  id: string;
  unit_amount: number;
  currency: string;
  recurring: { interval: string };
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  prices: Price[];
}

const PLAN_FEATURES: Record<string, string[]> = {
  starter: [
    "Jusqu'à 500 transactions/mois",
    "3 wallets (Orange Money, Wave, espèces)",
    "Rapports mensuels",
    "Accès mobile (PWA)",
    "Support par e-mail",
  ],
  pro: [
    "Transactions illimitées",
    "Wallets illimités",
    "Rapports avancés & exports PDF",
    "Import SMS / relevés",
    "Gestion des stocks",
    "Support prioritaire",
  ],
};

function getPlanFeatures(name: string): string[] {
  if (name.toLowerCase().includes("pro")) return PLAN_FEATURES.pro;
  return PLAN_FEATURES.starter;
}

function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
  }).format(amount / 100);
}

async function startCheckout(priceId: string): Promise<string> {
  const res = await fetch(`${basePath}/api/stripe/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ priceId }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Erreur de paiement");
  }
  const data = await res.json();
  return data.url;
}

export default function Pricing() {
  const { language } = useLanguage();
  const fr = language === "fr";
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  if (products === null && !fetchError) {
    fetch(`${basePath}/api/stripe/products`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setProducts(d.data || []))
      .catch(() => setFetchError("Impossible de charger les offres."));
  }

  const handleUpgrade = async (priceId: string) => {
    setLoadingPriceId(priceId);
    try {
      const url = await startCheckout(priceId);
      window.location.href = url;
    } catch (err: any) {
      alert(err.message);
      setLoadingPriceId(null);
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

        {fetchError && (
          <div className="text-center text-destructive py-8">{fetchError}</div>
        )}

        {!fetchError && products === null && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {products !== null && products.length === 0 && (
          <div className="text-center py-12 space-y-3">
            <p className="text-muted-foreground text-lg">
              {fr ? "Les offres seront disponibles prochainement." : "Plans coming soon."}
            </p>
            <p className="text-sm text-muted-foreground">
              {fr
                ? "Revenez bientôt pour découvrir nos formules d'abonnement."
                : "Check back soon to see our subscription plans."}
            </p>
          </div>
        )}

        {products !== null && products.length > 0 && (
          <div className="grid md:grid-cols-2 gap-6">
            {products.map((product, idx) => {
              const isPro = product.name.toLowerCase().includes("pro");
              const price = product.prices[0];
              const features = getPlanFeatures(product.name);

              return (
                <div
                  key={product.id}
                  className={`relative rounded-2xl border p-8 space-y-6 flex flex-col ${
                    isPro
                      ? "border-primary bg-primary/5 shadow-lg"
                      : "border-border bg-card"
                  }`}
                >
                  {isPro && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        {fr ? "Recommandé" : "Recommended"}
                      </span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {isPro ? (
                        <Star className="w-5 h-5 text-primary" />
                      ) : (
                        <Zap className="w-5 h-5 text-primary" />
                      )}
                      <h2 className="text-xl font-bold">{product.name}</h2>
                    </div>
                    {price ? (
                      <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-4xl font-bold">
                          {formatPrice(price.unit_amount, price.currency)}
                        </span>
                        <span className="text-muted-foreground text-sm">
                          /{fr ? "mois" : "month"}
                        </span>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm mt-2">
                        {fr ? "Tarif sur demande" : "Contact for pricing"}
                      </p>
                    )}
                  </div>

                  <ul className="space-y-3 flex-1">
                    {features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>

                  {price && (
                    <Button
                      className={`w-full rounded-xl h-12 text-base font-semibold ${
                        isPro ? "" : "variant-outline"
                      }`}
                      variant={isPro ? "default" : "outline"}
                      disabled={loadingPriceId === price.id}
                      onClick={() => handleUpgrade(price.id)}
                    >
                      {loadingPriceId === price.id ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : null}
                      {fr ? "Choisir cette offre" : "Choose this plan"}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground">
          {fr
            ? "Paiement sécurisé via Stripe. Annulez à tout moment."
            : "Secure payment via Stripe. Cancel anytime."}
        </p>
      </div>
    </div>
  );
}
