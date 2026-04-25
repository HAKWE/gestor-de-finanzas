import { useState } from "react";
import { useLanguage } from "../lib/language-context";
import { Layout } from "../components/layout";
import {
  useListTransactions,
  useDeleteTransaction,
  useCreateTransaction,
  getListTransactionsQueryKey,
  getGetDashboardSummaryQueryKey,
} from "@workspace/api-client-react";
import { queryClient } from "../lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  X,
  Loader2,
  CalendarDays,
  StickyNote,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/* ─── Category icon map ─── */
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  "Vente produit":   ShoppingBag,
  "Service coiffure":Scissors,
  "Achat stock":     Package,
  "Transport":       Car,
  "Orange Money reçu":Smartphone,
  "Wave reçu":       Smartphone,
  "MTN MoMo reçu":   Smartphone,
  "Nourriture":      Utensils,
  "Alimentation":    Utensils,
  "Loyer":           Home,
  "Eau/Électricité": Zap,
  "Autre":           HelpCircle,
};

function CategoryIcon({ category, isIncome }: { category: string; isIncome: boolean }) {
  const Icon = CATEGORY_ICONS[category] ?? (isIncome ? ArrowUpRight : ArrowDownRight);
  return <Icon className="w-5 h-5" />;
}

const PAYMENT_METHOD_COLORS: Record<string, string> = {
  "Orange Money": "bg-orange-100 text-orange-700 border-orange-200",
  "Wave":         "bg-blue-100 text-blue-700 border-blue-200",
  "MTN MoMo":     "bg-yellow-100 text-yellow-700 border-yellow-200",
  "Espèces":      "bg-gray-100 text-gray-700 border-gray-200",
  "Autre":        "bg-slate-100 text-slate-700 border-slate-200",
};

const CATEGORIES = [
  "Vente produit",
  "Service coiffure",
  "Achat stock",
  "Transport",
  "Alimentation",
  "Loyer",
  "Eau/Électricité",
  "Orange Money reçu",
  "Wave reçu",
  "MTN MoMo reçu",
  "Autre",
];

const PAYMENT_METHODS = ["Orange Money", "Wave", "MTN MoMo", "Espèces", "Autre"];

/* ─── Modal form ─── */
interface ModalFormState {
  type: "income" | "expense";
  amount: string;
  currency: string;
  category: string;
  paymentMethod: string;
  referenceNote: string;
  date: string;
}

function defaultForm(): ModalFormState {
  return {
    type: "income",
    amount: "",
    currency: "XOF",
    category: "",
    paymentMethod: "",
    referenceNote: "",
    date: new Date().toISOString().split("T")[0],
  };
}

