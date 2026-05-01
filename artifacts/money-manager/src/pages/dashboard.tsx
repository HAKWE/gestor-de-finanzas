import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { useLanguage } from "../lib/language-context";
import { Layout } from "../components/layout";
import { useGetDashboardSummary, useGetWeeklySummary, useListTransactions } from "@workspace/api-client-react";
import {
  Wallet, ArrowDownRight, ArrowUpRight,
  Zap, Crown, X, Plus, Receipt,
  TrendingUp, TrendingDown, BarChart2, Download,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
} from "recharts";

// ── Constants ─────────────────────────────────────────────────────────────────
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const BANNER_DURATION = 8000;
const ORANGE = "#f97316";
const GREEN = "#16a34a";
const GREEN_LIGHT = "#22c55e";
const RED = "#dc2626";
const IS_DEV = import.meta.env.MODE === "development";
const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ?? "";
const clerkMode = CLERK_KEY.startsWith("pk_live_") ? "Live" : "Test";

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtShort(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
  return String(Math.round(v));
}

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

function getGreetingEmoji() {
  const h = new Date().getHours();
  if (h < 12) return "☀️";
  if (h < 18) return "🌤️";
  return "🌙";
}

function getTodayLabel() {
  return new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

// ── Category icons ─────────────────────────────────────────────────────────────
const CATEGORY_ICONS: Record<string, string> = {
  alimentation: "🍲", nourriture: "🍲", courses: "🛒",
  transport: "🚌", carburant: "⛽", moto: "🏍️",
  vente: "💼", ventes: "💼", commande: "📦",
  salaire: "💰", revenus: "💰", recette: "💰",
  loyer: "🏠", maison: "🏠",
  eau: "💧", électricité: "⚡", facture: "📋",
  "mobile money": "📱", orange: "📱", wave: "🌊", mtn: "📶",
  santé: "💊", médecin: "🏥",
  éducation: "📚", école: "📚",
  téléphone: "📞", internet: "🌐",
  épargne: "🏦", transfert: "↗️",
  autre: "📁",
};

function getCategoryIcon(category: string): string {
  const key = category?.toLowerCase().trim() ?? "";
  for (const [k, v] of Object.entries(CATEGORY_ICONS)) {
    if (key.includes(k)) return v;
  }
  return "📁";
}

// ── Env status (dev only) ─────────────────────────────────────────────────────
interface EnvStatus { nodeEnv: string; stripeMode: string; clerkMode: string; }

function useEnvStatus() {
  const [status, setStatus] = useState<EnvStatus | null>(null);
  useEffect(() => {
    if (!IS_DEV) return;
    fetch(`${basePath}/api/env-status`)
      .then(r => r.json())
      .then((d: EnvStatus) => {
        setStatus(d);
        const env = d.nodeEnv === "production" ? "PRODUCTION" : "DEVELOPMENT";
        console.log(`🚀 Running in ${env} mode | Stripe: ${d.stripeMode.toUpperCase()} | Clerk: ${clerkMode.toUpperCase()} (frontend key)`);
      })
      .catch(() => {});
  }, []);
  return status;
}

// ── Confetti ──────────────────────────────────────────────────────────────────
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

// ── Subscription status interface ─────────────────────────────────────────────
interface SubscriptionStatus {
  plan: "free" | "starter" | "pro" | "paid";
  planLabel: string;
  status?: string;
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton({ h = 80, radius = 16 }: { h?: number; radius?: number }) {
  return (
    <div style={{
      height: h, borderRadius: radius,
      background: "linear-gradient(90deg, #f0ede9 25%, #e8e4e0 50%, #f0ede9 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.4s infinite",
    }} />
  );
}

// ── Trend badge ───────────────────────────────────────────────────────────────
function TrendBadge({ current, prev, invert = false }: { current: number; prev: number; invert?: boolean }) {
  if (prev === 0) return null;
  const pct = ((current - prev) / prev) * 100;
  const isUp = pct >= 0;
  const good = invert ? !isUp : isUp;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 2,
      padding: "2px 7px", borderRadius: 999, fontSize: 11, fontWeight: 700,
      background: good ? "#f0fdf4" : "#fef2f2",
      color: good ? "#16a34a" : "#dc2626",
    }}>
      {isUp ? "↑" : "↓"} {Math.abs(pct).toFixed(0)}%
    </span>
  );
}

