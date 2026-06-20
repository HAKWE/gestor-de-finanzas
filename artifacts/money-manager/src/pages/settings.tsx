import { useState, useEffect } from "react";
import { useLanguage } from "../lib/language-context";
import { Layout } from "../components/layout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { usePwaInstall } from "../hooks/use-pwa-install";
import { Smartphone, CheckCircle2, Loader2 } from "lucide-react";
import { ReferralCard } from "../components/referral-card";
import { useQueryClient } from "@tanstack/react-query";

const ORANGE = "#f97316";
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const CURRENCIES = [
  { code: "MXN", name: "Peso mexicano", flag: "🇲🇽" },
  { code: "COP", name: "Peso colombiano", flag: "🇨🇴" },
  { code: "ARS", name: "Peso argentino", flag: "🇦🇷" },
  { code: "BRL", name: "Real brasileño", flag: "🇧🇷" },
  { code: "PEN", name: "Sol peruano", flag: "🇵🇪" },
  { code: "CLP", name: "Peso chileno", flag: "🇨🇱" },
  { code: "VES", name: "Bolívar venezolano", flag: "🇻🇪" },
  { code: "BOB", name: "Boliviano", flag: "🇧🇴" },
  { code: "PYG", name: "Guaraní paraguayo", flag: "🇵🇾" },
  { code: "UYU", name: "Peso uruguayo", flag: "🇺🇾" },
  { code: "DOP", name: "Peso dominicano", flag: "🇩🇴" },
  { code: "GTQ", name: "Quetzal guatemalteco", flag: "🇬🇹" },
  { code: "USD", name: "Dólar estadounidense", flag: "🇺🇸" },
  { code: "EUR", name: "Euro", flag: "🇪🇺" },
];

