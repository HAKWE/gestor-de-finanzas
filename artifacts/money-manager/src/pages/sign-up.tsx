import { useState } from "react";
import { useSignUp } from "@clerk/react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, CheckCircle2, XCircle } from "lucide-react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  if (password.length === 0) return { score: 0, label: "", color: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return { score, label: "Faible", color: "bg-red-500" };
  if (score === 2) return { score, label: "Moyen", color: "bg-yellow-500" };
  if (score === 3) return { score, label: "Bon", color: "bg-blue-500" };
  return { score, label: "Fort", color: "bg-green-500" };
}

function PasswordStrengthBar({ password }: { password: string }) {
  const { score, label, color } = getPasswordStrength(password);
  if (!password) return null;
  return (
    <div className="mt-1 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= score ? color : "bg-muted"}`}
          />
        ))}
      </div>
      <p className={`text-xs font-medium ${score <= 1 ? "text-red-500" : score === 2 ? "text-yellow-600" : score === 3 ? "text-blue-600" : "text-green-600"}`}>
        Force du mot de passe : {label}
      </p>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-red-500 mt-1 flex items-center gap-1"><XCircle className="h-3 w-3" />{message}</p>;
}

export default function SignUpPage() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [, setLocation] = useLocation();

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
  const [errors, setErrors] = useState<Partial<typeof form & { global: string }>>({});
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");

  function validate() {
    const e: typeof errors = {};
    if (!form.firstName.trim()) e.firstName = "Le prénom est requis.";
    if (!form.lastName.trim()) e.lastName = "Le nom est requis.";
    if (!form.email.trim()) e.email = "L'email est requis.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Email invalide.";
    if (!form.password) e.password = "Le mot de passe est requis.";
    else if (form.password.length < 8) e.password = "Minimum 8 caractères.";
    if (!form.confirmPassword) e.confirmPassword = "Confirmez votre mot de passe.";
    else if (form.password !== form.confirmPassword) e.confirmPassword = "Les mots de passe ne correspondent pas.";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      await signUp!.create({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        emailAddress: form.email.trim(),
        password: form.password,
      });
      await signUp!.prepareEmailAddressVerification({ strategy: "email_code" });
      setStep("verify");
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || "Une erreur est survenue.";
      setErrors({ global: msg });
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) { setCodeError("Entrez le code de vérification."); return; }
    setLoading(true);
    setCodeError("");
    try {
      const result = await signUp!.attemptEmailAddressVerification({ code });
      if (result.status === "complete") {
        await setActive!({ session: result.createdSessionId });
        setLocation(`${basePath}/onboarding`);
      } else {
        setCodeError("Vérification incomplète. Veuillez réessayer.");
      }
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || "Code incorrect.";
      setCodeError(msg);
    } finally {
      setLoading(false);
    }
  }

  if (!isLoaded) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-border bg-card shadow-lg overflow-hidden">
          <div className="bg-primary px-8 py-6 text-primary-foreground">
            <h1 className="text-2xl font-bold">Créer un compte</h1>
            <p className="mt-1 text-sm opacity-80">
              {step === "form" ? "Gérez votre argent comme un pro" : "Vérifiez votre adresse e-mail"}
            </p>
          </div>

          <div className="px-8 py-6">
            {step === "form" ? (
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {errors.global && (
                  <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                    {errors.global}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="firstName">Prénom</Label>
                    <Input
                      id="firstName"
                      value={form.firstName}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                      className={errors.firstName ? "border-red-400" : ""}
                      autoComplete="given-name"
                    />
                    <FieldError message={errors.firstName} />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Nom</Label>
                    <Input
                      id="lastName"
                      value={form.lastName}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                      className={errors.lastName ? "border-red-400" : ""}
                      autoComplete="family-name"
                    />
                    <FieldError message={errors.lastName} />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Adresse e-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className={errors.email ? "border-red-400" : ""}
                    autoComplete="email"
                  />
                  <FieldError message={errors.email} />
                </div>

                <div>
                  <Label htmlFor="password">Mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className={`pr-10 ${errors.password ? "border-red-400" : ""}`}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-3 flex items-center text-muted-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <PasswordStrengthBar password={form.password} />
                  <FieldError message={errors.password} />
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      value={form.confirmPassword}
                      onChange={(e) => {
                        setForm({ ...form, confirmPassword: e.target.value });
                        if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
                      }}
                      className={`pr-10 ${
                        form.confirmPassword && form.password !== form.confirmPassword
                          ? "border-red-400"
                          : form.confirmPassword && form.password === form.confirmPassword
                          ? "border-green-500"
                          : errors.confirmPassword
                          ? "border-red-400"
                          : ""
                      }`}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-3 flex items-center text-muted-foreground"
                      onClick={() => setShowConfirm(!showConfirm)}
                      tabIndex={-1}
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {form.confirmPassword && form.password === form.confirmPassword && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Les mots de passe correspondent
                    </p>
                  )}
                  {form.confirmPassword && form.password !== form.confirmPassword && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <XCircle className="h-3 w-3" /> Les mots de passe ne correspondent pas
                    </p>
                  )}
                  {!form.confirmPassword && <FieldError message={errors.confirmPassword} />}
                </div>

                <Button type="submit" className="w-full h-11 text-base" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Créer mon compte"}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Déjà un compte ?{" "}
                  <Link href={`${basePath}/sign-in`} className="text-primary font-medium hover:underline">
                    Se connecter
                  </Link>
                </p>
              </form>
            ) : (
              <form onSubmit={handleVerify} className="space-y-4">
                <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-800">
                  Un code de vérification a été envoyé à <strong>{form.email}</strong>. Vérifiez votre boîte e-mail.
                </div>

                <div>
                  <Label htmlFor="code">Code de vérification</Label>
                  <Input
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="123456"
                    className={`text-center text-2xl tracking-widest font-mono ${codeError ? "border-red-400" : ""}`}
                    autoComplete="one-time-code"
                    maxLength={6}
                    autoFocus
                  />
                  <FieldError message={codeError} />
                </div>

                <Button type="submit" className="w-full h-11 text-base" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Vérifier"}
                </Button>

                <button
                  type="button"
                  onClick={() => setStep("form")}
                  className="w-full text-center text-sm text-muted-foreground hover:underline"
                >
                  ← Retour
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
