import { useEffect, useRef, useState } from "react";
import { ClerkProvider, Show, useClerk, useAuth, useUser, SignIn } from '@clerk/react';
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

// ── The ONE authorized admin email ────────────────────────────────────────────
const ADMIN_EMAIL = "sosthen@gmail.com";

// ── Shared top bar used by all admin screens ───────────────────────────────────
function AdminTopBar() {
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 52, background: "#161b22", borderBottom: "1px solid #21262d", display: "flex", alignItems: "center", padding: "0 24px", gap: 10, zIndex: 100 }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #fb923c, #ea580c)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#fff" }}>MM</div>
      <span style={{ fontSize: 14, fontWeight: 600, color: "#e6edf3" }}>
        Admin Dashboard <span style={{ color: "#7d8590", fontWeight: 400 }}>— MobileMoney Manager</span>
      </span>
      <span style={{ fontSize: 10, fontWeight: 700, color: "#f97316", background: "#1c0904", border: "1px solid #7c2d12", borderRadius: 20, padding: "2px 9px", letterSpacing: "0.06em" }}>
        RESTREINT
      </span>
      <a href="https://mobilemoneymanager.africa" style={{ marginLeft: "auto", textDecoration: "none", fontSize: 12, color: "#7d8590", fontWeight: 500 }}>
        ← Accueil
      </a>
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
          <p style={{ color: "#7d8590", fontSize: 14 }}>Vérification de l'accès…</p>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // ── 2. Not signed in — login form only, no sign-up ──────────────────────────
  if (!isSignedIn) {
    return (
      <div style={S.page}>
        <AdminTopBar />
        <div style={S.center}>
          <p style={{ color: "#7d8590", fontSize: 13, marginBottom: 22, textAlign: "center", maxWidth: 360 }}>
            Accès administrateur — email + mot de passe uniquement.
          </p>
          <SignIn
            routing="hash"
            forceRedirectUrl={typeof window !== "undefined" ? window.location.href : "/admin"}
            appearance={{
              variables: {
                colorPrimary: "#f97316",
                colorBackground: "#161b22",
                colorText: "#e6edf3",
                colorInputBackground: "#0d1117",
                colorInputText: "#e6edf3",
                borderRadius: "10px",
              },
              elements: {
                card: { boxShadow: "none", border: "1px solid #21262d", background: "#161b22" },
                footer: { display: "none" },
                footerAction: { display: "none" },
                headerTitle: { color: "#e6edf3" },
                headerSubtitle: { color: "#7d8590" },
                // ── Disable all social/OAuth logins on admin page ──
                socialButtonsRoot: { display: "none" },
                socialButtonsBlockButton: { display: "none" },
                dividerRow: { display: "none" },
                dividerText: { display: "none" },
              },
            }}
          />
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
              <span style={{ fontFamily: "monospace", fontSize: 12, color: "#f85149", fontWeight: 700, letterSpacing: "0.06em" }}>403 — ACCÈS REFUSÉ</span>
            </div>
            <h1 style={{ fontSize: 21, fontWeight: 800, color: "#e6edf3", margin: "0 0 10px" }}>Accès administrateur uniquement</h1>
            <p style={{ color: "#7d8590", fontSize: 14, lineHeight: 1.6, margin: "0 0 6px" }}>
              Ce compte n'est pas autorisé à accéder au tableau de bord admin.
            </p>
            <p style={{ fontFamily: "monospace", fontSize: 12, color: "#484f58", background: "#161b22", border: "1px solid #21262d", borderRadius: 8, padding: "7px 14px", display: "inline-block", margin: "8px 0 24px" }}>
              {email || "compte inconnu"}
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
                {signingOut ? "Déconnexion…" : "Se déconnecter"}
              </button>
              <a href="https://mobilemoneymanager.africa/dashboard" style={{ textDecoration: "none" }}>
                <button style={{ background: "#161b22", border: "1px solid #30363d", color: "#e6edf3", borderRadius: 11, padding: "10px 22px", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                  Mon tableau de bord
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
