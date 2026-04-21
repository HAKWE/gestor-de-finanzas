import { useState } from "react";
import { useSignUp } from "@clerk/react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Eye, EyeOff, Loader2 } from "lucide-react";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-red-500 mt-1">{message}</p>;
}

export default function SignUpPage() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [, setLocation] = useLocation();
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  const [step, setStep] = useState<"form" | "verify">("form");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

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

  function validate() {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = "Le prénom est requis.";
    if (!form.lastName.trim()) e.lastName = "Le nom est requis.";
    if (!form.email.trim()) e.email = "L'adresse e-mail est requise.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Adresse e-mail invalide.";
    if (!form.password) e.password = "Le mot de passe est requis.";
    else if (form.password.length < 8)
      e.password = "Le mot de passe doit contenir au moins 8 caractères.";
    if (!form.confirmPassword)
      e.confirmPassword = "Veuillez confirmer votre mot de passe.";
    else if (form.password !== form.confirmPassword)
      e.confirmPassword = "Les mots de passe ne correspondent pas.";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    if (!isLoaded) return;

    setLoading(true);
    setGlobalError("");
    try {
      await signUp.create({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        emailAddress: form.email.trim(),
        password: form.password,
        unsafeMetadata: {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
        },
      });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setStep("verify");
    } catch (err: any) {
      console.error("Signup error:", JSON.stringify(err?.errors ?? err));
      const clerkMsg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message;
      const msg = clerkMsg || "Une erreur est survenue. Veuillez réessayer.";
      setGlobalError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded) return;
    if (!code.trim()) { setCodeError("Veuillez entrer le code reçu."); return; }

    setLoading(true);
    setCodeError("");
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        setLocation(`${basePath}/dashboard`);
      }
    } catch (err: any) {
      const msg =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        "Code incorrect. Veuillez réessayer.";
      setCodeError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <img src="/logo.svg" alt="MobileMoney" className="w-14 h-14" />
          <span className="font-bold text-xl text-primary">MobileMoney Manager</span>
        </div>

        {step === "form" ? (
          <div className="bg-card border rounded-2xl shadow-sm p-8 space-y-6">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold">Créer un compte</h1>
              <p className="text-muted-foreground text-sm">Gérez votre argent comme un pro.</p>
            </div>

            {globalError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                {globalError}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input
                    id="firstName"
                    placeholder="Jean"
                    value={form.firstName}
                    onChange={(e) => set("firstName", e.target.value)}
                    className={errors.firstName ? "border-red-400" : ""}
                    autoComplete="given-name"
                  />
                  <FieldError message={errors.firstName} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="lastName">Nom</Label>
                  <Input
                    id="lastName"
                    placeholder="Dupont"
                    value={form.lastName}
                    onChange={(e) => set("lastName", e.target.value)}
                    className={errors.lastName ? "border-red-400" : ""}
                    autoComplete="family-name"
                  />
                  <FieldError message={errors.lastName} />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="email">Adresse e-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="jean@exemple.com"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  className={errors.email ? "border-red-400" : ""}
                  autoComplete="email"
                />
                <FieldError message={errors.email} />
              </div>

              <div className="space-y-1">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="8 caractères minimum"
                    value={form.password}
                    onChange={(e) => set("password", e.target.value)}
                    className={`pr-10 ${errors.password ? "border-red-400" : ""}`}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <FieldError message={errors.password} />
              </div>

              <div className="space-y-1">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Répétez le mot de passe"
                    value={form.confirmPassword}
                    onChange={(e) => set("confirmPassword", e.target.value)}
                    className={`pr-10 ${errors.confirmPassword ? "border-red-400" : ""}`}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <FieldError message={errors.confirmPassword} />
              </div>

              <Button type="submit" className="w-full rounded-xl h-12 text-base font-semibold" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Créer mon compte
              </Button>
            </form>

            {/* Trust text */}
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
          <div className="bg-card border rounded-2xl shadow-sm p-8 space-y-6">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold">Vérifiez votre e-mail</h1>
              <p className="text-muted-foreground text-sm">
                Un code à 6 chiffres a été envoyé à <strong>{form.email}</strong>.
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
                  className={`text-center text-xl tracking-widest ${codeError ? "border-red-400" : ""}`}
                  maxLength={6}
                  inputMode="numeric"
                  autoFocus
                />
                <FieldError message={codeError} />
              </div>

              <Button type="submit" className="w-full rounded-xl h-12 text-base font-semibold" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Vérifier et continuer
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              Pas reçu ?{" "}
              <button
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
