import { useEffect, useState, useMemo } from "react";
import { Link } from "wouter";
import { useAuth } from "@clerk/react";
import {
  Users, Crown, Zap, Gift, TrendingUp, RefreshCw,
  Search, Filter, Download, ChevronUp, ChevronDown, X,
  ShieldAlert, LogIn, AlertCircle, ArrowLeft,
} from "lucide-react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

// ── Design tokens ──────────────────────────────────────────────────────────────
const C = {
  bg:        "#030712",
  surface:   "#0d1117",
  surface2:  "#161b22",
  border:    "#21262d",
  border2:   "#30363d",
  text:      "#e6edf3",
  textMuted: "#7d8590",
  textDim:   "#484f58",
  orange:    "#f97316",
  blue:      "#3b82f6",
  green:     "#22c55e",
  red:       "#ef4444",
  purple:    "#a78bfa",
  yellow:    "#facc15",
};

// ── Types ──────────────────────────────────────────────────────────────────────
interface AdminUser {
  userId: string;
  email: string;
  name: string;
  plan: string;
  subscriptionStatus: "active" | "cancelled" | "expired" | "free";
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  periodEnd: string | null;
  currency: string;
  onboardingCompleted: boolean;
  createdAt: string;
  lastSignIn: string | null;
}

interface AdminStats {
  total: number;
  free: number;
  starter: number;
  pro: number;
  paid: number;
  active: number;
  convRate: string;
}

interface AdminData {
  stats: AdminStats;
  users: AdminUser[];
  generatedAt: string;
}

type SortKey = "name" | "plan" | "createdAt" | "lastSignIn";
type SortDir = "asc" | "desc";

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtRelative(iso: string | null) {
  if (!iso) return "—";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)     return "À l'instant";
  if (diff < 3600)   return `Il y a ${Math.round(diff / 60)} min`;
  if (diff < 86400)  return `Il y a ${Math.round(diff / 3600)} h`;
  if (diff < 604800) return `Il y a ${Math.round(diff / 86400)} j`;
  return fmtDate(iso);
}

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase() || "?";
}

const AVATAR_BG = ["#1d4ed8","#7c3aed","#0f766e","#92400e","#9d174d","#0e7490","#1e40af","#6d28d9"];
function avatarBg(id: string) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return AVATAR_BG[Math.abs(h) % AVATAR_BG.length];
}

