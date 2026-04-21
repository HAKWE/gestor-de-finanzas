import { useState, useEffect } from "react";
import { useSignUp } from "@clerk/react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Eye, EyeOff, Loader2, AlertCircle, RefreshCw } from "lucide-react";

export default function SignUpPage() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [, setLocation] = useLocation();
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  const [clerkTimedOut, setClerkTimedOut] = useState(false);

  useEffect(() => {
    if (isLoaded) return;
    const t = setTimeout(() => setClerkTimedOut(true), 30000);
    return () => clearTimeout(t);
  }, [isLoaded]);

  const [step, setStep] = useState<"form" | "verify">("form");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState("");
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
    setGlobalError("");
  }

  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = "Le prénom est requis.";
    if (!form.lastName.trim()) e.lastName = "Le nom est requis.";
    if (!form.email.trim()) e.email = "L'adresse e-mail est requise.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Adresse e-mail invalide.";
    if (!form.password) e.password = "Le mot de passe est requis.";
    else if (form.password.length < 8)
      e.password = "Au moins 8 caractères.";
    if (!form.confirmPassword) e.confirmPassword = "Veuillez confirmer.";
    else if (form.password !== form.confirmPassword)
      e.confirmPassword = "Les mots de passe ne correspondent pas.";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGlobalError("");

    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    if (!isLoaded || !signUp) {
      setGlobalError("Le service d'authentification n'est pas encore prêt. Rechargez la page.");
      return;
    }

    setSubmitting(true);
    try {
      await signUp.create({
        emailAddress: form.email.trim(),
        password: form.password,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        unsafeMetadata: {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
        },
      });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setStep("verify");
    } catch (err: any) {
      console.error("Signup error:", err);
      const code = err?.errors?.[0]?.code;
      const longMsg = err?.errors?.[0]?.longMessage;
      const shortMsg = err?.errors?.[0]?.message;

      if (code === "form_identifier_exists") {
        setGlobalError("Un compte avec cet e-mail existe déjà. Connectez-vous plutôt.");
      } else if (code === "form_password_pwned" || code === "form_password_length_too_short") {
        setErrors((e) => ({ ...e, password: longMsg || "Mot de passe trop faible." }));
      } else {
        setGlobalError(longMsg || shortMsg || "Une erreur est survenue. Veuillez réessayer.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded || !signUp) return;
    if (!code.trim()) { setCodeError("Veuillez entrer le code reçu."); return; }

    setSubmitting(true);
    setCodeError("");
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        setLocation("/dashboard");
      }
    } catch (err: any) {
      console.error("Verify error:", err);
      const msg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || "Code incorrect.";
      setCodeError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const hasErrors = Object.values(errors).some(Boolean);

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-2 mb-8">
          <img src="/logo.svg" alt="MobileMoney" className="w-14 h-14" />
          <span className="font-bold text-xl text-primary">MobileMoney Manager</span>
        </div>

        {step === "form" ? (
          <div className="bg-card border rounded-2xl shadow-sm p-6 md:p-8 space-y-5">
            <div>
              <h1 className="text-2xl font-bold">Créer un compte</h1>
              <p className="text-muted-foreground text-sm mt-1">Gérez votre argent comme un pro.</p>
            </div>

            {globalError && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{globalError}</span>
              </div>
            )}

            {hasErrors && !globalError && (
              <div className="flex items-start gap-3 bg-orange-50 border border-orange-200 text-orange-700 text-sm rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Veuillez corriger les champs en rouge ci-dessous.</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="firstName">Prénom *</Label>
                  <Input
                    id="firstName"
                    placeholder="Jean"
                    value={form.firstName}
                    onChange={(e) => set("firstName", e.target.value)}
                    className={errors.firstName ? "border-red-400 focus-visible:ring-red-400" : ""}
                    autoComplete="given-name"
                  />
                  {errors.firstName && <p className="text-xs text-red-500">{errors.firstName}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="lastName">Nom *</Label>
                  <Input
                    id="lastName"
                    placeholder="Dupont"
                    value={form.lastName}
                    onChange={(e) => set("lastName", e.target.value)}
                    className={errors.lastName ? "border-red-400 focus-visible:ring-red-400" : ""}
                    autoComplete="family-name"
                  />
                  {errors.lastName && <p className="text-xs text-red-500">{errors.lastName}</p>}
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="email">Adresse e-mail *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="jean@exemple.com"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  className={errors.email ? "border-red-400 focus-visible:ring-red-400" : ""}
                  autoComplete="email"
                />
                {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="password">Mot de passe *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="8 caractères minimum"
                    value={form.password}
                    onChange={(e) => set("password", e.target.value)}
                    className={`pr-10 ${errors.password ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                    autoComplete="new-password"
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Répétez le mot de passe"
                    value={form.confirmPassword}
                    onChange={(e) => set("confirmPassword", e.target.value)}
                    className={`pr-10 ${errors.confirmPassword ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                    autoComplete="new-password"
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
              </div>

              {clerkTimedOut && !isLoaded ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Le service d'authentification n'a pas pu démarrer. Veuillez recharger la page.</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full rounded-xl h-12 text-base font-semibold"
                    onClick={() => window.location.reload()}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Recharger la page
                  </Button>
                </div>
              ) : (
                <Button
                  type="submit"
                  className="w-full rounded-xl h-12 text-base font-semibold mt-2"
                  disabled={submitting || !isLoaded}
                >
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" />Création en cours…</>
                  ) : !isLoaded ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" />Chargement…</>
                  ) : (
                    "Créer mon compte"
                  )}
                </Button>
              )}
            </form>

            <div className="flex items-start gap-2 bg-muted/50 rounded-xl px-4 py-3">
              <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Vos données sont chiffrées et ne sont jamais partagées. Votre compte peut être supprimé à tout moment.
              </p>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              Déjà un compte ?{" "}
              <Link href={`${basePath}/sign-in`} className="text-primary font-medium hover:underline">
                Se connecter
              </Link>
            </p>
          </div>
        ) : (
          <div className="bg-card border rounded-2xl shadow-sm p-6 md:p-8 space-y-5">
            <div>
              <h1 className="text-2xl font-bold">Vérifiez votre e-mail</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Un code à 6 chiffres a été envoyé à{" "}
                <strong className="text-foreground">{form.email}</strong>.
              </p>
            </div>

            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="code">Code de vérification</Label>
                <Input
                  id="code"
                  placeholder="123456"
                  value={code}
                  onChange={(e) => { setCode(e.target.value); setCodeError(""); }}
                  className={`text-center text-2xl tracking-[0.5em] font-mono ${codeError ? "border-red-400" : ""}`}
                  maxLength={6}
                  inputMode="numeric"
                  autoFocus
                />
                {codeError && (
                  <div className="flex items-center gap-2 text-red-500 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {codeError}
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full rounded-xl h-12 text-base font-semibold" disabled={submitting}>
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" />Vérification…</>
                ) : "Vérifier et accéder à mon compte"}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              Pas reçu ?{" "}
              <button
                type="button"
                className="text-primary font-medium hover:underline"
                onClick={() => signUp?.prepareEmailAddressVerification({ strategy: "email_code" })}
              >
                Renvoyer le code
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
