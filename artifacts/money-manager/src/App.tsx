import { useEffect, useRef, useState } from "react";
import { ClerkProvider, Show, useClerk, useAuth, useUser } from '@clerk/react';
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

function AdminGuard() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  if (!isLoaded) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "#030712" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 44, height: 44, border: "3px solid #21262d", borderTopColor: "#f97316", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: "#7d8590", fontSize: 14, fontFamily: "system-ui, sans-serif" }}>Vérification en cours…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Redirect to="/" />;
  }

  const email =
    user?.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress
    ?? user?.emailAddresses[0]?.emailAddress
    ?? "";

  const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase());

  if (!isAdmin) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "#030712", fontFamily: "'Inter', system-ui, sans-serif" }}>
        <div style={{ textAlign: "center", maxWidth: 420, padding: "0 24px" }}>
          {/* Icon */}
          <div style={{ width: 80, height: 80, borderRadius: 24, background: "#1a0808", border: "1px solid #7f1d1d", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: 36 }}>
            🚫
          </div>
          {/* Code */}
          <div style={{ display: "inline-block", background: "#1a0808", border: "1px solid #7f1d1d", borderRadius: 8, padding: "4px 14px", marginBottom: 16 }}>
            <span style={{ fontFamily: "monospace", fontSize: 13, color: "#f87171", fontWeight: 700, letterSpacing: "0.05em" }}>403 FORBIDDEN</span>
          </div>
          {/* Title */}
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#e6edf3", margin: "0 0 10px", letterSpacing: "-0.02em" }}>
            Accès réservé à l'administrateur
          </h1>
          {/* Desc */}
          <p style={{ color: "#7d8590", fontSize: 15, lineHeight: 1.6, margin: "0 0 8px" }}>
            Cette zone est protégée. Votre compte n'est pas autorisé à y accéder.
          </p>
          <p style={{ color: "#484f58", fontSize: 13, margin: "0 0 32px", fontFamily: "monospace", background: "#0d1117", border: "1px solid #21262d", borderRadius: 8, padding: "8px 14px", display: "inline-block" }}>
            {email}
          </p>
          {/* Action */}
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <a href={`${import.meta.env.BASE_URL || "/"}`.replace(/\/\/$/, "/")} style={{ textDecoration: "none" }}>
              <button style={{ background: "#161b22", border: "1px solid #30363d", color: "#e6edf3", padding: "10px 24px", borderRadius: 12, fontWeight: 600, cursor: "pointer", fontSize: 14 }}>
                ← Retour à l'accueil
              </button>
            </a>
          </div>
        </div>
      </div>
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
