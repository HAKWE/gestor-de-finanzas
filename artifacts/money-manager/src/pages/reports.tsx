import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Layout } from "../components/layout";
import {
  TrendingUp, TrendingDown, Wallet, Hash,
  ChevronLeft, ChevronRight, FileDown, Lock, Crown, Loader2,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const ORANGE = "#f97316";
const GREEN = "#22c55e";
const RED = "#ef4444";
const PIE_COLORS = ["#f97316","#3b82f6","#a855f7","#eab308","#ec4899","#14b8a6","#f43f5e","#84cc16","#06b6d4","#8b5cf6"];
const MONTHS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const PAYMENT_LABELS: Record<string, string> = {
  "orange_money": "Orange Money",
  "wave": "Wave",
  "mtn_momo": "MTN MoMo",
  "cash": "Espèces",
  "other": "Autre",
};

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency", currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function fmtShort(amount: number) {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}k`;
  return String(Math.round(amount));
}

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function useSubscription() {
  const [plan, setPlan] = useState<string | null>(null);
  useEffect(() => {
    fetch(`${basePath}/api/stripe/subscription-status`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => setPlan(d?.plan ?? "free"))
      .catch(() => setPlan("free"));
  }, []);
  return plan;
}

interface DayData { date: string; income: number; expenses: number }
interface CatData { category: string; total: number; type: string; percentage: number; count: number }
interface TxData {
  id: number; date: string; type: string; category: string;
  amount: number; paymentMethod: string; referenceNote?: string | null; currency: string;
}
interface Summary {
  totalIncome: number; totalExpenses: number; netBalance: number;
  transactionCount: number; currency: string;
}
interface ReportData {
  summary: Summary;
  daily: DayData[];
  categories: CatData[];
  transactions: TxData[];
}

function groupByWeek(daily: DayData[]): { label: string; income: number; expenses: number }[] {
  const weeks: { label: string; income: number; expenses: number }[] = [];
  let wi = 1;
  for (let i = 0; i < daily.length; i += 7) {
    const chunk = daily.slice(i, i + 7);
    weeks.push({
      label: `Sem. ${wi++}`,
      income: chunk.reduce((s, d) => s + d.income, 0),
      expenses: chunk.reduce((s, d) => s + d.expenses, 0),
    });
  }
  return weeks;
}

function SummaryCard({ label, value, sub, color, icon }: {
  label: string; value: string; sub?: string; color: string; icon: React.ReactNode;
}) {
  return (
    <div style={{
      background: "#fff", borderRadius: 16, padding: "20px 18px",
      border: "1px solid #f0ede9", boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      display: "flex", flexDirection: "column", gap: 8,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>{label}</span>
        <span style={{
          width: 36, height: 36, borderRadius: 10,
          background: color + "18", display: "flex", alignItems: "center", justifyContent: "center",
          color,
        }}>{icon}</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: "#111" }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "#9ca3af" }}>{sub}</div>}
    </div>
  );
}

function BlurLock({ label, href }: { label: string; href: string }) {
  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 10,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      background: "rgba(255,255,255,0.7)", backdropFilter: "blur(6px)",
      borderRadius: 16, gap: 12,
    }}>
      <div style={{
        background: ORANGE, borderRadius: 999, width: 44, height: 44,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Crown style={{ color: "#fff", width: 20, height: 20 }} />
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#111", textAlign: "center", maxWidth: 220 }}>
        Fonctionnalité Pro
      </div>
      <div style={{ fontSize: 12, color: "#6b7280", textAlign: "center", maxWidth: 220 }}>
        {label}
      </div>
      <Link href={href}>
        <button style={{
          background: ORANGE, color: "#fff", border: "none", borderRadius: 10,
          padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer",
        }}>
          Passer à Pro →
        </button>
      </Link>
    </div>
  );
}

