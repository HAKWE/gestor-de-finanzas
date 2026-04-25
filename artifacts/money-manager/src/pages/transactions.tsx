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
  Plus, TrendingUp, TrendingDown, Trash2, UploadCloud, Pencil,
  ShoppingBag, Scissors, Package, Car, Smartphone, Utensils,
  Home, Zap, HelpCircle, Wallet, ArrowUpRight, ArrowDownRight,
  X, Loader2, CalendarDays, StickyNote, Phone, Sparkles, LayoutGrid,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/* ────────────────────────────────────────────────────────────
   CATEGORIES – icon map
──────────────────────────────────────────────────────────── */
const CATEGORIES: { label: string; Icon: React.ElementType }[] = [
  { label: "Vente produit",      Icon: ShoppingBag },
  { label: "Service coiffeuse",  Icon: Scissors    },
  { label: "Achat stock",        Icon: Package     },
  { label: "Transport",          Icon: Car         },
  { label: "Alimentation",       Icon: Utensils    },
  { label: "Loyer",              Icon: Home        },
  { label: "Revenu Orange Money",Icon: Smartphone  },
  { label: "Téléphone",          Icon: Phone       },
  { label: "Beauté/Coiffure",    Icon: Sparkles    },
  { label: "Divers",             Icon: LayoutGrid  },
  { label: "Autre",              Icon: HelpCircle  },
];

/* icon for the transaction list rows */
const LIST_ICON_MAP: Record<string, React.ElementType> = {
  "Vente produit":       ShoppingBag,
  "Service coiffeuse":   Scissors,
  "Service coiffure":    Scissors,
  "Achat stock":         Package,
  "Transport":           Car,
  "Alimentation":        Utensils,
  "Nourriture":          Utensils,
  "Loyer":               Home,
  "Revenu Orange Money": Smartphone,
  "Orange Money reçu":   Smartphone,
  "Wave reçu":           Smartphone,
  "MTN MoMo reçu":       Smartphone,
  "Téléphone":           Phone,
  "Beauté/Coiffure":     Sparkles,
  "Divers":              LayoutGrid,
  "Eau/Électricité":     Zap,
  "Autre":               HelpCircle,
};

function ListCategoryIcon({ category, isIncome }: { category: string; isIncome: boolean }) {
  const Icon = LIST_ICON_MAP[category] ?? (isIncome ? ArrowUpRight : ArrowDownRight);
  return <Icon className="w-5 h-5" />;
}

const PAYMENT_METHOD_COLORS: Record<string, string> = {
  "Orange Money": "bg-orange-100 text-orange-700 border-orange-200",
  "Wave":         "bg-blue-100 text-blue-700 border-blue-200",
  "MTN MoMo":     "bg-yellow-100 text-yellow-700 border-yellow-200",
  "Espèces":      "bg-gray-100 text-gray-700 border-gray-200",
  "Autre":        "bg-slate-100 text-slate-700 border-slate-200",
};

const PAYMENT_METHODS = ["Orange Money", "Wave", "MTN MoMo", "Espèces", "Autre"];

/* ────────────────────────────────────────────────────────────
   MODAL
──────────────────────────────────────────────────────────── */
interface FormState {
  type: "income" | "expense";
  amount: string;
  category: string;
  paymentMethod: string;
  referenceNote: string;
  date: string;
}

function defaultForm(): FormState {
  return {
    type: "income",
    amount: "",
    category: "",
    paymentMethod: "",
    referenceNote: "",
    date: new Date().toISOString().split("T")[0],
  };
}

