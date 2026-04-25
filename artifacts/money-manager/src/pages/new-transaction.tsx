import { useState } from "react";
import { Layout } from "../components/layout";
import { Input } from "@/components/ui/input";
import { useCreateTransaction, getListTransactionsQueryKey, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { queryClient } from "../lib/queryClient";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import {
  TrendingUp, TrendingDown, ShoppingBag, Scissors, Package, Car,
  Smartphone, Utensils, Home, HelpCircle, Phone, Sparkles,
  LayoutGrid, CalendarDays, StickyNote, Plus, Loader2, ArrowLeft,
} from "lucide-react";
import { Link } from "wouter";

const ORANGE = "#f97316";

const CATEGORIES = [
  { label: "Vente produit",       Icon: ShoppingBag },
  { label: "Service coiffeuse",   Icon: Scissors    },
  { label: "Achat stock",         Icon: Package     },
  { label: "Transport",           Icon: Car         },
  { label: "Alimentation",        Icon: Utensils    },
  { label: "Loyer",               Icon: Home        },
  { label: "Revenu Orange Money", Icon: Smartphone  },
  { label: "Téléphone",           Icon: Phone       },
  { label: "Beauté/Coiffure",     Icon: Sparkles    },
  { label: "Divers",              Icon: LayoutGrid  },
  { label: "Autre",               Icon: HelpCircle  },
];

const PAYMENT_METHODS = ["Orange Money", "Wave", "MTN MoMo", "Espèces", "Autre"];

interface FormState {
  type: "income" | "expense";
  amount: string;
  category: string;
  paymentMethod: string;
  referenceNote: string;
  date: string;
}

export default function NewTransaction() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createTx = useCreateTransaction();

  const [form, setForm] = useState<FormState>({
    type: "income",
    amount: "",
    category: "",
    paymentMethod: "",
    referenceNote: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm(f => ({ ...f, [key]: val }));

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
          setLocation("/transactions");
        },
        onError: () => {
          toast({ title: "Erreur", description: "Impossible d'enregistrer", variant: "destructive" });
        },
      }
    );
  };

  const isIncome = form.type === "income";

  return (
    <Layout>
      <div style={{ maxWidth: 560, margin: "0 auto", paddingBottom: 40 }}>

        {/* Back link */}
        <Link href="/transactions">
          <button style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "none", border: "none", cursor: "pointer",
            color: "#6b7280", fontSize: 14, marginBottom: 20, padding: 0,
          }}>
            <ArrowLeft size={16} /> Retour aux transactions
          </button>
        </Link>

        <h1 style={{ fontSize: 26, fontWeight: 700, color: "#111", marginBottom: 24 }}>
          Nouvelle transaction
        </h1>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

          {/* 1 · Type */}
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 10 }}>Type</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {([
                { val: "income"  as const, label: "Revenu",  Icon: TrendingUp,   color: "#22c55e" },
                { val: "expense" as const, label: "Dépense", Icon: TrendingDown, color: "#ef4444" },
              ] as const).map(({ val, label, Icon, color }) => {
                const active = form.type === val;
                return (
                  <button key={val} type="button" onClick={() => set("type", val)} style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    padding: "14px 0", borderRadius: 14,
                    border: `2px solid ${active ? color : "#e5e7eb"}`,
                    backgroundColor: active ? color : "white",
                    color: active ? "white" : "#6b7280",
                    fontWeight: 600, fontSize: 14, cursor: "pointer",
                    transition: "all 0.15s",
                  }}>
                    <Icon size={16} />{label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2 · Category grid */}
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 10 }}>
              Catégorie
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {CATEGORIES.map(({ label, Icon }) => {
                const selected = form.category === label;
                return (
                  <button key={label} type="button" onClick={() => set("category", label)} style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "11px 12px", borderRadius: 12,
                    border: `2px solid ${selected ? ORANGE : "#e5e7eb"}`,
                    backgroundColor: selected ? "#fff7ed" : "white",
                    color: selected ? ORANGE : "#374151",
                    fontWeight: selected ? 600 : 400,
                    fontSize: 13, cursor: "pointer", textAlign: "left",
                    transition: "all 0.15s",
                  }}>
                    <Icon size={16} style={{ flexShrink: 0, color: selected ? ORANGE : "#6b7280" }} />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
            {errors.category && (
              <p style={{ color: "#ef4444", fontSize: 12, marginTop: 6 }}>{errors.category}</p>
            )}
          </div>

          {/* 3 · Amount */}
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>Montant</p>
            <div style={{ position: "relative" }}>
              <Input
                type="number" min="0" placeholder="0"
                value={form.amount}
                onChange={e => set("amount", e.target.value)}
                style={{ fontSize: 22, fontWeight: 700, height: 56, paddingRight: 70, borderRadius: 12,
                         borderColor: errors.amount ? "#ef4444" : undefined }}
              />
              <span style={{
                position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                fontSize: 13, fontWeight: 600, color: "#9ca3af",
              }}>FCFA</span>
            </div>
            {errors.amount && (
              <p style={{ color: "#ef4444", fontSize: 12, marginTop: 6 }}>{errors.amount}</p>
            )}
          </div>

          {/* 4 · Payment method */}
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 10 }}>
              Moyen de paiement
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {PAYMENT_METHODS.map(pm => {
                const selected = form.paymentMethod === pm;
                return (
                  <button key={pm} type="button" onClick={() => set("paymentMethod", pm)} style={{
                    padding: "9px 18px", borderRadius: 999,
                    border: `2px solid ${selected ? ORANGE : "#e5e7eb"}`,
                    backgroundColor: selected ? ORANGE : "white",
                    color: selected ? "white" : "#374151",
                    fontWeight: 500, fontSize: 13, cursor: "pointer",
                    transition: "all 0.15s",
                  }}>
                    {pm}
                  </button>
                );
              })}
            </div>
            {errors.paymentMethod && (
              <p style={{ color: "#ef4444", fontSize: 12, marginTop: 6 }}>{errors.paymentMethod}</p>
            )}
          </div>

          {/* 5 · Date */}
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8,
                        display: "flex", alignItems: "center", gap: 6 }}>
              <CalendarDays size={14} color="#9ca3af" /> Date
            </p>
            <Input type="date" value={form.date} onChange={e => set("date", e.target.value)}
              style={{ height: 44, borderRadius: 12, borderColor: errors.date ? "#ef4444" : undefined }} />
            {errors.date && <p style={{ color: "#ef4444", fontSize: 12, marginTop: 6 }}>{errors.date}</p>}
          </div>

          {/* 6 · Note */}
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8,
                        display: "flex", alignItems: "center", gap: 6 }}>
              <StickyNote size={14} color="#9ca3af" />
              Note / Référence
              <span style={{ fontWeight: 400, color: "#9ca3af" }}>(optionnel)</span>
            </p>
            <textarea
              placeholder="Client, motif, numéro de reçu..."
              value={form.referenceNote}
              onChange={e => set("referenceNote", e.target.value)}
              rows={2}
              style={{
                width: "100%", boxSizing: "border-box",
                borderRadius: 12, border: "1px solid #e5e7eb",
                padding: "10px 12px", fontSize: 14, resize: "none",
                outline: "none", fontFamily: "inherit", color: "#374151",
              }}
            />
          </div>

          {/* Submit */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={createTx.isPending}
            style={{
              width: "100%", height: 56, borderRadius: 14, border: "none",
              backgroundColor: createTx.isPending ? "#fdba74" : ORANGE,
              color: "white", fontSize: 16, fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            {createTx.isPending
              ? <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
              : <Plus size={20} />}
            Enregistrer la transaction
          </button>

        </div>
      </div>
    </Layout>
  );
}