export default function Settings() {
  const { t, language, setLanguage } = useLanguage();
  const { canInstall, isInstalled, install } = usePwaInstall();
  const fr = language !== "en";
  const queryClient = useQueryClient();

  const [currency, setCurrency] = useState<string>("");
  const [currencySaving, setCurrencySaving] = useState(false);
  const [currencySaved, setCurrencySaved] = useState(false);

  useEffect(() => {
    fetch(`${basePath}/api/profile`, { credentials: "include" })
      .then((r) => r.ok ? r.json() : null)
      .then((profile) => {
        if (profile?.currency) setCurrency(profile.currency);
      })
      .catch(() => {});
  }, []);

  async function saveCurrency(newCurrency: string) {
    setCurrency(newCurrency);
    setCurrencySaving(true);
    setCurrencySaved(false);
    try {
      const res = await fetch(`${basePath}/api/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currency: newCurrency }),
      });
      if (res.ok) {
        await queryClient.invalidateQueries({ queryKey: ["profile"] });
        await queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
        setCurrencySaved(true);
        setTimeout(() => setCurrencySaved(false), 2000);
      }
    } catch {
    } finally {
      setCurrencySaving(false);
    }
  }

  return (
    <Layout>
      <div style={{ maxWidth: 600, margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: "#111" }}>{t("nav.settings")}</h1>
          <p style={{ color: "#6b7280", marginTop: 4, fontSize: 14 }}>
            {fr ? "Personaliza tu experiencia." : "Customize your experience."}
          </p>
        </div>

        {/* Preferences */}
        <div style={{
          background: "#fff", borderRadius: 18, border: "1px solid #f0ede9",
          boxShadow: "0 1px 4px rgba(0,0,0,0.05)", overflow: "hidden",
        }}>
          <div style={{ padding: "18px 20px", borderBottom: "1px solid #f5f3f0" }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#111" }}>
              {fr ? "Preferencias" : "Preferences"}
            </div>
            <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 2 }}>
              {fr ? "Gestiona el idioma y la moneda." : "Manage language and currency."}
            </div>
          </div>
          <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <Label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
                {fr ? "Idioma de la aplicación" : "App language"}
              </Label>
              <div style={{ marginTop: 8 }}>
                <Select value={language} onValueChange={(val: "es" | "en") => setLanguage(val)}>
                  <SelectTrigger>
                    <SelectValue placeholder={fr ? "Elige el idioma" : "Choose language"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="es">🇪🇸 Español</SelectItem>
                    <SelectItem value="en">🇬🇧 English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
                {fr ? "Moneda principal" : "Primary currency"}
              </Label>
              <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <Select
                    value={currency}
                    onValueChange={saveCurrency}
                    disabled={!currency || currencySaving}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={fr ? "Cargando…" : "Loading…"} />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.flag} {c.name} ({c.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {currencySaving && <Loader2 style={{ width: 18, height: 18, color: ORANGE, animation: "spin 1s linear infinite", flexShrink: 0 }} />}
                {currencySaved && <CheckCircle2 style={{ width: 18, height: 18, color: "#16a34a", flexShrink: 0 }} />}
              </div>
              <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 6 }}>
                {fr
                  ? "Se aplica a todos los saldos y transacciones nuevas."
                  : "Applied to all balances and new transactions."}
              </p>
            </div>
          </div>
        </div>

        {/* Referral */}
        <ReferralCard />

        {/* PWA install */}
        <div style={{
          background: "#fff", borderRadius: 18, border: "1px solid #f0ede9",
          boxShadow: "0 1px 4px rgba(0,0,0,0.05)", overflow: "hidden",
        }}>
          <div style={{ padding: "18px 20px", borderBottom: "1px solid #f5f3f0", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: ORANGE + "18", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Smartphone style={{ width: 18, height: 18, color: ORANGE }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#111" }}>
                {fr ? "Aplicación móvil" : "Mobile app"}
              </div>
              <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 1 }}>
                {fr
                  ? "Instala la app para acceder sin navegador."
                  : "Install the app to access it without a browser."}
              </div>
            </div>
          </div>
          <div style={{ padding: 20 }}>
            {isInstalled ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#16a34a" }}>
                <CheckCircle2 style={{ width: 20, height: 20, flexShrink: 0 }} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>
                  {fr ? "La app ya está instalada en este dispositivo." : "App already installed on this device."}
                </span>
              </div>
            ) : canInstall ? (
              <button onClick={install} style={{
                width: "100%", background: ORANGE, color: "#fff", border: "none",
                borderRadius: 12, padding: "12px 20px", fontWeight: 700, fontSize: 14,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}>
                <Smartphone style={{ width: 18, height: 18 }} />
                {fr ? "Instalar la aplicación" : "Install app"}
              </button>
            ) : (
              <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.7 }}>
                <p style={{ fontWeight: 600, color: "#374151", marginBottom: 8 }}>
                  {fr ? "Cómo instalar:" : "How to install:"}
                </p>
                <p><strong>iOS (Safari):</strong> {fr ? "Botón Compartir" : "Share button"} ⬆ → {fr ? "Agregar a inicio" : "Add to Home Screen"}</p>
                <p><strong>Android (Chrome):</strong> Menú ⋮ → {fr ? "Agregar a pantalla de inicio" : "Add to Home screen"}</p>
              </div>
            )}
          </div>
        </div>

        {/* Legal links */}
        <div style={{
          borderRadius: 14, border: "1px solid #f0ede9", background: "#fafaf9",
          padding: "16px 20px", display: "flex", flexWrap: "wrap", gap: 16,
        }}>
          {[
            { href: "mailto:support@gestordefinanzas.app", label: fr ? "Contacto y Soporte" : "Contact & Support" },
            { href: "/confidentialite", label: fr ? "Política de privacidad" : "Privacy Policy" },
            { href: "/conditions", label: fr ? "Términos de uso" : "Terms of Service" },
            { href: "/mentions-legales", label: fr ? "Aviso legal" : "Legal notice" },
          ].map(({ href, label }) => (
            <a key={label} href={href} style={{ fontSize: 13, color: "#9ca3af", textDecoration: "none" }}>
              {label}
            </a>
          ))}
        </div>
      </div>
    </Layout>
  );
}
