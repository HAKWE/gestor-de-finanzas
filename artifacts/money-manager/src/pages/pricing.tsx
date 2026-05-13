import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@clerk/react";
import {
  Check, Loader2, ArrowLeft, Zap, Star, ShieldCheck, Crown,
  Clock, CreditCard, Sparkles, X,
} from "lucide-react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const EUR_TO_XOF = 655.957;

function xof(cents: number) {
  const eur = cents / 100;
  const val = Math.ceil((eur * EUR_TO_XOF) / 100) * 100;
  return new Intl.NumberFormat("fr-FR").format(val);
}

function eur(cents: number, decimals = 0) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency", currency: "EUR",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(cents / 100);
}

const PLANS = [
  {
    key: "starter",
    name: "Starter",
    icon: Zap,
    recommended: false,
    monthlyPrice: 500,
    annualPrice: 3900,
    annualMonthlyEq: 325,
    launchPrice: 399,
    launchMonths: 3,
    features: [
      "Jusqu'à 500 transactions/mois",
      "3 wallets (Orange Money, Wave, espèces)",
      "Rapports mensuels",
      "Accès mobile (PWA)",
      "Support par e-mail",
    ],
    cta: "Choisir Starter",
  },
  {
    key: "pro",
    name: "Pro",
    icon: Star,
    recommended: true,
    monthlyPrice: 1100,
    annualPrice: 7900,
    annualMonthlyEq: 658,
    launchPrice: null,
    launchMonths: 0,
    features: [
      "Transactions illimitées",
      "Wallets illimités",
      "Rapports avancés & exports PDF",
      "Import SMS / relevés bancaires",
      "Gestion des stocks",
      "Support prioritaire",
    ],
    cta: "Choisir Pro",
  },
] as const;

const COMPARISON = [
  { label: "Transactions/mois",      free: "50",       starter: "500",      pro: "Illimité" },
  { label: "Wallets",                free: "1",        starter: "3",        pro: "Illimité" },
  { label: "Tableau de bord",        free: "Basique",  starter: "Complet",  pro: "Avancé" },
  { label: "Rapports mensuels",      free: "Basique",  starter: "✓",        pro: "Avancé" },
  { label: "Export PDF",             free: "—",        starter: "—",        pro: "✓" },
  { label: "Import SMS / relevés",   free: "—",        starter: "—",        pro: "✓" },
  { label: "Gestion des stocks",     free: "—",        starter: "—",        pro: "✓" },
  { label: "Accès mobile (PWA)",     free: "✓",        starter: "✓",        pro: "✓" },
  { label: "Support",                free: "—",        starter: "E-mail",   pro: "Prioritaire" },
];

const PLAN_RANK: Record<string, number> = { free: 0, limited_free: 0, trial: 1, starter: 1, pro: 2, paid: 1 };