function exportCsv(users: AdminUser[]) {
  const headers = ["ID", "Email", "Nom", "Plan", "Statut", "Fin abonnement", "Inscription", "Dernière connexion"];
  const rows = users.map(u => [
    u.userId, u.email, u.name, u.plan, u.subscriptionStatus,
    fmtDate(u.periodEnd), fmtDate(u.createdAt), fmtDate(u.lastSignIn),
  ]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `admin-users-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function PlanBadge({ plan }: { plan: string }) {
  const cfg: Record<string, { label: string; bg: string; color: string; border: string }> = {
    free:    { label: "Gratuit",  bg: "#161b22", color: C.textMuted, border: C.border2 },
    starter: { label: "Starter",  bg: "#1a0f2e", color: "#c4b5fd",  border: "#4c1d95" },
    pro:     { label: "Pro",      bg: "#1c0a04", color: "#fb923c",  border: "#7c2d12" },
  };
  const s = cfg[plan] ?? cfg.free;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color, border: `1px solid ${s.border}`, whiteSpace: "nowrap" }}>
      {plan === "pro" ? "👑" : plan === "starter" ? "⚡" : "🎁"} {s.label}
    </span>
  );
}

function StatusBadge({ status }: { status: AdminUser["subscriptionStatus"] }) {
  const cfg = {
    active:    { label: "Actif",    bg: "#051a0a", color: "#4ade80", border: "#14532d", dot: "#22c55e" },
    cancelled: { label: "Annulé",   bg: "#1a0808", color: "#f87171", border: "#7f1d1d", dot: "#ef4444" },
    expired:   { label: "Expiré",   bg: "#1a1208", color: "#fbbf24", border: "#78350f", dot: "#f59e0b" },
    free:      { label: "Gratuit",  bg: "#0d1117", color: C.textMuted, border: C.border, dot: C.textDim },
  };
  const s = cfg[status] ?? cfg.free;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color, border: `1px solid ${s.border}`, whiteSpace: "nowrap" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, flexShrink: 0, boxShadow: status === "active" ? `0 0 6px ${s.dot}` : "none" }} />
      {s.label}
    </span>
  );
}

function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "20px 20px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</span>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", color }}>{icon}</div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: C.text, lineHeight: 1, letterSpacing: "-0.02em" }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: C.textMuted }}>{sub}</div>}
    </div>
  );
}

function Th({ children, sortKey, currentSort, dir, onSort }: {
  children: React.ReactNode;
  sortKey?: SortKey;
  currentSort: SortKey;
  dir: SortDir;
  onSort: (k: SortKey) => void;
}) {
  const active = sortKey === currentSort;
  return (
    <th
      onClick={sortKey ? () => onSort(sortKey) : undefined}
      style={{
        textAlign: "left", padding: "11px 16px",
        fontSize: 11, fontWeight: 600, color: active ? C.orange : C.textMuted,
        textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap",
        cursor: sortKey ? "pointer" : "default",
        borderBottom: `1px solid ${C.border}`,
        userSelect: "none",
      }}
    >
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
        {children}
        {sortKey && (
          <span style={{ opacity: active ? 1 : 0.3, display: "flex", flexDirection: "column", lineHeight: 0.8 }}>
            {dir === "asc" && active ? <ChevronUp style={{ width: 12, height: 12 }} /> : <ChevronDown style={{ width: 12, height: 12 }} />}
          </span>
        )}
      </span>
    </th>
  );
}

// ── Full-screen states ─────────────────────────────────────────────────────────
function FullScreen({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg, fontFamily: "'Inter', system-ui, sans-serif" }}>
      {children}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const [data, setData]         = useState<AdminData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [search, setSearch]     = useState("");
  const [planFilter, setPlanFilter]     = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: "createdAt", dir: "desc" });
  const [refreshing, setRefreshing] = useState(false);

  const load = (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    fetch(`${basePath}/api/admin/stats`, { credentials: "include" })
      .then(async r => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error || "Erreur serveur");
        return json;
      })
      .then(d => { setData(d); setLoading(false); setRefreshing(false); setError(null); })
      .catch(e => { setError(e.message); setLoading(false); setRefreshing(false); });
  };

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    load();
  }, [isLoaded, isSignedIn]);

  const toggleSort = (key: SortKey) => {
    setSort(s => s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" });
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let list = (data?.users ?? []).filter(u => {
      const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.userId.toLowerCase().includes(q);
      const matchPlan   = planFilter === "all" || u.plan === planFilter;
      const matchStatus = statusFilter === "all" || u.subscriptionStatus === statusFilter;
      return matchSearch && matchPlan && matchStatus;
    });

    list = [...list].sort((a, b) => {
      const mul = sort.dir === "asc" ? 1 : -1;
      if (sort.key === "name")      return mul * a.name.localeCompare(b.name);
      if (sort.key === "plan")      return mul * a.plan.localeCompare(b.plan);
      if (sort.key === "createdAt") return mul * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      if (sort.key === "lastSignIn") {
        const aT = a.lastSignIn ? new Date(a.lastSignIn).getTime() : 0;
        const bT = b.lastSignIn ? new Date(b.lastSignIn).getTime() : 0;
        return mul * (aT - bT);
      }
      return 0;
    });

    return list;
  }, [data, search, planFilter, statusFilter, sort]);

  // ── States ─────────────────────────────────────────────────────────────────
  if (!isLoaded || (loading && !data)) {
    return (
      <FullScreen>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 44, height: 44, border: `3px solid ${C.border2}`, borderTopColor: C.orange, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: C.textMuted, fontSize: 14 }}>Chargement des données…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </FullScreen>
    );
  }

  if (!isSignedIn) {
    return (
      <FullScreen>
        <div style={{ textAlign: "center", maxWidth: 360 }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: C.surface, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <LogIn style={{ width: 28, height: 28, color: C.orange }} />
          </div>
          <h2 style={{ color: C.text, fontWeight: 700, fontSize: 20, margin: "0 0 8px" }}>Connexion requise</h2>
          <p style={{ color: C.textMuted, fontSize: 14, margin: "0 0 24px" }}>Vous devez être connecté pour accéder au panneau admin.</p>
          <Link href="/sign-in">
            <button style={{ background: C.orange, color: "#fff", padding: "11px 28px", borderRadius: 12, fontWeight: 700, border: "none", cursor: "pointer", fontSize: 14 }}>
              Se connecter
            </button>
          </Link>
        </div>
      </FullScreen>
    );
  }

  if (error) {
    const is403 = error.includes("refusé") || error.includes("403");
    return (
      <FullScreen>
        <div style={{ textAlign: "center", maxWidth: 400, padding: 24 }}>
          <div style={{ width: 72, height: 72, borderRadius: 22, background: is403 ? "#1a0a0a" : C.surface, border: `1px solid ${is403 ? "#7f1d1d" : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            {is403
              ? <ShieldAlert style={{ width: 32, height: 32, color: C.red }} />
              : <AlertCircle style={{ width: 32, height: 32, color: C.yellow }} />
            }
          </div>
          <h2 style={{ color: C.text, fontWeight: 700, fontSize: 22, margin: "0 0 8px" }}>
            {is403 ? "Accès refusé" : "Erreur"}
          </h2>
          <p style={{ color: C.textMuted, fontSize: 14, margin: "0 0 6px" }}>
            {is403 ? "Votre compte n'est pas autorisé à accéder à cette page." : error}
          </p>
          {is403 && (
            <p style={{ background: "#0d0505", border: `1px solid #7f1d1d`, borderRadius: 10, padding: "10px 16px", color: "#f87171", fontSize: 12, margin: "12px 0 24px", fontFamily: "monospace" }}>
              403 Forbidden
            </p>
          )}
          <Link href="/dashboard">
            <button style={{ display: "inline-flex", alignItems: "center", gap: 7, background: C.surface, color: C.text, padding: "10px 22px", borderRadius: 12, fontWeight: 600, border: `1px solid ${C.border2}`, cursor: "pointer", fontSize: 13 }}>
              <ArrowLeft style={{ width: 15, height: 15 }} />
              Retour au tableau de bord
            </button>
          </Link>
        </div>
      </FullScreen>
    );
  }

  const stats = data!.stats;
  const hasFilters = search || planFilter !== "all" || statusFilter !== "all";

  return (
    <div style={{ minHeight: "100dvh", background: C.bg, color: C.text, fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <nav style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "0 24px", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50, backdropFilter: "blur(8px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {/* Logo */}
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg, #fb923c, #f97316, #ea580c)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, color: "#fff", letterSpacing: "-0.5px" }}>
            MM
          </div>
          <div style={{ height: 20, width: 1, background: C.border2 }} />
          <span style={{ fontWeight: 700, color: C.text, fontSize: 15 }}>Admin Console</span>
          <span style={{ fontSize: 10, background: "#1c0a04", color: "#fb923c", border: "1px solid #7c2d12", padding: "2px 9px", borderRadius: 20, fontWeight: 700, letterSpacing: "0.08em" }}>ACCÈS RESTREINT</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: `1px solid ${C.border2}`, color: C.textMuted, padding: "6px 14px", borderRadius: 10, fontSize: 12, cursor: refreshing ? "default" : "pointer", fontWeight: 500, opacity: refreshing ? 0.6 : 1 }}
          >
            <RefreshCw style={{ width: 13, height: 13, animation: refreshing ? "spin 1s linear infinite" : "none" }} />
            Actualiser
          </button>
          <Link href="/dashboard">
            <button style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: `1px solid ${C.border2}`, color: C.textMuted, padding: "6px 14px", borderRadius: 10, fontSize: 12, cursor: "pointer", fontWeight: 500 }}>
              <ArrowLeft style={{ width: 13, height: 13 }} />
              App
            </button>
          </Link>
        </div>
      </nav>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "36px 24px 64px" }}>

        {/* ── Header ──────────────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: C.text, margin: 0, letterSpacing: "-0.02em" }}>Tableau de bord admin</h1>
            {data?.generatedAt && (
              <span style={{ fontSize: 11, color: C.textDim, fontWeight: 500 }}>
                · mis à jour {fmtRelative(data.generatedAt)}
              </span>
            )}
          </div>
          <p style={{ color: C.textMuted, fontSize: 14, margin: 0 }}>
            Données en direct depuis Clerk et votre base de données PostgreSQL.
          </p>
        </div>

        {/* ── Stat cards ──────────────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 32 }}>
          <StatCard icon={<Users style={{ width: 16, height: 16 }} />}       label="Inscrits"         value={stats.total}        color={C.blue}   sub={`dont ${stats.paid} payants`} />
          <StatCard icon={<Gift style={{ width: 16, height: 16 }} />}        label="Plan Gratuit"     value={stats.free}         color={C.textMuted} />
          <StatCard icon={<Zap style={{ width: 16, height: 16 }} />}         label="Starter"         value={stats.starter}      color={C.purple} />
          <StatCard icon={<Crown style={{ width: 16, height: 16 }} />}       label="Pro"             value={stats.pro}          color={C.orange} />
          <StatCard icon={<TrendingUp style={{ width: 16, height: 16 }} />}  label="Taux conversion" value={stats.convRate + "%"} color={C.green}  sub={`${stats.active} abonnements actifs`} />
        </div>

        {/* ── Filters bar ─────────────────────────────────────────────────────── */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "14px 16px", marginBottom: 16, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          {/* Search */}
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: C.textDim, pointerEvents: "none" }} />
            <input
              type="text"
              placeholder="Rechercher par email, nom, ID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: "100%", background: C.surface2, border: `1px solid ${C.border2}`, borderRadius: 11, padding: "9px 12px 9px 36px", fontSize: 13, color: C.text, outline: "none", boxSizing: "border-box" }}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.textMuted, display: "flex", padding: 2 }}>
                <X style={{ width: 13, height: 13 }} />
              </button>
            )}
          </div>

          {/* Plan filter */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Filter style={{ width: 13, height: 13, color: C.textDim }} />
            <select
              value={planFilter}
              onChange={e => setPlanFilter(e.target.value)}
              style={{ background: C.surface2, border: `1px solid ${C.border2}`, borderRadius: 10, padding: "8px 12px", fontSize: 13, color: C.text, cursor: "pointer", outline: "none" }}
            >
              <option value="all">Tous les plans</option>
              <option value="free">Gratuit</option>
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
            </select>
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ background: C.surface2, border: `1px solid ${C.border2}`, borderRadius: 10, padding: "8px 12px", fontSize: 13, color: C.text, cursor: "pointer", outline: "none" }}
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actif</option>
            <option value="cancelled">Annulé</option>
            <option value="expired">Expiré</option>
            <option value="free">Gratuit</option>
          </select>

          {/* Reset */}
          {hasFilters && (
            <button
              onClick={() => { setSearch(""); setPlanFilter("all"); setStatusFilter("all"); }}
              style={{ background: "transparent", border: `1px solid ${C.border2}`, borderRadius: 10, padding: "8px 14px", fontSize: 12, color: C.textMuted, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}
            >
              <X style={{ width: 12, height: 12 }} />
              Réinitialiser
            </button>
          )}

          <span style={{ fontSize: 12, color: C.textDim, marginLeft: "auto", whiteSpace: "nowrap" }}>
            {filtered.length} / {stats.total} utilisateur{stats.total !== 1 ? "s" : ""}
          </span>

          {/* Export */}
          <button
            onClick={() => exportCsv(filtered)}
            style={{ display: "flex", alignItems: "center", gap: 6, background: C.surface2, border: `1px solid ${C.border2}`, borderRadius: 10, padding: "8px 14px", fontSize: 12, color: C.textMuted, cursor: "pointer", fontWeight: 500, whiteSpace: "nowrap" }}
          >
            <Download style={{ width: 13, height: 13 }} />
            Exporter CSV
          </button>
        </div>

        {/* ── Table ───────────────────────────────────────────────────────────── */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 780 }}>
              <thead>
                <tr style={{ background: C.surface2 }}>
                  <Th sortKey="name" currentSort={sort.key} dir={sort.dir} onSort={toggleSort}>Utilisateur</Th>
                  <Th sortKey="plan" currentSort={sort.key} dir={sort.dir} onSort={toggleSort}>Plan</Th>
                  <Th currentSort={sort.key} dir={sort.dir} onSort={toggleSort}>Statut</Th>
                  <Th currentSort={sort.key} dir={sort.dir} onSort={toggleSort}>Fin abonnement</Th>
                  <Th sortKey="createdAt" currentSort={sort.key} dir={sort.dir} onSort={toggleSort}>Inscription</Th>
                  <Th sortKey="lastSignIn" currentSort={sort.key} dir={sort.dir} onSort={toggleSort}>Dernière connexion</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "60px 24px", color: C.textDim }}>
                      <div style={{ fontSize: 36, marginBottom: 10, opacity: 0.5 }}>🔍</div>
                      <p style={{ margin: 0, fontSize: 14, color: C.textMuted }}>Aucun utilisateur trouvé</p>
                      {hasFilters && (
                        <button onClick={() => { setSearch(""); setPlanFilter("all"); setStatusFilter("all"); }} style={{ marginTop: 12, background: "none", border: `1px solid ${C.border2}`, borderRadius: 8, padding: "6px 14px", color: C.textMuted, cursor: "pointer", fontSize: 12 }}>
                          Réinitialiser les filtres
                        </button>
                      )}
                    </td>
                  </tr>
                ) : filtered.map((u, i) => (
                  <tr
                    key={u.userId}
                    style={{ borderTop: `1px solid ${C.border}`, transition: "background 0.12s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = C.surface2)}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    {/* User column */}
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: avatarBg(u.userId), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0, letterSpacing: "-0.5px" }}>
                          {initials(u.name)}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontWeight: 600, color: C.text, margin: 0, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name}</p>
                          <p style={{ color: C.textMuted, fontSize: 12, margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Plan */}
                    <td style={{ padding: "14px 16px" }}>
                      <PlanBadge plan={u.plan} />
                    </td>

                    {/* Status */}
                    <td style={{ padding: "14px 16px" }}>
                      <StatusBadge status={u.subscriptionStatus} />
                    </td>

                    {/* Period end */}
                    <td style={{ padding: "14px 16px", color: u.periodEnd ? C.textMuted : C.textDim, fontSize: 12, whiteSpace: "nowrap" }}>
                      {fmtDate(u.periodEnd)}
                    </td>

                    {/* Signup date */}
                    <td style={{ padding: "14px 16px", color: C.textMuted, fontSize: 12, whiteSpace: "nowrap" }}>
                      {fmtDate(u.createdAt)}
                    </td>

                    {/* Last sign in */}
                    <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                      <span style={{ fontSize: 12, color: u.lastSignIn ? C.textMuted : C.textDim }}>
                        {fmtRelative(u.lastSignIn)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table footer */}
          {filtered.length > 0 && (
            <div style={{ padding: "10px 18px", borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: C.surface2 }}>
              <span style={{ fontSize: 11, color: C.textDim }}>
                {filtered.length} résultat{filtered.length !== 1 ? "s" : ""}
                {hasFilters ? ` filtrés sur ${stats.total}` : ""}
              </span>
              <button
                onClick={() => exportCsv(filtered)}
                style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", color: C.textDim, cursor: "pointer", fontSize: 11, fontWeight: 500 }}
              >
                <Download style={{ width: 11, height: 11 }} />
                Télécharger CSV
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p style={{ textAlign: "center", fontSize: 11, color: C.textDim, marginTop: 28 }}>
          MobileMoney Manager · Admin Console · Données chiffrées, accès journalisé
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: #484f58; }
        select option { background: #161b22; }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}
