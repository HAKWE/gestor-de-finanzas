import { Link } from "wouter";
import { useLanguage } from "../lib/language-context";
import { Layout } from "../components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGetDashboardSummary, useGetWeeklySummary } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, ArrowDownRight, ArrowUpRight, Activity, Zap } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const { t, language } = useLanguage();
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary();
  const { data: weekly, isLoading: isLoadingWeekly } = useGetWeeklySummary();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === "fr" ? "fr-FR" : "en-US", {
      style: "currency",
      currency: summary?.currency || "XOF",
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">{t("nav.dashboard")}</h1>
          <p className="text-muted-foreground">Voici le résumé de votre activité.</p>
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
                    tickFormatter={(val) => new Date(val).toLocaleDateString(language === "fr" ? "fr-FR" : "en-US", { weekday: 'short' })}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}
                  />
                  <RechartsTooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => new Date(label).toLocaleDateString(language === "fr" ? "fr-FR" : "en-US", { weekday: 'long', month: 'short', day: 'numeric' })}
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
        <div className="rounded-2xl bg-gradient-to-r from-primary/10 to-orange-100 border border-primary/20 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Passez à Pro pour débloquer tout le potentiel</p>
              <p className="text-sm text-muted-foreground">Transactions illimitées, rapports avancés, import SMS et bien plus.</p>
            </div>
          </div>
          <Link href="/pricing" className="shrink-0 sm:ml-auto">
            <Button size="sm" className="rounded-xl whitespace-nowrap">
              Voir les offres
            </Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
}
