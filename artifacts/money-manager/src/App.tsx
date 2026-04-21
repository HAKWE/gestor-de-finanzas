import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from '@clerk/react';
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from 'wouter';
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "./lib/language-context";

import Home from "./pages/home";
import SignInPage from "./pages/sign-in";
import SignUpPage from "./pages/sign-up";
import Dashboard from "./pages/dashboard";
import Transactions from "./pages/transactions";
import NewTransaction from "./pages/new-transaction";
import EditTransaction from "./pages/edit-transaction";
import Reports from "./pages/reports";
import Inventory from "./pages/inventory";
import Settings from "./pages/settings";
import Import from "./pages/import";
import NotFound from "@/pages/not-found";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
// In production the proxy middleware forwards to the correct Clerk FAPI
// (decoded from the key itself), so always use the proxy in production.
// In development the proxy middleware is bypassed, so leave it undefined.
const clerkProxyUrl: string | undefined = import.meta.env.PROD
  ? (import.meta.env.VITE_CLERK_PROXY_URL || `${window.location.origin}/api/__clerk`)
  : undefined;

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

function ProtectedRoute({ component: Component }: { component: any }) {
  return (
    <>
      <Show when="signed-in">
        <Component />
      </Show>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
    </>
  );
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
          <Route path="/dashboard"><ProtectedRoute component={Dashboard} /></Route>
          <Route path="/transactions"><ProtectedRoute component={Transactions} /></Route>
          <Route path="/transactions/new"><ProtectedRoute component={NewTransaction} /></Route>
          <Route path="/transactions/:id/edit"><ProtectedRoute component={EditTransaction} /></Route>
          <Route path="/import"><ProtectedRoute component={Import} /></Route>
          <Route path="/reports"><ProtectedRoute component={Reports} /></Route>
          <Route path="/inventory"><ProtectedRoute component={Inventory} /></Route>
          <Route path="/settings"><ProtectedRoute component={Settings} /></Route>
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
