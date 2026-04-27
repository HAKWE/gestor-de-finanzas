import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { useLanguage } from "../lib/language-context";
import { Layout } from "../components/layout";
import { useGetDashboardSummary, useGetWeeklySummary, useListTransactions } from "@workspace/api-client-react";
import {
  Wallet, ArrowDownRight, ArrowUpRight, Hash,
  Zap, Star, Crown, X, Plus, Sparkles, Receipt,
  TrendingUp, TrendingDown,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
} from "recharts";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const BANNER_DURATION = 8000;
const ORANGE = "#f97316";
const GREEN = "#22c55e";
const RED = "#ef4444";

function fmtShort(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
  return String(Math.round(v));
}

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short",
  });
}

function ConfettiCanvas({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!active || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const colors = ["#f97316","#4ade80","#60a5fa","#facc15","#c084fc","#f472b6","#34d399","#fb923c"];
    type P = { x:number; y:number; r:number; vx:number; vy:number; color:string; rotation:number; rotV:number };
    const particles: P[] = Array.from({ length: 160 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * canvas.height * 0.6,
      r: Math.random() * 7 + 3,
      vx: (Math.random() - 0.5) * 3.5,
      vy: Math.random() * 3.5 + 1.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * Math.PI * 2,
      rotV: (Math.random() - 0.5) * 0.15,
    }));
    let rafId: number;
    const start = Date.now();
    function draw() {
      const elapsed = Date.now() - start;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const alpha = Math.max(0, 1 - Math.max(0, elapsed - 3500) / 1500);
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.06; p.rotation += p.rotV;
        if (p.y > canvas.height + 20) { p.y = -10; p.x = Math.random() * canvas.width; }
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.roundRect(-p.r, -p.r * 0.5, p.r * 2, p.r, 2);
        ctx.fill();
        ctx.restore();
      }
      if (elapsed < 5000) rafId = requestAnimationFrame(draw);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [active]);
  if (!active) return null;
  return (
    <canvas ref={canvasRef} style={{
      position: "fixed", inset: 0, width: "100vw", height: "100vh",
      pointerEvents: "none", zIndex: 9999,
    }} />
  );
}

interface SubscriptionStatus {
  plan: "free" | "starter" | "pro" | "paid";
  planLabel: string;
  status?: string;
}

function PlanBadge({ plan, label }: { plan: string; label: string }) {
  if (plan === "free") return null;
  const isPro = plan === "pro";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "5px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700,
      backgroundColor: isPro ? ORANGE : "#fff7ed",
      color: isPro ? "white" : ORANGE,
      border: isPro ? "none" : `2px solid ${ORANGE}`,
      boxShadow: isPro ? "0 2px 8px rgba(249,115,22,0.30)" : "none",
    }}>
      {isPro ? <Crown style={{ width: 12, height: 12 }} /> : <Star style={{ width: 12, height: 12 }} />}
      {label}
    </span>
  );
}

function KpiCard({ label, value, sub, color, icon, hero }: {
  label: string; value: string; sub?: string; color: string;
  icon: React.ReactNode; hero?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  if (hero) {
    return (
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: `linear-gradient(135deg, ${color}ee 0%, ${color} 100%)`,
          borderRadius: 18, padding: "22px 20px",
          boxShadow: hovered
            ? "0 8px 28px rgba(249,115,22,0.38)"
            : "0 4px 16px rgba(249,115,22,0.25)",
          transform: hovered ? "translateY(-2px)" : "none",
          transition: "box-shadow 0.18s, transform 0.18s",
          display: "flex", flexDirection: "column", gap: 8,
          cursor: "default",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>
            {label}
          </span>
          <span style={{
            width: 36, height: 36, borderRadius: 10,
            background: "rgba(255,255,255,0.2)", display: "flex",
            alignItems: "center", justifyContent: "center", color: "#fff",
          }}>{icon}</span>
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, color: "#fff", lineHeight: 1.1 }}>{value}</div>
        {sub && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{sub}</div>}
      </div>
    );
  }
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#fff", borderRadius: 18, padding: "20px 18px",
        border: "1px solid #f0ede9",
        boxShadow: hovered
          ? "0 6px 20px rgba(0,0,0,0.10)"
          : "0 1px 4px rgba(0,0,0,0.05)",
        transform: hovered ? "translateY(-2px)" : "none",
        transition: "box-shadow 0.18s, transform 0.18s",
        display: "flex", flexDirection: "column", gap: 8, cursor: "default",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 500, letterSpacing: "0.02em" }}>{label}</span>
        <span style={{
          width: 36, height: 36, borderRadius: 10,
          background: color + "18", display: "flex",
          alignItems: "center", justifyContent: "center", color, flexShrink: 0,
        }}>{icon}</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: "#111", lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "#9ca3af" }}>{sub}</div>}
    </div>
  );
}

