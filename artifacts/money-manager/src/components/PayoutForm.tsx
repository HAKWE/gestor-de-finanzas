import { useState, useEffect, useRef } from "react";
import { useAuth } from "@clerk/react";
import {
  Send, CheckCircle2, AlertCircle, Loader2, ArrowLeft,
  Info, Phone, FileText, DollarSign, ShieldCheck, RefreshCw,
} from "lucide-react";

const BASE_PATH = import.meta.env.BASE_URL.replace(/\/$/, "");
const ORANGE = "#f97316";
const GREEN  = "#16a34a";
const RED    = "#dc2626";
const BORDER = "#e5e7eb";
const BG     = "#fafaf9";

// ── Country / network config ──────────────────────────────────────────────────

interface Country {
  name: string;
  flag: string;
  dialCode: string;
  currency: "XOF" | "XAF" | "NGN" | "KES" | "GHS";
  rail: string;
  providers: string[];
}

const COUNTRIES: Country[] = [
  { name: "Sénégal",       flag: "🇸🇳", dialCode: "+221", currency: "XOF", rail: "xof_local", providers: ["Wave", "Orange Money", "Free Money"] },
  { name: "Côte d'Ivoire", flag: "🇨🇮", dialCode: "+225", currency: "XOF", rail: "xof_local", providers: ["Orange Money", "MTN MoMo", "Wave", "Moov Money"] },
  { name: "Mali",           flag: "🇲🇱", dialCode: "+223", currency: "XOF", rail: "xof_local", providers: ["Orange Money", "Moov Money"] },
  { name: "Burkina Faso",   flag: "🇧🇫", dialCode: "+226", currency: "XOF", rail: "xof_local", providers: ["Orange Money", "Moov Money"] },
  { name: "Niger",          flag: "🇳🇪", dialCode: "+227", currency: "XOF", rail: "xof_local", providers: ["Orange Money", "Airtel Money"] },
  { name: "Cameroun",       flag: "🇨🇲", dialCode: "+237", currency: "XAF", rail: "xaf_local", providers: ["MTN MoMo", "Orange Money"] },
  { name: "Guinée",         flag: "🇬🇳", dialCode: "+224", currency: "XOF", rail: "xof_local", providers: ["Orange Money", "MTN MoMo"] },
  { name: "Kenya",          flag: "🇰🇪", dialCode: "+254", currency: "KES", rail: "kes_local", providers: ["M-Pesa"] },
  { name: "Nigeria",        flag: "🇳🇬", dialCode: "+234", currency: "NGN", rail: "ngn_local", providers: ["MTN MoMo", "Airtel Money"] },
  { name: "Ghana",          flag: "🇬🇭", dialCode: "+233", currency: "GHS", rail: "ghs_local", providers: ["MTN MoMo", "Vodafone Cash", "AirtelTigo Money"] },
];

const FX_RATES: Record<string, number> = {
  XOF: 610, XAF: 610, NGN: 1600, KES: 130, GHS: 16,
};

function fmtCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency", currency,
    maximumFractionDigits: currency === "KES" || currency === "NGN" ? 0 : 0,
  }).format(amount);
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface FormState {
  amountUsd: string;
  countryIdx: number;
  providerIdx: number;
  phone: string;
  recipientId: string;
  memo: string;
}

interface PayoutResult {
  transferId: string;
  status: string;
  destinationAmount?: number;
  destinationCurrency?: string;
  fxRate?: number;
}

type Step = "form" | "confirm" | "submitting" | "success" | "error";

// ── Component ─────────────────────────────────────────────────────────────────

interface PayoutFormProps {
  onSuccess?: (result: PayoutResult) => void;
}