function AddTransactionModal({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const createTx = useCreateTransaction();
  const [form, setForm] = useState<ModalFormState>(defaultForm());
  const [errors, setErrors] = useState<Partial<Record<keyof ModalFormState, string>>>({});

  const set = <K extends keyof ModalFormState>(key: K, value: ModalFormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const validate = () => {
    const e: typeof errors = {};
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0)
      e.amount = "Montant invalide";
    if (!form.category) e.category = "Choisissez une catégorie";
    if (!form.paymentMethod) e.paymentMethod = "Choisissez un moyen de paiement";
    if (!form.date) e.date = "Date requise";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    createTx.mutate(
      {
        data: {
          type: form.type,
          amount: Number(form.amount),
          currency: form.currency,
          category: form.category,
          paymentMethod: form.paymentMethod,
          referenceNote: form.referenceNote || undefined,
          date: form.date,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "✓ Transaction enregistrée" });
          queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
          onClose();
        },
        onError: () => {
          toast({ title: "Erreur", description: "Impossible d'enregistrer", variant: "destructive" });
        },
      }
    );
  };

  const isIncome = form.type === "income";

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Sheet / Dialog — single scrollable container, sticky header + footer */}
      <div
        className="bg-background w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-y-auto"
        style={{ maxHeight: "92vh" }}
      >
        {/* Header — sticks while scrolling */}
        <div className="sticky top-0 z-10 bg-background flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
          <h2 className="text-lg font-bold">Nouvelle transaction</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body — scrolls with the container */}
        <div className="px-5 py-5 space-y-5">

          {/* Type toggle */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => set("type", "income")}
              className={`flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm border-2 transition-all ${
                isIncome
                  ? "bg-green-500 border-green-500 text-white shadow-md"
                  : "bg-background border-border text-muted-foreground hover:border-green-300"
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Revenu
            </button>
            <button
              type="button"
              onClick={() => set("type", "expense")}
              className={`flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm border-2 transition-all ${
                !isIncome
                  ? "bg-red-500 border-red-500 text-white shadow-md"
                  : "bg-background border-border text-muted-foreground hover:border-red-300"
              }`}
            >
              <TrendingDown className="w-4 h-4" />
              Dépense
            </button>
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Montant</label>
            <div className="relative">
              <Input
                type="number"
                min="0"
                placeholder="0"
                value={form.amount}
                onChange={(e) => set("amount", e.target.value)}
                className={`text-xl font-bold h-14 pr-16 rounded-xl ${errors.amount ? "border-destructive" : ""}`}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                FCFA
              </span>
            </div>
            {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Catégorie</label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => {
                const Icon = CATEGORY_ICONS[cat] ?? HelpCircle;
                const selected = form.category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => set("category", cat)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-left border-2 transition-all ${
                      selected
                        ? "border-primary bg-primary/10 text-primary font-semibold"
                        : "border-border bg-background text-foreground hover:border-primary/40"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{cat}</span>
                  </button>
                );
              })}
            </div>
            {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
          </div>

          {/* Payment method */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Moyen de paiement</label>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_METHODS.map((pm) => {
                const selected = form.paymentMethod === pm;
                return (
                  <button
                    key={pm}
                    type="button"
                    onClick={() => set("paymentMethod", pm)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-all ${
                      selected
                        ? "border-primary bg-primary text-white shadow-sm"
                        : "border-border bg-background text-foreground hover:border-primary/50"
                    }`}
                  >
                    {pm}
                  </button>
                );
              })}
            </div>
            {errors.paymentMethod && <p className="text-xs text-destructive">{errors.paymentMethod}</p>}
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4 text-muted-foreground" />
              Date
            </label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
              className={`rounded-xl h-11 ${errors.date ? "border-destructive" : ""}`}
            />
            {errors.date && <p className="text-xs text-destructive">{errors.date}</p>}
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <StickyNote className="w-4 h-4 text-muted-foreground" />
              Note / Référence
              <span className="text-muted-foreground font-normal">(optionnel)</span>
            </label>
            <textarea
              placeholder="Client, motif, numéro de reçu..."
              value={form.referenceNote}
              onChange={(e) => set("referenceNote", e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>
        </div>

        {/* Footer CTA — sticks at bottom while scrolling */}
        <div className="sticky bottom-0 z-10 px-5 py-4 border-t border-border bg-background">
          <Button
            className="w-full h-14 text-base font-bold rounded-xl shadow-lg"
            onClick={handleSubmit}
            disabled={createTx.isPending}
          >
            {createTx.isPending
              ? <Loader2 className="w-5 h-5 animate-spin mr-2" />
              : <Plus className="w-5 h-5 mr-2" />}
            Enregistrer la transaction
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main page ─── */
export default function Transactions() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const { data: transactions, isLoading } = useListTransactions();
  const deleteTx = useDeleteTransaction();
  const [showModal, setShowModal] = useState(false);

  const formatCurrency = (amount: number | string, currency: string) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency || "XOF",
      maximumFractionDigits: 0,
    }).format(Number(amount));

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const handleDelete = (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette transaction ?")) {
      deleteTx.mutate(
        { id },
        {
          onSuccess: () => {
            toast({ title: "Transaction supprimée" });
            queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
          },
          onError: () => {
            toast({ title: "Erreur", description: "Impossible de supprimer", variant: "destructive" });
          },
        }
      );
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
            <Button
              size="lg"
              className="flex-1 sm:flex-none rounded-xl gap-2"
              onClick={() => setShowModal(true)}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nouvelle transaction</span>
              <span className="sm:hidden">Ajouter</span>
            </Button>
          </div>
        </div>

        {/* Summary pills */}
        {!isLoading && transactions && transactions.length > 0 && (() => {
          const totalIn  = transactions.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
          const totalOut = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
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
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
            </div>
          ) : transactions && transactions.length > 0 ? (
            <ul className="divide-y divide-border">
              {transactions.map((tx) => {
                const isIncome = tx.type === "income";
                return (
                  <li
                    key={tx.id}
                    className={`flex items-center gap-3 px-4 py-3.5 transition-colors ${
                      isIncome ? "bg-green-50/60 hover:bg-green-50" : "bg-red-50/40 hover:bg-red-50"
                    }`}
                  >
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                      isIncome ? "bg-green-100 text-green-600" : "bg-red-100 text-red-500"
                    }`}>
                      <CategoryIcon category={tx.category} isIncome={isIncome} />
                    </div>

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

                    <div className={`flex items-center gap-0.5 font-bold text-base shrink-0 ${
                      isIncome ? "text-green-600" : "text-red-500"
                    }`}>
                      {isIncome ? <TrendingUp className="w-4 h-4 mr-0.5" /> : <TrendingDown className="w-4 h-4 mr-0.5" />}
                      {isIncome ? "+" : "−"}
                      {formatCurrency(tx.amount, tx.currency)}
                    </div>

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
              <Button className="rounded-xl gap-2 mt-2" onClick={() => setShowModal(true)}>
                <Plus className="w-4 h-4" />
                Ajouter une transaction
              </Button>
            </div>
          )}
        </div>
      </div>

      {showModal && <AddTransactionModal onClose={() => setShowModal(false)} />}
    </Layout>
  );
}
