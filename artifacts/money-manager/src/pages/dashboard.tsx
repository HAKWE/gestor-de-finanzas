import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useLanguage } from "../lib/language-context";
import { Layout } from "../components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGetDashboardSummary, useGetWeeklySummary, useListTransactions } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, ArrowDownRight, ArrowUpRight, Activity, Zap, Star, Crown, CheckCircle, X, Plus } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

interface SubscriptionStatus {
  plan: "free" | "starter" | "pro" | "paid";
  planLabel: string;
  status?: string;
}

function PlanBadge({ plan, label }: { plan: string; label: string }) {
  if (plan === "free") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
        Gratuit
      </span>
    );
  }
  if (plan === "pro") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-primary text-white">
        <Crown className="w-3 h-3" />
        {label}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-orange-100 text-primary border border-primary/20">
      <Star className="w-3 h-3" />
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
  const [showUpgradedBanner, setShowUpgradedBanner] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("upgraded") === "true") {
      setShowUpgradedBanner(true);
      const clean = window.location.pathname;
      window.history.replaceState({}, "", clean);
    }
  }, []);

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

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {showUpgradedBanner && (
          <div className="rounded-2xl bg-green-50 border border-green-200 p-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-green-800">Abonnement activé avec succès !</p>
              <p className="text-sm text-green-700 mt-0.5">Merci pour votre confiance. Vos nouvelles fonctionnalités sont maintenant disponibles.</p>
            </div>
            <button
              onClick={() => setShowUpgradedBanner(false)}
              className="shrink-0 text-green-500 hover:text-green-700 transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold tracking-tight">{t("nav.dashboard")}</h1>
              {subStatus && (
                <PlanBadge plan={subStatus.plan} label={subStatus.planLabel} />
              )}
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
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                  />
                  <RechartsTooltip
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => new Date(label).toLocaleDateString(language === "fr" ? "fr-FR" : "en-US", { weekday: "long", month: "short", day: "numeric" })}
                  />
                  <Bar dataKey="income" name="Revenus" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Dépenses" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Aucune donnée pour cette semaine
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
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
                      tx.type === "income"
                        ? "bg-green-100 text-green-600"
                        : "bg-red-100 text-red-500"
                    }`}>
                      {tx.type === "income"
                        ? <ArrowUpRight className="w-4 h-4" />
                        : <ArrowDownRight className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{tx.category}</p>
                      <p className="text-xs text-muted-foreground">{tx.paymentMethod} · {tx.date}</p>
                    </div>
                    <span className={`text-sm font-semibold shrink-0 ${
                      tx.type === "income" ? "text-green-600" : "text-red-500"
                    }`}>
                      {tx.type === "income" ? "+" : "−"}
                      {new Intl.NumberFormat("fr-FR", {
                        style: "currency",
                        currency: tx.currency || "XOF",
                        maximumFractionDigits: 0,
                      }).format(parseFloat(tx.amount))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

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
              <Button size="sm" className="rounded-xl whitespace-nowrap">
                Voir les offres
              </Button>
            </Link>
          </div>
        )}

        {isPaid && (
          <div className="rounded-2xl bg-green-50 border border-green-200 p-5 flex items-center gap-4">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
              <Crown className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Abonnement {subStatus?.planLabel} actif</p>
              <p className="text-sm text-muted-foreground">Vous bénéficiez de toutes les fonctionnalités incluses dans votre offre.</p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