export default function PayoutForm({ onSuccess }: PayoutFormProps) {
  const { getToken } = useAuth();

  const [form, setForm] = useState<FormState>({
    amountUsd: "",
    countryIdx: 0,
    providerIdx: 0,
    phone: "",
    recipientId: "",
    memo: "",
  });

  const [step, setStep] = useState<Step>("form");
  const [result, setResult] = useState<PayoutResult | null>(null);
  const [serverError, setServerError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const country = COUNTRIES[form.countryIdx];
  const provider = country.providers[form.providerIdx];
  const amountNum = parseFloat(form.amountUsd) || 0;
  const estimatedLocal = Math.round(amountNum * (FX_RATES[country.currency] ?? 1));

  // Reset provider if country changes
  useEffect(() => {
    setForm(f => ({ ...f, providerIdx: 0 }));
  }, [form.countryIdx]);

  // ── Validation ──────────────────────────────────────────────────────────────

  function validate(): boolean {
    const errs: Partial<Record<keyof FormState, string>> = {};
    const amt = parseFloat(form.amountUsd);
    if (!form.amountUsd || isNaN(amt))    errs.amountUsd = "Montant requis";
    else if (amt < 2)                     errs.amountUsd = "Minimum 2 USD";
    else if (amt > 10_000)                errs.amountUsd = "Maximum 10 000 USD";
    if (!form.phone.trim())               errs.phone = "Numéro requis";
    else if (!/^\+?[0-9\s\-]{7,15}$/.test(form.phone.trim()))
                                          errs.phone = "Numéro invalide";
    if (!form.recipientId.trim())         errs.recipientId = "ID destinataire requis";
    else if (!/^rcp_[a-zA-Z0-9]+$/.test(form.recipientId.trim()))
                                          errs.recipientId = "Format : rcp_xxxxxxxx";
    if (form.memo.length > 200)           errs.memo = "200 caractères max";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(f => ({ ...f, [key]: value }));
    if (fieldErrors[key]) setFieldErrors(e => ({ ...e, [key]: undefined }));
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function submitPayout() {
    setStep("submitting");
    setServerError("");
    try {
      const token = await getToken();
      const body = {
        recipientId: form.recipientId.trim(),
        source: { amount: parseFloat(form.amountUsd), currency: "USDC", rail: "base-sepolia" },
        destination: { currency: country.currency, rail: country.rail },
        memo: form.memo.trim() || undefined,
        metadata: {
          phone: form.phone.trim(),
          provider,
          country: country.name,
        },
      };
      const res = await fetch(`${BASE_PATH}/api/due/payout`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? `Erreur ${res.status}`);
      }
      const r: PayoutResult = {
        transferId: data.transferId,
        status: data.status,
        destinationAmount: data.quote?.destination?.amount,
        destinationCurrency: data.quote?.destination?.currency,
        fxRate: data.quote?.fxRate,
      };
      setResult(r);
      setStep("success");
      onSuccess?.(r);
    } catch (e: unknown) {
      setServerError(e instanceof Error ? e.message : "Erreur inconnue");
      setStep("error");
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  function reset() {
    setForm({ amountUsd: "", countryIdx: 0, providerIdx: 0, phone: "", recipientId: "", memo: "" });
    setFieldErrors({});
    setServerError("");
    setResult(null);
    setStep("form");
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  if (step === "success" && result) {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 4px" }}>
        <div style={{ background: "#fff", borderRadius: 22, border: "1px solid #dcfce7", boxShadow: "0 4px 20px rgba(22,163,74,0.10)", overflow: "hidden" }}>
          {/* Header */}
          <div style={{ background: "linear-gradient(135deg, #f0fdf4, #dcfce7)", padding: "28px 24px 20px", textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <CheckCircle2 style={{ width: 32, height: 32, color: "#fff" }} />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#14532d", margin: "0 0 6px" }}>Virement initié ✓</h2>
            <p style={{ fontSize: 13, color: "#15803d", margin: 0 }}>Le transfert a été soumis avec succès</p>
          </div>

          {/* Details */}
          <div style={{ padding: "20px 24px 24px" }}>
            <div style={{ background: "#f9fafb", borderRadius: 14, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
              <Row label="Identifiant" value={
                <code style={{ fontSize: 11, background: "#e5e7eb", borderRadius: 6, padding: "2px 7px", fontFamily: "monospace" }}>{result.transferId}</code>
              } />
              <Row label="Statut" value={
                <span style={{ fontSize: 12, fontWeight: 700, color: "#f97316", background: "#fff7ed", borderRadius: 999, padding: "3px 10px", border: "1px solid #fed7aa" }}>
                  {result.status}
                </span>
              } />
              {result.destinationAmount != null && (
                <Row label="Montant reçu" value={
                  <span style={{ fontWeight: 800, color: GREEN, fontSize: 16 }}>
                    {fmtCurrency(result.destinationAmount, result.destinationCurrency ?? country.currency)}
                  </span>
                } />
              )}
              {result.fxRate != null && (
                <Row label="Taux de change" value={`1 USD = ${result.fxRate} ${result.destinationCurrency ?? country.currency}`} />
              )}
              <Row label="Réseau" value={`${provider} · ${country.name}`} />
              <Row label="Téléphone" value={form.phone} />
            </div>

            <InfoBox icon={<Info />} color="#2563eb" bg="#eff6ff" border="#bfdbfe">
              Le statut <strong>awaiting_funds</strong> signifie que les USDC doivent encore être déposés pour compléter le transfert.
            </InfoBox>

            <button
              onClick={reset}
              style={{ marginTop: 20, width: "100%", background: ORANGE, color: "#fff", border: "none", borderRadius: 14, padding: "14px 0", fontWeight: 700, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              <RefreshCw style={{ width: 16, height: 16 }} />
              Nouveau virement
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "error") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 4px" }}>
        <div style={{ background: "#fff", borderRadius: 22, border: "1px solid #fecaca", boxShadow: "0 4px 20px rgba(220,38,38,0.08)", overflow: "hidden" }}>
          <div style={{ background: "linear-gradient(135deg, #fef2f2, #fee2e2)", padding: "28px 24px 20px", textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: RED, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <AlertCircle style={{ width: 32, height: 32, color: "#fff" }} />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#7f1d1d", margin: "0 0 8px" }}>Virement échoué</h2>
            <p style={{ fontSize: 13, color: "#b91c1c", background: "#fff", borderRadius: 10, padding: "10px 14px", margin: 0, textAlign: "left", lineHeight: 1.5 }}>{serverError}</p>
          </div>
          <div style={{ padding: "20px 24px 24px", display: "flex", gap: 10, flexDirection: "column" }}>
            <button onClick={() => setStep("confirm")} style={{ width: "100%", background: ORANGE, color: "#fff", border: "none", borderRadius: 14, padding: "14px 0", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              Réessayer
            </button>
            <button onClick={reset} style={{ width: "100%", background: "#f9fafb", color: "#374151", border: `1.5px solid ${BORDER}`, borderRadius: 14, padding: "13px 0", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
              Recommencer
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "confirm") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 4px" }}>
        <div style={{ background: "#fff", borderRadius: 22, border: `1px solid ${BORDER}`, boxShadow: "0 4px 20px rgba(0,0,0,0.06)", overflow: "hidden" }}>
          <div style={{ background: "linear-gradient(135deg, #fff7ed, #ffedd5)", padding: "24px 24px 18px" }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#431407", margin: "0 0 4px" }}>Confirmer le virement</h2>
            <p style={{ fontSize: 13, color: "#9a3412", margin: 0 }}>Vérifiez les informations avant de valider</p>
          </div>
          <div style={{ padding: "20px 24px" }}>
            <div style={{ background: "#f9fafb", borderRadius: 14, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
              <Row label="Montant envoyé" value={<span style={{ fontWeight: 800, fontSize: 17, color: "#111" }}>${parseFloat(form.amountUsd).toFixed(2)} USD</span>} />
              <Row label="Estimation reçue" value={<span style={{ fontWeight: 700, color: ORANGE }}>{fmtCurrency(estimatedLocal, country.currency)} <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 400 }}>(approx.)</span></span>} />
              <Row label="Réseau" value={`${country.flag} ${provider} · ${country.name}`} />
              <Row label="Téléphone" value={form.phone} />
              <Row label="ID destinataire" value={<code style={{ fontSize: 11, background: "#e5e7eb", borderRadius: 6, padding: "2px 7px" }}>{form.recipientId}</code>} />
              {form.memo && <Row label="Mémo" value={form.memo} />}
            </div>

            <InfoBox icon={<ShieldCheck />} color="#9333ea" bg="#faf5ff" border="#e9d5ff">
              Une fois confirmé, le transfert sera soumis à Due. Assurez-vous que l'ID destinataire correspond bien au numéro {form.phone}.
            </InfoBox>

            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button
                onClick={() => setStep("form")}
                style={{ flex: 1, background: "#f9fafb", color: "#374151", border: `1.5px solid ${BORDER}`, borderRadius: 14, padding: "13px 0", fontWeight: 600, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
              >
                <ArrowLeft style={{ width: 15, height: 15 }} />
                Modifier
              </button>
              <button
                onClick={submitPayout}
                style={{ flex: 2, background: ORANGE, color: "#fff", border: "none", borderRadius: 14, padding: "14px 0", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 4px 14px rgba(249,115,22,0.35)" }}
              >
                <Send style={{ width: 16, height: 16 }} />
                Valider le virement
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === "submitting") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 24px", gap: 16 }}>
        <div style={{ width: 72, height: 72, borderRadius: 22, background: "#fff7ed", border: `2px solid #fed7aa`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Loader2 style={{ width: 36, height: 36, color: ORANGE, animation: "spin 1s linear infinite" }} />
        </div>
        <p style={{ fontWeight: 700, fontSize: 16, color: "#111", margin: 0 }}>Traitement en cours…</p>
        <p style={{ fontSize: 13, color: "#9ca3af", margin: 0, textAlign: "center" }}>Création du devis puis du transfert. Cela peut prendre quelques secondes.</p>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Main form ────────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "0 4px", display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Admin notice */}
      <InfoBox icon={<ShieldCheck />} color="#9333ea" bg="#faf5ff" border="#e9d5ff">
        Cette fonctionnalité est réservée aux administrateurs. L'ID destinataire (<code>rcp_…</code>) doit être pré-enregistré dans Due.
      </InfoBox>

      {/* Card: Country */}
      <Card title="Pays destinataire">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
          {COUNTRIES.map((c, i) => (
            <button
              key={c.name}
              onClick={() => handleField("countryIdx", i)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 12px", borderRadius: 12, cursor: "pointer",
                border: `2px solid ${form.countryIdx === i ? ORANGE : BORDER}`,
                background: form.countryIdx === i ? "#fff7ed" : "#fff",
                fontWeight: form.countryIdx === i ? 700 : 500,
                fontSize: 13, color: "#111", transition: "all 0.15s",
              }}
            >
              <span style={{ fontSize: 20 }}>{c.flag}</span>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Card: Provider */}
      <Card title={`Réseau mobile · ${country.name}`}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {country.providers.map((p, i) => (
            <button
              key={p}
              onClick={() => handleField("providerIdx", i)}
              style={{
                padding: "8px 16px", borderRadius: 999, cursor: "pointer", fontSize: 13,
                border: `2px solid ${form.providerIdx === i ? ORANGE : BORDER}`,
                background: form.providerIdx === i ? ORANGE : "#fff",
                color: form.providerIdx === i ? "#fff" : "#374151",
                fontWeight: form.providerIdx === i ? 700 : 500,
                transition: "all 0.15s",
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </Card>

      {/* Card: Amount */}
      <Card title="Montant">
        <FieldLabel label="Montant en USD" required />
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" }}>
            <DollarSign style={{ width: 16, height: 16 }} />
          </span>
          <input
            type="number"
            min={2}
            max={10000}
            step="0.01"
            placeholder="10.00"
            value={form.amountUsd}
            onChange={e => handleField("amountUsd", e.target.value)}
            style={inputStyle(!!fieldErrors.amountUsd, true)}
          />
          <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#9ca3af", fontWeight: 600, pointerEvents: "none" }}>
            USDC
          </span>
        </div>
        {fieldErrors.amountUsd && <ErrMsg msg={fieldErrors.amountUsd} />}

        {/* Live estimate */}
        {amountNum >= 2 && (
          <div style={{ marginTop: 10, background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 12, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "#92400e", fontWeight: 600 }}>Estimation {country.currency}</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: ORANGE }}>
              ≈ {fmtCurrency(estimatedLocal, country.currency)}
            </span>
          </div>
        )}
        <p style={{ fontSize: 11, color: "#9ca3af", margin: "6px 0 0" }}>Min 2 USD · Max 10 000 USD · Taux indicatif, confirmé au moment du transfert</p>
      </Card>

      {/* Card: Recipient */}
      <Card title="Destinataire">
        <FieldLabel label="Numéro de téléphone" required />
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#9ca3af", fontWeight: 600, pointerEvents: "none" }}>
            {country.dialCode}
          </span>
          <input
            type="tel"
            placeholder="77 123 45 67"
            value={form.phone}
            onChange={e => handleField("phone", e.target.value)}
            style={{ ...inputStyle(!!fieldErrors.phone), paddingLeft: `${country.dialCode.length * 8 + 22}px` }}
          />
        </div>
        {fieldErrors.phone && <ErrMsg msg={fieldErrors.phone} />}

        <div style={{ marginTop: 14 }}>
          <FieldLabel label="ID destinataire Due (rcp_…)" required />
          <input
            type="text"
            placeholder="rcp_xxxxxxxxxxxxxxxx"
            value={form.recipientId}
            onChange={e => handleField("recipientId", e.target.value)}
            style={inputStyle(!!fieldErrors.recipientId)}
          />
          {fieldErrors.recipientId
            ? <ErrMsg msg={fieldErrors.recipientId} />
            : <p style={{ fontSize: 11, color: "#9ca3af", margin: "5px 0 0" }}>Identifiant enregistré dans le tableau de bord Due</p>
          }
        </div>
      </Card>

      {/* Card: Memo */}
      <Card title="Référence (optionnelle)">
        <div style={{ position: "relative" }}>
          <textarea
            placeholder="Ex: Paiement prestation juin…"
            value={form.memo}
            onChange={e => handleField("memo", e.target.value)}
            maxLength={200}
            rows={3}
            style={{
              width: "100%", boxSizing: "border-box",
              border: `1.5px solid ${fieldErrors.memo ? RED : BORDER}`,
              borderRadius: 12, padding: "12px 14px",
              fontSize: 14, color: "#111", outline: "none",
              resize: "vertical", fontFamily: "inherit", lineHeight: 1.5,
              background: fieldErrors.memo ? "#fef2f2" : "#fff",
            }}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          {fieldErrors.memo
            ? <ErrMsg msg={fieldErrors.memo} />
            : <span />
          }
          <span style={{ fontSize: 11, color: form.memo.length > 180 ? ORANGE : "#9ca3af" }}>{form.memo.length}/200</span>
        </div>
      </Card>

      {/* Submit */}
      <button
        onClick={() => { if (validate()) setStep("confirm"); }}
        style={{
          width: "100%", background: ORANGE, color: "#fff", border: "none",
          borderRadius: 16, padding: "16px 0", fontWeight: 800, fontSize: 15,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          gap: 10, boxShadow: "0 4px 16px rgba(249,115,22,0.35)",
          marginBottom: 8,
        }}
      >
        <Send style={{ width: 18, height: 18 }} />
        Continuer → Confirmation
      </button>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", borderRadius: 18, border: `1px solid ${BORDER}`, boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" }}>
      <div style={{ padding: "14px 18px 0" }}>
        <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>{title}</p>
      </div>
      <div style={{ padding: "0 18px 18px" }}>{children}</div>
    </div>
  );
}

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
      {label}{required && <span style={{ color: RED, marginLeft: 3 }}>*</span>}
    </label>
  );
}

function ErrMsg({ msg }: { msg: string }) {
  return <p style={{ margin: "5px 0 0", fontSize: 12, color: RED, display: "flex", alignItems: "center", gap: 4 }}><AlertCircle style={{ width: 12, height: 12 }} />{msg}</p>;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
      <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: "#111", fontWeight: 600, textAlign: "right" }}>{value}</span>
    </div>
  );
}

function InfoBox({ icon, color, bg, border, children }: { icon: React.ReactNode; color: string; bg: string; border: string; children: React.ReactNode }) {
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 12, padding: "12px 14px", display: "flex", gap: 10, alignItems: "flex-start", marginTop: 12 }}>
      <span style={{ color, flexShrink: 0, marginTop: 1 }}>{icon}</span>
      <p style={{ margin: 0, fontSize: 12, color, lineHeight: 1.6 }}>{children}</p>
    </div>
  );
}

function inputStyle(hasError: boolean, hasLeftIcon = false): React.CSSProperties {
  return {
    width: "100%",
    boxSizing: "border-box",
    border: `1.5px solid ${hasError ? RED : BORDER}`,
    borderRadius: 12,
    padding: `12px 14px 12px ${hasLeftIcon ? 38 : 14}px`,
    fontSize: 14,
    color: "#111",
    outline: "none",
    background: hasError ? "#fef2f2" : "#fff",
    fontFamily: "inherit",
  };
}
