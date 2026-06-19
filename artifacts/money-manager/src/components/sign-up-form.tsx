import { useState } from "react";
import { useClerk, useAuth } from "@clerk/react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, CheckCircle2, XCircle } from "lucide-react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const CLERK_ERROR_ES: Record<string, string> = {
  form_password_pwned:
    "Esta contraseña ha sido encontrada en una filtración de datos. Por tu seguridad, usa una contraseña diferente.",
  form_password_not_strong_enough:
    "Tu contraseña no es lo suficientemente segura.",
  form_password_length_too_short:
    "La contraseña es demasiado corta. Mínimo 8 caracteres.",
  form_identifier_exists:
    "Ya existe una cuenta con este correo. Inicia sesión en su lugar.",
  form_param_format_invalid:
    "El formato del correo electrónico no es válido.",
  form_password_incorrect: "Contraseña incorrecta.",
};

function translateClerkError(err: any): string {
  const code: string = err?.errors?.[0]?.code ?? "";
  if (code && CLERK_ERROR_ES[code]) return CLERK_ERROR_ES[code];
  return (
    err?.errors?.[0]?.longMessage ||
    err?.errors?.[0]?.message ||
    err?.message ||
    "No se pudo crear la cuenta. Inténtalo de nuevo."
  );
}

function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  if (password.length === 0) return { score: 0, label: "", color: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return { score, label: "Débil", color: "bg-red-500" };
  if (score === 2) return { score, label: "Regular", color: "bg-yellow-500" };
  if (score === 3) return { score, label: "Buena", color: "bg-blue-500" };
  return { score, label: "Fuerte", color: "bg-green-500" };
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
      <p
        className={`text-xs font-medium ${score <= 1 ? "text-red-500" : score === 2 ? "text-yellow-600" : score === 3 ? "text-blue-600" : "text-green-600"}`}
      >
        Seguridad: {label}
      </p>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
      <XCircle className="h-3 w-3 shrink-0" />
      {message}
    </p>
  );
}

interface SignUpFormProps {
  showTitle?: boolean;
  fullForm?: boolean;
  simpleForm?: boolean;
}