function KpiSkeleton() {
  return (
    <div style={{
      background: "#f3f4f6", borderRadius: 18, height: 110,
      animation: "pulse 1.5s ease-in-out infinite",
    }} />
  );
}

function ChartEmptyState() {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", height: "100%", gap: 14, padding: 24,
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 18,
        background: "#fff7ed", display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <TrendingUp style={{ width: 30, height: 30, color: ORANGE }} />
      </div>
      <div style={{ fontWeight: 700, fontSize: 15, color: "#374151", textAlign: "center" }}>
        Pas encore d'activité cette semaine
      </div>
      <div style={{ fontSize: 13, color: "#9ca3af", textAlign: "center", maxWidth: 220 }}>
        Les barres apparaîtront dès votre première transaction.
      </div>
      <Link href="/transactions/new">
        <button style={{
          background: ORANGE, color: "#fff", border: "none", borderRadius: 10,
          padding: "9px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <Plus style={{ width: 14, height: 14 }} />
          Première transaction
        </button>
      </Link>
    </div>
  );
}

function TxEmptyState() {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "44px 24px", gap: 14, textAlign: "center",
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: 22,
        background: "#fff7ed", display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Receipt style={{ width: 34, height: 34, color: ORANGE }} />
      </div>
      <div style={{ fontWeight: 700, fontSize: 17, color: "#111" }}>
        Aucune transaction pour le moment
      </div>
      <div style={{ color: "#6b7280", fontSize: 13, maxWidth: 270 }}>
        Commencez par enregistrer votre première recette ou dépense.
      </div>
      <Link href="/transactions/new">
        <button style={{
          background: ORANGE, color: "#fff", border: "none", borderRadius: 12,
          padding: "11px 22px", fontWeight: 700, fontSize: 13, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 6,
          boxShadow: "0 2px 8px rgba(249,115,22,0.30)",
        }}>
          <Plus style={{ width: 15, height: 15 }} />
          Ajouter ma première transaction
        </button>
      </Link>
    </div>
  );
}