function AddTransactionModal({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const createTx = useCreateTransaction();
  const [form, setForm] = useState<FormState>(defaultForm());
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const validate = () => {
    const e: typeof errors = {};
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0)
      e.amount = "Montant invalide";
    if (!form.category)      e.category      = "Choisissez une catégorie";
    if (!form.paymentMethod) e.paymentMethod = "Choisissez un moyen de paiement";
    if (!form.date)          e.date          = "Date requise";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    createTx.mutate(
      { data: { type: form.type, amount: Number(form.amount), currency: "XOF",
                category: form.category, paymentMethod: form.paymentMethod,
                referenceNote: form.referenceNote || undefined, date: form.date } },
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
  const ORANGE = "#f97316";

  return (
    /* ── Backdrop ── */
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.55)",
      }}
    >
      {/* ── Dialog ── */}
      <div style={{
        width: "100%", maxWidth: 480,
        height: "92vh",
        borderRadius: "24px 24px 0 0",
        backgroundColor: "white",
        display: "flex", flexDirection: "column",
        boxShadow: "0 -4px 32px rgba(0,0,0,0.2)",
        overflow: "hidden",
      }}>

        {/* Header */}
        <div style={{
          flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 20px 16px",
          borderBottom: "1px solid #e5e7eb",
        }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: "#111" }}>
            Nouvelle transaction
          </span>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "#f3f4f6", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <X size={16} color="#6b7280" />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div style={{
          flex: "1 1 auto",
          minHeight: 0,
          overflowY: "scroll",
          WebkitOverflowScrolling: "touch",
          padding: "20px 20px 8px",
          display: "flex", flexDirection: "column", gap: 20,
        }}>

          {/* 1 · Type toggle */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { val: "income"  as const, label: "Revenu",  Icon: TrendingUp,   activeColor: "#22c55e" },
              { val: "expense" as const, label: "Dépense", Icon: TrendingDown, activeColor: "#ef4444" },
            ].map(({ val, label, Icon, activeColor }) => {
              const active = form.type === val;
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => set("type", val)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    padding: "14px 0",
                    borderRadius: 14,
                    border: `2px solid ${active ? activeColor : "#e5e7eb"}`,
                    backgroundColor: active ? activeColor : "white",
                    color: active ? "white" : "#6b7280",
                    fontWeight: 600, fontSize: 14, cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <Icon size={16} />
                  {label}
                </button>
              );
            })}
          </div>

          {/* 2 · Category grid – RIGHT AFTER the toggle so it's immediately visible */}
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 10 }}>
              Catégorie
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {CATEGORIES.map(({ label, Icon }) => {
                const selected = form.category === label;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => set("category", label)}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: `2px solid ${selected ? ORANGE : "#e5e7eb"}`,
                      backgroundColor: selected ? "#fff7ed" : "white",
                      color: selected ? ORANGE : "#374151",
                      fontWeight: selected ? 600 : 400,
                      fontSize: 13,
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.15s",
                    }}
                  >
                    <Icon size={16} style={{ flexShrink: 0, color: selected ? ORANGE : "#6b7280" }} />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
            {errors.category && (
              <p style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>{errors.category}</p>
            )}
          </div>

          {/* 3 · Amount */}
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>Montant</p>
            <div style={{ position: "relative" }}>
              <Input
                type="number"
                min="0"
                placeholder="0"
                value={form.amount}
                onChange={(e) => set("amount", e.target.value)}
                style={{ fontSize: 20, fontWeight: 700, height: 56, paddingRight: 64, borderRadius: 12 }}
              />
              <span style={{
                position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                fontSize: 13, fontWeight: 600, color: "#9ca3af",
              }}>
                FCFA
              </span>
            </div>
            {errors.amount && (
              <p style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>{errors.amount}</p>
            )}
          </div>

          {/* 4 · Payment method */}
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 10 }}>
              Moyen de paiement
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {PAYMENT_METHODS.map((pm) => {
                const selected = form.paymentMethod === pm;
                return (
                  <button
                    key={pm}
                    type="button"
                    onClick={() => set("paymentMethod", pm)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 999,
                      border: `2px solid ${selected ? ORANGE : "#e5e7eb"}`,
                      backgroundColor: selected ? ORANGE : "white",
                      color: selected ? "white" : "#374151",
                      fontWeight: 500, fontSize: 13, cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {pm}
                  </button>
                );
              })}
            </div>
            {errors.paymentMethod && (
              <p style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>{errors.paymentMethod}</p>
            )}
          </div>

          {/* 5 · Date */}
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8,
                        display: "flex", alignItems: "center", gap: 6 }}>
              <CalendarDays size={14} color="#9ca3af" /> Date
            </p>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
              style={{ height: 44, borderRadius: 12 }}
            />
          </div>

          {/* 6 · Note */}
          <div style={{ paddingBottom: 8 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8,
                        display: "flex", alignItems: "center", gap: 6 }}>
              <StickyNote size={14} color="#9ca3af" />
              Note / Référence
              <span style={{ fontWeight: 400, color: "#9ca3af" }}>(optionnel)</span>
            </p>
            <textarea
              placeholder="Client, motif, numéro de reçu..."
              value={form.referenceNote}
              onChange={(e) => set("referenceNote", e.target.value)}
              rows={2}
              style={{
                width: "100%", boxSizing: "border-box",
                borderRadius: 12, border: "1px solid #e5e7eb",
                padding: "10px 12px", fontSize: 14, resize: "none",
                outline: "none", fontFamily: "inherit",
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{
          flexShrink: 0,
          padding: "12px 20px 20px",
          borderTop: "1px solid #e5e7eb",
          backgroundColor: "white",
        }}>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={createTx.isPending}
            style={{
              width: "100%", height: 56,
              borderRadius: 14, border: "none",
              backgroundColor: createTx.isPending ? "#fdba74" : ORANGE,
              color: "white",
              fontSize: 16, fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "background-color 0.15s",
            }}
          >
            {createTx.isPending
              ? <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
              : <Plus size={20} />}
            Enregistrer la transaction
          </button>
        </div>

      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   MAIN PAGE
──────────────────────────────────────────────────────────── */
export default function Transactions() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { data: transactions, isLoading } = useListTransactions();
  const deleteTx = useDeleteTransaction();
  const [showModal, setShowModal] = useState(false);

  const formatCurrency = (amount: number | string, currency: string) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency", currency: currency || "XOF", maximumFractionDigits: 0,
    }).format(Number(amount));

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit", month: "short", year: "numeric",
    });

  const handleDelete = (id: number) => {
    if (!confirm("Supprimer cette transaction ?")) return;
    deleteTx.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Transaction supprimée" });
        queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
      },
      onError: () => toast({ title: "Erreur", variant: "destructive" }),
    });
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
          const totalIn  = transactions.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
          const totalOut = transactions.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
          const currency = transactions[0]?.currency || "XOF";
          const net = totalIn - totalOut;
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
              <div className={`rounded-2xl p-4 text-center border ${net >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                <p className={`text-xs font-medium mb-1 ${net >= 0 ? "text-green-700" : "text-red-700"}`}>Solde net</p>
                <p className={`text-lg font-bold ${net >= 0 ? "text-green-600" : "text-red-500"}`}>
                  {net >= 0 ? "+" : "−"}{formatCurrency(Math.abs(net), currency)}
                </p>
              </div>
            </div>
          );
        })()}

        {/* Transaction list */}
        <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1,2,3,4].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
            </div>
          ) : transactions && transactions.length > 0 ? (
            <ul className="divide-y divide-border">
              {transactions.map(tx => {
                const isIncome = tx.type === "income";
                return (
                  <li key={tx.id} className={`flex items-center gap-3 px-4 py-3.5 transition-colors ${
                    isIncome ? "bg-green-50/60 hover:bg-green-50" : "bg-red-50/40 hover:bg-red-50"
                  }`}>
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                      isIncome ? "bg-green-100 text-green-600" : "bg-red-100 text-red-500"
                    }`}>
                      <ListCategoryIcon category={tx.category} isIncome={isIncome} />
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
                      {isIncome ? "+" : "−"}{formatCurrency(tx.amount, tx.currency)}
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-1">
                      <Link href={`/transactions/${tx.id}/edit`}>
                        <Button variant="ghost" size="icon" className="w-8 h-8 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/80">
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="icon"
                        className="w-8 h-8 rounded-xl text-muted-foreground hover:text-red-500 hover:bg-red-50"
                        onClick={() => handleDelete(tx.id)} disabled={deleteTx.isPending}>
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
                <p className="font-semibold">Aucune transaction</p>
                <p className="text-sm text-muted-foreground mt-1">Commencez par enregistrer votre première entrée ou sortie.</p>
              </div>
              <Button className="rounded-xl gap-2 mt-2" onClick={() => setShowModal(true)}>
                <Plus className="w-4 h-4" /> Ajouter une transaction
              </Button>
            </div>
          )}
        </div>
      </div>

      {showModal && <AddTransactionModal onClose={() => setShowModal(false)} />}
    </Layout>
  );
}
