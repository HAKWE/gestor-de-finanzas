import { useEffect, useRef, useState, Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { ClerkProvider, Show, useClerk, useAuth, useUser } from '@clerk/react';
import { esES } from '@clerk/localizations';
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from 'wouter';
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQueryClient, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "./lib/language-context";
import { Loader2 } from "lucide-react";

import Home from "./pages/home";
import SignInPage from "./pages/sign-in";
import SignUpPage from "./pages/sign-up";
import OnboardingPage from "./pages/onboarding";
import Dashboard from "./pages/dashboard";
import Transactions from "./pages/transactions";
import NewTransaction from "./pages/new-transaction";
import EditTransaction from "./pages/edit-transaction";
import Reports from "./pages/reports";
import Inventory from "./pages/inventory";
import Settings from "./pages/settings";
import Import from "./pages/import";
import Pricing from "./pages/pricing";
import Success from "./pages/success";
import Subscription from "./pages/subscription";
import Privacy from "./pages/privacy";
import Terms from "./pages/terms";
import Legal from "./pages/legal";
import AdminPage from "./pages/admin";
import ReferralRedirectPage from "./pages/referral-redirect";
import Payout from "./pages/payout";
import Payouts from "./pages/payouts";
import NotFound from "@/pages/not-found";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

const clerkAppearance = {
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(160, 84%, 39%)",
    colorBackground: "hsl(0, 0%, 98%)",
    colorInputBackground: "hsl(0, 0%, 100%)",
    colorText: "hsl(220, 20%, 12%)",
    colorTextSecondary: "hsl(220, 10%, 46%)",
    colorInputText: "hsl(220, 20%, 12%)",
    colorNeutral: "hsl(220, 20%, 12%)",
    borderRadius: "0.75rem",
    fontFamily: "'Inter', sans-serif",
  },
  elements: {
    rootBox: "w-full",
    cardBox: "rounded-2xl w-full overflow-hidden border border-border shadow-lg",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: { color: "hsl(140, 40%, 10%)" },
    headerSubtitle: { color: "hsl(140, 20%, 40%)" },
    socialButtonsBlockButtonText: { color: "hsl(140, 40%, 10%)" },
    formFieldLabel: { color: "hsl(140, 40%, 10%)" },
    footerActionLink: { color: "hsl(24, 90%, 55%)" },
    footerActionText: { color: "hsl(140, 20%, 40%)" },
    dividerText: { color: "hsl(140, 20%, 40%)" },
    identityPreviewEditButton: { color: "hsl(24, 90%, 55%)" },
    formFieldSuccessText: { color: "hsl(140, 40%, 10%)" },
    alertText: { color: "hsl(0, 84%, 60%)" },
    formButtonPrimary: "bg-primary hover:bg-primary/90 text-white rounded-xl h-12 text-lg font-medium",
  },
};

function HomeRedirect() {
  const { isLoaded, isSignedIn } = useAuth();
  // While Clerk is initialising (or fails to reach FAPI in dev), show the
  // landing page so there is never a blank screen. Once loaded, redirect
  // signed-in users to the dashboard.
  if (!isLoaded || !isSignedIn) return <Home />;
  return <Redirect to="/dashboard" />;
}

async function fetchProfile() {
  const res = await fetch(`${basePath}/api/profile`, { credentials: "include" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch profile");
  return res.json();
}

function ProtectedRoute({ component: Component }: { component: any }) {
  const { isSignedIn, isLoaded } = useAuth();
  const [, setLocation] = useLocation();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfile,
    enabled: !!isSignedIn,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  if (!isLoaded || (isSignedIn && profileLoading)) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isSignedIn) return <Redirect to="/" />;

  if (profile === null || (profile && !profile.onboardingCompleted)) {
    return <Redirect to="/onboarding" />;
  }

  return <Component />;
}

// ── The ONE authorized admin email ────────────────────────────────────────────
const ADMIN_EMAIL = "sosthen@gmail.com";

// ── Shared top bar used by all admin screens ───────────────────────────────────
function AdminTopBar() {
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 52, background: "#161b22", borderBottom: "1px solid #21262d", display: "flex", alignItems: "center", padding: "0 24px", gap: 10, zIndex: 100 }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #fb923c, #ea580c)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#fff" }}>MM</div>
      <span style={{ fontSize: 14, fontWeight: 600, color: "#e6edf3" }}>
        Admin Dashboard <span style={{ color: "#7d8590", fontWeight: 400 }}>— Gestor de Finanzas</span>
      </span>
      <span style={{ fontSize: 10, fontWeight: 700, color: "#f97316", background: "#1c0904", border: "1px solid #7c2d12", borderRadius: 20, padding: "2px 9px", letterSpacing: "0.06em" }}>
        RESTRINGIDO
      </span>
      <a href="https://mobilemoneymanager.africa" style={{ marginLeft: "auto", textDecoration: "none", fontSize: 12, color: "#7d8590", fontWeight: 500 }}>
        ← Inicio
      </a>
    </div>
  );
}

