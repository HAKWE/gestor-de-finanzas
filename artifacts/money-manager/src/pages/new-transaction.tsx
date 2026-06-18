import { useState } from "react";
import { Layout } from "../components/layout";
import { Input } from "@/components/ui/input";
import {
  useCreateTransaction,
  getListTransactionsQueryKey,
  getGetDashboardSummaryQueryKey,
  getGetWeeklySummaryQueryKey,
} from "@workspace/api-client-react";
import { queryClient } from "../lib/queryClient";
import { useLocation, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import {
  TrendingUp, TrendingDown, ShoppingBag, Scissors, Package, Car,
  Smartphone, Utensils, Home, HelpCircle, Phone, Sparkles,
  LayoutGrid, CalendarDays, StickyNote, Plus, Loader2, ArrowLeft, CheckCircle2,
} from "lucide-react";

/* ─── Design tokens ─── */
const ORANGE      = "#f97316";
const ORANGE_LIGHT = "#fff7ed";
const ORANGE_MID  = "#ffedd5";
const BORDER      = "#e5e7eb";
const TEXT        = "#111827";
const MUTED       = "#6b7280";
const LABEL       = "#374151";

const CATEGORIES = [
  { label: "Venta de producto",    Icon: ShoppingBag },
  { label: "Servicio / consulta",  Icon: Scissors    },
  { label: "Compra de inventario", Icon: Package     },
  { label: "Transporte",           Icon: Car         },
  { label: "Alimentación",         Icon: Utensils    },
  { label: "Alquiler",             Icon: Home        },
  { label: "Ingreso Mercado Pago", Icon: Smartphone  },
  { label: "Teléfono",             Icon: Phone       },
  { label: "Belleza / Estética",   Icon: Sparkles    },
  { label: "Varios",               Icon: LayoutGrid  },
  { label: "Otro",                 Icon: HelpCircle  },
];

const PAYMENT_METHODS = ["Mercado Pago", "Nequi", "OXXO Pay", "Efectivo", "Tarjeta", "Otro"];

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
      e.amount = "Monto inválido";
    if (!form.category)      e.category      = "Elige una categoría";
    if (!form.paymentMethod) e.paymentMethod = "Elige un método de pago";
    if (!form.date)          e.date          = "Fecha requerida";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    createTx.mutate(
      {
        data: {
          type: form.type, amount: Number(form.amount), currency: "COP",
          category: form.category, paymentMethod: form.paymentMethod,
          referenceNote: form.referenceNote || undefined, date: form.date,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "✓ Transacción guardada" });
          queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetWeeklySummaryQueryKey() });
          setLocation("/transactions");
        },
        onError: () =>
          toast({ title: "Error", description: "No se pudo guardar", variant: "destructive" }),
      }
    );
  };

  return (
    <Layout>
      {/* ── Scoped keyframe animations ── */}
      <style>{`
        @keyframes ntFadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .nt-form { animation: ntFadeUp 0.35s cubic-bezier(.22,.68,0,1.2) both; }
        .nt-cat  { transition: transform 0.13s, box-shadow 0.13s, background 0.13s, border-color 0.13s, color 0.13s; }
        .nt-cat:active  { transform: scale(0.94); }
        .nt-chip { transition: transform 0.13s, box-shadow 0.13s, background 0.13s, border-color 0.13s, color 0.13s; }
        .nt-chip:active { transform: scale(0.93); }
        .nt-type { transition: transform 0.13s, background 0.13s, border-color 0.13s, color 0.13s, box-shadow 0.13s; }
        .nt-type:active { transform: scale(0.96); }
        .nt-submit { transition: transform 0.12s, background 0.15s, box-shadow 0.15s; }
        .nt-submit:not(:disabled):hover  { box-shadow: 0 8px 22px rgba(249,115,22,0.45); transform: translateY(-2px); }
        .nt-submit:not(:disabled):active { transform: scale(0.97); box-shadow: none; }
        @media (max-width: 480px) {
          .nt-form { padding-left: 2px !important; padding-right: 2px !important; }
          .nt-form h1 { font-size: 20px !important; margin-bottom: 18px !important; }
          .nt-sections { gap: 18px !important; }
          .nt-cat  { padding: 9px 10px !important; }
          .nt-grid { gap: 7px !important; }
        }
      `}</style>

      <div
        className="nt-form"
        style={{ maxWidth: 560, margin: "0 auto", width: "100%", paddingBottom: 48, boxSizing: "border-box" }}
      >
        {/* Back */}
        <Link href="/transactions">
          <button className="nt-type" style={{
            display: "flex", alignItems: "center", gap: 6, background: "none",
            border: "none", cursor: "pointer", color: MUTED, fontSize: 14,
            marginBottom: 24, padding: 0, fontFamily: "inherit",
          }}>
            <ArrowLeft size={15} /> Volver a transacciones
          </button>
        </Link>

        <h1 style={{ fontSize: 26, fontWeight: 700, color: TEXT, marginBottom: 28, letterSpacing: "-0.02em" }}>
          Nouvelle transaction
        </h1>

        <div className="nt-sections" style={{ display: "flex", flexDirection: "column", gap: 24 }}>

          {/* ── 1 · Type ── */}
          <section>
            <SectionLabel>Type</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {([
                { val: "income"  as const, label: "Ingreso", Icon: TrendingUp   },
                { val: "expense" as const, label: "Gasto",   Icon: TrendingDown },
              ] as const).map(({ val, label, Icon }) => {
                const active = form.type === val;
                return (
                  <button key={val} type="button" className="nt-type"
                    onClick={() => set("type", val)}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      padding: "15px 0", borderRadius: 14,
                      border: `2px solid ${active ? ORANGE : BORDER}`,
                      backgroundColor: active ? ORANGE : "white",
                      color: active ? "white" : MUTED,
                      fontWeight: 700, fontSize: 14, cursor: "pointer",
                      boxShadow: active ? "0 4px 16px rgba(249,115,22,0.38)" : "none",
                    }}>
                    <Icon size={18} /> {label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* ── 2 · Category grid ── */}
          <section>
            <SectionLabel>Categoría</SectionLabel>
            <div className="nt-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
              {CATEGORIES.map(({ label, Icon }) => {
                const sel = form.category === label;
                return (
                  <button key={label} type="button" className="nt-cat"
                    onClick={() => set("category", label)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "11px 12px", borderRadius: 13,
                      border: `2px solid ${sel ? ORANGE : BORDER}`,
                      backgroundColor: sel ? ORANGE : "white",
                      color: sel ? "white" : LABEL,
                      fontWeight: sel ? 700 : 400, fontSize: 13,
                      cursor: "pointer", textAlign: "left",
                      boxShadow: sel
                        ? "0 4px 14px rgba(249,115,22,0.38)"
                        : "0 1px 3px rgba(0,0,0,0.06)",
                    }}>
                    {/* Icon bubble */}
                    <span style={{
                      width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      backgroundColor: sel ? "rgba(255,255,255,0.22)" : "#f3f4f6",
                    }}>
                      <Icon size={17} color={sel ? "white" : MUTED} />
                    </span>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.3 }}>
                      {label}
                    </span>
                    {sel && (
                      <CheckCircle2 size={14} color="white" style={{ marginLeft: "auto", flexShrink: 0, opacity: 0.9 }} />
                    )}
                  </button>
                );
              })}
            </div>
            {errors.category && <ErrorMsg>{errors.category}</ErrorMsg>}
          </section>

          {/* ── 3 · Amount ── */}
          <section>
            <SectionLabel>Monto</SectionLabel>
            <div style={{ position: "relative" }}>
              <Input
                type="number" min="0" placeholder="0"
                value={form.amount}
                onChange={e => set("amount", e.target.value)}
                style={{
                  fontSize: 24, fontWeight: 700, height: 60, paddingRight: 72,
                  borderRadius: 14, letterSpacing: "-0.01em",
                  borderColor: errors.amount ? "#ef4444" : BORDER,
                  boxShadow: errors.amount ? "0 0 0 3px rgba(239,68,68,0.12)" : "none",
                }}
              />
              <span style={{
                position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)",
                fontSize: 13, fontWeight: 700, color: MUTED, letterSpacing: "0.04em",
              }}>COP</span>
            </div>
            {errors.amount && <ErrorMsg>{errors.amount}</ErrorMsg>}
          </section>

          {/* ── 4 · Payment method ── */}
          <section>
            <SectionLabel>Método de pago</SectionLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {PAYMENT_METHODS.map(pm => {
                const sel = form.paymentMethod === pm;
                return (
                  <button key={pm} type="button" className="nt-chip"
                    onClick={() => set("paymentMethod", pm)}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "10px 18px", borderRadius: 999,
                      border: `2px solid ${sel ? ORANGE : BORDER}`,
                      backgroundColor: sel ? ORANGE : "white",
                      color: sel ? "white" : LABEL,
                      fontWeight: sel ? 700 : 500, fontSize: 13,
                      cursor: "pointer",
                      boxShadow: sel ? `0 3px 12px rgba(249,115,22,0.35)` : "none",
                    }}>
                    {sel && <CheckCircle2 size={13} color="white" />}
                    {pm}
                  </button>
                );
              })}
            </div>
            {errors.paymentMethod && <ErrorMsg>{errors.paymentMethod}</ErrorMsg>}
          </section>

          {/* ── 5 · Date ── */}
          <section>
            <p style={{
              fontSize: 13, fontWeight: 600, color: LABEL, marginBottom: 8, marginTop: 0,
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <CalendarDays size={14} color={MUTED} /> Date
            </p>
            <Input
              type="date" value={form.date}
              onChange={e => set("date", e.target.value)}
              style={{ height: 46, borderRadius: 12, borderColor: errors.date ? "#ef4444" : BORDER }}
            />
            {errors.date && <ErrorMsg>{errors.date}</ErrorMsg>}
          </section>

          {/* ── 6 · Note ── */}
          <section>
            <p style={{
              fontSize: 13, fontWeight: 600, color: LABEL, marginBottom: 8, marginTop: 0,
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <StickyNote size={14} color={MUTED} />
              Nota / Referencia
              <span style={{ fontWeight: 400, color: MUTED }}>(opcional)</span>
            </p>
            <textarea
              placeholder="Cliente, motivo, número de recibo..."
              value={form.referenceNote}
              onChange={e => set("referenceNote", e.target.value)}
              rows={2}
              style={{
                width: "100%", boxSizing: "border-box",
                borderRadius: 12, border: `1px solid ${BORDER}`,
                padding: "11px 14px", fontSize: 14, resize: "none",
                outline: "none", fontFamily: "inherit", color: TEXT,
                lineHeight: 1.5,
              }}
            />
          </section>

          {/* ── Submit ── */}
          <button
            type="button" className="nt-submit"
            onClick={handleSubmit}
            disabled={createTx.isPending}
            style={{
              width: "100%", height: 58, borderRadius: 16, border: "none",
              backgroundColor: createTx.isPending ? "#fdba74" : ORANGE,
              color: "white", fontSize: 16, fontWeight: 700, cursor: createTx.isPending ? "default" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: "0 4px 16px rgba(249,115,22,0.30)",
              letterSpacing: "0.01em",
            }}
          >
            {createTx.isPending
              ? <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
              : <Plus size={20} />}
            Guardar transacción
          </button>

        </div>
      </div>
    </Layout>
  );
}

/* ── Small helpers ── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 10, marginTop: 0 }}>
      {children}
    </p>
  );
}

function ErrorMsg({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ color: "#ef4444", fontSize: 12, marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
      {children}
    </p>
  );
}
