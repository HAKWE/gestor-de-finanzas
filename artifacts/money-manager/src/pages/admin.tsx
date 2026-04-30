import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@clerk/react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const ORANGE = "#f97316";
const GREEN = "#22c55e";

// ── Types ─────────────────────────────────────────────────────────────────────
interface AdminUser {
  userId: string;
  email: string;
  name: string;
  plan: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  periodEnd: string | null;
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
  convRate: string;
}

interface AdminData {
  stats: AdminStats;
  users: AdminUser[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtRelative(iso: string | null) {
  if (!iso) return "—";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 3600)   return "Il y a " + Math.round(diff / 60) + " min";
  if (diff < 86400)  return "Il y a " + Math.round(diff / 3600) + " h";
  if (diff < 604800) return "Il y a " + Math.round(diff / 86400) + " j";
  return fmtDate(iso);
}

function planBadge(plan: string) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    free:    { label: "Gratuit",  bg: "#1f2937",       color: "#9ca3af" },
    starter: { label: "Starter",  bg: "#2e1065",       color: "#c4b5fd" },
    pro:     { label: "Pro",      bg: "#431407",       color: "#fb923c" },
  };
  const cfg = map[plan] ?? map.free;
  return (
    <span style={{
      display: "inline-block", padding: "2px 10px", borderRadius: 20,
      fontSize: 11, fontWeight: 600, background: cfg.bg, color: cfg.color,
    }}>
      {cfg.label}
    </span>
  );
}

