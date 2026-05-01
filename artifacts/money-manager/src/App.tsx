import { useEffect, useRef, useState } from "react";
import { ClerkProvider, Show, useClerk, useAuth, useUser, SignInButton } from '@clerk/react';
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
    colorPrimary: "hsl(24, 90%, 55%)",
    colorBackground: "hsl(30, 50%, 98%)",
    colorInputBackground: "hsl(0, 0%, 100%)",
    colorText: "hsl(140, 40%, 10%)",
    colorTextSecondary: "hsl(140, 20%, 40%)",
    colorInputText: "hsl(140, 40%, 10%)",
    colorNeutral: "hsl(140, 40%, 10%)",
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
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <Home />
      </Show>
    </>
  );
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

// ── Admin emails allowed (client-side guard — real security is on the API) ────
const ADMIN_EMAILS = ["sosthen@gmail.com"];

// Shared screen shell for admin access errors
function AdminAccessScreen({
  icon, code, title, message, detail, actions,
}: {
  icon: string; code?: string; title: string; message: string; detail?: string;
  actions: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#0d1117", fontFamily: "'Inter', system-ui, sans-serif", padding: 24 }}>
      {/* Logo strip */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 52, background: "#161b22", borderBottom: "1px solid #21262d", display: "flex", alignItems: "center", padding: "0 24px", gap: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #fb923c, #ea580c)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#fff" }}>MM</div>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#e6edf3" }}>Admin Dashboard <span style={{ color: "#7d8590", fontWeight: 400 }}>— MobileMoney Manager</span></span>
      </div>

      <div style={{ textAlign: "center", maxWidth: 440 }}>
        {/* Icon */}
        <div style={{ width: 80, height: 80, borderRadius: 24, background: "#1a0808", border: "1px solid #7f1d1d", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 38 }}>
          {icon}
        </div>
        {/* Error code badge */}
        {code && (
          <div style={{ display: "inline-block", background: "#1a0808", border: "1px solid #7f1d1d", borderRadius: 8, padding: "3px 14px", marginBottom: 14 }}>
            <span style={{ fontFamily: "monospace", fontSize: 12, color: "#f85149", fontWeight: 700, letterSpacing: "0.06em" }}>{code}</span>
          </div>
        )}
        {/* Title */}
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#e6edf3", margin: "0 0 10px", letterSpacing: "-0.02em" }}>{title}</h1>
        {/* Message */}
        <p style={{ color: "#7d8590", fontSize: 14, lineHeight: 1.65, margin: "0 0 6px" }}>{message}</p>
        {/* Detail (e.g. email) */}
        {detail && (
          <p style={{ fontFamily: "monospace", fontSize: 12, color: "#484f58", background: "#161b22", border: "1px solid #21262d", borderRadius: 8, padding: "7px 14px", display: "inline-block", margin: "6px 0 24px" }}>
            {detail}
          </p>
        )}
        {!detail && <div style={{ height: 20 }} />}
        {/* Actions */}
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          {actions}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function AdminGuard() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "") || "/";

  // Clerk still loading
  if (!isLoaded) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0d1117" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 44, height: 44, border: "3px solid #21262d", borderTopColor: "#f97316", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 14px" }} />
          <p style={{ color: "#7d8590", fontSize: 14, fontFamily: "system-ui" }}>Vérification de l'accès…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Not signed in
  if (!isSignedIn) {
    return (
      <AdminAccessScreen
        icon="🔒"
        title="Accès administrateur uniquement"
        message="Cette page est réservée à l'administrateur. Veuillez vous connecter avec le compte autorisé pour continuer."
        actions={
          <>
            <SignInButton mode="modal">
              <button style={{ background: "#f97316", color: "#fff", border: "none", borderRadius: 11, padding: "10px 24px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                Se connecter
              </button>
            </SignInButton>
            <a href="https://mobilemoneymanager.africa" style={{ textDecoration: "none" }}>
              <button style={{ background: "#161b22", border: "1px solid #30363d", color: "#e6edf3", borderRadius: 11, padding: "10px 24px", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                ← Accueil
              </button>
            </a>
          </>
        }
      />
    );
  }

  // Get primary email
  const email =
    user?.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress
    ?? user?.emailAddresses[0]?.emailAddress
    ?? "";

  // Not admin
  if (!ADMIN_EMAILS.includes(email.toLowerCase())) {
    return (
      <AdminAccessScreen
        icon="🚫"
        code="403 FORBIDDEN"
        title="Accès administrateur uniquement"
        message="Votre compte n'est pas autorisé à accéder à cette zone. Contactez l'administrateur si vous pensez que c'est une erreur."
        detail={email}
        actions={
          <a href={base || "/"} style={{ textDecoration: "none" }}>
            <button style={{ background: "#161b22", border: "1px solid #30363d", color: "#e6edf3", borderRadius: 11, padding: "10px 24px", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
              ← Retour à l'accueil
            </button>
          </a>
        }
      />
    );
  }

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

// Detect admin subdomain (works in prod and dev)
const IS_ADMIN_SUBDOMAIN =
  typeof window !== "undefined" &&
  window.location.hostname === "admin.mobilemoneymanager.africa";

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      localization={{
        signIn: {
          start: {
            title: "Bon retour !",
            subtitle: "Connectez-vous pour accéder à vos comptes",
          },
        },
        signUp: {
          start: {
            title: "Créer un compte",
            subtitle: "Gérez votre argent comme un pro",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />

        {/* admin.mobilemoneymanager.africa → always show admin guard */}
        {IS_ADMIN_SUBDOMAIN ? (
          <AdminGuard />
        ) : (
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
            <Route path="/confidentialite" component={Privacy} />
            <Route path="/conditions" component={Terms} />
            <Route path="/mentions-legales" component={Legal} />
            <Route path="/admin" component={AdminGuard} />
            <Route component={NotFound} />
          </Switch>
        )}
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <LanguageProvider>
      <TooltipProvider>
        <WouterRouter base={basePath}>
          <ClerkProviderWithRoutes />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </LanguageProvider>
  );
}

export default App;
