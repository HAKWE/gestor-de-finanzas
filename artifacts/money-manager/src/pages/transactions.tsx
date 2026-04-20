import { useLanguage } from "../lib/language-context";
import { Layout } from "../components/layout";
import { useListTransactions, useDeleteTransaction, getListTransactionsQueryKey, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { queryClient } from "../lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Plus, ArrowUpRight, ArrowDownRight, Trash2, UploadCloud } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Transactions() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const { data: transactions, isLoading } = useListTransactions();
  const deleteTx = useDeleteTransaction();

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat(language === "fr" ? "fr-FR" : "en-US", {
      style: "currency",
      currency: currency || "XOF",
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleDelete = (id: number) => {
    if (confirm(t("transactions.deleteConfirm") || "Êtes-vous sûr de vouloir supprimer cette transaction ?")) {
      deleteTx.mutate({ id }, {
        onSuccess: () => {
          toast({ title: "Transaction supprimée" });
          queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        },
        onError: () => {
          toast({ title: "Erreur", description: "Impossible de supprimer la transaction", variant: "destructive" });
        }
      });
    }
  };

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold tracking-tight">{t("nav.transactions")}</h1>
            <p className="text-muted-foreground">Gérez toutes vos entrées et sorties.</p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Link href="/import" className="flex-1 sm:flex-none">
              <Button size="lg" variant="outline" className="w-full rounded-xl">
                <UploadCloud className="w-5 h-5 mr-2" />
                Importer
              </Button>
            </Link>
            <Link href="/transactions/new" className="flex-1 sm:flex-none">
              <Button size="lg" className="w-full rounded-xl">
                <Plus className="w-5 h-5 mr-2" />
                Nouvelle transaction
              </Button>
            </Link>
          </div>
        </div>

        <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-4 space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : transactions && transactions.length > 0 ? (
            <div className="divide-y divide-border">
              {transactions.map((tx) => (
                <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${tx.type === 'income' ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
                      {tx.type === 'income' ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownRight className="w-6 h-6" />}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{tx.category}</p>
                      <p className="text-sm text-muted-foreground">
                        {tx.paymentMethod} • {new Date(tx.date).toLocaleDateString(language === "fr" ? "fr-FR" : "en-US")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={`font-bold ${tx.type === 'income' ? 'text-primary' : 'text-destructive'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, tx.currency)}
                    </div>
                    <Link href={`/transactions/${tx.id}/edit`}>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="w-4 h-4 text-muted-foreground hover:text-foreground hidden" />
                        <span className="sr-only">Edit</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-edit-2 w-4 h-4 text-muted-foreground hover:text-foreground"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                      </Button>
                    </Link>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(tx.id)} disabled={deleteTx.isPending}>
                      <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-muted-foreground">
              <p>Aucune transaction trouvée.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