// ── Chart tooltip ─────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label, currency }: any) {
  if (!active || !payload?.length) return null;
  const fmt = (v: number) => new Intl.NumberFormat("fr-FR", {
    style: "currency", currency: currency || "XOF", maximumFractionDigits: 0,
  }).format(v);
  return (
    <div style={{
      background: "#1a1a1a", borderRadius: 12, padding: "10px 14px",
      boxShadow: "0 8px 24px rgba(0,0,0,0.20)", fontSize: 13, minWidth: 140,
    }}>
      <p style={{ color: "#9ca3af", margin: "0 0 8px", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>{label}</p>
      {payload.map((e: any) => (
        <p key={e.name} style={{ margin: "3px 0", color: e.name === "income" ? "#4ade80" : "#f87171", fontWeight: 700 }}>
          {e.name === "income" ? "Revenus" : "Dépenses"} : {fmt(e.value)}
        </p>
      ))}
    </div>
  );
}

// ── Upgrade banner ────────────────────────────────────────────────────────────
function UpgradeBanner({ plan, onDismiss }: { plan: string; onDismiss: () => void }) {
  if (plan === "pro") return null;
  const isStarter = plan === "starter";
  const features = isStarter
    ? ["📄 Export PDF professionnel", "📱 Import SMS Orange Money", "📊 Rapports avancés", "♾️ Transactions illimitées"]
    : ["📊 Tableau de bord complet", "📄 Export PDF", "📱 Import SMS & relevés", "🗂️ Jusqu'à 3 wallets"];
  return (
    <div style={{
      borderRadius: 20, overflow: "hidden", position: "relative",
      background: "#fff",
      border: "1.5px solid #fed7aa",
      boxShadow: "0 2px 12px rgba(249,115,22,0.10)",
    }}>
      <div style={{ height: 3, background: "linear-gradient(90deg, #f97316 0%, #fb923c 100%)" }} />
      <div style={{ padding: "16px 18px 16px", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
          <div>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#fff7ed", borderRadius: 999, padding: "3px 10px", fontSize: 11, fontWeight: 700, color: "#ea580c", marginBottom: 6, border: "1px solid #fed7aa" }}>
              {isStarter ? "⚡ Starter → 👑 Pro" : "🎁 Plan Gratuit → Pro"}
              <strong style={{ color: "#c2410c", marginLeft: 4 }}>{isStarter ? "+6 €/mois" : "dès 5 €/mois"}</strong>
            </span>
            <p style={{ fontSize: 14, fontWeight: 800, color: "#111827", margin: 0 }}>
              {isStarter ? "Passez au Pro — un cran au-dessus" : "Gérez votre activité comme un pro"}
            </p>
          </div>
          <button onClick={onDismiss} style={{ background: "#f9fafb", border: "1px solid #e5e7eb", cursor: "pointer", color: "#9ca3af", padding: 5, borderRadius: 7, flexShrink: 0, display: "flex", alignItems: "center" }}>
            <X style={{ width: 13, height: 13 }} />
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5, marginBottom: 12 }}>
          {features.map(f => (
            <div key={f} style={{ background: "#fafaf9", borderRadius: 9, padding: "7px 10px", fontSize: 11, color: "#374151", fontWeight: 600, border: "1px solid #f0ede9" }}>
              {f}
            </div>
          ))}
        </div>
        <Link href="/pricing">
          <button style={{ width: "100%", background: ORANGE, color: "#fff", border: "none", borderRadius: 12, padding: "11px 20px", fontWeight: 800, fontSize: 13, cursor: "pointer", boxShadow: "0 3px 12px rgba(249,115,22,0.30)" }}>
            <Crown style={{ width: 14, height: 14, display: "inline", marginRight: 6, verticalAlign: "middle" }} />
            {isStarter ? "Passer au Pro maintenant →" : "Voir les offres →"}
          </button>
        </Link>
      </div>
    </div>
  );
}

// ── Welcome tour ──────────────────────────────────────────────────────────────
function WelcomeTour({ onClose }: { onClose: () => void }) {
  const steps = [
    { icon: "📊", title: "Tableau de bord", desc: "Suivez vos revenus et dépenses en temps réel." },
    { icon: "➕", title: "Ajouter des transactions", desc: "Enregistrez chaque recette et dépense instantanément." },
    { icon: "📈", title: "Rapports & analyses", desc: "Visualisez votre activité sur la semaine ou le mois." },
  ];
  const [step, setStep] = useState(0);
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "0 16px 32px" }}>
      <div style={{ background: "#fff", borderRadius: 24, padding: "28px 24px", maxWidth: 420, width: "100%", boxShadow: "0 24px 64px rgba(0,0,0,0.22)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600 }}>Étape {step + 1} / {steps.length}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", display: "flex", alignItems: "center" }}>
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>{steps[step].icon}</div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: "#111", margin: "0 0 8px" }}>{steps[step].title}</h3>
          <p style={{ color: "#6b7280", fontSize: 14, lineHeight: 1.6, margin: 0 }}>{steps[step].desc}</p>
        </div>
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 20 }}>
          {steps.map((_, i) => (
            <div key={i} style={{ width: i === step ? 24 : 8, height: 8, borderRadius: 4, background: i === step ? ORANGE : "#e5e7eb", transition: "width 0.2s" }} />
          ))}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {step < steps.length - 1 ? (
            <>
              <button onClick={onClose} style={{ flex: 1, background: "#f3f4f6", color: "#6b7280", border: "none", borderRadius: 12, padding: "12px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Passer</button>
              <button onClick={() => setStep(s => s + 1)} style={{ flex: 2, background: ORANGE, color: "#fff", border: "none", borderRadius: 12, padding: "12px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Suivant →</button>
            </>
          ) : (
            <button onClick={onClose} style={{ flex: 1, background: ORANGE, color: "#fff", border: "none", borderRadius: 12, padding: "13px", fontWeight: 800, fontSize: 14, cursor: "pointer", boxShadow: "0 4px 14px rgba(249,115,22,0.35)" }}>
              C'est parti ! 🚀
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD PAGE
// ─────────────────────────────────────────────────────────────────────────────
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

  const envStatus = useEnvStatus();

  const [showTour, setShowTour] = useState(() => !localStorage.getItem("welcome-tour-v1"));
  const closeTour = () => { localStorage.setItem("welcome-tour-v1", "1"); setShowTour(false); };

  const [showUpgradeBanner, setShowUpgradeBanner] = useState(() => !localStorage.getItem("upgrade-banner-v1"));
  const dismissUpgradeBanner = () => { localStorage.setItem("upgrade-banner-v1", "1"); setShowUpgradeBanner(false); };

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

  const fmt = (amount: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency", currency: summary?.currency || "XOF", maximumFractionDigits: 0,
    }).format(amount);

  const isPaid = subStatus && subStatus.plan !== "free";
  const isPro  = subStatus?.plan === "pro";

  const chartData = (weekly ?? []).map(d => ({
    ...d,
    label: new Date(d.date + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", ""),
  }));
  const hasChartData = chartData.some(d => (d.income || 0) + (d.expenses || 0) > 0);

  const weekNet = (summary?.weekIncome ?? 0) - (summary?.weekExpenses ?? 0);

  return (
    <Layout>
      <ConfettiCanvas active={showSuccessBanner} />
      {showTour && <WelcomeTour onClose={closeTour} />}

      <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingBottom: 32 }}>

        {/* ── Success banner ──────────────────────────────────────────────── */}
        {showSuccessBanner && (
          <div style={{
            position: "relative", overflow: "hidden", borderRadius: 20,
            background: "linear-gradient(135deg, #052e16 0%, #14532d 60%, #166534 100%)",
            padding: "0 0 4px",
            boxShadow: "0 8px 32px rgba(21,128,61,0.35)",
          }}>
            <div style={{ position: "absolute", bottom: 0, left: 0, height: 4, width: `${bannerProgress}%`, backgroundColor: "#4ade80", borderRadius: 4, transition: "width 0.1s linear" }} />
            <div style={{ padding: "20px 22px", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ fontSize: 30, flexShrink: 0 }}>🏆</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 800, fontSize: 16, color: "#f0fdf4", margin: "0 0 4px" }}>Félicitations !</p>
                <p style={{ fontSize: 13, color: "#86efac", margin: 0, lineHeight: 1.5 }}>
                  {subStatus?.plan !== "free"
                    ? <>Abonnement <strong style={{ color: "#4ade80" }}>{subStatus?.planLabel}</strong> activé. Toutes vos fonctionnalités sont disponibles.</>
                    : "Votre abonnement est maintenant actif."}
                </p>
              </div>
              <button onClick={() => setShowSuccessBanner(false)} style={{ background: "rgba(255,255,255,0.10)", border: "none", cursor: "pointer", color: "#86efac", padding: 6, borderRadius: 8, flexShrink: 0, display: "flex" }}>
                <X style={{ width: 15, height: 15 }} />
              </button>
            </div>
          </div>
        )}

        {/* ── Greeting ────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <p style={{ margin: 0, fontSize: 13, color: "#9ca3af", fontWeight: 500, textTransform: "capitalize" }}>
              {getTodayLabel()}
            </p>
            <h1 style={{ margin: "2px 0 0", fontSize: 22, fontWeight: 800, color: "#111" }}>
              {getGreeting()} {getGreetingEmoji()}
            </h1>
          </div>
          <Link href="/transactions/new">
            <button style={{
              background: ORANGE, color: "#fff", border: "none", borderRadius: 14,
              padding: "11px 18px", fontWeight: 700, fontSize: 14, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 7, flexShrink: 0,
              boxShadow: "0 4px 14px rgba(249,115,22,0.38)",
            }}>
              <Plus style={{ width: 17, height: 17 }} />
              Ajouter
            </button>
          </Link>
        </div>

        {/* ── Hero balance card ────────────────────────────────────────────── */}
        <div style={{
          borderRadius: 24, overflow: "hidden", position: "relative",
          background: "#ffffff",
          border: "1.5px solid #e5e7eb",
          boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
          padding: "24px 24px 20px",
        }}>
          {/* Subtle orange accent top bar */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "linear-gradient(90deg, #f97316 0%, #fb923c 100%)", borderRadius: "24px 24px 0 0" }} />

          <div style={{ position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: "#fff7ed", border: "1.5px solid #fed7aa", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Wallet style={{ width: 16, height: 16, color: "#f97316" }} />
                </div>
                <div>
                  <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", display: "block" }}>
                    Solde d'aujourd'hui
                  </span>
                  <span style={{ fontSize: 11, color: "#d1d5db", fontWeight: 600 }}>
                    {summary?.currency ?? "XOF"}
                  </span>
                </div>
              </div>
              <div style={{ background: "#f9fafb", borderRadius: 999, padding: "4px 12px", border: "1px solid #e5e7eb" }}>
                <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 600 }}>Aujourd'hui</span>
              </div>
            </div>

            {isLoadingSummary ? (
              <div style={{ height: 52, background: "#f3f4f6", borderRadius: 12, marginBottom: 14, animation: "pulse 1.5s ease-in-out infinite" }} />
            ) : (
              <div style={{ fontSize: 38, fontWeight: 900, color: "#111827", lineHeight: 1, letterSpacing: "-0.03em", marginBottom: 16 }}>
                {fmt(summary?.todayBalance ?? 0)}
              </div>
            )}

            <div style={{ height: 1, background: "#f3f4f6", marginBottom: 16 }} />

            {/* Income vs Expenses mini summary */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ background: "#f0fdf4", borderRadius: 14, padding: "12px 14px", border: "1px solid #bbf7d0" }}>
                <p style={{ margin: 0, fontSize: 10, color: "#16a34a", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>↑ Revenus sem.</p>
                {isLoadingSummary
                  ? <div style={{ height: 20, background: "#bbf7d0", borderRadius: 6, animation: "pulse 1.5s ease-in-out infinite" }} />
                  : <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#15803d" }}>{fmt(summary?.weekIncome ?? 0)}</p>
                }
              </div>
              <div style={{ background: "#fef2f2", borderRadius: 14, padding: "12px 14px", border: "1px solid #fecaca" }}>
                <p style={{ margin: 0, fontSize: 10, color: "#dc2626", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>↓ Dépenses sem.</p>
                {isLoadingSummary
                  ? <div style={{ height: 20, background: "#fecaca", borderRadius: 6, animation: "pulse 1.5s ease-in-out infinite" }} />
                  : <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#dc2626" }}>{fmt(summary?.weekExpenses ?? 0)}</p>
                }
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats row ────────────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {/* Profit net semaine */}
          <div style={{ background: "#fff", borderRadius: 18, padding: "16px 14px", border: "1px solid #f0ede9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: weekNet >= 0 ? "#f0fdf4" : "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
              {weekNet >= 0
                ? <TrendingUp style={{ width: 16, height: 16, color: GREEN }} />
                : <TrendingDown style={{ width: 16, height: 16, color: RED }} />
              }
            </div>
            <p style={{ margin: 0, fontSize: 10, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>Bénéfice net</p>
            {isLoadingSummary
              ? <Skeleton h={20} radius={6} />
              : <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: weekNet >= 0 ? GREEN : RED, lineHeight: 1 }}>
                  {weekNet >= 0 ? "+" : ""}{fmtShort(Math.abs(weekNet))}
                </p>
            }
          </div>

          {/* Ce mois revenus */}
          <div style={{ background: "#fff", borderRadius: 18, padding: "16px 14px", border: "1px solid #f0ede9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "#fff7ed", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
              <ArrowUpRight style={{ width: 16, height: 16, color: ORANGE }} />
            </div>
            <p style={{ margin: 0, fontSize: 10, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>Mois (revenus)</p>
            {isLoadingSummary
              ? <Skeleton h={20} radius={6} />
              : <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#111", lineHeight: 1 }}>{fmtShort(summary?.monthIncome ?? 0)}</p>
            }
          </div>

          {/* Transactions */}
          <div style={{ background: "#fff", borderRadius: 18, padding: "16px 14px", border: "1px solid #f0ede9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
              <Receipt style={{ width: 16, height: 16, color: "#6366f1" }} />
            </div>
            <p style={{ margin: 0, fontSize: 10, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>Transactions</p>
            {isLoadingSummary
              ? <Skeleton h={20} radius={6} />
              : <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#111", lineHeight: 1 }}>{summary?.totalTransactions ?? 0}</p>
            }
          </div>
        </div>

        {/* ── Quick actions ─────────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {[
            { label: "Transaction", icon: <Plus style={{ width: 18, height: 18 }} />, href: "/transactions/new", primary: true },
            { label: "Rapports",    icon: <BarChart2 style={{ width: 18, height: 18 }} />, href: "/reports", primary: false },
            { label: "Importer",   icon: <Download style={{ width: 18, height: 18 }} />, href: "/import", primary: false },
          ].map(a => (
            <Link key={a.label} href={a.href}>
              <button style={{
                width: "100%",
                background: a.primary ? ORANGE : "#fff",
                color: a.primary ? "#fff" : "#374151",
                border: a.primary ? "none" : "1.5px solid #e5e7eb",
                borderRadius: 14, padding: "12px 8px",
                fontWeight: 700, fontSize: 12, cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                boxShadow: a.primary ? "0 4px 12px rgba(249,115,22,0.30)" : "0 1px 3px rgba(0,0,0,0.05)",
              }}>
                {a.icon}
                {a.label}
              </button>
            </Link>
          ))}
        </div>

        {/* ── Upgrade banner ────────────────────────────────────────────────── */}
        {showUpgradeBanner && subStatus && subStatus.plan !== "pro" && (
          <UpgradeBanner plan={subStatus.plan} onDismiss={dismissUpgradeBanner} />
        )}

        {/* ── Weekly chart ──────────────────────────────────────────────────── */}
        <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #f0ede9", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", overflow: "hidden" }}>
          <div style={{ padding: "18px 20px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "#111" }}>Activité de la semaine</h2>
              {!isLoadingSummary && (
                <p style={{ margin: "3px 0 0", fontSize: 12, color: "#9ca3af" }}>
                  {(summary?.weekIncome ?? 0) > 0 || (summary?.weekExpenses ?? 0) > 0
                    ? `Revenus vs dépenses · ${summary?.currency ?? "XOF"}`
                    : "Aucune activité cette semaine"
                  }
                </p>
              )}
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              {[{ color: GREEN_LIGHT, label: "Revenus" }, { color: "#f87171", label: "Dépenses" }].map(l => (
                <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 3, background: l.color }} />
                  {l.label}
                </div>
              ))}
            </div>
          </div>

          <div style={{ height: 220, padding: "8px 8px 4px" }}>
            {isLoadingWeekly ? (
              <div style={{ height: "100%", padding: 16 }}><Skeleton h={180} /></div>
            ) : !hasChartData ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 10, padding: 20, textAlign: "center" }}>
                <div style={{ fontSize: 36, opacity: 0.4 }}>📊</div>
                <p style={{ fontWeight: 700, fontSize: 14, color: "#374151", margin: 0 }}>Pas encore d'activité</p>
                <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>Les courbes apparaîtront dès votre première transaction.</p>
                <Link href="/transactions/new">
                  <button style={{ background: ORANGE, color: "#fff", border: "none", borderRadius: 10, padding: "9px 18px", fontWeight: 700, fontSize: 12, cursor: "pointer", marginTop: 4 }}>
                    + Première transaction
                  </button>
                </Link>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }} barGap={3} barCategoryGap="32%">
                  <defs>
                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4ade80" />
                      <stop offset="100%" stopColor="#16a34a" />
                    </linearGradient>
                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f87171" />
                      <stop offset="100%" stopColor="#dc2626" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f3f0" vertical={false} />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#9ca3af", fontWeight: 600 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9ca3af" }} tickFormatter={fmtShort} width={40} />
                  <RechartsTooltip content={<CustomTooltip currency={summary?.currency ?? "XOF"} />} cursor={{ fill: "rgba(249,115,22,0.04)", radius: 6 } as any} />
                  <Bar dataKey="income" name="income" fill="url(#incomeGrad)" radius={[6, 6, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="expenses" name="expenses" fill="url(#expenseGrad)" radius={[6, 6, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ── Recent transactions ───────────────────────────────────────────── */}
        <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #f0ede9", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f5f3f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "#111" }}>Transactions récentes</h2>
            <Link href="/transactions">
              <span style={{ fontSize: 13, color: ORANGE, fontWeight: 600, cursor: "pointer" }}>Voir tout →</span>
            </Link>
          </div>

          {isLoadingTxs ? (
            <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
              {[0, 1, 2].map(i => <Skeleton key={i} h={52} radius={12} />)}
            </div>
          ) : !recentTxs || recentTxs.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 24px", gap: 14, textAlign: "center" }}>
              <div style={{ width: 72, height: 72, borderRadius: 22, background: "#fff7ed", border: "2px solid #fed7aa", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Receipt style={{ width: 34, height: 34, color: ORANGE }} />
              </div>
              <div>
                <p style={{ fontWeight: 800, fontSize: 16, color: "#111", margin: "0 0 6px" }}>Aucune transaction</p>
                <p style={{ color: "#6b7280", fontSize: 13, maxWidth: 240, lineHeight: 1.6, margin: 0 }}>
                  Enregistrez votre première recette ou dépense pour voir votre activité ici.
                </p>
              </div>
              <Link href="/transactions/new">
                <button style={{ background: ORANGE, color: "#fff", border: "none", borderRadius: 14, padding: "12px 24px", fontWeight: 800, fontSize: 13, cursor: "pointer", boxShadow: "0 4px 14px rgba(249,115,22,0.35)" }}>
                  + Ajouter ma première transaction
                </button>
              </Link>
            </div>
          ) : (
            <>
              <ul style={{ margin: 0, padding: "4px 0", listStyle: "none" }}>
                {recentTxs.slice(0, 5).map((tx: any, i: number) => {
                  const isIncome = tx.type === "income";
                  const amount = typeof tx.amount === "string" ? parseFloat(tx.amount) : tx.amount;
                  const emoji = getCategoryIcon(tx.category);
                  return (
                    <li key={tx.id}
                      style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 18px", borderTop: i === 0 ? "none" : "1px solid #fafaf9", transition: "background 0.12s" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#fafafa")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      {/* Icon */}
                      <div style={{ width: 40, height: 40, borderRadius: 13, flexShrink: 0, background: isIncome ? "#f0fdf4" : "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                        {emoji}
                      </div>
                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {tx.category}
                        </p>
                        <p style={{ margin: 0, fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                          {tx.paymentMethod}
                          <span style={{ margin: "0 4px", opacity: 0.5 }}>·</span>
                          {fmtDate(tx.date)}
                        </p>
                      </div>
                      {/* Amount */}
                      <span style={{ fontSize: 14, fontWeight: 800, flexShrink: 0, color: isIncome ? GREEN : RED }}>
                        {isIncome ? "+" : "−"}
                        {new Intl.NumberFormat("fr-FR", { style: "currency", currency: tx.currency || "XOF", maximumFractionDigits: 0 }).format(amount)}
                      </span>
                    </li>
                  );
                })}
              </ul>
              {recentTxs.length > 5 && (
                <div style={{ padding: "12px 20px", borderTop: "1px solid #f5f3f0", textAlign: "center" }}>
                  <Link href="/transactions">
                    <span style={{ fontSize: 13, color: ORANGE, fontWeight: 600, cursor: "pointer" }}>
                      + {recentTxs.length - 5} transaction{recentTxs.length - 5 > 1 ? "s" : ""} →
                    </span>
                  </Link>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Pro active banner ─────────────────────────────────────────────── */}
        {isPaid && (
          <div style={{
            borderRadius: 18, padding: "16px 18px",
            background: "linear-gradient(135deg, #431407, #7c2d12)",
            display: "flex", flexWrap: "wrap", alignItems: "center", gap: 14,
            boxShadow: "0 4px 16px rgba(249,115,22,0.18)",
          }}>
            <div style={{ width: 40, height: 40, background: "rgba(255,255,255,0.15)", borderRadius: 12, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {isPro ? <Crown style={{ width: 20, height: 20, color: "#fed7aa" }} /> : <Zap style={{ width: 20, height: 20, color: "#fed7aa" }} />}
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <p style={{ fontWeight: 700, fontSize: 14, color: "#fff7ed", margin: 0 }}>
                Abonnement <span style={{ color: "#fdba74" }}>{subStatus?.planLabel}</span> actif ✓
              </p>
              <p style={{ fontSize: 12, color: "#fdba74", margin: "3px 0 0", opacity: 0.85 }}>
                Vous bénéficiez de toutes les fonctionnalités de votre offre.
              </p>
            </div>
            <Link href="/subscription">
              <button style={{ background: "rgba(255,255,255,0.14)", border: "1.5px solid rgba(255,255,255,0.22)", color: "#fff7ed", fontWeight: 600, fontSize: 12, padding: "8px 16px", borderRadius: 10, cursor: "pointer", whiteSpace: "nowrap" }}>
                Mon abonnement →
              </button>
            </Link>
          </div>
        )}

        {/* ── Env status (dev only) ─────────────────────────────────────────── */}
        {IS_DEV && envStatus && (
          <div style={{ margin: "8px 0 0", padding: "12px 16px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: 10, fontFamily: "monospace", fontSize: 12, color: "#475569", lineHeight: 1.7 }}>
            <strong style={{ color: "#334155", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>🛠 Env Status (dev only)</strong><br />
            Environment: <strong style={{ color: envStatus.nodeEnv === "production" ? "#16a34a" : "#ea580c" }}>{envStatus.nodeEnv === "production" ? "PRODUCTION" : "DEVELOPMENT"}</strong><br />
            Stripe: <strong style={{ color: envStatus.stripeMode === "live" ? "#16a34a" : "#6366f1" }}>{envStatus.stripeMode === "live" ? "🟢 LIVE" : "🔵 TEST"}</strong><br />
            Clerk: <strong style={{ color: clerkMode === "Live" ? "#16a34a" : "#6366f1" }}>{clerkMode === "Live" ? "🟢 LIVE" : "🔵 TEST (dev key)"}</strong>
          </div>
        )}

      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
      `}</style>
    </Layout>
  );
}
