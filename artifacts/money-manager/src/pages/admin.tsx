import { useEffect, useState, useMemo } from "react";
import {
  Users, Crown, Activity, RefreshCw,
  Search, Download, ArrowLeft, ChevronUp, ChevronDown, X, Filter, RotateCw,
} from "lucide-react";

const IS_ADMIN_SUBDOMAIN =
  typeof window !== "undefined" &&
  window.location.hostname === "admin.mobilemoneymanager.africa";

const APP_HOME = IS_ADMIN_SUBDOMAIN ? "https://mobilemoneymanager.africa" : "/dashboard";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

// ── Design tokens (dark, GitHub-inspired) ─────────────────────────────────────
const T = {
  bg:       "#0d1117",
  panel:    "#161b22",
  border:   "#21262d",
  border2:  "#30363d",
  text:     "#e6edf3",
  muted:    "#7d8590",
  dim:      "#484f58",
  orange:   "#f97316",
  green:    "#3fb950",
  blue:     "#58a6ff",
  purple:   "#bc8cff",
  red:      "#f85149",
  yellow:   "#d29922",
};

// ── Types ──────────────────────────────────────────────────────────────────────
interface AdminUser {
  userId: string;
  email: string;
  name: string;
  plan: "free" | "starter" | "pro";
  subscriptionStatus: "active" | "cancelled" | "expired" | "free";
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
  periodEnd: string | null;
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

type SortKey = "email" | "name" | "plan" | "createdAt" | "lastSignIn";
type SortDir = "asc" | "desc";

// ── Utilities ─────────────────────────────────────────────────────────────────
function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtAgo(iso: string | null) {
  if (!iso) return "—";
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60)     return "À l'instant";
  if (s < 3600)   return `Il y a ${Math.round(s / 60)} min`;
  if (s < 86400)  return `Il y a ${Math.round(s / 3600)} h`;
  if (s < 604800) return `Il y a ${Math.round(s / 86400)} j`;
  return fmtDate(iso);
}

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase() || "?";
}

const AVATAR_COLORS = ["#1d4ed8","#7c3aed","#0f766e","#92400e","#9d174d","#0e7490","#1e40af","#4d7c0f"];
function avatarColor(id: string) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function downloadCsv(users: AdminUser[]) {
  const cols = ["Email", "Nom complet", "Date inscription", "Plan", "Statut abonnement", "Fin abonnement"];
  const rows = users.map(u => [
    u.email,
    u.name,
    fmtDate(u.createdAt),
    u.plan,
    u.subscriptionStatus,
    fmtDate(u.periodEnd),
  ]);
  const csv = [cols, ...rows].map(r => r.map(v => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const a = Object.assign(document.createElement("a"), {
    href: URL.createObjectURL(blob),
    download: `mmm-users-${new Date().toISOString().slice(0, 10)}.csv`,
  });
  a.click();
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function PlanBadge({ plan }: { plan: string }) {
  const map: Record<string, [string, string, string, string]> = {
    free:    ["Gratuit", "#0d1117", T.muted,  T.border2],
    starter: ["Starter", "#1a0e2e", "#bc8cff", "#4c1d95"],
    pro:     ["Pro",     "#1c0904", "#fb923c", "#7c2d12"],
  };
  const [label, bg, color, border] = map[plan] ?? map.free;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: bg, color, border: `1px solid ${border}`, whiteSpace: "nowrap" }}>
      {plan === "pro" ? "👑" : plan === "starter" ? "⚡" : "·"} {label}
    </span>
  );
}

function StatusBadge({ status }: { status: AdminUser["subscriptionStatus"] }) {
  const map = {
    active:    ["Actif",   "#051a0a", "#3fb950", "#196c2e", true],
    cancelled: ["Annulé",  "#1a0808", "#f85149", "#7f1d1d", false],
    expired:   ["Expiré",  "#1a1208", "#d29922", "#78350f", false],
    free:      ["Gratuit", "#0d1117", T.muted,   T.border,  false],
  } as Record<string, [string, string, string, string, boolean]>;
  const [label, bg, color, border, glow] = map[status] ?? map.free;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: bg, color, border: `1px solid ${border}`, whiteSpace: "nowrap" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0, boxShadow: glow ? `0 0 5px ${color}` : "none" }} />
      {label}
    </span>
  );
}

