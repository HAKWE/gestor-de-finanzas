import { useState } from "react";
import { useLocation } from "wouter";
import { useUser } from "@clerk/react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Loader2, Briefcase, User, CheckCircle2 } from "lucide-react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const CURRENCIES = [
  { code: "XOF", name: "Franc CFA (BCEAO)", flag: "🌍" },
  { code: "XAF", name: "Franc CFA (BEAC)", flag: "🌍" },
  { code: "NGN", name: "Naira nigérian", flag: "🇳🇬" },
  { code: "KES", name: "Shilling kényan", flag: "🇰🇪" },
  { code: "GHS", name: "Cédi ghanéen", flag: "🇬🇭" },
  { code: "ZAR", name: "Rand sud-africain", flag: "🇿🇦" },
  { code: "EGP", name: "Livre égyptienne", flag: "🇪🇬" },
  { code: "MAD", name: "Dirham marocain", flag: "🇲🇦" },
  { code: "TZS", name: "Shilling tanzanien", flag: "🇹🇿" },
  { code: "UGX", name: "Shilling ougandais", flag: "🇺🇬" },
  { code: "RWF", name: "Franc rwandais", flag: "🇷🇼" },
  { code: "ETB", name: "Birr éthiopien", flag: "🇪🇹" },
  { code: "USD", name: "Dollar américain", flag: "🇺🇸" },
  { code: "EUR", name: "Euro", flag: "🇪🇺" },
];

const PROVIDERS = [
  { id: "mtn", name: "MTN Mobile Money", countries: "Côte d'Ivoire, Ghana, Nigeria, Uganda, Rwanda..." },
  { id: "orange", name: "Orange Money", countries: "Sénégal, Mali, Côte d'Ivoire, Cameroun..." },
  { id: "moov", name: "Moov Money", countries: "Bénin, Togo, Burkina Faso, Niger..." },
  { id: "airtel", name: "Airtel Money", countries: "Kenya, Tanzania, Uganda, Zambia..." },
  { id: "mpesa", name: "M-Pesa", countries: "Kenya, Tanzania, Mozambique, Ghana..." },
  { id: "wave", name: "Wave", countries: "Sénégal, Côte d'Ivoire, Mali, Ouganda..." },
  { id: "free", name: "Free Money", countries: "Sénégal" },
  { id: "other", name: "Autre", countries: "" },
  { id: "none", name: "Aucun", countries: "" },
];

export default function OnboardingPage() {
  const { user, isLoaded } = useUser();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(1);
  const [accountType, setAccountType] = useState<"personal" | "business">("personal");
  const [currency, setCurrency] = useState("XOF");
  const [provider, setProvider] = useState("mtn");
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
      if (!res.ok) throw new Error("Échec de la sauvegarde.");
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      setLocation(`${basePath}/dashboard`);
    } catch {
      setError("Impossible de sauvegarder. Veuillez réessayer.");
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
              <h1 className="text-2xl font-bold">Configuration du compte</h1>
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
                  <h2 className="text-lg font-semibold">Type de compte</h2>
                  <p className="text-sm text-muted-foreground mt-1">Comment souhaitez-vous utiliser MobileMoney Manager ?</p>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {[
                    { value: "personal" as const, label: "Personnel", desc: "Pour vos finances personnelles", Icon: User },
                    { value: "business" as const, label: "Business", desc: "Pour une entreprise ou activité", Icon: Briefcase },
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
                  Continuer →
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold">Devise principale</h2>
                  <p className="text-sm text-muted-foreground mt-1">Choisissez la devise dans laquelle vous gérez vos finances.</p>
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
                    ← Retour
                  </Button>
                  <Button className="flex-1 h-11" onClick={() => setStep(3)}>
                    Continuer →
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold">Mobile Money principal</h2>
                  <p className="text-sm text-muted-foreground mt-1">Quel service de mobile money utilisez-vous le plus ?</p>
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
                    ← Retour
                  </Button>
                  <Button className="flex-1 h-11" onClick={handleFinish} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Commencer →"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {user && (
          <p className="text-center text-xs text-muted-foreground mt-4">
            Connecté en tant que {user.primaryEmailAddress?.emailAddress}
          </p>
        )}
      </div>
    </div>
  );
}
