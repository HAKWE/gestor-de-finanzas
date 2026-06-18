import { useState } from "react";
import { useLocation } from "wouter";
import { useUser } from "@clerk/react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Loader2, Briefcase, User, CheckCircle2 } from "lucide-react";

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

const PROVIDERS = [
  { id: "mercadopago", name: "Mercado Pago", countries: "Argentina, México, Colombia, Brasil, Chile, Perú..." },
  { id: "nequi", name: "Nequi", countries: "Colombia" },
  { id: "oxxo", name: "OXXO Pay", countries: "México" },
  { id: "yape", name: "Yape", countries: "Perú" },
  { id: "daviplata", name: "Daviplata", countries: "Colombia" },
  { id: "pix", name: "Pix", countries: "Brasil" },
  { id: "clip", name: "Clip", countries: "México" },
  { id: "other", name: "Otro", countries: "" },
  { id: "none", name: "Ninguno", countries: "" },
];

export default function OnboardingPage() {
  const { user, isLoaded } = useUser();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(1);
  const [accountType, setAccountType] = useState<"personal" | "business">("personal");
  const [currency, setCurrency] = useState("MXN");
  const [provider, setProvider] = useState("mercadopago");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!isLoaded) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  async function handleFinish() {
    setSaving(true);
    setError("");
    try {
      const firstName = sessionStorage.getItem("pendingFirstName");
      const lastName = sessionStorage.getItem("pendingLastName");
      if (user && (firstName || lastName)) {
        try {
          await user.update({
            ...(firstName ? { firstName } : {}),
            ...(lastName ? { lastName } : {}),
          });
        } catch {
          // name update failure is non-blocking
        }
        sessionStorage.removeItem("pendingFirstName");
        sessionStorage.removeItem("pendingLastName");
      }

      const res = await fetch(`${basePath}/api/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          accountType,
          currency,
          mobileMoneyProvider: provider === "none" ? null : provider,
          onboardingCompleted: true,
        }),
      });
      if (!res.ok) throw new Error("Error al guardar.");
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      setLocation(`${basePath}/dashboard`);
    } catch {
      setError("No se pudo guardar. Por favor intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  const totalSteps = 3;

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="rounded-2xl border border-border bg-card shadow-lg overflow-hidden">
          <div className="bg-primary px-8 py-6 text-primary-foreground">
            <div className="flex items-center justify-between mb-1">
              <h1 className="text-2xl font-bold">Configuración de cuenta</h1>
              <span className="text-sm opacity-70">{step}/{totalSteps}</span>
            </div>
            <div className="mt-3 flex gap-1.5">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${s <= step ? "bg-white" : "bg-white/30"}`}
                />
              ))}
            </div>
          </div>

          <div className="px-8 py-6">
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold">Tipo de cuenta</h2>
                  <p className="text-sm text-muted-foreground mt-1">¿Cómo quieres usar Gestor de Finanzas?</p>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {[
                    { value: "personal" as const, label: "Personal", desc: "Para tus finanzas personales", Icon: User },
                    { value: "business" as const, label: "Negocio", desc: "Para un negocio o actividad", Icon: Briefcase },
                  ].map(({ value, label, desc, Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setAccountType(value)}
                      className={`relative rounded-xl border-2 p-4 text-left transition-all duration-200 ${
                        accountType === value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      {accountType === value && (
                        <CheckCircle2 className="absolute top-3 right-3 h-4 w-4 text-primary" />
                      )}
                      <Icon className={`h-6 w-6 mb-2 ${accountType === value ? "text-primary" : "text-muted-foreground"}`} />
                      <p className="font-semibold text-sm">{label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                    </button>
                  ))}
                </div>
                <Button className="w-full h-11 mt-2" onClick={() => setStep(2)}>
                  Continuar →
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold">Moneda principal</h2>
                  <p className="text-sm text-muted-foreground mt-1">Elige la moneda en la que manejas tus finanzas.</p>
                </div>
                <div className="max-h-64 overflow-y-auto rounded-xl border border-border divide-y divide-border">
                  {CURRENCIES.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => setCurrency(c.code)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                        currency === c.code ? "bg-primary/5" : "hover:bg-muted/50"
                      }`}
                    >
                      <span className="text-xl">{c.flag}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{c.code}</p>
                        <p className="text-xs text-muted-foreground truncate">{c.name}</p>
                      </div>
                      {currency === c.code && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 h-11" onClick={() => setStep(1)}>
                    ← Volver
                  </Button>
                  <Button className="flex-1 h-11" onClick={() => setStep(3)}>
                    Continuar →
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold">Billetera digital principal</h2>
                  <p className="text-sm text-muted-foreground mt-1">¿Qué servicio de pago digital usas más?</p>
                </div>
                <div className="max-h-64 overflow-y-auto rounded-xl border border-border divide-y divide-border">
                  {PROVIDERS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setProvider(p.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                        provider === p.id ? "bg-primary/5" : "hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{p.name}</p>
                        {p.countries && <p className="text-xs text-muted-foreground truncate">{p.countries}</p>}
                      </div>
                      {provider === p.id && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                    </button>
                  ))}
                </div>

                {error && (
                  <p className="text-sm text-red-500">{error}</p>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 h-11" onClick={() => setStep(2)} disabled={saving}>
                    ← Volver
                  </Button>
                  <Button className="flex-1 h-11" onClick={handleFinish} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Empezar →"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {user && (
          <p className="text-center text-xs text-muted-foreground mt-4">
            Conectado como {user.primaryEmailAddress?.emailAddress}
          </p>
        )}
      </div>
    </div>
  );
}