function StatCard({ icon, label, value, sub, accent }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; accent: string;
}) {
  return (
    <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: "20px 22px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 11, color: T.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: accent + "20", display: "flex", alignItems: "center", justifyContent: "center", color: accent }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: 30, fontWeight: 800, color: T.text, letterSpacing: "-0.02em", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: T.muted, marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

function SortTh({ children, sortKey, active, dir, onClick }: {
  children: React.ReactNode;
  sortKey?: SortKey;
  active: boolean;
  dir: SortDir;
  onClick?: () => void;
}) {
  return (
    <th
      onClick={onClick}
      style={{ textAlign: "left", padding: "10px 16px", fontSize: 11, fontWeight: 600, color: active ? T.orange : T.muted, textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap", cursor: onClick ? "pointer" : "default", borderBottom: `1px solid ${T.border}`, userSelect: "none", background: "#0d1117" }}
    >
      <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
        {children}
        {onClick && (
          active ? (dir === "asc" ? <ChevronUp style={{ width: 11, height: 11 }} /> : <ChevronDown style={{ width: 11, height: 11 }} />)
                 : <ChevronDown style={{ width: 11, height: 11, opacity: 0.25 }} />
        )}
      </span>
    </th>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [data, setData]       = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch]           = useState("");
  const [planFilter, setPlanFilter]   = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: "createdAt", dir: "desc" });
  const [syncingUsers, setSyncingUsers] = useState<Record<string, "loading" | "ok" | "err">>({});

  const syncUser = async (stripeCustomerId: string) => {
    setSyncingUsers(s => ({ ...s, [stripeCustomerId]: "loading" }));
    try {
      const res = await fetch(`${basePath}/api/admin/sync-subscription`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stripeCustomerId }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Erreur");
      setSyncingUsers(s => ({ ...s, [stripeCustomerId]: "ok" }));
      setTimeout(() => load(true), 800);
    } catch {
      setSyncingUsers(s => ({ ...s, [stripeCustomerId]: "err" }));
      setTimeout(() => setSyncingUsers(s => { const n = { ...s }; delete n[stripeCustomerId]; return n; }), 3000);
    }
  };

  const load = (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    fetch(`${basePath}/api/admin/stats`, { credentials: "include" })
      .then(async r => { const j = await r.json(); if (!r.ok) throw new Error(j.error ?? "Erreur"); return j; })
      .then(d => { setData(d); setLoading(false); setRefreshing(false); setError(null); })
      .catch(e => { setError(e.message); setLoading(false); setRefreshing(false); });
  };

  useEffect(() => { load(); }, []);

  const toggleSort = (key: SortKey) =>
    setSort(s => ({ key, dir: s.key === key && s.dir === "desc" ? "asc" : "desc" }));

  const hasFilters = !!(search || planFilter !== "all" || statusFilter !== "all");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return [...(data?.users ?? [])]
      .filter(u => {
        const ms = !q || u.email.includes(q) || u.name.toLowerCase().includes(q) || u.userId.includes(q);
        const mp = planFilter === "all" || u.plan === planFilter;
        const ms2 = statusFilter === "all" || u.subscriptionStatus === statusFilter;
        return ms && mp && ms2;
      })
      .sort((a, b) => {
        const m = sort.dir === "asc" ? 1 : -1;
        if (sort.key === "email")    return m * a.email.localeCompare(b.email);
        if (sort.key === "name")     return m * a.name.localeCompare(b.name);
        if (sort.key === "plan")     return m * a.plan.localeCompare(b.plan);
        if (sort.key === "createdAt") return m * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        if (sort.key === "lastSignIn") {
          const at = a.lastSignIn ? new Date(a.lastSignIn).getTime() : 0;
          const bt = b.lastSignIn ? new Date(b.lastSignIn).getTime() : 0;
          return m * (at - bt);
        }
        return 0;
      });
  }, [data, search, planFilter, statusFilter, sort]);

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: T.bg }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 44, height: 44, border: `3px solid ${T.border2}`, borderTopColor: T.orange, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 14px" }} />
          <p style={{ color: T.muted, fontSize: 14, fontFamily: "system-ui" }}>Chargement des données…</p>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: T.bg, fontFamily: "system-ui" }}>
        <div style={{ textAlign: "center", maxWidth: 380, padding: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ color: T.text, fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>Erreur de chargement</h2>
          <p style={{ color: T.muted, fontSize: 14, margin: "0 0 24px" }}>{error}</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button onClick={() => load()} style={{ background: T.orange, color: "#fff", border: "none", borderRadius: 10, padding: "10px 22px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              Réessayer
            </button>
            <a href={APP_HOME} style={{ textDecoration: "none" }}>
              <button style={{ display: "flex", alignItems: "center", gap: 6, background: T.panel, color: T.text, border: `1px solid ${T.border2}`, borderRadius: 10, padding: "10px 22px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                <ArrowLeft style={{ width: 14, height: 14 }} /> App
              </button>
            </a>
          </div>
        </div>
      </div>
    );
  }

  const { stats } = data!;

  return (
    <div style={{ minHeight: "100dvh", background: T.bg, color: T.text, fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <header style={{ background: T.panel, borderBottom: `1px solid ${T.border}`, height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: "linear-gradient(135deg, #fb923c, #ea580c)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff" }}>
            MM
          </div>
          <span style={{ color: T.border2, fontSize: 18, fontWeight: 100 }}>|</span>
          <h1 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: T.text }}>
            Admin Dashboard <span style={{ color: T.muted, fontWeight: 400 }}>— MobileMoney Manager</span>
          </h1>
          <span style={{ fontSize: 10, fontWeight: 700, color: T.orange, background: "#1c0904", border: `1px solid #7c2d12`, borderRadius: 20, padding: "2px 9px", letterSpacing: "0.06em" }}>
            RESTREINT
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            style={{ display: "flex", alignItems: "center", gap: 5, background: "transparent", border: `1px solid ${T.border2}`, borderRadius: 9, padding: "6px 13px", fontSize: 12, color: T.muted, cursor: refreshing ? "default" : "pointer", opacity: refreshing ? 0.6 : 1, fontWeight: 500 }}
          >
            <RefreshCw style={{ width: 12, height: 12, animation: refreshing ? "spin 1s linear infinite" : "none" }} />
            Actualiser
          </button>
          <a href={APP_HOME} style={{ textDecoration: "none" }}>
            <button style={{ display: "flex", alignItems: "center", gap: 5, background: "transparent", border: `1px solid ${T.border2}`, borderRadius: 9, padding: "6px 13px", fontSize: 12, color: T.muted, cursor: "pointer", fontWeight: 500 }}>
              <ArrowLeft style={{ width: 12, height: 12 }} /> App
            </button>
          </a>
        </div>
      </header>

      <main style={{ maxWidth: 1300, margin: "0 auto", padding: "32px 24px 64px" }}>

        {/* ── Page title ──────────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 28 }}>
          <p style={{ color: T.muted, fontSize: 13, margin: 0 }}>
            Données en direct · Dernière mise à jour {fmtAgo(data?.generatedAt ?? null)}
          </p>
        </div>

        {/* ── Stat cards ──────────────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 28 }}>
          <StatCard
            icon={<Users style={{ width: 16, height: 16 }} />}
            label="Utilisateurs inscrits"
            value={stats.total}
            sub={`dont ${stats.paid} payants (${stats.convRate}%)`}
            accent={T.blue}
          />
          <StatCard
            icon={<Crown style={{ width: 16, height: 16 }} />}
            label="Utilisateurs Pro"
            value={stats.pro}
            sub={`${stats.starter} Starter · ${stats.free} Gratuit`}
            accent={T.orange}
          />
          <StatCard
            icon={<Activity style={{ width: 16, height: 16 }} />}
            label="Abonnements actifs"
            value={stats.active}
            sub={`Taux de conversion ${stats.convRate}%`}
            accent={T.green}
          />
        </div>

        {/* ── Filter bar ──────────────────────────────────────────────────────── */}
        <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: "12px 14px", marginBottom: 14, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          {/* Search */}
          <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
            <Search style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 13, height: 13, color: T.dim, pointerEvents: "none" }} />
            <input
              type="text"
              placeholder="Rechercher par email, nom…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: "100%", background: "#0d1117", border: `1px solid ${T.border2}`, borderRadius: 9, padding: "8px 32px 8px 32px", fontSize: 13, color: T.text, outline: "none", boxSizing: "border-box" }}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: T.muted, display: "flex", padding: 2 }}>
                <X style={{ width: 12, height: 12 }} />
              </button>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Filter style={{ width: 12, height: 12, color: T.dim }} />
            <select value={planFilter} onChange={e => setPlanFilter(e.target.value)} style={{ background: "#0d1117", border: `1px solid ${T.border2}`, borderRadius: 9, padding: "7px 12px", fontSize: 13, color: T.text, cursor: "pointer", outline: "none" }}>
              <option value="all">Tous les plans</option>
              <option value="free">Gratuit</option>
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
            </select>
          </div>

          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ background: "#0d1117", border: `1px solid ${T.border2}`, borderRadius: 9, padding: "7px 12px", fontSize: 13, color: T.text, cursor: "pointer", outline: "none" }}>
            <option value="all">Tous les statuts</option>
            <option value="active">Actif</option>
            <option value="expired">Expiré</option>
            <option value="free">Gratuit</option>
          </select>

          {hasFilters && (
            <button onClick={() => { setSearch(""); setPlanFilter("all"); setStatusFilter("all"); }} style={{ display: "flex", alignItems: "center", gap: 5, background: "transparent", border: `1px solid ${T.border2}`, borderRadius: 9, padding: "7px 12px", fontSize: 12, color: T.muted, cursor: "pointer" }}>
              <X style={{ width: 11, height: 11 }} /> Réinitialiser
            </button>
          )}

          <span style={{ fontSize: 12, color: T.dim, marginLeft: "auto", whiteSpace: "nowrap" }}>
            {filtered.length} / {stats.total} utilisateur{stats.total !== 1 ? "s" : ""}
          </span>

          <button
            onClick={() => downloadCsv(filtered)}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "#0d1117", border: `1px solid ${T.border2}`, borderRadius: 9, padding: "7px 13px", fontSize: 12, color: T.muted, cursor: "pointer", fontWeight: 500, whiteSpace: "nowrap" }}
          >
            <Download style={{ width: 12, height: 12 }} /> Exporter CSV
          </button>
        </div>

        {/* ── Table ───────────────────────────────────────────────────────────── */}
        <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 820 }}>
              <thead>
                <tr>
                  <SortTh sortKey="email" active={sort.key === "email"} dir={sort.dir} onClick={() => toggleSort("email")}>Email / Nom</SortTh>
                  <SortTh sortKey="createdAt" active={sort.key === "createdAt"} dir={sort.dir} onClick={() => toggleSort("createdAt")}>Date inscription</SortTh>
                  <SortTh sortKey="plan" active={sort.key === "plan"} dir={sort.dir} onClick={() => toggleSort("plan")}>Plan actuel</SortTh>
                  <SortTh sortKey="plan" active={false} dir={sort.dir}>Statut abonnement</SortTh>
                  <SortTh sortKey="plan" active={false} dir={sort.dir}>Fin abonnement</SortTh>
                  <SortTh sortKey="lastSignIn" active={sort.key === "lastSignIn"} dir={sort.dir} onClick={() => toggleSort("lastSignIn")}>Dernière connexion</SortTh>
                  <SortTh active={false} dir={sort.dir}></SortTh>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "56px 24px", color: T.dim }}>
                      <div style={{ fontSize: 32, marginBottom: 10, opacity: 0.4 }}>🔍</div>
                      <p style={{ margin: 0, fontSize: 14, color: T.muted }}>Aucun utilisateur correspondant</p>
                      {hasFilters && (
                        <button onClick={() => { setSearch(""); setPlanFilter("all"); setStatusFilter("all"); }} style={{ marginTop: 12, background: "none", border: `1px solid ${T.border2}`, borderRadius: 8, padding: "6px 16px", color: T.muted, cursor: "pointer", fontSize: 12 }}>
                          Réinitialiser les filtres
                        </button>
                      )}
                    </td>
                  </tr>
                ) : filtered.map((u, i) => (
                  <tr
                    key={u.userId}
                    style={{ borderTop: `1px solid ${T.border}`, transition: "background 0.1s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#161b22")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    {/* Email + Full Name */}
                    <td style={{ padding: "13px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: "50%", background: avatarColor(u.userId), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0, letterSpacing: "-0.5px" }}>
                          {initials(u.name)}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ margin: 0, fontWeight: 600, color: T.text, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 220 }}>{u.name}</p>
                          <p style={{ margin: "2px 0 0", color: T.muted, fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 220 }}>{u.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Signup date */}
                    <td style={{ padding: "13px 16px", color: T.muted, fontSize: 12, whiteSpace: "nowrap" }}>
                      {fmtDate(u.createdAt)}
                    </td>

                    {/* Current plan */}
                    <td style={{ padding: "13px 16px" }}>
                      <PlanBadge plan={u.plan} />
                    </td>

                    {/* Subscription status */}
                    <td style={{ padding: "13px 16px" }}>
                      <StatusBadge status={u.subscriptionStatus} />
                    </td>

                    {/* Subscription end date */}
                    <td style={{ padding: "13px 16px", color: u.periodEnd ? T.muted : T.dim, fontSize: 12, whiteSpace: "nowrap" }}>
                      {fmtDate(u.periodEnd)}
                    </td>

                    {/* Last sign-in */}
                    <td style={{ padding: "13px 16px", color: T.muted, fontSize: 12, whiteSpace: "nowrap" }}>
                      {fmtAgo(u.lastSignIn)}
                    </td>

                    {/* Stripe sync */}
                    <td style={{ padding: "13px 16px", textAlign: "right" }}>
                      {u.stripeCustomerId && (() => {
                        const st = syncingUsers[u.stripeCustomerId];
                        return (
                          <button
                            onClick={() => syncUser(u.stripeCustomerId!)}
                            disabled={st === "loading"}
                            title="Synchroniser depuis Stripe"
                            style={{
                              display: "inline-flex", alignItems: "center", gap: 4,
                              background: st === "ok" ? "#051a0a" : st === "err" ? "#1a0808" : "transparent",
                              border: `1px solid ${st === "ok" ? "#196c2e" : st === "err" ? "#7f1d1d" : T.border2}`,
                              borderRadius: 7, padding: "4px 9px", fontSize: 11,
                              color: st === "ok" ? T.green : st === "err" ? T.red : T.dim,
                              cursor: st === "loading" ? "default" : "pointer",
                              fontWeight: 500, whiteSpace: "nowrap",
                            }}
                          >
                            <RotateCw style={{ width: 10, height: 10, animation: st === "loading" ? "spin 0.8s linear infinite" : "none" }} />
                            {st === "ok" ? "Synced" : st === "err" ? "Erreur" : "Sync"}
                          </button>
                        );
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          {filtered.length > 0 && (
            <div style={{ padding: "9px 18px", borderTop: `1px solid ${T.border}`, background: "#0d1117", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 11, color: T.dim }}>
                {filtered.length} résultat{filtered.length !== 1 ? "s" : ""}{hasFilters ? ` · filtré sur ${stats.total}` : ""}
              </span>
              <button onClick={() => downloadCsv(filtered)} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", color: T.dim, cursor: "pointer", fontSize: 11, fontWeight: 500 }}>
                <Download style={{ width: 10, height: 10 }} /> CSV
              </button>
            </div>
          )}
        </div>

        <p style={{ textAlign: "center", fontSize: 11, color: T.border, marginTop: 24 }}>
          MobileMoney Manager · Console Admin · Accès confidentiel
        </p>
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: ${T.dim}; }
        select option { background: #161b22; }
      `}</style>
    </div>
  );
}