function StarterTeaser() {
  return (
    <div style={{
      background: "#fff7ed", border: `1.5px solid ${ORANGE}`,
      borderRadius: 16, padding: "24px 20px",
      display: "flex", flexDirection: "column", alignItems: "center",
      gap: 12, textAlign: "center",
    }}>
      <Crown style={{ color: ORANGE, width: 32, height: 32 }} />
      <div style={{ fontWeight: 700, fontSize: 17, color: "#111" }}>
        Débloquez les Rapports complets
      </div>
      <div style={{ color: "#6b7280", fontSize: 14, maxWidth: 320 }}>
        Les graphiques, tableaux et l'export PDF sont disponibles exclusivement avec l'abonnement Pro.
      </div>
      <Link href="/pricing">
        <button style={{
          background: ORANGE, color: "#fff", border: "none", borderRadius: 12,
          padding: "12px 28px", fontWeight: 700, fontSize: 14, cursor: "pointer",
          marginTop: 4,
        }}>
          Voir les offres
        </button>
      </Link>
    </div>
  );
}

export default function Reports() {
  const plan = useSubscription();
  const isPro = plan === "pro";
  const isStarter = plan === "starter" || plan === "paid";

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [chartView, setChartView] = useState<"day" | "week">("week");
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${basePath}/api/reports/monthly?year=${year}&month=${month}`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [year, month]);

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
    if (isCurrentMonth) return;
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
  const currency = data?.summary.currency ?? "XOF";
  const s = data?.summary;

  const chartData = chartView === "week"
    ? groupByWeek(data?.daily ?? [])
    : (data?.daily ?? []).map(d => ({
        label: new Date(d.date + "T00:00:00").getDate().toString(),
        income: d.income,
        expenses: d.expenses,
      }));

  const topCats = (data?.categories ?? []).slice(0, 8);

  async function exportPDF() {
    if (!data || !isPro) return;
    setExporting(true);
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();

      doc.setFillColor(249, 115, 22);
      doc.rect(0, 0, pageW, 22, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("MobileMoney Manager", 14, 14);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Rapport — ${MONTHS_FR[month - 1]} ${year}`, pageW - 14, 14, { align: "right" });

      doc.setTextColor(30, 30, 30);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(`Rapport Financier — ${MONTHS_FR[month - 1]} ${year}`, 14, 34);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text(`Généré le ${new Date().toLocaleDateString("fr-FR")}`, 14, 41);

      autoTable(doc as any, {
        startY: 48,
        head: [["Indicateur", "Montant"]],
        body: [
          ["Total Revenus", fmt(s?.totalIncome ?? 0, currency)],
          ["Total Dépenses", fmt(s?.totalExpenses ?? 0, currency)],
          ["Solde Net", fmt(s?.netBalance ?? 0, currency)],
          ["Nombre de transactions", String(s?.transactionCount ?? 0)],
        ],
        headStyles: { fillColor: [249, 115, 22], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [255, 247, 237] },
        styles: { fontSize: 10, cellPadding: 4 },
        columnStyles: { 1: { halign: "right" } },
      });

      const afterSummary = (doc as any).lastAutoTable?.finalY ?? 90;

      if (data.categories.length > 0) {
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 30, 30);
        doc.text("Répartition par catégorie", 14, afterSummary + 10);

        autoTable(doc as any, {
          startY: afterSummary + 14,
          head: [["Catégorie", "Type", "Montant", "%"]],
          body: data.categories.slice(0, 10).map(c => [
            c.category,
            c.type === "income" ? "Revenu" : "Dépense",
            fmt(c.total, currency),
            `${c.percentage}%`,
          ]),
          headStyles: { fillColor: [249, 115, 22], textColor: 255, fontStyle: "bold" },
          alternateRowStyles: { fillColor: [255, 247, 237] },
          styles: { fontSize: 9, cellPadding: 3 },
          columnStyles: { 2: { halign: "right" }, 3: { halign: "center" } },
        });
      }

      if (data.transactions.length > 0) {
        doc.addPage();

        doc.setFillColor(249, 115, 22);
        doc.rect(0, 0, pageW, 14, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Transactions du mois", 14, 10);

        autoTable(doc as any, {
          startY: 20,
          head: [["Date", "Catégorie", "Moyen paiement", "Type", "Montant"]],
          body: data.transactions.map(t => [
            fmtDate(t.date),
            t.category,
            t.paymentMethod,
            t.type === "income" ? "Revenu" : "Dépense",
            fmt(t.amount, currency),
          ]),
          headStyles: { fillColor: [249, 115, 22], textColor: 255, fontStyle: "bold" },
          alternateRowStyles: { fillColor: [255, 247, 237] },
          styles: { fontSize: 8, cellPadding: 2.5 },
          columnStyles: {
            4: { halign: "right" },
            3: { halign: "center" },
          },
          didParseCell: (data: any) => {
            if (data.section === "body" && data.column.index === 4) {
              const raw = data.row.raw[3];
              data.cell.styles.textColor = raw === "Revenu" ? [34, 197, 94] : [239, 68, 68];
            }
          },
        });
      }

      const pageCount = (doc.internal as any).getNumberOfPages?.() ?? 1;
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.setFont("helvetica", "normal");
        doc.text(
          `MobileMoney Manager — ${MONTHS_FR[month - 1]} ${year} — Page ${i}/${pageCount}`,
          pageW / 2, doc.internal.pageSize.getHeight() - 8,
          { align: "center" }
        );
      }

      doc.save(`rapport-${year}-${String(month).padStart(2, "0")}.pdf`);
    } finally {
      setExporting(false);
    }
  }

  return (
    <Layout>
      <div style={{ display: "flex", flexDirection: "column", gap: 24, paddingBottom: 32 }}>

        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: "#111" }}>Rapports</h1>
            <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 14 }}>
              Analysez votre activité financière en détail.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={prevMonth}
              style={{
                background: "#f3f4f6", border: "none", borderRadius: 8, padding: "8px 10px",
                cursor: "pointer", display: "flex", alignItems: "center",
              }}
            >
              <ChevronLeft style={{ width: 16, height: 16 }} />
            </button>
            <div style={{
              background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10,
              padding: "8px 16px", fontWeight: 700, fontSize: 14, color: "#111",
              minWidth: 140, textAlign: "center",
            }}>
              {MONTHS_FR[month - 1]} {year}
            </div>
            <button
              onClick={nextMonth}
              disabled={isCurrentMonth}
              style={{
                background: isCurrentMonth ? "#f9fafb" : "#f3f4f6",
                border: "none", borderRadius: 8, padding: "8px 10px",
                cursor: isCurrentMonth ? "default" : "pointer",
                opacity: isCurrentMonth ? 0.4 : 1,
                display: "flex", alignItems: "center",
              }}
            >
              <ChevronRight style={{ width: 16, height: 16 }} />
            </button>

            {isPro && (
              <button
                onClick={exportPDF}
                disabled={exporting || loading || !data}
                style={{
                  background: ORANGE, color: "#fff", border: "none", borderRadius: 10,
                  padding: "9px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 7,
                  opacity: (exporting || loading || !data) ? 0.6 : 1,
                  boxShadow: "0 2px 8px rgba(249,115,22,0.3)",
                }}
              >
                {exporting ? <Loader2 style={{ width: 15, height: 15, animation: "spin 1s linear infinite" }} /> : <FileDown style={{ width: 15, height: 15 }} />}
                Exporter en PDF
              </button>
            )}
          </div>
        </div>

        {loading || plan === null ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200 }}>
            <Loader2 style={{ width: 36, height: 36, color: ORANGE, animation: "spin 1s linear infinite" }} />
          </div>
        ) : (
          <>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 14,
            }}>
              <SummaryCard
                label="Total Revenus"
                value={s ? fmt(s.totalIncome, currency) : "—"}
                sub={`ce mois`}
                color={GREEN}
                icon={<TrendingUp style={{ width: 18, height: 18 }} />}
              />
              <SummaryCard
                label="Total Dépenses"
                value={s ? fmt(s.totalExpenses, currency) : "—"}
                sub={`ce mois`}
                color={RED}
                icon={<TrendingDown style={{ width: 18, height: 18 }} />}
              />
              <SummaryCard
                label="Solde Net"
                value={s ? fmt(s.netBalance, currency) : "—"}
                sub={s && s.netBalance >= 0 ? "Bénéfice" : "Déficit"}
                color={s && s.netBalance >= 0 ? ORANGE : RED}
                icon={<Wallet style={{ width: 18, height: 18 }} />}
              />
              <SummaryCard
                label="Transactions"
                value={s ? String(s.transactionCount) : "—"}
                sub="opérations"
                color="#6366f1"
                icon={<Hash style={{ width: 18, height: 18 }} />}
              />
            </div>

            {!isPro && !isStarter && (
              <StarterTeaser />
            )}

            {!isPro && isStarter && (
              <StarterTeaser />
            )}

            {isPro && (
              <>
                <div style={{
                  background: "#fff", borderRadius: 16, border: "1px solid #f0ede9",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)", padding: "20px 18px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#111" }}>
                      Revenus vs Dépenses
                    </h2>
                    <div style={{ display: "flex", gap: 6 }}>
                      {(["week", "day"] as const).map(v => (
                        <button
                          key={v}
                          onClick={() => setChartView(v)}
                          style={{
                            padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                            border: "none", cursor: "pointer",
                            background: chartView === v ? ORANGE : "#f3f4f6",
                            color: chartView === v ? "#fff" : "#6b7280",
                          }}
                        >
                          {v === "week" ? "Par semaine" : "Par jour"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {chartData.every(d => d.income === 0 && d.expenses === 0) ? (
                    <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: 14 }}>
                      Aucune donnée pour cette période
                    </div>
                  ) : (
                    <div style={{ height: 240 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barGap={3}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                          <XAxis
                            dataKey="label" axisLine={false} tickLine={false}
                            tick={{ fontSize: 11, fill: "#9ca3af" }}
                          />
                          <YAxis
                            axisLine={false} tickLine={false}
                            tick={{ fontSize: 11, fill: "#9ca3af" }}
                            tickFormatter={fmtShort}
                            width={44}
                          />
                          <Tooltip
                            formatter={(v: number, name: string) => [fmt(v, currency), name === "income" ? "Revenus" : "Dépenses"]}
                            labelFormatter={(l) => `${l}`}
                            contentStyle={{ borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 12 }}
                          />
                          <Bar dataKey="income" name="income" fill={GREEN} radius={[4, 4, 0, 0]} maxBarSize={28} />
                          <Bar dataKey="expenses" name="expenses" fill={RED} radius={[4, 4, 0, 0]} maxBarSize={28} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 16, marginTop: 12, justifyContent: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#6b7280" }}>
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: GREEN }} />
                      Revenus
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#6b7280" }}>
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: RED }} />
                      Dépenses
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
                  <div style={{
                    background: "#fff", borderRadius: 16, border: "1px solid #f0ede9",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.06)", padding: "20px 18px",
                  }}>
                    <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 16px", color: "#111" }}>
                      Top catégories
                    </h2>

                    {topCats.length === 0 ? (
                      <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: 14 }}>
                        Aucune donnée
                      </div>
                    ) : (
                      <>
                        <div style={{ height: 190 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={topCats}
                                cx="50%" cy="50%"
                                innerRadius={52} outerRadius={78}
                                paddingAngle={3}
                                dataKey="total"
                              >
                                {topCats.map((_, i) => (
                                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip
                                formatter={(v: number) => fmt(v, currency)}
                                contentStyle={{ borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 12 }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 4 }}>
                          {topCats.map((c, i) => (
                            <div key={`${c.category}-${c.type}`} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{ width: 10, height: 10, borderRadius: 3, background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                              <span style={{ fontSize: 12, color: "#374151", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {c.category}
                              </span>
                              <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: "auto" }}>{c.percentage}%</span>
                              <span style={{ fontSize: 12, fontWeight: 600, color: "#111", minWidth: 60, textAlign: "right" }}>
                                {fmtShort(c.total)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  <div style={{
                    background: "#fff", borderRadius: 16, border: "1px solid #f0ede9",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.06)", padding: "20px 18px",
                  }}>
                    <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 16px", color: "#111" }}>
                      Performance du mois
                    </h2>
                    {!s || s.transactionCount === 0 ? (
                      <div style={{ color: "#9ca3af", fontSize: 14, textAlign: "center", padding: "40px 0" }}>
                        Aucune donnée pour cette période
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={{ fontSize: 12, color: "#6b7280" }}>Revenus</span>
                            <span style={{ fontSize: 12, fontWeight: 600, color: GREEN }}>{fmt(s.totalIncome, currency)}</span>
                          </div>
                          <div style={{ background: "#f3f4f6", borderRadius: 999, height: 8, overflow: "hidden" }}>
                            <div style={{
                              background: GREEN, height: "100%", borderRadius: 999,
                              width: `${s.totalIncome + s.totalExpenses > 0 ? (s.totalIncome / (s.totalIncome + s.totalExpenses)) * 100 : 0}%`,
                              transition: "width 0.8s ease",
                            }} />
                          </div>
                        </div>
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={{ fontSize: 12, color: "#6b7280" }}>Dépenses</span>
                            <span style={{ fontSize: 12, fontWeight: 600, color: RED }}>{fmt(s.totalExpenses, currency)}</span>
                          </div>
                          <div style={{ background: "#f3f4f6", borderRadius: 999, height: 8, overflow: "hidden" }}>
                            <div style={{
                              background: RED, height: "100%", borderRadius: 999,
                              width: `${s.totalIncome + s.totalExpenses > 0 ? (s.totalExpenses / (s.totalIncome + s.totalExpenses)) * 100 : 0}%`,
                              transition: "width 0.8s ease",
                            }} />
                          </div>
                        </div>
                        <div style={{
                          background: s.netBalance >= 0 ? "#f0fdf4" : "#fef2f2",
                          borderRadius: 12, padding: "14px 16px",
                          border: `1.5px solid ${s.netBalance >= 0 ? "#bbf7d0" : "#fecaca"}`,
                          marginTop: 4,
                        }}>
                          <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Solde net du mois</div>
                          <div style={{ fontSize: 22, fontWeight: 800, color: s.netBalance >= 0 ? "#16a34a" : RED }}>
                            {fmt(s.netBalance, currency)}
                          </div>
                          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                            {s.netBalance >= 0 ? "Vous êtes en bénéfice ce mois-ci 🎉" : "Vous êtes en déficit ce mois-ci"}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{
                  background: "#fff", borderRadius: 16, border: "1px solid #f0ede9",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)", overflow: "hidden",
                }}>
                  <div style={{ padding: "18px 20px", borderBottom: "1px solid #f0ede9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#111" }}>
                      Toutes les transactions
                    </h2>
                    <span style={{ fontSize: 13, color: "#6b7280" }}>
                      {data?.transactions.length ?? 0} opération{(data?.transactions.length ?? 0) !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {!data?.transactions.length ? (
                    <div style={{ padding: 40, textAlign: "center", color: "#9ca3af", fontSize: 14 }}>
                      Aucune transaction pour cette période
                    </div>
                  ) : (
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                        <thead>
                          <tr style={{ background: "#f9fafb" }}>
                            {["Date", "Catégorie", "Moyen de paiement", "Montant"].map(h => (
                              <th key={h} style={{
                                padding: "10px 16px", textAlign: "left", fontSize: 12,
                                fontWeight: 600, color: "#6b7280", whiteSpace: "nowrap",
                              }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {data.transactions.map((tx, i) => (
                            <tr key={tx.id} style={{
                              borderTop: "1px solid #f0ede9",
                              background: i % 2 === 0 ? "#fff" : "#fafafa",
                            }}>
                              <td style={{ padding: "10px 16px", color: "#374151", whiteSpace: "nowrap" }}>
                                {fmtDate(tx.date)}
                              </td>
                              <td style={{ padding: "10px 16px" }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                  <span style={{ color: "#111", fontWeight: 500 }}>{tx.category}</span>
                                  {tx.referenceNote && (
                                    <span style={{ color: "#9ca3af", fontSize: 11 }}>{tx.referenceNote}</span>
                                  )}
                                </div>
                              </td>
                              <td style={{ padding: "10px 16px", color: "#6b7280" }}>
                                {tx.paymentMethod}
                              </td>
                              <td style={{ padding: "10px 16px", textAlign: "right", whiteSpace: "nowrap" }}>
                                <span style={{
                                  fontWeight: 700,
                                  color: tx.type === "income" ? GREEN : RED,
                                }}>
                                  {tx.type === "income" ? "+" : "−"}{fmt(tx.amount, tx.currency)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </Layout>
  );
}