// ── Custom admin sign-in form (full style control, email+password + OTP step) ──
function AdminSignInForm() {
  // Use useClerk() instead of useSignIn() to avoid isLoaded blocking on admin path.
  // clerk.client is available as soon as Clerk initialises; no extra async step needed.
  const clerk = useClerk();

  // step: "password"  → user types email+password
  //       "otp"       → Client Trust 2nd factor code
  //       "emailcode" → passwordless: code sent to email (no password needed)
  const [step, setStep]           = useState<"password" | "otp" | "emailcode">("password");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [showPwd, setShowPwd]     = useState(false);
  const [otp, setOtp]             = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  const inputStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box",
    background: "#0d1117", border: "1px solid #30363d", borderRadius: 8,
    padding: "11px 14px", fontSize: 14, color: "#e6edf3",
    outline: "none", fontFamily: "inherit",
  };
  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 13, fontWeight: 600, color: "#8b949e", marginBottom: 6,
  };

  // ── Step 1: email + password ─────────────────────────────────────────────────
  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    const signInResource = clerk.client?.signIn;
    if (!signInResource) {
      setError("El servicio de autenticación no está listo. Recarga la página.");
      return;
    }
    setError(""); setLoading(true);
    try {
      const result = await signInResource.create({ identifier: email.trim(), password });
      if (result.status === "complete") {
        await clerk.setActive({ session: result.createdSessionId });
      } else if (result.status === "needs_second_factor") {
        // Client Trust: a code has been sent to the email — show OTP input
        setStep("otp");
      } else if (result.status === "needs_first_factor") {
        // Fallback: try preparing email_code factor
        const emailFactor = signInResource.supportedFirstFactors?.find((f: any) => f.strategy === "email_code");
        await signInResource.prepareFirstFactor({ strategy: "email_code", emailAddressId: emailFactor?.emailAddressId ?? "" });
        setStep("otp");
      } else {
        setError("Paso de autenticación desconocido. Contacta al administrador.");
      }
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || "Correo o contraseña incorrectos.";
      setError(msg);
    } finally { setLoading(false); }
  }

  // ── Step 2: OTP code (Client Trust second factor after password) ─────────────
  async function handleOtp(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    const signInResource = clerk.client?.signIn;
    if (!signInResource) {
      setError("El servicio de autenticación no está listo. Recarga la página.");
      return;
    }
    setError(""); setLoading(true);
    try {
      // Try second factor first (Client Trust), then first factor email_code
      let result: any;
      try {
        result = await signInResource.attemptSecondFactor({ strategy: "email_code", code: otp.trim() });
      } catch {
        result = await signInResource.attemptFirstFactor({ strategy: "email_code", code: otp.trim() });
      }
      if (result.status === "complete") {
        await clerk.setActive({ session: result.createdSessionId });
      } else {
        setError("Código incorrecto o expirado. Inténtalo de nuevo.");
      }
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || "Código incorrecto o expirado.";
      setError(msg);
    } finally { setLoading(false); }
  }

  // ── Passwordless: send email code (no password required) ─────────────────────
  async function handleSendEmailCode(e: React.MouseEvent | React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    const signInResource = clerk.client?.signIn;
    if (!signInResource) {
      setError("El servicio de autenticación no está listo. Recarga la página.");
      return;
    }
    if (!email.trim()) {
      setError("Primero ingresa tu correo electrónico.");
      return;
    }
    setError(""); setLoading(true);
    try {
      await signInResource.create({ strategy: "email_code", identifier: email.trim() });
      setStep("emailcode");
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || "No se pudo enviar el código. Verifica el correo electrónico.";
      setError(msg);
    } finally { setLoading(false); }
  }

  // ── Verify email code (passwordless step) ─────────────────────────────────────
  async function handleVerifyEmailCode(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    const signInResource = clerk.client?.signIn;
    if (!signInResource) {
      setError("El servicio de autenticación no está listo. Recarga la página.");
      return;
    }
    setError(""); setLoading(true);
    try {
      const result = await signInResource.attemptFirstFactor({ strategy: "email_code", code: otp.trim() });
      if (result.status === "complete") {
        await clerk.setActive({ session: result.createdSessionId });
      } else {
        setError("Código incorrecto o expirado. Inténtalo de nuevo.");
      }
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || "Código incorrecto o expirado.";
      setError(msg);
    } finally { setLoading(false); }
  }

  const stepSubtitle = step === "password"
    ? "Email + contraseña"
    : step === "emailcode"
    ? `Código enviado a ${email}`
    : `Verificación 2FA — ${email}`;

  const header = (
    <div style={{ textAlign: "center", marginBottom: 28 }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,#fb923c,#ea580c)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: "#fff", margin: "0 auto 14px" }}>MM</div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#e6edf3", margin: "0 0 6px" }}>Acceso administrador</h2>
      <p style={{ fontSize: 13, color: "#7d8590", margin: 0 }}>{stepSubtitle}</p>
    </div>
  );

  const errorBox = error ? (
    <div style={{ background: "#1a0808", border: "1px solid #7f1d1d", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#f85149" }}>
      {error}
    </div>
  ) : null;

  const submitBtn = (label: string) => (
    <button type="submit" disabled={loading}
      style={{ width: "100%", background: "#f97316", color: "#fff", border: "none", borderRadius: 9, padding: "12px 0", fontWeight: 700, fontSize: 15, cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1, fontFamily: "inherit" }}>
      {loading ? "Conectando…" : label}
    </button>
  );

  return (
    <div style={{ width: "100%", maxWidth: 380, padding: "0 16px" }}>
      <div style={{ background: "#161b22", border: "1px solid #21262d", borderRadius: 12, padding: "32px 28px" }}>
        {header}

        {/* ── STEP 1: password ── */}
        {step === "password" && (
          <form onSubmit={handlePassword}>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Correo electrónico</label>
              <input type="email" required autoComplete="username"
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="sosthen@gmail.com" style={inputStyle} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Contraseña</label>
              <div style={{ position: "relative" }}>
                <input type={showPwd ? "text" : "password"} required autoComplete="current-password"
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" style={{ ...inputStyle, paddingRight: 44 }} />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#7d8590", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 0 }}
                  aria-label={showPwd ? "Ocultar" : "Mostrar"}>
                  {showPwd ? "🙈" : "👁️"}
                </button>
              </div>
            </div>
            {errorBox}
            {submitBtn("Iniciar sesión")}
            <div style={{ margin: "16px 0 0", textAlign: "center" }}>
              <span style={{ fontSize: 12, color: "#484f58" }}>¿Sin contraseña?</span>
              {" "}
              <button type="button" disabled={loading}
                onClick={handleSendEmailCode}
                style={{ background: "none", border: "none", color: "#f97316", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
                {loading ? "Enviando…" : "Iniciar sesión por código de email"}
              </button>
            </div>
          </form>
        )}

        {/* ── STEP 2: OTP (Client Trust second factor) ── */}
        {step === "otp" && (
          <form onSubmit={handleOtp}>
            <div style={{ background: "#0d2818", border: "1px solid #166534", borderRadius: 8, padding: "10px 14px", marginBottom: 20, fontSize: 13, color: "#86efac" }}>
              Se envió un código de verificación a <strong>{email}</strong>. Revisa tu bandeja de entrada.
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Código de verificación</label>
              <input type="text" required autoComplete="one-time-code" inputMode="numeric"
                value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 8))}
                placeholder="123456" maxLength={8}
                style={{ ...inputStyle, letterSpacing: "0.2em", textAlign: "center", fontSize: 20 }} />
            </div>
            {errorBox}
            {submitBtn("Verificar código")}
            <button type="button" onClick={() => { setStep("password"); setOtp(""); setError(""); }}
              style={{ width: "100%", background: "none", border: "none", color: "#7d8590", fontSize: 13, marginTop: 12, cursor: "pointer", fontFamily: "inherit" }}>
              ← Volver
            </button>
          </form>
        )}

        {/* ── STEP 3: Email code (passwordless) ── */}
        {step === "emailcode" && (
          <form onSubmit={handleVerifyEmailCode}>
            <div style={{ background: "#0d2818", border: "1px solid #166534", borderRadius: 8, padding: "10px 14px", marginBottom: 20, fontSize: 13, color: "#86efac" }}>
              Se envió un código de 6 dígitos a <strong>{email}</strong>. Revisa tu bandeja de entrada.
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Código por email</label>
              <input type="text" required autoComplete="one-time-code" inputMode="numeric"
                value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 8))}
                placeholder="123456" maxLength={8} autoFocus
                style={{ ...inputStyle, letterSpacing: "0.2em", textAlign: "center", fontSize: 20 }} />
            </div>
            {errorBox}
            {submitBtn("Verificar código")}
            <button type="button" onClick={() => { setStep("password"); setOtp(""); setError(""); }}
              style={{ width: "100%", background: "none", border: "none", color: "#7d8590", fontSize: 13, marginTop: 12, cursor: "pointer", fontFamily: "inherit" }}>
              ← Volver
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ── AdminGuard: three possible outcomes ───────────────────────────────────────
//   1. Not loaded / forcing sign-out → spinner
//   2. Not signed in  → embedded Clerk sign-in form (no sign-up, no redirect away)
//   3. Signed in      → check email: admin → show dashboard | else → 403 + sign-out
function AdminGuard() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user }                 = useUser();
  const { signOut }              = useClerk();
  const [signingOut, setSigningOut] = useState(false);
  // Force re-authentication every time the admin page is opened.
  // If a session exists, sign it out first so the user must always type their password.
  // readyToShow stays false (spinner) until we know isSignedIn=false for certain.
  const [readyToShow, setReadyToShow] = useState(false);
  const didSignOut = useRef(false);     // have we issued the signOut call?
  const didRelease = useRef(false);     // have we flipped readyToShow?

  useEffect(() => {
    if (!isLoaded) return;

    if (!didSignOut.current) {
      didSignOut.current = true;
      if (isSignedIn) {
        // Kick off sign-out; wait for Clerk to flip isSignedIn→false (next effect run)
        signOut().catch(() => {});
        return;
      }
    }

    // We reach here either: (a) was already signed out, or (b) sign-out completed
    // and Clerk re-ran this effect with isSignedIn=false.
    if (!isSignedIn && !didRelease.current) {
      didRelease.current = true;
      setReadyToShow(true);
    }
    // Once the user re-authenticates through the form, isSignedIn flips back to true.
    // didRelease is already true so we won't reset readyToShow → dashboard is shown.
  }, [isLoaded, isSignedIn, signOut]);

  const S = {
    page:    { minHeight: "100dvh", background: "#0d1117", fontFamily: "'Inter', system-ui, sans-serif" } as React.CSSProperties,
    center:  { paddingTop: 52, display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", flex: 1, minHeight: "calc(100dvh - 52px)" },
  };

  // ── 1. Clerk still initialising, or silently signing out previous session ────
  if (!isLoaded || !readyToShow) {
    return (
      <div style={{ ...S.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 44, height: 44, border: "3px solid #21262d", borderTopColor: "#f97316", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 14px" }} />
          <p style={{ color: "#7d8590", fontSize: 14 }}>Verificando acceso…</p>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // ── 2. Not signed in — custom login form (email + password only) ────────────
  if (!isSignedIn) {
    return (
      <div style={S.page}>
        <AdminTopBar />
        <div style={S.center}>
          <AdminSignInForm />
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // ── 3a. Signed in — resolve primary email ───────────────────────────────────
  const email = (
    user?.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress
    ?? user?.emailAddresses[0]?.emailAddress
    ?? ""
  ).trim().toLowerCase();

  // ── 3b. Wrong account — 403 + sign-out button ───────────────────────────────
  if (email !== ADMIN_EMAIL) {
    return (
      <div style={S.page}>
        <AdminTopBar />
        <div style={S.center}>
          <div style={{ textAlign: "center", maxWidth: 420, padding: "0 24px" }}>
            <div style={{ width: 76, height: 76, borderRadius: 22, background: "#1a0808", border: "1px solid #7f1d1d", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 36 }}>🚫</div>
            <div style={{ display: "inline-block", background: "#1a0808", border: "1px solid #7f1d1d", borderRadius: 7, padding: "3px 13px", marginBottom: 14 }}>
              <span style={{ fontFamily: "monospace", fontSize: 12, color: "#f85149", fontWeight: 700, letterSpacing: "0.06em" }}>403 — ACCESO DENEGADO</span>
            </div>
            <h1 style={{ fontSize: 21, fontWeight: 800, color: "#e6edf3", margin: "0 0 10px" }}>Acceso solo para administradores</h1>
            <p style={{ color: "#7d8590", fontSize: 14, lineHeight: 1.6, margin: "0 0 6px" }}>
              Esta cuenta no tiene autorización para acceder al panel de administración.
            </p>
            <p style={{ fontFamily: "monospace", fontSize: 12, color: "#484f58", background: "#161b22", border: "1px solid #21262d", borderRadius: 8, padding: "7px 14px", display: "inline-block", margin: "8px 0 24px" }}>
              {email || "cuenta desconocida"}
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <button
                disabled={signingOut}
                onClick={() => {
                  setSigningOut(true);
                  signOut().catch(() => setSigningOut(false));
                }}
                style={{ background: "#f97316", color: "#fff", border: "none", borderRadius: 11, padding: "10px 22px", fontWeight: 700, fontSize: 14, cursor: signingOut ? "default" : "pointer", opacity: signingOut ? 0.6 : 1 }}
              >
                {signingOut ? "Cerrando sesión…" : "Cerrar sesión"}
              </button>
              <a href="https://mobilemoneymanager.africa/dashboard" style={{ textDecoration: "none" }}>
                <button style={{ background: "#161b22", border: "1px solid #30363d", color: "#e6edf3", borderRadius: 11, padding: "10px 22px", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                  Mi panel de control
                </button>
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── 3c. Correct admin email — show dashboard ─────────────────────────────────
  return <AdminPage />;
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

// Detect admin subdomain
const IS_ADMIN_SUBDOMAIN =
  typeof window !== "undefined" &&
  window.location.hostname === "admin.mobilemoneymanager.africa";

// If on the admin subdomain, redirect immediately to the main domain's /admin path.
// Clerk's useSignIn() only works on the authorised domain (mobilemoneymanager.africa);
// the subdomain shares the same static build but Clerk cannot initialise signIn there.
if (IS_ADMIN_SUBDOMAIN) {
  window.location.replace("https://mobilemoneymanager.africa/admin");
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      localization={{
        ...esES,
        signIn: {
          ...esES.signIn,
          start: {
            ...(esES.signIn as Record<string, unknown>)?.["start"] as object,
            title: "¡Bienvenido de nuevo!",
            subtitle: "Inicia sesión para acceder a tus cuentas",
          },
        },
        signUp: {
          ...esES.signUp,
          start: {
            ...(esES.signUp as Record<string, unknown>)?.["start"] as object,
            title: "Crea tu cuenta gratis",
            subtitle: "Gestiona tu dinero como un profesional",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />

        {/* The admin subdomain redirects to /admin at module level before rendering */}
        <Switch>
          <Route path="/" component={HomeRedirect} />
          <Route path="/sign-in/*?" component={SignInPage} />
          <Route path="/sign-up/*?" component={SignUpPage} />
          <Route path="/onboarding" component={OnboardingPage} />
          <Route path="/dashboard"><ProtectedRoute component={Dashboard} /></Route>
          <Route path="/transactions"><ProtectedRoute component={Transactions} /></Route>
          <Route path="/transactions/new"><ProtectedRoute component={NewTransaction} /></Route>
          <Route path="/transactions/:id/edit"><ProtectedRoute component={EditTransaction} /></Route>
          <Route path="/import"><ProtectedRoute component={Import} /></Route>
          <Route path="/reports"><ProtectedRoute component={Reports} /></Route>
          <Route path="/inventory"><ProtectedRoute component={Inventory} /></Route>
          <Route path="/settings"><ProtectedRoute component={Settings} /></Route>
          <Route path="/pricing" component={Pricing} />
          <Route path="/success" component={Success} />
          <Route path="/subscription"><ProtectedRoute component={Subscription} /></Route>
          <Route path="/payout"><ProtectedRoute component={Payout} /></Route>
          <Route path="/payouts"><ProtectedRoute component={Payouts} /></Route>
          <Route path="/confidentialite" component={Privacy} />
          <Route path="/conditions" component={Terms} />
          <Route path="/mentions-legales" component={Legal} />
          <Route path="/admin" component={AdminGuard} />
          <Route path="/ref/:code" component={ReferralRedirectPage} />
          <Route component={NotFound} />
        </Switch>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

class AppErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[AppErrorBoundary]", error, info.componentStack);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100dvh", padding: 32, textAlign: "center", fontFamily: "sans-serif" }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#111", marginBottom: 8 }}>Algo salió mal</h1>
          <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 24 }}>Por favor, recarga la página. Si el problema persiste, contacta al soporte.</p>
          <button
            onClick={() => window.location.reload()}
            style={{ background: "#f97316", color: "#fff", border: "none", borderRadius: 12, padding: "12px 28px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
          >
            Recargar la página
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <AppErrorBoundary>
      <LanguageProvider>
        <TooltipProvider>
          <WouterRouter base={basePath}>
            <ClerkProviderWithRoutes />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </LanguageProvider>
    </AppErrorBoundary>
  );
}

export default App;