function CustomTooltip({ active, payload, label, currency }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12,
      padding: "10px 14px", boxShadow: "0 4px 16px rgba(0,0,0,0.10)", fontSize: 13,
    }}>
      <div style={{ fontWeight: 600, color: "#374151", marginBottom: 6 }}>
        {label}
      </div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: p.fill || p.color }} />
          <span style={{ color: "#6b7280" }}>{p.name === "income" ? "Revenus" : "Dépenses"} :</span>
          <span style={{ fontWeight: 700, color: "#111" }}>
            {new Intl.NumberFormat("fr-FR", { style: "currency", currency, maximumFractionDigits: 0 }).format(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { language } = useLanguage();

  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary({
    query: { refetchInterval: 30_000, staleTime: 15_000 },
  });
  const { data: weekly, isLoading: isLoadingWeekly } = useGetWeeklySummary({
    query: { refetchInterval: 30_000, staleTime: 15_000 },
  });
  const { data: recentTxs, isLoading: isLoadingTxs } = useListTransactions(
    {},
    { query: { refetchInterval: 30_000, staleTime: 10_000 } },
  );

  const [subStatus, setSubStatus] = useState<SubscriptionStatus | null>(null);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [bannerProgress, setBannerProgress] = useState(100);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef<number>(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true" || params.get("upgraded") === "true") {
      setShowSuccessBanner(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (!showSuccessBanner) {
      if (timerRef.current) clearInterval(timerRef.current);
      setBannerProgress(100);
      return;
    }
    startRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const pct = Math.max(0, 100 - (elapsed / BANNER_DURATION) * 100);
      setBannerProgress(pct);
      if (elapsed >= BANNER_DURATION) {
        setShowSuccessBanner(false);
        clearInterval(timerRef.current!);
      }
    }, 50);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [showSuccessBanner]);

  useEffect(() => {
    fetch(`${basePath}/api/stripe/subscription-status`, { credentials: "include" })
      .then(r => r.json())
      .then(d => setSubStatus(d))
      .catch(() => setSubStatus({ plan: "free", planLabel: "Gratuit" }));
  }, []);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency", currency: summary?.currency || "XOF", maximumFractionDigits: 0,
    }).format(amount);

  const isPaid = subStatus && subStatus.plan !== "free";
  const isPro = subStatus?.plan === "pro";

  const chartData = (weekly ?? []).map(d => ({
    ...d,
    label: new Date(d.date + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "short" })
      .replace(".", ""),
  }));
  const hasChartData = chartData.some(d => (d.income || 0) + (d.expenses || 0) > 0);

  return (
    <Layout>
      <ConfettiCanvas active={showSuccessBanner} />

      <div style={{ display: "flex", flexDirection: "column", gap: 20, paddingBottom: 32 }}>

        {showSuccessBanner && (
          <div style={{
            position: "relative", overflow: "hidden", borderRadius: 20,
            background: "linear-gradient(135deg, #052e16 0%, #14532d 50%, #166534 100%)",
            padding: "0 0 4px",
            boxShadow: "0 8px 32px rgba(21,128,61,0.35)",
          }}>
            <div style={{
              position: "absolute", bottom: 0, left: 0, height: 4,
              width: `${bannerProgress}%`, backgroundColor: "#4ade80",
              borderRadius: 4, transition: "width 0.1s linear",
            }} />
            <div style={{ position: "absolute", top: 10, right: 60, fontSize: 28, opacity: 0.25, pointerEvents: "none" }}>🎊</div>
            <div style={{ position: "absolute", top: 20, right: 140, fontSize: 20, opacity: 0.20, pointerEvents: "none" }}>✨</div>
            <div style={{ padding: "22px 24px", display: "flex", alignItems: "flex-start", gap: 16 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 16, flexShrink: 0,
                background: "rgba(74,222,128,0.20)", border: "1.5px solid rgba(74,222,128,0.40)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26,
              }}>🏆</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 800, fontSize: 17, color: "#f0fdf4", margin: 0 }}>Félicitations&nbsp;! 🎉</p>
                <p style={{ fontSize: 14, color: "#86efac", margin: "5px 0 0", lineHeight: 1.5 }}>
                  {subStatus && subStatus.plan !== "free"
                    ? <>Votre abonnement <strong style={{ color: "#4ade80" }}>{subStatus.planLabel}</strong> est maintenant actif. Profitez de toutes vos fonctionnalités&nbsp;!</>
                    : <>Votre abonnement est maintenant actif. Vos nouvelles fonctionnalités sont disponibles.</>
                  }
                </p>
              </div>
              <button onClick={() => setShowSuccessBanner(false)} style={{
                background: "rgba(255,255,255,0.10)", border: "none", cursor: "pointer",
                color: "#86efac", padding: 6, borderRadius: 8, flexShrink: 0,
                display: "flex", alignItems: "center",
              }}>
                <X style={{ width: 15, height: 15 }} />
              </button>
            </div>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: "#111" }}>Tableau de bord</h1>
              {subStatus && <PlanBadge plan={subStatus.plan} label={subStatus.planLabel} />}
            </div>
            <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 14 }}>Voici le résumé de votre activité.</p>
          </div>
          <Link href="/transactions/new">
            <button style={{
              background: ORANGE, color: "#fff", border: "none", borderRadius: 12,
              padding: "10px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 8, flexShrink: 0,
              boxShadow: "0 2px 10px rgba(249,115,22,0.32)",
            }}>
              <Plus style={{ width: 17, height: 17 }} />
              <span>Ajouter</span>
            </button>
          </Link>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 12,
        }}>
          {isLoadingSummary ? (
            <><KpiSkeleton /><KpiSkeleton /><KpiSkeleton /><KpiSkeleton /></>
          ) : (
            <>
              <KpiCard
                label="Solde d'aujourd'hui"
                value={formatCurrency(summary?.todayBalance ?? 0)}
                sub="revenus − dépenses du jour"
                color={ORANGE}
                hero
                icon={<Wallet style={{ width: 18, height: 18 }} />}
              />
              <KpiCard
                label="Revenus cette semaine"
                value={formatCurrency(summary?.weekIncome ?? 0)}
                sub={`mois : ${formatCurrency(summary?.monthIncome ?? 0)}`}
                color={GREEN}
                icon={<TrendingUp style={{ width: 17, height: 17 }} />}
              />
              <KpiCard
                label="Dépenses cette semaine"
                value={formatCurrency(summary?.weekExpenses ?? 0)}
                sub={`mois : ${formatCurrency(summary?.monthExpenses ?? 0)}`}
                color={RED}
                icon={<TrendingDown style={{ width: 17, height: 17 }} />}
              />
              <KpiCard
                label="Total transactions"
                value={String(summary?.totalTransactions ?? 0)}
                sub="depuis le début"
                color="#6366f1"
                icon={<Hash style={{ width: 17, height: 17 }} />}
              />
            </>
          )}
        </div>

        <div style={{
          background: "#fff", borderRadius: 18, border: "1px solid #f0ede9",
          boxShadow: "0 1px 4px rgba(0,0,0,0.05)", overflow: "hidden",
        }}>
          <div style={{
            padding: "18px 20px 0", display: "flex",
            alignItems: "center", justifyContent: "space-between",
          }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "#111" }}>
              Activité de la semaine
            </h2>
            <div style={{ display: "flex", gap: 14 }}>
              {[{ color: GREEN, label: "Revenus" }, { color: RED, label: "Dépenses" }].map(l => (
                <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#6b7280" }}>
                  <div style={{ width: 9, height: 9, borderRadius: 3, background: l.color }} />
                  {l.label}
                </div>
              ))}
            </div>
          </div>

          <div style={{ height: 260, padding: "8px 8px 4px" }}>
            {isLoadingWeekly ? (
              <div style={{
                height: "100%", background: "#f3f4f6", borderRadius: 12,
                animation: "pulse 1.5s ease-in-out infinite",
              }} />
            ) : !hasChartData ? (
              <ChartEmptyState />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
                  barGap={4}
                  barCategoryGap="30%"
                >
                  <defs>
                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" />
                      <stop offset="100%" stopColor="#16a34a" />
                    </linearGradient>
                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f87171" />
                      <stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis
                    dataKey="label"
                    axisLine={false} tickLine={false}
                    tick={{ fontSize: 12, fill: "#9ca3af", fontWeight: 600 }}
                  />
                  <YAxis
                    axisLine={false} tickLine={false}
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    tickFormatter={fmtShort}
                    width={42}
                  />
                  <RechartsTooltip
                    content={<CustomTooltip currency={summary?.currency ?? "XOF"} />}
                    cursor={{ fill: "rgba(249,115,22,0.05)", radius: 6 } as any}
                  />
                  <Bar
                    dataKey="income"
                    name="income"
                    fill="url(#incomeGrad)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={32}
                  />
                  <Bar
                    dataKey="expenses"
                    name="expenses"
                    fill="url(#expenseGrad)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={32}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div style={{
          background: "#fff", borderRadius: 18, border: "1px solid #f0ede9",
          boxShadow: "0 1px 4px rgba(0,0,0,0.05)", overflow: "hidden",
        }}>
          <div style={{
            padding: "16px 20px", borderBottom: "1px solid #f5f3f0",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "#111" }}>
              Transactions récentes
            </h2>
            <Link href="/transactions">
              <span style={{ fontSize: 13, color: ORANGE, fontWeight: 600, cursor: "pointer" }}>
                Voir tout →
              </span>
            </Link>
          </div>

          {isLoadingTxs ? (
            <div style={{ padding: "12px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  height: 48, background: "#f3f4f6", borderRadius: 10,
                  animation: "pulse 1.5s ease-in-out infinite",
                }} />
              ))}
            </div>
          ) : !recentTxs || recentTxs.length === 0 ? (
            <TxEmptyState />
          ) : (
            <>
              <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {recentTxs.slice(0, 5).map((tx: any, i: number) => {
                  const isIncome = tx.type === "income";
                  const amount = typeof tx.amount === "string" ? parseFloat(tx.amount) : tx.amount;
                  return (
                    <li key={tx.id} style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "12px 20px",
                      borderTop: i === 0 ? "none" : "1px solid #f5f3f0",
                      transition: "background 0.12s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#fafafa")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <div style={{
                        width: 38, height: 38, borderRadius: 12, flexShrink: 0,
                        background: isIncome ? "#f0fdf4" : "#fef2f2",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {isIncome
                          ? <ArrowUpRight style={{ width: 17, height: 17, color: GREEN }} />
                          : <ArrowDownRight style={{ width: 17, height: 17, color: RED }} />
                        }
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {tx.category}
                        </p>
                        <p style={{ margin: 0, fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                          {tx.paymentMethod}
                          <span style={{ margin: "0 5px", opacity: 0.5 }}>·</span>
                          {fmtDate(tx.date)}
                        </p>
                      </div>
                      <span style={{
                        fontSize: 13, fontWeight: 700, flexShrink: 0,
                        color: isIncome ? GREEN : RED,
                      }}>
                        {isIncome ? "+" : "−"}
                        {new Intl.NumberFormat("fr-FR", {
                          style: "currency", currency: tx.currency || "XOF", maximumFractionDigits: 0,
                        }).format(amount)}
                      </span>
                    </li>
                  );
                })}
              </ul>
              {recentTxs.length > 5 && (
                <div style={{ padding: "12px 20px", borderTop: "1px solid #f5f3f0", textAlign: "center" }}>
                  <Link href="/transactions">
                    <span style={{ fontSize: 13, color: ORANGE, fontWeight: 600, cursor: "pointer" }}>
                      Voir {recentTxs.length - 5} transaction{recentTxs.length - 5 > 1 ? "s" : ""} de plus →
                    </span>
                  </Link>
                </div>
              )}
            </>
          )}
        </div>

        {!isPaid && (
          <div style={{
            borderRadius: 18, padding: "18px 20px",
            background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)",
            border: "1px solid #fed7aa",
            display: "flex", flexWrap: "wrap", alignItems: "center", gap: 14,
          }}>
            <div style={{
              width: 42, height: 42, background: ORANGE, borderRadius: 12, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Zap style={{ width: 20, height: 20, color: "#fff" }} />
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#111" }}>
                Passez à Starter ou Pro
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 13, color: "#6b7280" }}>
                Transactions illimitées, rapports avancés, et bien plus.
              </p>
            </div>
            <Link href="/pricing">
              <button style={{
                background: ORANGE, color: "#fff", border: "none", borderRadius: 10,
                padding: "9px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer",
                whiteSpace: "nowrap",
              }}>
                Voir les offres
              </button>
            </Link>
          </div>
        )}

        {isPaid && (
          <div style={{
            borderRadius: 20, overflow: "hidden",
            background: isPro
              ? "linear-gradient(135deg, #431407 0%, #7c2d12 50%, #9a3412 100%)"
              : "linear-gradient(135deg, #431407 0%, #c2410c 100%)",
            boxShadow: "0 4px 20px rgba(249,115,22,0.25)",
            padding: 22,
            display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, flexShrink: 0,
              background: "rgba(255,255,255,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {isPro
                ? <Crown style={{ width: 24, height: 24, color: "#fed7aa" }} />
                : <Sparkles style={{ width: 24, height: 24, color: "#fed7aa" }} />
              }
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <p style={{ fontWeight: 700, fontSize: 15, color: "#fff7ed", margin: 0 }}>
                Abonnement <span style={{ color: "#fdba74" }}>{subStatus?.planLabel}</span> actif ✓
              </p>
              <p style={{ fontSize: 13, color: "#fed7aa", margin: "4px 0 0", opacity: 0.85 }}>
                Vous bénéficiez de toutes les fonctionnalités de votre offre.
              </p>
            </div>
            <Link href="/subscription">
              <button style={{
                background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.25)",
                color: "#fff7ed", fontWeight: 600, fontSize: 13, padding: "8px 18px",
                borderRadius: 10, cursor: "pointer", whiteSpace: "nowrap",
              }}>
                Mon abonnement →
              </button>
            </Link>
          </div>
        )}

      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </Layout>
  );
}