export function SignUpForm({
  showTitle = false,
  fullForm = false,
  simpleForm = false,
}: SignUpFormProps) {
  const { isLoaded } = useAuth();
  const clerk = useClerk();
  const [, setLocation] = useLocation();

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
  const [errors, setErrors] = useState<
    Partial<typeof form & { global: string }>
  >({});
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");

  function validate() {
    const e: typeof errors = {};
    if (fullForm && !form.firstName.trim()) e.firstName = "Nombre requerido.";
    if (fullForm && !form.lastName.trim()) e.lastName = "Apellido requerido.";
    if (!form.email.trim()) e.email = "Email requerido.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Email inválido.";
    if (!form.password) e.password = "Contraseña requerida.";
    else if (form.password.length < 8) e.password = "Mínimo 8 caracteres.";
    if (!simpleForm) {
      if (!form.confirmPassword)
        e.confirmPassword = "Confirma tu contraseña.";
      else if (form.password !== form.confirmPassword)
        e.confirmPassword = "Las contraseñas no coinciden.";
    }
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    if (!isLoaded || !clerk?.client) {
      setErrors({ global: "Servicio no disponible. Recarga la página." });
      return;
    }

    setSubmitting(true);
    setErrors({});

    try {
      const signUp = clerk.client.signUp;
      const result = await signUp.create({
        emailAddress: form.email.trim(),
        password: form.password,
        firstName: form.firstName.trim() || undefined,
        lastName: form.lastName.trim() || undefined,
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });

      if (result.status === "complete") {
        await clerk.setActive({ session: result.createdSessionId });
        setLocation(`${basePath}/onboarding`);
      } else {
        setStep("verify");
      }
    } catch (err: any) {
      setErrors({ global: translateClerkError(err) });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) {
      setCodeError("Introduce el código de verificación.");
      return;
    }
    if (!clerk?.client) {
      setCodeError("Servicio no disponible. Recarga la página.");
      return;
    }

    setSubmitting(true);
    setCodeError("");
    try {
      const signUp = clerk.client.signUp;
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === "complete") {
        await clerk.setActive({ session: result.createdSessionId });
        if (form.firstName.trim())
          sessionStorage.setItem("pendingFirstName", form.firstName.trim());
        if (form.lastName.trim())
          sessionStorage.setItem("pendingLastName", form.lastName.trim());
        const refCode = localStorage.getItem("referralCode");
        if (refCode) {
          try {
            await fetch(`${basePath}/api/referral/claim`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ code: refCode }),
            });
          } catch (_) {}
          localStorage.removeItem("referralCode");
        }
        setLocation(`${basePath}/onboarding`);
      } else {
        setCodeError("Verificación incompleta. Inténtalo de nuevo.");
      }
    } catch (err: any) {
      const msg =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        "Código incorrecto.";
      setCodeError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "verify") {
    return (
      <form onSubmit={handleVerify} className="space-y-4">
        {showTitle && (
          <div className="mb-2">
            <h2 className="text-xl font-bold">Verifica tu correo</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Se envió un código a <strong>{form.email}</strong>
            </p>
          </div>
        )}
        <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-800">
          Código enviado a <strong>{form.email}</strong>. Revisa tu bandeja de entrada.
        </div>
        <div>
          <Label htmlFor="code">Código de verificación</Label>
          <Input
            id="code"
            value={code}
            onChange={(e) =>
              setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            placeholder="123456"
            className={`text-center text-2xl tracking-widest font-mono ${codeError ? "border-red-400" : ""}`}
            autoComplete="one-time-code"
            maxLength={6}
            autoFocus
          />
          <FieldError message={codeError} />
        </div>
        <Button
          type="submit"
          className="w-full h-11 text-base"
          disabled={submitting}
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Verificar"
          )}
        </Button>
        <button
          type="button"
          onClick={() => setStep("form")}
          className="w-full text-center text-sm text-muted-foreground hover:underline"
        >
          ← Volver
        </button>
      </form>
    );
  }

  const buttonDisabled = submitting || !isLoaded;

  return (
    <form onSubmit={handleSubmit} className="space-y-3" noValidate>
      {showTitle && (
        <div className="mb-1">
          <h2 className="text-xl font-bold">Crear una cuenta</h2>
          <p className="text-sm text-muted-foreground">
            Gestiona tu dinero como un profesional
          </p>
        </div>
      )}

      {errors.global && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {errors.global}
        </div>
      )}

      {fullForm && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="sf-firstName">Nombre</Label>
            <Input
              id="sf-firstName"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              className={errors.firstName ? "border-red-400" : ""}
              autoComplete="given-name"
            />
            <FieldError message={errors.firstName} />
          </div>
          <div>
            <Label htmlFor="sf-lastName">Apellido</Label>
            <Input
              id="sf-lastName"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              className={errors.lastName ? "border-red-400" : ""}
              autoComplete="family-name"
            />
            <FieldError message={errors.lastName} />
          </div>
        </div>
      )}

      <div>
        <Label htmlFor="sf-email">Correo electrónico</Label>
        <Input
          id="sf-email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className={errors.email ? "border-red-400" : ""}
          autoComplete="email"
        />
        <FieldError message={errors.email} />
      </div>

      <div>
        <Label htmlFor="sf-password">Contraseña</Label>
        <div className="relative">
          <Input
            id="sf-password"
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
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        <PasswordStrengthBar password={form.password} />
        <FieldError message={errors.password} />
      </div>

      {!simpleForm && (
        <div>
          <Label htmlFor="sf-confirmPassword">Confirmar contraseña</Label>
          <div className="relative">
            <Input
              id="sf-confirmPassword"
              type={showConfirm ? "text" : "password"}
              value={form.confirmPassword}
              onChange={(e) => {
                setForm({ ...form, confirmPassword: e.target.value });
                if (errors.confirmPassword)
                  setErrors({ ...errors, confirmPassword: undefined });
              }}
              className={`pr-10 ${
                form.confirmPassword && form.password !== form.confirmPassword
                  ? "border-red-400"
                  : form.confirmPassword &&
                      form.password === form.confirmPassword
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
              {showConfirm ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {form.confirmPassword && form.password === form.confirmPassword && (
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Las contraseñas coinciden
            </p>
          )}
          {form.confirmPassword && form.password !== form.confirmPassword && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <XCircle className="h-3 w-3" /> Las contraseñas no coinciden
            </p>
          )}
          {!form.confirmPassword && (
            <FieldError message={errors.confirmPassword} />
          )}
        </div>
      )}

      <Button
        type="submit"
        className="w-full mt-1"
        style={{
          height: 52,
          fontSize: 16,
          fontWeight: 800,
          letterSpacing: "-0.01em",
        }}
        disabled={buttonDisabled}
      >
        {submitting ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : !isLoaded ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Cargando...
          </>
        ) : (
          "Crear mi cuenta →"
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
        <Link
          href={`${basePath}/sign-in`}
          className="text-primary font-medium hover:underline"
        >
          Iniciar sesión
        </Link>
      </p>
    </form>
  );
}
