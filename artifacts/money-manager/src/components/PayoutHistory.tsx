import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@clerk/react";
import { Link } from "wouter";
import {
  Copy, Check, RefreshCw, Clock, Send, AlertCircle,
  CheckCircle2, XCircle, Loader2, ExternalLink,
} from "lucide-react";

const BASE_PATH = import.meta.env.BASE_URL.replace(/\/$/, "");
const GREEN   = "#16a34a";
const ORANGE  = "#f97316";
const RED     = "#ef4444";
const BORDER  = "#e5e7eb";

const PAGE_SIZE = 10;
const FETCH_LIMIT = 100;

// ── Types ─────────────────────────────────────────────────────────────────────

interface Transfer {
  id: string;
  status: string;
  created_at?: string;
  updated_at?: string;
  metadata?: Record<string, string>;
  source?: { amount?: number; currency?: string; rail?: string };
  destination?: { amount?: number; currency?: string; rail?: string };
  recipient_id?: string;
  [key: string]: unknown;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function safeGetToken(getToken: () => Promise<string | null>): Promise<string | null> {
  try { return await getToken(); } catch { return null; }
}

function normalizeTransfers(raw: unknown): Transfer[] {
  if (Array.isArray(raw)) return raw as Transfer[];
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    for (const key of ["data", "items", "transfers", "results", "content"]) {
      if (Array.isArray(obj[key])) return obj[key] as Transfer[];
    }
  }
  return [];
}

function fmtDate(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
    + " · " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function fmtAmount(n: number | undefined, currency: string | undefined): string {
  if (!n) return "—";
  const c = currency ?? "USD";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: c, maximumFractionDigits: 0 }).format(n);
}

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { color: string; bg: string; border: string; label: string; icon: React.ReactNode }> = {
  completed: {
    color: GREEN, bg: "#f0fdf4", border: "#bbf7d0", label: "Complété",
    icon: <CheckCircle2 style={{ width: 11, height: 11 }} />,
  },
  awaiting_funds: {
    color: ORANGE, bg: "#fff7ed", border: "#fed7aa", label: "En attente",
    icon: <Clock style={{ width: 11, height: 11 }} />,
  },
  pending: {
    color: ORANGE, bg: "#fff7ed", border: "#fed7aa", label: "En cours",
    icon: <Clock style={{ width: 11, height: 11 }} />,
  },
  processing: {
    color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", label: "En traitement",
    icon: <Loader2 style={{ width: 11, height: 11 }} />,
  },
  failed: {
    color: RED, bg: "#fef2f2", border: "#fecaca", label: "Échoué",
    icon: <XCircle style={{ width: 11, height: 11 }} />,
  },
  cancelled: {
    color: RED, bg: "#fef2f2", border: "#fecaca", label: "Annulé",
    icon: <XCircle style={{ width: 11, height: 11 }} />,
  },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? {
    color: "#6b7280", bg: "#f9fafb", border: BORDER, label: status,
    icon: <Clock style={{ width: 11, height: 11 }} />,
  };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 11, fontWeight: 700, color: s.color,
      background: s.bg, border: `1px solid ${s.border}`,
      borderRadius: 999, padding: "3px 10px", whiteSpace: "nowrap",
    }}>
      {s.icon}
      {s.label}
    </span>
  );
}

// ── Copyable ID ───────────────────────────────────────────────────────────────

function CopyableId({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  async function doCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  }
  return (
    <button
      onClick={doCopy}
      title="Copier l'identifiant"
      style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        background: "#f3f4f6", border: `1px solid ${BORDER}`, borderRadius: 8,
        padding: "3px 8px", cursor: "pointer", transition: "background 0.15s",
      }}
      onMouseEnter={e => (e.currentTarget.style.background = "#e5e7eb")}
      onMouseLeave={e => (e.currentTarget.style.background = "#f3f4f6")}
    >
      <code style={{ fontSize: 11, fontFamily: "monospace", color: "#374151", letterSpacing: "-0.2px" }}>
        {value.length > 20 ? `${value.slice(0, 8)}…${value.slice(-6)}` : value}
      </code>
      {copied
        ? <Check style={{ width: 11, height: 11, color: GREEN }} />
        : <Copy style={{ width: 11, height: 11, color: "#9ca3af" }} />}
    </button>
  );
}