async function startCheckout(planKey: string, paymentMethod: "card" | "paypal" = "card"): Promise<string> {
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

function PaypalLogo({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.5 7.5c.3 2.1-.9 4.5-3 5.4-.6.3-1.2.4-1.9.4h-2.4l-.6 3.9H9.4l2.1-13.2h4.8c1.5 0 2.7.6 3.2 3.5z" fill="#253B80"/>
      <path d="M8.1 7.5c.3 2.1-.9 4.5-3 5.4-.6.3-1.2.4-1.9.4H.8L0 17.2h-2.2l2.1-13.2H4.7c1.5 0 2.7.6 3.4 3.5z" fill="#179BD7" transform="translate(7.5 0)"/>
    </svg>
  );
}

export default function Pricing() {
  const { isSignedIn, isLoaded } = useAuth();
  const [, setLocation] = useLocation();
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [currentLabel, setCurrentLabel] = useState<string>("");
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);
  const [effectivePlan, setEffectivePlan] = useState<string | null>(null);
  const [showLaunchBanner, setShowLaunchBanner] = useState(true);

  useEffect(() => {
    if (!isSignedIn) return;
    fetch(`${basePath}/api/stripe/subscription-status`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) return;
        setCurrentPlan(d.plan || "free");
        setCurrentLabel(d.planLabel || "");
        setTrialDaysLeft(typeof d.trialDaysLeft === "number" ? d.trialDaysLeft : null);
        setEffectivePlan(d.effectivePlan ?? null);
      })
      .catch(() => {});
  }, [isSignedIn]);

  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setLoadingPlan(null);
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  const handlePlanClick = async (planKey: string, paymentMethod: "card" | "paypal" = "card") => {
    if (!isSignedIn) return;
    const key = `${planKey}-${paymentMethod}`;
    setLoadingPlan(key);
    try {
      const url = await startCheckout(planKey, paymentMethod);
      window.location.href = url;
      // Reset after 10 s — guards against slow navigation or browser back
      setTimeout(() => setLoadingPlan(null), 10_000);
    } catch (err: any) {
      alert(err.message);
      setLoadingPlan(null);
    }
  };

  const userRank = currentPlan ? (PLAN_RANK[currentPlan] ?? 0) : 0;
  const isInTrial = effectivePlan === "trial";

  const trialUrgency = trialDaysLeft === null ? null
    : trialDaysLeft <= 7 ? "critical"
    : trialDaysLeft <= 14 ? "high"
    : "normal";

  return (
    <div style={{ minHeight: "100vh", background: "#faf8f5", fontFamily: "Inter, sans-serif" }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header style={{ borderBottom: "1px solid #ede9e3", padding: "14px 20px", background: "#fff", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 860, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#6b7280", textDecoration: "none" }}>
            <ArrowLeft style={{ width: 15, height: 15 }} />
            Retour à l'accueil
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <img src="/logo.svg" alt="MobileMoney" style={{ width: 24, height: 24 }} />
            <span style={{ fontWeight: 700, fontSize: 14, color: "#111" }}>MobileMoney Manager</span>
          </div>
          {isLoaded && !isSignedIn && (
            <Link href="/sign-in" style={{ fontSize: 13, color: "#f97316", fontWeight: 600, textDecoration: "none" }}>
              Se connecter
            </Link>
          )}
          {isLoaded && isSignedIn && (
            <Link href="/dashboard" style={{ fontSize: 13, color: "#f97316", fontWeight: 600, textDecoration: "none" }}>
              Mon tableau de bord
            </Link>
          )}
        </div>
      </header>

      <main style={{ padding: "32px 16px 64px", maxWidth: 860, margin: "0 auto" }}>

        {/* ── Launch promo banner ─────────────────────────────────────────── */}
        <div style={{
          background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
          borderRadius: 16, marginBottom: 24, overflow: "hidden",
          boxShadow: "0 6px 28px rgba(124,58,237,0.35)",
        }}>
          <div style={{ background: "rgba(251,191,36,0.15)", padding: "5px 18px", display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#fde68a", letterSpacing: "0.5px", textTransform: "uppercase" }}>
              ⏰ Offre limitée — se termine le 31 mai 2026
            </span>
          </div>
          <div style={{ padding: "12px 18px 16px", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 26, flexShrink: 0 }}>🚀</span>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 900, fontSize: 15, color: "#fff", lineHeight: 1.3 }}>
                OFFRE DE LANCEMENT LIMITÉE — Starter à 3,99 €/mois pendant 3 mois
              </p>
              <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "#ddd6fe", lineHeight: 1.4 }}>
                Au lieu de 5 €/mois.{" "}
                <strong style={{ color: "#fbbf24" }}>Offre se termine le 31 mai 2026 — ne manquez pas cette opportunité !</strong>
              </p>
            </div>
          </div>
        </div>

        {/* ── Trial countdown box (signed-in trial users) ─────────────────── */}
        {isInTrial && trialDaysLeft !== null && (() => {
          const bg = trialUrgency === "critical" ? "#fef2f2" : trialUrgency === "high" ? "#fff7ed" : "#eff6ff";
          const border = trialUrgency === "critical" ? "#fca5a5" : trialUrgency === "high" ? "#fdba74" : "#93c5fd";
          const grad = trialUrgency === "critical"
            ? "linear-gradient(90deg,#dc2626,#ef4444)"
            : trialUrgency === "high"
            ? "linear-gradient(90deg,#f97316,#fb923c)"
            : "linear-gradient(90deg,#2563eb,#3b82f6)";
          const txtColor = trialUrgency === "critical" ? "#dc2626" : trialUrgency === "high" ? "#c2410c" : "#1d4ed8";
          const pct = Math.max(5, Math.round(((45 - trialDaysLeft) / 45) * 100));
          return (
            <div style={{ borderRadius: 20, overflow: "hidden", marginBottom: 28, background: bg, border: `2px solid ${border}`, boxShadow: trialUrgency === "critical" ? "0 6px 28px rgba(220,38,38,0.20)" : "0 4px 18px rgba(59,130,246,0.14)" }}>
              <div style={{ height: 5, background: grad }} />
              <div style={{ padding: "20px 22px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: trialUrgency === "critical" ? "rgba(220,38,38,0.10)" : trialUrgency === "high" ? "rgba(249,115,22,0.10)" : "rgba(37,99,235,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Clock style={{ width: 22, height: 22, color: txtColor }} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 900, fontSize: 17, color: txtColor, lineHeight: 1.2 }}>
                      {trialUrgency === "critical"
                        ? `⏰ Plus que ${trialDaysLeft} jour${trialDaysLeft > 1 ? "s" : ""} d'essai gratuit !`
                        : `Votre essai gratuit se termine dans ${trialDaysLeft} jours`}
                    </p>
                    <p style={{ margin: "3px 0 0", fontSize: 12, color: "#6b7280", lineHeight: 1.4 }}>
                      {trialUrgency === "critical"
                        ? "Abonnez-vous maintenant pour ne pas perdre l'accès à vos données."
                        : "Profitez de toutes les fonctionnalités premium jusqu'à la fin de l'essai."}
                    </p>
                  </div>
                </div>
                <div style={{ background: "rgba(0,0,0,0.07)", borderRadius: 99, height: 8, overflow: "hidden", marginBottom: 6 }}>
                  <div style={{ height: "100%", width: `${pct}%`, borderRadius: 99, background: grad, transition: "width 0.6s ease" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#9ca3af" }}>
                  <span>Début de l'essai</span>
                  <span style={{ color: txtColor, fontWeight: 700 }}>{trialDaysLeft} jours restants</span>
                  <span>Fin (45 j)</span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── Hero ───────────────────────────────────────────────────────────── */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "#fff7ed", border: "1px solid #fed7aa",
            borderRadius: 99, padding: "6px 14px", fontSize: 12, fontWeight: 600, color: "#c2410c",
            marginBottom: 14,
          }}>
            <ShieldCheck style={{ width: 13, height: 13 }} />
            Paiement sécurisé via Stripe et PayPal
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 900, color: "#111", margin: "0 0 10px", lineHeight: 1.15 }}>
            Choisissez votre offre
          </h1>
          <p style={{ fontSize: 16, color: "#6b7280", margin: "0 0 20px", lineHeight: 1.6 }}>
            45 jours d'essai gratuit inclus. Aucune carte bancaire requise.
          </p>

          {/* Trial CTA (not signed in) */}
          {!isSignedIn && isLoaded && (
            <Link
              href="/sign-up"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "linear-gradient(135deg,#2563eb,#3b82f6)",
                borderRadius: 99, padding: "11px 24px",
                fontSize: 14, fontWeight: 700, color: "#fff",
                textDecoration: "none",
                boxShadow: "0 4px 14px rgba(37,99,235,0.30)",
                marginBottom: 8,
              }}
            >
              🎁 Démarrer l'essai gratuit 45 jours →
            </Link>
          )}

          {/* Current plan badge */}
          {currentPlan && currentPlan !== "free" && currentPlan !== "limited_free" && !isInTrial && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              background: "linear-gradient(135deg,#fff7ed,#ffedd5)",
              border: "1.5px solid #f97316", borderRadius: 99,
              padding: "7px 16px", fontSize: 13, fontWeight: 700, color: "#9a3412",
            }}>
              <Crown style={{ width: 13, height: 13, color: "#f97316" }} />
              Plan actuel&nbsp;: <span style={{ color: "#f97316" }}>{currentLabel}</span>
            </div>
          )}
        </div>

        {/* ── Billing toggle ─────────────────────────────────────────────────── */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
          <div style={{ display: "inline-flex", background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 14, padding: 4, gap: 4, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <button
              onClick={() => setBilling("monthly")}
              style={{
                padding: "11px 28px", borderRadius: 11, border: "none", cursor: "pointer",
                fontWeight: 700, fontSize: 15,
                background: billing === "monthly" ? "#f97316" : "transparent",
                color: billing === "monthly" ? "#fff" : "#6b7280",
                transition: "all 0.15s",
              }}
            >
              Mensuel
            </button>
            <button
              onClick={() => setBilling("annual")}
              style={{
                padding: "11px 28px", borderRadius: 11, border: "none", cursor: "pointer",
                fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", gap: 7,
                background: billing === "annual" ? "#f97316" : "transparent",
                color: billing === "annual" ? "#fff" : "#6b7280",
                transition: "all 0.15s",
              }}
            >
              Annuel
              <span style={{
                background: billing === "annual" ? "rgba(255,255,255,0.25)" : "#dcfce7",
                color: billing === "annual" ? "#fff" : "#16a34a",
                fontSize: 10, fontWeight: 800, padding: "2px 7px", borderRadius: 99,
              }}>
                Jusqu'à 5 mois offerts
              </span>
            </button>
          </div>
        </div>

        {/* ── Plans grid ─────────────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: 20, marginBottom: 36 }}>
          {PLANS.map((plan) => {
            const PlanIcon = plan.icon;
            const isLoading = (key: string) => loadingPlan === key;
            const isCurrentPlan = !isInTrial && currentPlan === plan.key;
            const planRank = PLAN_RANK[plan.key] ?? 0;
            const isDowngrade = !isInTrial && userRank > planRank;

            const displayPrice = billing === "annual" ? plan.annualMonthlyEq : plan.monthlyPrice;
            const originalMonthly = plan.monthlyPrice;
            const annualTotal = plan.annualPrice;
            const showLaunch = billing === "monthly" && plan.launchPrice !== null;

            return (
              <div
                key={plan.key}
                style={{
                  borderRadius: 22, overflow: "hidden", position: "relative",
                  border: plan.recommended
                    ? "2.5px solid #f97316"
                    : isCurrentPlan
                    ? "2px solid #f97316"
                    : "1.5px solid #e5e7eb",
                  background: "#fff",
                  boxShadow: plan.recommended
                    ? "0 8px 32px rgba(249,115,22,0.18)"
                    : "0 2px 12px rgba(0,0,0,0.05)",
                  display: "flex", flexDirection: "column",
                }}
              >
                {/* Top color band */}
                <div style={{
                  height: 5,
                  background: plan.recommended
                    ? "linear-gradient(90deg,#f97316,#fb923c)"
                    : "linear-gradient(90deg,#e5e7eb,#d1d5db)",
                }} />

                {/* Recommended / Current badges */}
                {plan.recommended && !isCurrentPlan && (
                  <div style={{ position: "absolute", top: 16, right: 16 }}>
                    <span style={{
                      background: "linear-gradient(135deg,#f97316,#ea580c)",
                      color: "#fff", fontSize: 10, fontWeight: 800,
                      padding: "4px 10px", borderRadius: 99,
                      display: "inline-flex", alignItems: "center", gap: 4,
                    }}>
                      <Star style={{ width: 9, height: 9, fill: "white" }} />
                      Recommandé
                    </span>
                  </div>
                )}
                {isCurrentPlan && (
                  <div style={{ position: "absolute", top: 16, right: 16 }}>
                    <span style={{ background: "#f97316", color: "#fff", fontSize: 10, fontWeight: 800, padding: "4px 10px", borderRadius: 99, display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <Check style={{ width: 9, height: 9 }} />
                      Plan actif
                    </span>
                  </div>
                )}

                <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", flex: 1, gap: 16 }}>
                  {/* Plan name */}
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 12,
                      background: plan.recommended ? "#fff7ed" : "#f3f4f6",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <PlanIcon style={{ width: 19, height: 19, color: plan.recommended ? "#f97316" : "#6b7280" }} />
                    </div>
                    <h2 style={{ fontSize: 20, fontWeight: 800, color: "#111", margin: 0 }}>{plan.name}</h2>
                  </div>

                  {/* Price */}
                  <div>
                    {billing === "monthly" && showLaunch && (
                      <div style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        background: "linear-gradient(135deg,#7c3aed,#5b21b6)",
                        borderRadius: 8, padding: "4px 10px", marginBottom: 8,
                      }}>
                        <Sparkles style={{ width: 11, height: 11, color: "#fbbf24" }} />
                        <span style={{ fontSize: 11, fontWeight: 800, color: "#e9d5ff" }}>
                          Prix de lancement — {plan.launchMonths} premiers mois à {eur(plan.launchPrice!, 2)} !
                        </span>
                      </div>
                    )}
                    <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                      <span style={{ fontSize: 40, fontWeight: 900, color: "#111" }}>
                        {eur(displayPrice, displayPrice % 100 === 0 ? 0 : 2)}
                      </span>
                      <span style={{ fontSize: 14, color: "#9ca3af", fontWeight: 500 }}>/mois</span>
                      {billing === "annual" && (
                        <span style={{ fontSize: 12, color: "#9ca3af", textDecoration: "line-through", marginLeft: 4 }}>
                          {eur(originalMonthly)}
                        </span>
                      )}
                    </div>
                    {billing === "annual" ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#16a34a" }}>
                          {eur(annualTotal)} facturé annuellement
                        </span>
                        <span style={{ background: "#dcfce7", color: "#15803d", fontSize: 10, fontWeight: 800, padding: "2px 7px", borderRadius: 99 }}>
                          {plan.key === "pro" ? "5 mois offerts" : "2 mois offerts"}
                        </span>
                      </div>
                    ) : (
                      <div style={{ marginTop: 4, display: "inline-flex", alignItems: "center", gap: 5, background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 7, padding: "3px 8px" }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#c2410c" }}>≈ {xof(displayPrice)} FCFA/mois</span>
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 9, flex: 1 }}>
                    {plan.features.map((f) => (
                      <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: "#374151" }}>
                        <Check style={{ width: 15, height: 15, color: "#f97316", flexShrink: 0, marginTop: 1 }} />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {/* CTA buttons */}
                  {isCurrentPlan ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 46, borderRadius: 12, background: "#fff7ed", border: "2px solid #f97316", gap: 7, fontWeight: 700, fontSize: 13, color: "#c2410c" }}>
                      <Check style={{ width: 15, height: 15 }} />
                      Plan actif
                    </div>
                  ) : isDowngrade ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 46, borderRadius: 12, background: "#f3f4f6", border: "1.5px solid #e5e7eb", fontWeight: 600, fontSize: 13, color: "#9ca3af", cursor: "not-allowed" }}>
                      Plan inférieur
                    </div>
                  ) : !isLoaded ? (
                    <div style={{ height: 48, borderRadius: 13, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Loader2 style={{ width: 18, height: 18, color: "#9ca3af", animation: "spin 0.8s linear infinite" }} />
                    </div>
                  ) : !isSignedIn ? (
                    <Link href="/sign-up" style={{ textDecoration: "none" }}>
                      <div style={{
                        width: "100%", height: 48, borderRadius: 13, border: "none",
                        background: plan.recommended
                          ? "linear-gradient(135deg,#f97316,#ea580c)"
                          : "linear-gradient(135deg,#111827,#1f2937)",
                        color: "#fff", fontWeight: 800, fontSize: 14,
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        boxShadow: plan.recommended ? "0 4px 16px rgba(249,115,22,0.35)" : "0 4px 14px rgba(0,0,0,0.18)",
                      }}>
                        🎁 Commencer l'essai gratuit
                      </div>
                    </Link>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                      {/* Card button */}
                      <button
                        disabled={!!loadingPlan}
                        onClick={() => handlePlanClick(plan.key, "card")}
                        style={{
                          width: "100%", height: 48, borderRadius: 13, border: "none",
                          background: plan.recommended
                            ? "linear-gradient(135deg,#f97316,#ea580c)"
                            : "linear-gradient(135deg,#111827,#1f2937)",
                          color: "#fff", fontWeight: 800, fontSize: 14, cursor: !!loadingPlan ? "wait" : "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                          boxShadow: plan.recommended ? "0 4px 16px rgba(249,115,22,0.35)" : "0 4px 14px rgba(0,0,0,0.18)",
                          opacity: !!loadingPlan && loadingPlan !== `${plan.key}-card` ? 0.6 : 1,
                          transition: "opacity 0.15s",
                        }}
                      >
                        {isLoading(`${plan.key}-card`)
                          ? <Loader2 style={{ width: 16, height: 16, animation: "spin 0.8s linear infinite" }} />
                          : <CreditCard style={{ width: 15, height: 15 }} />
                        }
                        Payer par carte
                      </button>

                      {/* PayPal button */}
                      <button
                        disabled={!!loadingPlan}
                        onClick={() => handlePlanClick(plan.key, "paypal")}
                        style={{
                          width: "100%", height: 48, borderRadius: 13,
                          background: isLoading(`${plan.key}-paypal`)
                            ? "#f0c430"
                            : "linear-gradient(135deg,#ffd140,#ffca2c)",
                          border: "2px solid rgba(0,0,0,0.06)",
                          cursor: !!loadingPlan ? "wait" : "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                          boxShadow: "0 4px 14px rgba(255,196,44,0.45)",
                          opacity: !!loadingPlan && loadingPlan !== `${plan.key}-paypal` ? 0.6 : 1,
                          transition: "opacity 0.15s",
                        }}
                      >
                        {isLoading(`${plan.key}-paypal`) ? (
                          <Loader2 style={{ width: 16, height: 16, color: "#253B80", animation: "spin 0.8s linear infinite" }} />
                        ) : (
                          <>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M7.5 21.5h2.6l.4-2.6h1.7c2.8 0 4.9-1.4 5.5-4.3.5-2.5-.8-4-3.1-4.1H9.6L7.5 21.5z" fill="#179BD7"/>
                              <path d="M9.9 10.5h4.5c.6 0 1.1.1 1.5.2-.4-2.8-2.3-3.7-5-3.7H7.2L5 18.9h2.9l.7-4.6.9-5.9 1 2.1z" fill="#253B80"/>
                            </svg>
                            <span style={{ fontSize: 14, fontWeight: 800, color: "#253B80", letterSpacing: "-0.2px" }}>Payer avec PayPal</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Social proof ─────────────────────────────────────────────────── */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "#fff", border: "1.5px solid #e5e7eb",
            borderRadius: 99, padding: "10px 20px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}>
            <span style={{ fontSize: 18 }}>👥</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>
              Rejoignez <strong style={{ color: "#f97316" }}>+500 entrepreneurs</strong> qui gèrent déjà leur argent mobile avec nous
            </span>
          </div>
        </div>

        {/* ── Annual savings callout ───────────────────────────────────────── */}
        {billing === "annual" && (
          <div style={{
            borderRadius: 16, padding: "16px 20px", marginBottom: 32,
            background: "linear-gradient(135deg,#f0fdf4,#dcfce7)",
            border: "1.5px solid #86efac",
            display: "flex", alignItems: "center", gap: 14,
          }}>
            <span style={{ fontSize: 28, flexShrink: 0 }}>🎉</span>
            <div>
              <p style={{ margin: 0, fontWeight: 800, fontSize: 14, color: "#15803d" }}>
                Payez annuellement et économisez jusqu'à 5 mois !
              </p>
              <p style={{ margin: "3px 0 0", fontSize: 12, color: "#4b7c59" }}>
                Starter : <strong>39 €/an</strong> au lieu de 60 € (économie 21 €) · Pro : <strong>79 €/an</strong> au lieu de 132 € (≈ 5 mois offerts) — Annulable avant renouvellement
              </p>
            </div>
          </div>
        )}

        {/* ── Trust signals ───────────────────────────────────────────────── */}
        <div style={{
          display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center",
          marginBottom: 40,
        }}>
          {[
            { icon: "🔒", text: "Paiements sécurisés via Stripe" },
            { icon: "🚫", text: "Aucune carte pour l'essai" },
            { icon: "✂️", text: "Annulable à tout moment" },
            { icon: "🔒", text: "Données chiffrées" },
            { icon: "🌍", text: "Conçu pour l'Afrique" },
          ].map(({ icon, text }) => (
            <div key={text} style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "#fff", border: "1px solid #e5e7eb", borderRadius: 99,
              padding: "7px 14px", fontSize: 12, fontWeight: 600, color: "#374151",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}>
              <span>{icon}</span>
              {text}
            </div>
          ))}
        </div>

        {/* ── Comparison table ─────────────────────────────────────────────── */}
        <div style={{ background: "#fff", borderRadius: 20, border: "1.5px solid #e5e7eb", overflow: "hidden", marginBottom: 32 }}>
          <div style={{ padding: "18px 22px", borderBottom: "1px solid #f3f4f6", background: "linear-gradient(135deg,#fff7ed,#fff)" }}>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: "#111", margin: 0 }}>Comparaison détaillée</h3>
            <p style={{ margin: "3px 0 0", fontSize: 12, color: "#9ca3af" }}>Essai gratuit → Starter → Pro</p>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #f3f4f6", background: "#fafafa" }}>
                  <th style={{ textAlign: "left", padding: "12px 20px", color: "#9ca3af", fontWeight: 600, width: "40%" }}>Fonctionnalité</th>
                  <th style={{ textAlign: "center", padding: "12px 12px", color: "#9ca3af", fontWeight: 600 }}>Essai / Gratuit</th>
                  <th style={{ textAlign: "center", padding: "12px 12px", color: "#6b7280", fontWeight: 700 }}>Starter</th>
                  <th style={{ textAlign: "center", padding: "12px 12px", color: "#f97316", fontWeight: 800 }}>Pro ⭐</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr key={row.label} style={{ borderBottom: i < COMPARISON.length - 1 ? "1px solid #f9fafb" : "none", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <td style={{ padding: "11px 20px", color: "#374151", fontWeight: 600 }}>{row.label}</td>
                    <td style={{ padding: "11px 12px", textAlign: "center", color: row.free === "—" ? "#d1d5db" : "#9ca3af" }}>{row.free}</td>
                    <td style={{ padding: "11px 12px", textAlign: "center", color: row.starter === "—" ? "#d1d5db" : "#374151", fontWeight: 500 }}>{row.starter}</td>
                    <td style={{ padding: "11px 12px", textAlign: "center", color: row.pro === "—" ? "#d1d5db" : "#f97316", fontWeight: 700 }}>{row.pro}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Final CTA ───────────────────────────────────────────────────── */}
        {!isSignedIn && isLoaded && (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <Link
              href="/sign-up"
              style={{
                display: "inline-flex", alignItems: "center", gap: 10,
                background: "linear-gradient(135deg,#f97316,#ea580c)",
                color: "#fff", fontWeight: 800, fontSize: 16, padding: "16px 36px",
                borderRadius: 16, textDecoration: "none",
                boxShadow: "0 6px 24px rgba(249,115,22,0.40)",
              }}
            >
              🎁 Démarrer 45 jours gratuits — sans carte bancaire
            </Link>
            <p style={{ margin: "10px 0 0", fontSize: 12, color: "#9ca3af" }}>
              Aucun engagement · Annulable à tout moment · Accès immédiat
            </p>
          </div>
        )}

      </main>

      <footer style={{ borderTop: "1px solid #ede9e3", padding: "18px 20px", textAlign: "center", fontSize: 12, color: "#9ca3af" }}>
        © {new Date().getFullYear()} MobileMoney Manager — Tous droits réservés.{" "}
        <a href="/confidentialite" style={{ color: "#9ca3af" }}>Confidentialité</a>{" · "}
        <a href="/conditions" style={{ color: "#9ca3af" }}>Conditions</a>
      </footer>
    </div>
  );
}
