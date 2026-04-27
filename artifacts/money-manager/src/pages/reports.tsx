import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Layout } from "../components/layout";
import {
  TrendingUp, TrendingDown, Wallet, Hash,
  ChevronLeft, ChevronRight, FileDown, Crown, Loader2, BarChart2, Plus,
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
const PIE_COLORS = [
  "#f97316","#3b82f6","#a855f7","#eab308",
  "#ec4899","#14b8a6","#f43f5e","#84cc16","#06b6d4","#8b5cf6",
];
const MONTHS_FR = [
  "Janvier","Février","Mars","Avril","Mai","Juin",
  "Juillet","Août","Septembre","Octobre","Novembre","Décembre",
];

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency", currency, maximumFractionDigits: 0,
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

function trend(current: number, prev: number): { pct: number; up: boolean; isNew: boolean; noData: boolean } {
  if (prev === 0 && current === 0) return { pct: 0, up: true, isNew: false, noData: true };
  if (prev === 0) return { pct: 100, up: true, isNew: true, noData: false };
  const pct = Math.round(((current - prev) / prev) * 100);
  return { pct: Math.abs(pct), up: pct >= 0, isNew: false, noData: false };
}

function TrendBadge({ current, prev, positiveIsGood = true }: {
  current: number; prev: number; positiveIsGood?: boolean;
}) {
  const t = trend(current, prev);
  if (t.noData) return null;
  if (t.isNew) {
    return (
      <span style={{ fontSize: 11, fontWeight: 600, color: GREEN }}>
        ✦ Nouveau
      </span>
    );
  }
  const color = t.up === positiveIsGood ? GREEN : RED;
  return (
    <span style={{ fontSize: 11, fontWeight: 600, color, display: "flex", alignItems: "center", gap: 2 }}>
      {t.up ? "↑" : "↓"} {t.pct}% vs mois préc.
    </span>
  );
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
interface PrevSummary {
  totalIncome: number; totalExpenses: number; netBalance: number; transactionCount: number;
}
interface ReportData {
  summary: Summary;
  prevSummary: PrevSummary;
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

function SummaryCard({ label, value, trend: trendNode, color, icon }: {
  label: string; value: string; trend?: React.ReactNode; color: string; icon: React.ReactNode;
}) {
  return (
    <div style={{
      background: "#fff", borderRadius: 16, padding: "18px 16px",
      border: "1px solid #f0ede9", boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      display: "flex", flexDirection: "column", gap: 6,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>{label}</span>
        <span style={{
          width: 34, height: 34, borderRadius: 10,
          background: color + "18", display: "flex", alignItems: "center", justifyContent: "center",
          color, flexShrink: 0,
        }}>{icon}</span>
      </div>
      <div style={{ fontSize: 21, fontWeight: 800, color: "#111", lineHeight: 1.1 }}>{value}</div>
      {trendNode && <div style={{ minHeight: 16 }}>{trendNode}</div>}
    </div>
  );
}

function StarterTeaser() {
  return (
    <div style={{
      background: "#fff7ed", border: `1.5px solid ${ORANGE}`,
      borderRadius: 16, padding: "32px 24px",
      display: "flex", flexDirection: "column", alignItems: "center",
      gap: 12, textAlign: "center",
    }}>
      <Crown style={{ color: ORANGE, width: 36, height: 36 }} />
      <div style={{ fontWeight: 700, fontSize: 18, color: "#111" }}>
        Débloquez les Rapports complets
      </div>
      <div style={{ color: "#6b7280", fontSize: 14, maxWidth: 320 }}>
        Les graphiques détaillés, le tableau des transactions et l'export PDF branded
        sont disponibles exclusivement avec l'abonnement <strong>Pro</strong>.
      </div>
      <Link href="/pricing">
        <button style={{
          background: ORANGE, color: "#fff", border: "none", borderRadius: 12,
          padding: "12px 28px", fontWeight: 700, fontSize: 14, cursor: "pointer", marginTop: 4,
        }}>
          Voir les offres →
        </button>
      </Link>
    </div>
  );
}

function EmptyState({ month, year }: { month: number; year: number }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", gap: 16, padding: "56px 24px",
      background: "#fff", borderRadius: 20, border: "1px dashed #e5e7eb",
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: 20,
        background: "#fff7ed", display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <BarChart2 style={{ width: 36, height: 36, color: ORANGE }} />
      </div>
      <div style={{ fontWeight: 700, fontSize: 18, color: "#111", textAlign: "center" }}>
        Aucune transaction en {MONTHS_FR[month - 1]} {year}
      </div>
      <div style={{ color: "#6b7280", fontSize: 14, textAlign: "center", maxWidth: 300 }}>
        Commencez à enregistrer vos revenus et dépenses pour voir vos rapports ici.
      </div>
      <Link href="/transactions/new">
        <button style={{
          background: ORANGE, color: "#fff", border: "none", borderRadius: 12,
          padding: "11px 24px", fontWeight: 700, fontSize: 13, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <Plus style={{ width: 15, height: 15 }} />
          Ajouter une transaction
        </button>
      </Link>
    </div>
  );
}

function drawPdfLogo(doc: any, x: number, y: number, size: number) {
  const cx = x + size / 2;
  const cy = y + size / 2;
  const r = size / 2;
  const dr = size * 0.3;

  doc.setFillColor(249, 115, 22);
  doc.circle(cx, cy, r, "F");

  doc.setFillColor(250, 204, 21);
  doc.lines([[dr, dr], [-dr, dr], [-dr, -dr]], cx, cy - dr, [1, 1], "F", true);

  doc.setFillColor(20, 83, 45);
  doc.circle(cx, cy, size * 0.145, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(size * 0.32);
  doc.setFont("helvetica", "bold");
  doc.text("MM", cx, cy + size * 0.1, { align: "center" });
}

export default function Reports() {
  const plan = useSubscription();
  const isPro = plan === "pro";
  const isPayingNotPro = plan === "starter" || plan === "paid";

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [chartView, setChartView] = useState<"day" | "week">("week");
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setLoading(true);
    setData(null);
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
    if (isCurrentMonth) return;
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
  const currency = data?.summary.currency ?? "XOF";
  const s = data?.summary;
  const p = data?.prevSummary;
  const isEmpty = s && s.transactionCount === 0;

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
      const pageH = doc.internal.pageSize.getHeight();

      const headerH = 28;
      doc.setFillColor(249, 115, 22);
      doc.rect(0, 0, pageW, headerH, "F");

      drawPdfLogo(doc, 10, 5, 18);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(15);
      doc.setFont("helvetica", "bold");
      doc.text("MobileMoney Manager", 33, 13);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("La gestion financière des entrepreneurs africains", 33, 19);
      doc.setFontSize(9);
      doc.text(`Rapport — ${MONTHS_FR[month - 1]} ${year}`, pageW - 12, 14, { align: "right" });
      doc.text(`Généré le ${new Date().toLocaleDateString("fr-FR")}`, pageW - 12, 20, { align: "right" });

      doc.setTextColor(20, 20, 20);
      doc.setFontSize(17);
      doc.setFont("helvetica", "bold");
      doc.text(`Rapport Financier`, 14, 40);
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(120, 120, 120);
      doc.text(`${MONTHS_FR[month - 1]} ${year}`, 14, 47);

      doc.setDrawColor(249, 115, 22);
      doc.setLineWidth(0.8);
      doc.line(14, 50, pageW - 14, 50);

      const summaryBody: any[] = [
        ["Total Revenus", { content: fmt(s?.totalIncome ?? 0, currency), styles: { textColor: [34, 197, 94], fontStyle: "bold" } }],
        ["Total Dépenses", { content: fmt(s?.totalExpenses ?? 0, currency), styles: { textColor: [239, 68, 68], fontStyle: "bold" } }],
        [
          { content: "Solde Net", styles: { fontStyle: "bold" } },
          {
            content: fmt(s?.netBalance ?? 0, currency),
            styles: {
              textColor: (s?.netBalance ?? 0) >= 0 ? [249, 115, 22] : [239, 68, 68],
              fontStyle: "bold",
              fontSize: 11,
            }
          }
        ],
        ["Nombre de transactions", { content: String(s?.transactionCount ?? 0), styles: { fontStyle: "bold" } }],
      ];

      autoTable(doc as any, {
        startY: 54,
        head: [["Indicateur", "Valeur"]],
        body: summaryBody,
        headStyles: { fillColor: [249, 115, 22], textColor: 255, fontStyle: "bold", fontSize: 10 },
        bodyStyles: { fontSize: 10, cellPadding: 4.5 },
        alternateRowStyles: { fillColor: [255, 247, 237] },
        columnStyles: { 1: { halign: "right" } },
        tableLineColor: [240, 237, 233],
        tableLineWidth: 0.3,
      });

      const afterSummary = (doc as any).lastAutoTable?.finalY ?? 100;

      if (data.categories.length > 0) {
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(20, 20, 20);
        doc.text("Répartition par catégorie", 14, afterSummary + 12);

        autoTable(doc as any, {
          startY: afterSummary + 16,
          head: [["Catégorie", "Type", "Montant", "Part"]],
          body: data.categories.slice(0, 12).map(c => [
            c.category,
            c.type === "income" ? "Revenu" : "Dépense",
            {
              content: fmt(c.total, currency),
              styles: { textColor: c.type === "income" ? [34, 197, 94] : [239, 68, 68], fontStyle: "bold" },
            },
            `${c.percentage}%`,
          ]),
          headStyles: { fillColor: [249, 115, 22], textColor: 255, fontStyle: "bold", fontSize: 9 },
          bodyStyles: { fontSize: 9, cellPadding: 3 },
          alternateRowStyles: { fillColor: [255, 247, 237] },
          columnStyles: { 2: { halign: "right" }, 3: { halign: "center" } },
          tableLineColor: [240, 237, 233],
          tableLineWidth: 0.3,
        });
      }

      if (data.transactions.length > 0) {
        doc.addPage();

        doc.setFillColor(249, 115, 22);
        doc.rect(0, 0, pageW, 16, "F");
        drawPdfLogo(doc, 10, 2, 12);
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(`Transactions — ${MONTHS_FR[month - 1]} ${year}`, 27, 11);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text(`${data.transactions.length} opération(s)`, pageW - 12, 10, { align: "right" });

        autoTable(doc as any, {
          startY: 22,
          head: [["Date", "Catégorie", "Référence", "Moyen paiement", "Montant"]],
          body: data.transactions.map(t => [
            fmtDate(t.date),
            t.category,
            t.referenceNote ?? "—",
            t.paymentMethod,
            {
              content: (t.type === "income" ? "+" : "−") + fmt(t.amount, currency),
              styles: {
                textColor: t.type === "income" ? [34, 197, 94] : [239, 68, 68],
                fontStyle: "bold",
              },
            },
          ]),
          headStyles: { fillColor: [249, 115, 22], textColor: 255, fontStyle: "bold", fontSize: 8 },
          bodyStyles: { fontSize: 7.5, cellPadding: 2.5 },
          alternateRowStyles: { fillColor: [255, 247, 237] },
          columnStyles: { 4: { halign: "right" } },
          tableLineColor: [240, 237, 233],
          tableLineWidth: 0.3,
        });
      }

      const pageCount = (doc.internal as any).getNumberOfPages?.() ?? 1;
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setDrawColor(240, 237, 233);
        doc.setLineWidth(0.4);
        doc.line(14, pageH - 12, pageW - 14, pageH - 12);
        doc.setFontSize(7.5);
        doc.setTextColor(160, 160, 160);
        doc.setFont("helvetica", "normal");
        doc.text(
          `MobileMoney Manager  •  Rapport ${MONTHS_FR[month - 1]} ${year}  •  Page ${i} / ${pageCount}`,
          pageW / 2, pageH - 7, { align: "center" }
        );
      }

      doc.save(`rapport-${year}-${String(month).padStart(2, "0")}.pdf`);
    } finally {
      setExporting(false);
    }
  }

  return (
    <Layout>
      <div style={{ display: "flex", flexDirection: "column", gap: 22, paddingBottom: 32 }}>

        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: "#111" }}>Rapports</h1>
            <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 14 }}>
              Analysez votre activité financière mois par mois.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#f9fafb", borderRadius: 12, padding: "4px 4px" }}>
              <button
                onClick={prevMonth}
                style={{
                  background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8,
                  padding: "7px 9px", cursor: "pointer", display: "flex", alignItems: "center",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                }}
              >
                <ChevronLeft style={{ width: 15, height: 15 }} />
              </button>
              <div style={{
                fontWeight: 700, fontSize: 14, color: "#111",
                minWidth: 130, textAlign: "center", padding: "0 8px",
              }}>
                {MONTHS_FR[month - 1]} {year}
              </div>
              <button
                onClick={nextMonth}
                disabled={isCurrentMonth}
                style={{
                  background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8,
                  padding: "7px 9px", cursor: isCurrentMonth ? "default" : "pointer",
                  opacity: isCurrentMonth ? 0.35 : 1, display: "flex", alignItems: "center",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                }}
              >
                <ChevronRight style={{ width: 15, height: 15 }} />
              </button>
            </div>

            {isPro && (
              <button
                onClick={exportPDF}
                disabled={exporting || loading || !data || isEmpty}
                style={{
                  background: exporting ? "#fb923c" : ORANGE,
                  color: "#fff", border: "none", borderRadius: 11,
                  padding: "10px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 7,
                  opacity: (loading || !data || isEmpty) && !exporting ? 0.5 : 1,
                  boxShadow: "0 2px 10px rgba(249,115,22,0.35)",
                  transition: "background 0.15s",
                }}
              >
                {exporting
                  ? <Loader2 style={{ width: 15, height: 15, animation: "spin 0.8s linear infinite" }} />
                  : <FileDown style={{ width: 15, height: 15 }} />
                }
                {exporting ? "Génération…" : "Exporter en PDF"}
              </button>
            )}
          </div>
        </div>

        {loading || plan === null ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 220 }}>
            <Loader2 style={{ width: 38, height: 38, color: ORANGE, animation: "spin 0.8s linear infinite" }} />
          </div>
        ) : (
          <>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))",
              gap: 12,
            }}>
              <SummaryCard
                label="Total Revenus"
                value={s ? fmt(s.totalIncome, currency) : "—"}
                trend={p !== undefined ? <TrendBadge current={s?.totalIncome ?? 0} prev={p.totalIncome} positiveIsGood /> : undefined}
                color={GREEN}
                icon={<TrendingUp style={{ width: 17, height: 17 }} />}
              />
              <SummaryCard
                label="Total Dépenses"
                value={s ? fmt(s.totalExpenses, currency) : "—"}
                trend={p !== undefined ? <TrendBadge current={s?.totalExpenses ?? 0} prev={p.totalExpenses} positiveIsGood={false} /> : undefined}
                color={RED}
                icon={<TrendingDown style={{ width: 17, height: 17 }} />}
              />
              <SummaryCard
                label="Solde Net"
                value={s ? fmt(s.netBalance, currency) : "—"}
                trend={p !== undefined ? <TrendBadge current={s?.netBalance ?? 0} prev={p.netBalance} positiveIsGood /> : undefined}
                color={s && s.netBalance >= 0 ? ORANGE : RED}
                icon={<Wallet style={{ width: 17, height: 17 }} />}
              />
              <SummaryCard
                label="Transactions"
                value={s ? String(s.transactionCount) : "—"}
                trend={p !== undefined ? <TrendBadge current={s?.transactionCount ?? 0} prev={p.transactionCount} positiveIsGood /> : undefined}
                color="#6366f1"
                icon={<Hash style={{ width: 17, height: 17 }} />}
              />
            </div>

            {!isPro && (
              <StarterTeaser />
            )}

            {isPro && isEmpty && (
              <EmptyState month={month} year={year} />
            )}

            {isPro && !isEmpty && (
              <>
                <div style={{
                  background: "#fff", borderRadius: 16, border: "1px solid #f0ede9",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)", padding: "20px 18px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
                    <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "#111" }}>
                      Revenus vs Dépenses
                    </h2>
                    <div style={{ display: "flex", gap: 5 }}>
                      {(["week", "day"] as const).map(v => (
                        <button
                          key={v}
                          onClick={() => setChartView(v)}
                          style={{
                            padding: "5px 11px", borderRadius: 8, fontSize: 12, fontWeight: 600,
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
                          contentStyle={{ borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 12 }}
                        />
                        <Bar dataKey="income" name="income" fill={GREEN} radius={[4, 4, 0, 0]} maxBarSize={28} />
                        <Bar dataKey="expenses" name="expenses" fill={RED} radius={[4, 4, 0, 0]} maxBarSize={28} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div style={{ display: "flex", gap: 20, marginTop: 10, justifyContent: "center" }}>
                    {[{ color: GREEN, label: "Revenus" }, { color: RED, label: "Dépenses" }].map(l => (
                      <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#6b7280" }}>
                        <div style={{ width: 10, height: 10, borderRadius: 3, background: l.color }} />
                        {l.label}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
                  <div style={{
                    background: "#fff", borderRadius: 16, border: "1px solid #f0ede9",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.06)", padding: "20px 18px",
                  }}>
                    <h2 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 16px", color: "#111" }}>
                      Top catégories
                    </h2>

                    {topCats.length === 0 ? (
                      <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: 14 }}>
                        Aucune donnée
                      </div>
                    ) : (
                      <>
                        <div style={{ height: 180, marginBottom: 16 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={topCats}
                                cx="50%" cy="50%"
                                innerRadius={50} outerRadius={76}
                                paddingAngle={2}
                                dataKey="total"
                                stroke="none"
                              >
                                {topCats.map((_, i) => (
                                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip
                                formatter={(v: number, _name: string, props: any) => [
                                  fmt(v, currency),
                                  props.payload?.category,
                                ]}
                                contentStyle={{ borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 12 }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {topCats.map((c, i) => (
                            <div key={`${c.category}-${c.type}`} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{
                                width: 12, height: 12, borderRadius: 4,
                                background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0,
                              }} />
                              <span style={{
                                flex: 1, fontSize: 12, color: "#374151",
                                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                              }}>
                                {c.category}
                              </span>
                              <span style={{
                                borderRadius: 999, padding: "2px 7px", fontSize: 10, fontWeight: 700,
                                background: PIE_COLORS[i % PIE_COLORS.length] + "20",
                                color: PIE_COLORS[i % PIE_COLORS.length],
                                flexShrink: 0,
                              }}>
                                {c.percentage}%
                              </span>
                              <span style={{ fontSize: 12, fontWeight: 700, color: "#111", minWidth: 56, textAlign: "right" }}>
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
                    <h2 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 16px", color: "#111" }}>
                      Performance du mois
                    </h2>
                    {!s ? (
                      <div style={{ color: "#9ca3af", fontSize: 14, textAlign: "center", padding: "36px 0" }}>
                        Aucune donnée
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {[
                          { label: "Revenus", value: s.totalIncome, color: GREEN },
                          { label: "Dépenses", value: s.totalExpenses, color: RED },
                        ].map(row => (
                          <div key={row.label}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                              <span style={{ fontSize: 12, color: "#6b7280" }}>{row.label}</span>
                              <span style={{ fontSize: 12, fontWeight: 700, color: row.color }}>
                                {fmt(row.value, currency)}
                              </span>
                            </div>
                            <div style={{ background: "#f3f4f6", borderRadius: 999, height: 8, overflow: "hidden" }}>
                              <div style={{
                                background: row.color, height: "100%", borderRadius: 999,
                                width: `${s.totalIncome + s.totalExpenses > 0
                                  ? (row.value / (s.totalIncome + s.totalExpenses)) * 100
                                  : 0}%`,
                                transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
                              }} />
                            </div>
                          </div>
                        ))}

                        <div style={{
                          background: s.netBalance >= 0 ? "#f0fdf4" : "#fef2f2",
                          borderRadius: 12, padding: "14px 16px",
                          border: `1.5px solid ${s.netBalance >= 0 ? "#bbf7d0" : "#fecaca"}`,
                          marginTop: 2,
                        }}>
                          <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>Solde net du mois</div>
                          <div style={{ fontSize: 22, fontWeight: 800, color: s.netBalance >= 0 ? "#16a34a" : RED }}>
                            {fmt(s.netBalance, currency)}
                          </div>
                          {p && p.netBalance !== 0 && (
                            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 3 }}>
                              <TrendBadge current={s.netBalance} prev={p.netBalance} positiveIsGood />
                            </div>
                          )}
                          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                            {s.netBalance >= 0 ? "Bénéfice ce mois-ci 🎉" : "Déficit ce mois-ci"}
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
                  <div style={{
                    padding: "16px 20px", borderBottom: "1px solid #f0ede9",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                  }}>
                    <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "#111" }}>
                      Toutes les transactions
                    </h2>
                    <span style={{ fontSize: 12, color: "#6b7280", background: "#f9fafb", borderRadius: 8, padding: "3px 10px" }}>
                      {data?.transactions.length ?? 0} op.
                    </span>
                  </div>

                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: "#f9fafb" }}>
                          {["Date", "Catégorie", "Moyen de paiement", "Montant"].map(h => (
                            <th key={h} style={{
                              padding: "10px 16px", textAlign: "left",
                              fontSize: 11, fontWeight: 600, color: "#6b7280",
                              whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: "0.04em",
                            }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(data?.transactions ?? []).map((tx, i) => (
                          <tr key={tx.id} style={{
                            borderTop: "1px solid #f5f3f0",
                            background: i % 2 === 0 ? "#fff" : "#fafafa",
                          }}>
                            <td style={{ padding: "10px 16px", color: "#374151", whiteSpace: "nowrap", fontSize: 12 }}>
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
                            <td style={{ padding: "10px 16px" }}>
                              <span style={{
                                fontSize: 11, background: "#f3f4f6", color: "#374151",
                                borderRadius: 6, padding: "3px 8px", whiteSpace: "nowrap",
                              }}>
                                {tx.paymentMethod}
                              </span>
                            </td>
                            <td style={{ padding: "10px 16px", textAlign: "right", whiteSpace: "nowrap" }}>
                              <span style={{ fontWeight: 700, color: tx.type === "income" ? GREEN : RED }}>
                                {tx.type === "income" ? "+" : "−"}{fmt(tx.amount, tx.currency)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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
