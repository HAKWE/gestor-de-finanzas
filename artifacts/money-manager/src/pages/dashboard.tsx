import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { useLanguage } from "../lib/language-context";
import { Layout } from "../components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGetDashboardSummary, useGetWeeklySummary, useListTransactions } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, ArrowDownRight, ArrowUpRight, Activity, Zap, Star, Crown, X, Plus, Sparkles } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const BANNER_DURATION = 8000;

interface SubscriptionStatus {
  plan: "free" | "starter" | "pro" | "paid";
  planLabel: string;
  status?: string;
}

function PlanBadge({ plan, label }: { plan: string; label: string }) {
  if (plan === "free") return null;
  const isPro = plan === "pro";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "5px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700,
      backgroundColor: isPro ? "#f97316" : "#fff7ed",
      color: isPro ? "white" : "#f97316",
      border: isPro ? "none" : "2px solid #f97316",
      boxShadow: isPro ? "0 2px 8px rgba(249,115,22,0.30)" : "none",
    }}>
      {isPro ? <Crown style={{ width: 12, height: 12 }} /> : <Star style={{ width: 12, height: 12 }} />}
      {label}
    </span>
  );
}

export default function Dashboard() {
  const { t, language } = useLanguage();
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary();
  const { data: weekly, isLoading: isLoadingWeekly } = useGetWeeklySummary();
  const { data: recentTxs } = useListTransactions();
  const [subStatus, setSubStatus] = useState<SubscriptionStatus | null>(null);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [bannerProgress, setBannerProgress] = useState(100);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef<number>(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true" || params.get("upgraded") === "true") {
      setShowSuccessBanner(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // Auto-dismiss timer with progress bar
  useEffect(() => {
    if (!showSuccessBanner) {
      if (timerRef.current) clearInterval(timerRef.current);
      setBannerProgress(100);
      return;
    }
    startRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const pct = Math.max(0, 100 - (elapsed / BANNER_DURATION) * 100);
      setBannerProgress(pct);
      if (elapsed >= BANNER_DURATION) {
        setShowSuccessBanner(false);
        clearInterval(timerRef.current!);
      }
    }, 50);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [showSuccessBanner]);

  useEffect(() => {
    fetch(`${basePath}/api/stripe/subscription-status`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setSubStatus(d))
      .catch(() => setSubStatus({ plan: "free", planLabel: "Gratuit" }));
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === "fr" ? "fr-FR" : "en-US", {
      style: "currency",
      currency: summary?.currency || "XOF",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const isPaid = subStatus && subStatus.plan !== "free";
  const isPro = subStatus?.plan === "pro";

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* ── Celebratory success banner ── */}
        {showSuccessBanner && (
          <div style={{
            position: "relative", overflow: "hidden", borderRadius: 20,
            background: "linear-gradient(135deg, #052e16 0%, #14532d 50%, #166534 100%)",
            padding: "0 0 4px",
            boxShadow: "0 8px 32px rgba(21,128,61,0.35)",
          }}>
            {/* Progress bar */}
            <div style={{
              position: "absolute", bottom: 0, left: 0, height: 4,
              width: `${bannerProgress}%`, backgroundColor: "#4ade80",
              borderRadius: 4, transition: "width 0.1s linear",
            }} />

            {/* Decorative emoji confetti */}
            <div style={{
              position: "absolute", top: 10, right: 60, fontSize: 28, opacity: 0.25, pointerEvents: "none",
              animation: "dbSpin 8s linear infinite",
            }}>🎊</div>
            <div style={{
              position: "absolute", top: 20, right: 140, fontSize: 20, opacity: 0.20, pointerEvents: "none",
              animation: "dbFloat 3s ease-in-out infinite",
            }}>✨</div>

            <style>{`
              @keyframes dbSpin  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
              @keyframes dbFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
            `}</style>

            <div style={{ padding: "22px 24px 22px", display: "flex", alignItems: "flex-start", gap: 16 }}>
              {/* Trophy icon */}
              <div style={{
                width: 52, height: 52, borderRadius: 16, flexShrink: 0,
                background: "rgba(74,222,128,0.20)", border: "1.5px solid rgba(74,222,128,0.40)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26,
              }}>🏆</div>

              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 800, fontSize: 17, color: "#f0fdf4", margin: 0, letterSpacing: "-0.02em" }}>
                  Félicitations&nbsp;! 🎉
                </p>
                <p style={{ fontSize: 14, color: "#86efac", margin: "5px 0 0", lineHeight: 1.5 }}>
                  {subStatus && subStatus.plan !== "free"
                    ? <>Votre abonnement <strong style={{ color: "#4ade80" }}>{subStatus.planLabel}</strong> est maintenant actif. Profitez de toutes vos fonctionnalités&nbsp;!</>
                    : <>Votre abonnement est maintenant actif. Vos nouvelles fonctionnalités sont disponibles.</>
                  }
                </p>
              </div>

              <button onClick={() => setShowSuccessBanner(false)} style={{
                background: "rgba(255,255,255,0.10)", border: "none", cursor: "pointer",
                color: "#86efac", padding: 6, borderRadius: 8, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <X style={{ width: 15, height: 15 }} />
              </button>
            </div>
          </div>
        )}

        {/* ── Page header ── */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <h1 className="text-3xl font-bold tracking-tight">{t("nav.dashboard")}</h1>
              {subStatus && <PlanBadge plan={subStatus.plan} label={subStatus.planLabel} />}
            </div>
            <p className="text-muted-foreground">Voici le résumé de votre activité.</p>
          </div>
          <Link href="/transactions/new">
            <Button size="lg" className="rounded-xl shrink-0 gap-2 shadow-sm">
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Ajouter une transaction</span>
              <span className="sm:hidden">Ajouter</span>
            </Button>
          </Link>
        </div>

        {/* ── KPI cards ── */}
        {isLoadingSummary ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-primary text-primary-foreground border-none">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Solde d'aujourd'hui</CardTitle>
                <Wallet className="h-4 w-4 opacity-80" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{formatCurrency(summary?.todayBalance || 0)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Revenus (Cette semaine)</CardTitle>
                <ArrowUpRight className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{formatCurrency(summary?.weekIncome || 0)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Dépenses (Cette semaine)</CardTitle>
                <ArrowDownRight className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{formatCurrency(summary?.weekExpenses || 0)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Transactions</CardTitle>
                <Activity className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{summary?.totalTransactions || 0}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Weekly chart ── */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Activité de la semaine</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {isLoadingWeekly ? (
              <Skeleton className="w-full h-full" />
            ) : weekly && weekly.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekly} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(val) => new Date(val).toLocaleDateString(language === "fr" ? "fr-FR" : "en-US", { weekday: "short" })}
                    axisLine={false} tickLine={false}
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis
                    axisLine={false} tickLine={false}
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                  />
                  <RechartsTooltip
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => new Date(label).toLocaleDateString(language === "fr" ? "fr-FR" : "en-US", { weekday: "long", month: "short", day: "numeric" })}
                  />
                  <Bar dataKey="income"   name="Revenus"   fill="hsl(var(--primary))"     radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Dépenses"  fill="hsl(var(--destructive))"  radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Aucune donnée pour cette semaine
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Recent Transactions ── */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Transactions récentes</CardTitle>
            <Link href="/transactions" className="text-sm text-primary hover:underline font-medium">
              Voir tout
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {!recentTxs || recentTxs.length === 0 ? (
              <div className="px-6 pb-6 pt-2 text-center space-y-4">
                <p className="text-muted-foreground text-sm">Aucune transaction pour l'instant.</p>
                <Link href="/transactions/new">
                  <Button className="rounded-xl gap-2">
                    <Plus className="w-4 h-4" />
                    Ajouter votre première transaction
                  </Button>
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {recentTxs.slice(0, 5).map((tx: any) => (
                  <li key={tx.id} className="flex items-center gap-3 px-6 py-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      tx.type === "income" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-500"
                    }`}>
                      {tx.type === "income" ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{tx.category}</p>
                      <p className="text-xs text-muted-foreground">{tx.paymentMethod} · {tx.date}</p>
                    </div>
                    <span className={`text-sm font-semibold shrink-0 ${tx.type === "income" ? "text-green-600" : "text-red-500"}`}>
                      {tx.type === "income" ? "+" : "−"}
                      {new Intl.NumberFormat("fr-FR", {
                        style: "currency", currency: tx.currency || "XOF", maximumFractionDigits: 0,
                      }).format(parseFloat(tx.amount))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* ── Upgrade promo (free users only) ── */}
        {!isPaid && (
          <div className="rounded-2xl bg-gradient-to-r from-primary/10 to-orange-100 border border-primary/20 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Passez à Starter ou Pro</p>
                <p className="text-sm text-muted-foreground">Transactions illimitées, rapports avancés, import SMS et bien plus.</p>
              </div>
            </div>
            <Link href="/pricing" className="shrink-0 sm:ml-auto">
              <Button size="sm" className="rounded-xl whitespace-nowrap">Voir les offres</Button>
            </Link>
          </div>
        )}

        {/* ── Active subscription card (paid users) ── */}
        {isPaid && (
          <div style={{
            borderRadius: 20, overflow: "hidden",
            background: isPro
              ? "linear-gradient(135deg, #431407 0%, #7c2d12 50%, #9a3412 100%)"
              : "linear-gradient(135deg, #431407 0%, #c2410c 100%)",
            boxShadow: "0 4px 20px rgba(249,115,22,0.25)",
            padding: 22,
            display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, flexShrink: 0,
              background: "rgba(255,255,255,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {isPro
                ? <Crown style={{ width: 24, height: 24, color: "#fed7aa" }} />
                : <Sparkles style={{ width: 24, height: 24, color: "#fed7aa" }} />
              }
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <p style={{ fontWeight: 700, fontSize: 15, color: "#fff7ed", margin: 0 }}>
                Abonnement <span style={{ color: "#fdba74" }}>{subStatus?.planLabel}</span> actif ✓
              </p>
              <p style={{ fontSize: 13, color: "#fed7aa", margin: "4px 0 0", opacity: 0.85 }}>
                Vous bénéficiez de toutes les fonctionnalités de votre offre.
              </p>
            </div>
            <Link href="/pricing">
              <button style={{
                background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.25)",
                color: "#fff7ed", fontWeight: 600, fontSize: 13, padding: "8px 18px",
                borderRadius: 10, cursor: "pointer", whiteSpace: "nowrap",
              }}>
                Gérer mon abonnement
              </button>
            </Link>
          </div>
        )}

      </div>
    </Layout>
  );
}