// ── Transfer card ─────────────────────────────────────────────────────────────

function TransferCard({ t }: { t: Transfer }) {
  const phone    = t.metadata?.phone ?? "—";
  const provider = t.metadata?.provider ?? t.metadata?.country ?? "—";
  const srcAmt   = t.source?.amount;
  const srcCur   = t.source?.currency ?? "USD";
  const dstAmt   = t.destination?.amount;
  const dstCur   = t.destination?.currency;

  const isCompleted = t.status === "completed";
  const accentColor = isCompleted ? GREEN : STATUS_MAP[t.status]?.color ?? "#6b7280";

  return (
    <div style={{
      background: "#fff", border: `1.5px solid ${BORDER}`, borderRadius: 18,
      overflow: "hidden", transition: "box-shadow 0.15s",
    }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.07)")}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
    >
      {/* Top strip */}
      <div style={{ height: 3, background: accentColor, opacity: 0.6 }} />

      <div style={{ padding: "14px 18px" }}>
        {/* Row 1: ID + status + date */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          <CopyableId value={t.id} />
          <StatusBadge status={t.status} />
          <span style={{ marginLeft: "auto", fontSize: 11, color: "#9ca3af", whiteSpace: "nowrap" }}>
            {fmtDate(t.created_at)}
          </span>
        </div>

        {/* Row 2: amounts + recipient */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <div style={{ background: "#f9fafb", borderRadius: 12, padding: "10px 12px" }}>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Envoyé</p>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#111" }}>
              {srcAmt != null ? fmtAmount(srcAmt, srcCur) : "—"}
            </p>
          </div>
          <div style={{ background: "#f9fafb", borderRadius: 12, padding: "10px 12px" }}>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Reçu</p>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: isCompleted ? GREEN : "#111" }}>
              {dstAmt != null ? fmtAmount(dstAmt, dstCur) : "—"}
            </p>
          </div>
          <div style={{ background: "#f9fafb", borderRadius: 12, padding: "10px 12px" }}>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Téléphone</p>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#374151", lineHeight: 1.3 }}>
              {phone}
              {provider !== "—" && <span style={{ display: "block", fontSize: 10, color: "#9ca3af", fontWeight: 500, marginTop: 1 }}>{provider}</span>}
            </p>
          </div>
        </div>

        {/* Subscription renewal tag */}
        {t.metadata?.paymentType === "subscription_renewal" && (
          <div style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: ORANGE, background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 999, padding: "3px 9px" }}>
            <CheckCircle2 style={{ width: 11, height: 11 }} />
            Renouvellement d'abonnement
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PayoutHistory() {
  const { getToken } = useAuth();
  const [transfers, setTransfers]   = useState<Transfer[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState("");
  const [visible, setVisible]       = useState(PAGE_SIZE);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchTransfers = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError("");
    try {
      const token = await safeGetToken(getToken);
      const res = await fetch(`${BASE_PATH}/api/due/transfers?limit=${FETCH_LIMIT}`, {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as any).error ?? `Erreur ${res.status}`);
      }
      const raw = await res.json();
      const list = normalizeTransfers(raw);
      list.sort((a, b) => {
        const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
        const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
        return tb - ta;
      });
      setTransfers(list);
      setLastRefresh(new Date());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur de chargement");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getToken]);

  // Initial load
  useEffect(() => { fetchTransfers(); }, [fetchTransfers]);

  // Auto-refresh every 20 s
  useEffect(() => {
    intervalRef.current = setInterval(() => fetchTransfers(true), 20_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchTransfers]);

  const shown = transfers.slice(0, visible);
  const hasMore = visible < transfers.length;

  // ── Loading state ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 260, gap: 12 }}>
        <Loader2 style={{ width: 32, height: 32, color: ORANGE, animation: "spin 0.9s linear infinite" }} />
        <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>Chargement des virements…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={{ background: "#fef2f2", border: "1.5px solid #fecaca", borderRadius: 18, padding: "24px 20px", textAlign: "center", maxWidth: 480, margin: "0 auto" }}>
        <AlertCircle style={{ width: 32, height: 32, color: RED, margin: "0 auto 12px" }} />
        <p style={{ fontSize: 14, color: "#7f1d1d", fontWeight: 600, margin: "0 0 6px" }}>Impossible de charger l'historique</p>
        <p style={{ fontSize: 13, color: "#b91c1c", margin: "0 0 16px" }}>{error}</p>
        <button
          onClick={() => fetchTransfers()}
          style={{ background: RED, color: "#fff", border: "none", borderRadius: 12, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
        >
          Réessayer
        </button>
      </div>
    );
  }

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (transfers.length === 0) {
    return (
      <div style={{ background: "#fff", border: `1.5px solid ${BORDER}`, borderRadius: 20, padding: "48px 24px", textAlign: "center", maxWidth: 480, margin: "0 auto" }}>
        <div style={{ width: 64, height: 64, borderRadius: 20, background: "#fff7ed", border: "1.5px solid #fed7aa", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <Send style={{ width: 28, height: 28, color: ORANGE }} />
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: "#111", margin: "0 0 8px" }}>Aucun virement pour l'instant</h3>
        <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 24px", lineHeight: 1.6 }}>
          Vos paiements Mobile Money apparaîtront ici une fois effectués.
        </p>
        <Link href="/payout">
          <button style={{ background: ORANGE, color: "#fff", border: "none", borderRadius: 13, padding: "12px 24px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            Effectuer un paiement →
          </button>
        </Link>
      </div>
    );
  }

  // ── List ─────────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 600, margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Header bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>
            {transfers.length} virement{transfers.length > 1 ? "s" : ""}
          </span>
          {lastRefresh && (
            <span style={{ fontSize: 11, color: "#9ca3af" }}>
              · Mis à jour {lastRefresh.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
        <button
          onClick={() => fetchTransfers(true)}
          disabled={refreshing}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "#f9fafb", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "6px 12px", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#374151" }}
        >
          <RefreshCw style={{ width: 13, height: 13, animation: refreshing ? "spin 0.9s linear infinite" : undefined }} />
          {refreshing ? "Actualisation…" : "Actualiser"}
        </button>
      </div>

      {/* Auto-refresh notice */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "8px 14px" }}>
        <Clock style={{ width: 13, height: 13, color: GREEN, flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: "#15803d" }}>
          Actualisation automatique toutes les 20 secondes
        </span>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }`}</style>

      {/* Transfer cards */}
      {shown.map((tr, i) => (
        <div key={tr.id} style={{ animation: `fadeUp 0.25s ease ${Math.min(i, 6) * 40}ms both` }}>
          <TransferCard t={tr} />
        </div>
      ))}

      {/* Voir plus */}
      {hasMore && (
        <button
          onClick={() => setVisible(v => v + PAGE_SIZE)}
          style={{
            width: "100%", background: "#fff", border: `1.5px solid ${BORDER}`,
            borderRadius: 14, padding: "13px 0", fontWeight: 700, fontSize: 14,
            color: "#374151", cursor: "pointer", transition: "background 0.15s",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "#f9fafb")}
          onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
        >
          Voir plus ({transfers.length - visible} restants)
        </button>
      )}

      {/* Footer link */}
      <div style={{ textAlign: "center", paddingTop: 8 }}>
        <Link href="/payout">
          <span style={{ fontSize: 13, color: ORANGE, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}>
            <ExternalLink style={{ width: 13, height: 13 }} />
            Effectuer un nouveau paiement
          </span>
        </Link>
      </div>
    </div>
  );
}