function initials(name: string) {
  return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

const AVATAR_COLORS = ["#1d4ed8","#7c3aed","#0f766e","#b45309","#be185d","#0369a1"];
function avatarColor(id: string) {
  let hash = 0;
  for (const c of id) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ── Page admin ────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const [data, setData]     = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    setLoading(true);
    fetch(`${basePath}/api/admin/stats`, { credentials: "include" })
      .then(async r => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error || "Erreur serveur");
        return json;
      })
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [isLoaded, isSignedIn]);

  // Filtrage
  const filtered = (data?.users ?? []).filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchPlan = planFilter === "all" || u.plan === planFilter;
    return matchSearch && matchPlan;
  });

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (!isLoaded || loading) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "#030712" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, border: "3px solid #374151", borderTopColor: ORANGE, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
          <p style={{ color: "#6b7280", fontSize: 14 }}>Chargement des données…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Non connecté ────────────────────────────────────────────────────────────
  if (!isSignedIn) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "#030712" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#9ca3af", marginBottom: 16 }}>Vous devez être connecté pour accéder à cette page.</p>
          <Link href="/sign-in">
            <button style={{ background: ORANGE, color: "#fff", padding: "10px 24px", borderRadius: 12, fontWeight: 600, border: "none", cursor: "pointer" }}>
              Se connecter
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // ── Erreur / accès refusé ────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "#030712" }}>
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🚫</div>
          <h2 style={{ color: "#f1f5f9", fontWeight: 700, marginBottom: 8, fontSize: 20 }}>Accès refusé</h2>
          <p style={{ color: "#9ca3af", fontSize: 14, marginBottom: 24 }}>{error}</p>
          <Link href="/dashboard">
            <button style={{ background: "#1f2937", color: "#e5e7eb", padding: "10px 24px", borderRadius: 12, fontWeight: 600, border: "1px solid #374151", cursor: "pointer" }}>
              ← Retour au tableau de bord
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const stats = data!.stats;

  return (
    <div style={{ minHeight: "100dvh", background: "#030712", color: "#f1f5f9", fontFamily: "'Inter', sans-serif" }}>

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <nav style={{ background: "#0f172a", borderBottom: "1px solid #1e293b", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: ORANGE, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, color: "#fff" }}>
            MM
          </div>
          <span style={{ fontWeight: 600, color: "#f1f5f9" }}>Admin</span>
          <span style={{ fontSize: 11, background: "#1c1917", color: "#fb923c", padding: "2px 8px", borderRadius: 20, fontWeight: 600 }}>Accès restreint</span>
        </div>
        <Link href="/dashboard">
          <button style={{ background: "transparent", border: "1px solid #334155", color: "#94a3b8", padding: "6px 16px", borderRadius: 10, fontSize: 13, cursor: "pointer", fontWeight: 500 }}>
            ← App
          </button>
        </Link>
      </nav>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>

        {/* ── Titre ────────────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#f8fafc", margin: 0 }}>Tableau de bord admin</h1>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>Données en temps réel depuis Clerk et votre base de données.</p>
        </div>

        {/* ── Cartes stats ──────────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 28 }}>
          {[
            { label: "Inscrits total", value: stats.total, color: "#60a5fa", icon: "👥" },
            { label: "Gratuit",         value: stats.free,    color: "#94a3b8", icon: "🎁" },
            { label: "Starter",         value: stats.starter, color: "#a78bfa", icon: "⚡" },
            { label: "Pro",             value: stats.pro,     color: ORANGE,    icon: "👑" },
            { label: "Taux conversion", value: stats.convRate + "%", color: GREEN, icon: "📈" },
          ].map(c => (
            <div key={c.label} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 16, padding: "20px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: "#64748b", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>{c.label}</span>
                <span style={{ fontSize: 18 }}>{c.icon}</span>
              </div>
              <p style={{ fontSize: 30, fontWeight: 700, color: c.color, margin: 0 }}>{c.value}</p>
            </div>
          ))}
        </div>

        {/* ── Filtres ───────────────────────────────────────────────────────── */}
        <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 16, padding: 16, marginBottom: 20, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#475569", fontSize: 14 }}>🔍</span>
            <input
              type="text"
              placeholder="Rechercher par nom ou email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: "100%", background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: "9px 12px 9px 36px", fontSize: 14, color: "#f1f5f9", outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <select
            value={planFilter}
            onChange={e => setPlanFilter(e.target.value)}
            style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: "9px 14px", fontSize: 14, color: "#f1f5f9", cursor: "pointer", outline: "none" }}
          >
            <option value="all">Tous les plans</option>
            <option value="free">Gratuit</option>
            <option value="starter">Starter</option>
            <option value="pro">Pro</option>
          </select>
          <button
            onClick={() => { setSearch(""); setPlanFilter("all"); }}
            style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: "9px 16px", fontSize: 13, color: "#94a3b8", cursor: "pointer" }}
          >
            Réinitialiser
          </button>
          <span style={{ alignSelf: "center", fontSize: 13, color: "#475569", marginLeft: "auto" }}>
            {filtered.length} utilisateur{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* ── Tableau ───────────────────────────────────────────────────────── */}
        <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1e293b" }}>
                  {["Utilisateur", "Plan", "Abonnement", "Onboarding", "Inscrit", "Dernière connexion"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "12px 18px", fontSize: 11, fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "48px 24px", color: "#4b5563" }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
                      <p>Aucun utilisateur trouvé</p>
                    </td>
                  </tr>
                ) : filtered.map((u, i) => (
                  <tr
                    key={u.userId}
                    style={{ borderBottom: i < filtered.length - 1 ? "1px solid #0f172a" : "none", transition: "background 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#1e293b")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    {/* Avatar + nom + email */}
                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 34, height: 34, borderRadius: "50%", background: avatarColor(u.userId), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                          {initials(u.name)}
                        </div>
                        <div>
                          <p style={{ fontWeight: 600, color: "#f1f5f9", margin: 0, fontSize: 14 }}>{u.name}</p>
                          <p style={{ color: "#64748b", fontSize: 12, margin: "2px 0 0" }}>{u.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Plan */}
                    <td style={{ padding: "14px 18px" }}>{planBadge(u.plan)}</td>

                    {/* Abonnement Stripe */}
                    <td style={{ padding: "14px 18px" }}>
                      {u.stripeSubscriptionId ? (
                        <div>
                          <p style={{ color: "#34d399", fontSize: 12, margin: 0, fontWeight: 500 }}>✓ Actif</p>
                          {u.periodEnd && (
                            <p style={{ color: "#475569", fontSize: 11, margin: "2px 0 0" }}>Fin : {fmtDate(u.periodEnd)}</p>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: "#4b5563", fontSize: 12 }}>—</span>
                      )}
                    </td>

                    {/* Onboarding */}
                    <td style={{ padding: "14px 18px" }}>
                      <span style={{ fontSize: 12, color: u.onboardingCompleted ? "#34d399" : "#6b7280" }}>
                        {u.onboardingCompleted ? "✓ Complété" : "⏳ En cours"}
                      </span>
                    </td>

                    {/* Date inscription */}
                    <td style={{ padding: "14px 18px", color: "#64748b", fontSize: 13, whiteSpace: "nowrap" }}>
                      {fmtDate(u.createdAt)}
                    </td>

                    {/* Dernière connexion */}
                    <td style={{ padding: "14px 18px", color: "#64748b", fontSize: 13, whiteSpace: "nowrap" }}>
                      {fmtRelative(u.lastSignIn)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p style={{ textAlign: "center", fontSize: 12, color: "#1e293b", marginTop: 24 }}>
          Données en direct · {new Date().toLocaleString("fr-FR")}
        </p>
      </div>
    </div>
  );
}
