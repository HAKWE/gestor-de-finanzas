import { useLanguage } from "../lib/language-context";
import { Layout } from "../components/layout";
import { useListTransactions, useDeleteTransaction, getListTransactionsQueryKey, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { queryClient } from "../lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Trash2,
  UploadCloud,
  Pencil,
  ShoppingBag,
  Scissors,
  Package,
  Car,
  Smartphone,
  Utensils,
  Home,
  Zap,
  HelpCircle,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  "Vente produit":        ShoppingBag,
  "Product sale":         ShoppingBag,
  "Service coiffure":     Scissors,
  "Beauty service":       Scissors,
  "Achat stock":          Package,
  "Stock purchase":       Package,
  "Transport":            Car,
  "Orange Money reçu":    Smartphone,
  "Orange Money received":Smartphone,
  "Wave reçu":            Smartphone,
  "Wave received":        Smartphone,
  "MTN MoMo reçu":        Smartphone,
  "MTN MoMo received":    Smartphone,
  "Nourriture":           Utensils,
  "Food":                 Utensils,
  "Loyer":                Home,
  "Rent":                 Home,
  "Eau/Électricité":      Zap,
  "Water/Electricity":    Zap,
  "Autre":                HelpCircle,
  "Other":                HelpCircle,
};

function CategoryIcon({ category, isIncome }: { category: string; isIncome: boolean }) {
  const Icon = CATEGORY_ICONS[category] ?? (isIncome ? ArrowUpRight : ArrowDownRight);
  return <Icon className="w-5 h-5" />;
}

const PAYMENT_METHOD_COLORS: Record<string, string> = {
  "Orange Money": "bg-orange-100 text-orange-700 border-orange-200",
  "Wave":         "bg-blue-100 text-blue-700 border-blue-200",
  "MTN MoMo":     "bg-yellow-100 text-yellow-700 border-yellow-200",
  "Cash":         "bg-gray-100 text-gray-700 border-gray-200",
  "Other":        "bg-slate-100 text-slate-700 border-slate-200",
};

export default function Transactions() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const { data: transactions, isLoading } = useListTransactions();
  const deleteTx = useDeleteTransaction();

  const formatCurrency = (amount: number | string, currency: string) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency || "XOF",
      maximumFractionDigits: 0,
    }).format(Number(amount));
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette transaction ?")) {
      deleteTx.mutate({ id }, {
        onSuccess: () => {
          toast({ title: "Transaction supprimée" });
          queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        },
        onError: () => {
          toast({ title: "Erreur", description: "Impossible de supprimer la transaction", variant: "destructive" });
        },
      });
    }
  };

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("nav.transactions")}</h1>
            <p className="text-muted-foreground mt-1">Gérez toutes vos entrées et sorties.</p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Link href="/import" className="flex-1 sm:flex-none">
              <Button size="lg" variant="outline" className="w-full rounded-xl gap-2">
                <UploadCloud className="w-4 h-4" />
                <span className="hidden sm:inline">Importer</span>
                <span className="sm:hidden">Import</span>
              </Button>
            </Link>
            <Link href="/transactions/new" className="flex-1 sm:flex-none">
              <Button size="lg" className="w-full rounded-xl gap-2">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Nouvelle transaction</span>
                <span className="sm:hidden">Ajouter</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Summary pills */}
        {!isLoading && transactions && transactions.length > 0 && (() => {
          const totalIn  = transactions.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
          const totalOut = transactions.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
          const currency = transactions[0]?.currency || "XOF";
          return (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
                <p className="text-xs text-green-700 font-medium mb-1">Total revenus</p>
                <p className="text-lg font-bold text-green-600">+{formatCurrency(totalIn, currency)}</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
                <p className="text-xs text-red-700 font-medium mb-1">Total dépenses</p>
                <p className="text-lg font-bold text-red-500">−{formatCurrency(totalOut, currency)}</p>
              </div>
              <div className={`rounded-2xl p-4 text-center border ${totalIn - totalOut >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                <p className={`text-xs font-medium mb-1 ${totalIn - totalOut >= 0 ? "text-green-700" : "text-red-700"}`}>Solde net</p>
                <p className={`text-lg font-bold ${totalIn - totalOut >= 0 ? "text-green-600" : "text-red-500"}`}>
                  {totalIn - totalOut >= 0 ? "+" : "−"}
                  {formatCurrency(Math.abs(totalIn - totalOut), currency)}
                </p>
              </div>
            </div>
          );
        })()}

        {/* Transaction list */}
        <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
            </div>
          ) : transactions && transactions.length > 0 ? (
            <ul className="divide-y divide-border">
              {transactions.map((tx) => {
                const isIncome = tx.type === "income";
                return (
                  <li
                    key={tx.id}
                    className={`flex items-center gap-3 px-4 py-3.5 transition-colors hover:brightness-95 ${
                      isIncome
                        ? "bg-green-50/60 hover:bg-green-50"
                        : "bg-red-50/40 hover:bg-red-50"
                    }`}
                  >
                    {/* Icon */}
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                      isIncome
                        ? "bg-green-100 text-green-600"
                        : "bg-red-100 text-red-500"
                    }`}>
                      <CategoryIcon category={tx.category} isIncome={isIncome} />
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-foreground truncate text-sm">{tx.category}</p>
                        <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${
                          PAYMENT_METHOD_COLORS[tx.paymentMethod] ?? "bg-muted text-muted-foreground border-border"
                        }`}>
                          {tx.paymentMethod}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-muted-foreground">{formatDate(tx.date)}</p>
                        {tx.referenceNote && (
                          <>
                            <span className="text-muted-foreground/40 text-xs">·</span>
                            <p className="text-xs text-muted-foreground truncate max-w-[140px]">{tx.referenceNote}</p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <div className={`flex items-center gap-0.5 font-bold text-base ${
                        isIncome ? "text-green-600" : "text-red-500"
                      }`}>
                        {isIncome
                          ? <TrendingUp className="w-4 h-4 mr-0.5" />
                          : <TrendingDown className="w-4 h-4 mr-0.5" />}
                        {isIncome ? "+" : "−"}
                        {formatCurrency(tx.amount, tx.currency)}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0 ml-1">
                      <Link href={`/transactions/${tx.id}/edit`}>
                        <Button variant="ghost" size="icon" className="w-8 h-8 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/80">
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 rounded-xl text-muted-foreground hover:text-red-500 hover:bg-red-50"
                        onClick={() => handleDelete(tx.id)}
                        disabled={deleteTx.isPending}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="p-16 text-center space-y-4">
              <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto">
                <Wallet className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Aucune transaction</p>
                <p className="text-sm text-muted-foreground mt-1">Commencez par enregistrer votre première entrée ou sortie.</p>
              </div>
              <Link href="/transactions/new">
                <Button className="rounded-xl gap-2 mt-2">
                  <Plus className="w-4 h-4" />
                  Ajouter une transaction
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
