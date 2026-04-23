import { Link } from "wouter";
import { useState, useEffect } from "react";
import { useLanguage } from "../lib/language-context";
import { Button } from "@/components/ui/button";
import { usePwaInstall } from "../hooks/use-pwa-install";
import { SignUpForm } from "@/components/sign-up-form";
import {
  Wallet,
  TrendingUp,
  ShieldCheck,
  UserPlus,
  PlusCircle,
  BarChart2,
  Smartphone,
  CheckCircle,
  X,
} from "lucide-react";

export default function Home() {
  const { language } = useLanguage();
  const { canInstall, isInstalled, install } = usePwaInstall();
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const fr = language === "fr";

  const isAndroid = /android/i.test(navigator.userAgent);
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isMobile = isAndroid || isIOS;

  useEffect(() => {
    const dismissed = sessionStorage.getItem("install-banner-dismissed");
    if (dismissed) setBannerDismissed(true);
  }, []);

  const dismissBanner = () => {
    setBannerDismissed(true);
    sessionStorage.setItem("install-banner-dismissed", "1");
  };

  const steps = [
    {
      icon: UserPlus,
      title: fr ? "Créez votre compte" : "Create your account",
      description: fr
        ? "Inscription gratuite en 30 secondes. Aucune carte bancaire requise."
        : "Free sign-up in 30 seconds. No credit card required.",
    },
    {
      icon: PlusCircle,
      title: fr ? "Ajoutez vos transactions" : "Add your transactions",
      description: fr
        ? "Saisissez manuellement, importez un relevé PDF, ou prenez une photo de votre reçu. Orange Money, Wave, MTN MoMo, cash — tout est pris en charge."
        : "Enter manually, import a PDF statement, or scan a receipt. Orange Money, Wave, MTN MoMo, cash — all supported.",
    },
    {
      icon: BarChart2,
      title: fr ? "Visualisez vos finances" : "Understand your finances",
      description: fr
        ? "Tableaux de bord clairs, rapports mensuels et suivi de vos dépenses par catégorie. Sachez exactement où va votre argent."
        : "Clear dashboards, monthly reports and spending by category. Know exactly where your money goes.",
    },
    {
      icon: Smartphone,
      title: fr ? "Installez l'app sur votre téléphone" : "Install on your phone",
      description: fr
        ? "Ajoutez l'application à votre écran d'accueil en un clic. Aucun App Store, aucun téléchargement — fonctionne même hors ligne."
        : "Add the app to your home screen in one tap. No App Store, no download — works offline too.",
    },
  ];

  const features = [
    {
      icon: Wallet,
      title: "Multi-Wallets",
      description: fr
        ? "Orange Money, Wave, MTN MoMo, espèces. Tout au même endroit."
        : "Orange Money, Wave, MTN MoMo, cash. Everything in one place.",
    },
    {
      icon: TrendingUp,
      title: fr ? "Rapports clairs" : "Clear Reports",
      description: fr
        ? "Sachez exactement où va votre argent. Visuels simples et intuitifs."
        : "Know exactly where your money goes. Simple, visual breakdowns.",
    },
    {
      icon: ShieldCheck,
      title: fr ? "Sécurisé & Privé" : "Secure & Private",
      description: fr
        ? "Vos données restent les vôtres. Toujours protégées."
        : "Your business data belongs to you. Always protected.",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ── Hero ── */}
      <section className="flex-1 px-4 py-12 md:py-20">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10 items-center">

          {/* Left: headline */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-6">
            <img src="/logo.svg" alt="MobileMoney Manager" className="w-16 h-16 md:w-20 md:h-20 drop-shadow-md" />
            <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight leading-tight">
              {fr ? "Gérez votre argent avec fierté." : "Manage your money with pride."}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              {fr
                ? "Le compagnon financier des entrepreneurs africains. Orange Money, Wave, MTN MoMo — tout en un."
                : "The financial companion for African entrepreneurs. Orange Money, Wave, MTN MoMo — all in one."}
            </p>
            <p className="text-sm text-muted-foreground">
              {fr ? "Déjà un compte ?" : "Already have an account?"}{" "}
              <Link href="/sign-in" className="text-primary font-medium hover:underline">
                {fr ? "Se connecter" : "Sign in"}
              </Link>
            </p>
          </div>

          {/* Right: sign-up form */}
          <div className="bg-card border border-border rounded-2xl shadow-lg p-6 md:p-8">
            <div className="mb-5">
              <h2 className="text-xl font-bold text-foreground">
                {fr ? "Créer un compte gratuit" : "Create a free account"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {fr ? "Inscription en 30 secondes. Aucune carte bancaire." : "Sign up in 30 seconds. No credit card."}
              </p>
            </div>
            <SignUpForm fullForm />
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="bg-muted/30 border-y border-border/50 px-4 py-16 md:py-20">
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, description }) => (
            <div key={title} className="bg-card p-6 rounded-2xl border shadow-sm space-y-3">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="px-4 py-16 md:py-24 max-w-4xl mx-auto w-full">
        <div className="text-center mb-12 space-y-3">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            {fr ? "Comment ça marche ?" : "How does it work?"}
          </h2>
          <p className="text-muted-foreground text-lg">
            {fr
              ? "Prêt à utiliser en moins de 2 minutes."
              : "Up and running in under 2 minutes."}
          </p>
        </div>

        <div className="space-y-6">
          {steps.map(({ icon: Icon, title, description }, i) => (
            <div
              key={title}
              className="flex gap-5 items-start bg-card border rounded-2xl p-6 shadow-sm"
            >
              <div className="shrink-0 flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-lg shadow">
                  {i + 1}
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Icon className="w-5 h-5 text-primary shrink-0" />
                  <h3 className="text-lg font-semibold">{title}</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Install CTA ── */}
      <section className="px-4 pb-16 md:pb-24 max-w-4xl mx-auto w-full">
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8 md:p-10 space-y-6">
          <div className="text-center space-y-3">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
              <Smartphone className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">
              {fr ? "Installez l'app sur votre téléphone" : "Install app on your phone"}
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm md:text-base">
              {fr
                ? "Gratuit, sans App Store. Fonctionne même hors ligne."
                : "Free, no App Store needed. Works offline too."}
            </p>
          </div>

          {isInstalled ? (
            <div className="flex items-center justify-center gap-2 text-green-600 font-semibold py-2">
              <CheckCircle className="w-5 h-5" />
              {fr ? "Application déjà installée !" : "App already installed!"}
            </div>
          ) : canInstall ? (
            <div className="text-center">
              <Button size="lg" className="rounded-xl px-8 py-6 text-lg shadow" onClick={install}>
                <Smartphone className="mr-2 w-5 h-5" />
                {fr ? "Ajouter à l'écran d'accueil" : "Add to Home Screen"}
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {/* iOS */}
              <div className="bg-card rounded-xl border border-border p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🍎</span>
                  <span className="font-semibold">{fr ? "iPhone / iPad (Safari)" : "iPhone / iPad (Safari)"}</span>
                </div>
                <ol className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">1</span>
                    <span>{fr ? "Ouvrez Safari et allez sur ce site" : "Open Safari and visit this site"}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">2</span>
                    <span>
                      {fr ? "Appuyez sur le bouton Partager" : "Tap the Share button"}
                      {" "}<span className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs text-foreground">⬆</span>
                      {" "}{fr ? "en bas de l'écran" : "at the bottom"}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">3</span>
                    <span>
                      {fr ? "Choisissez" : "Select"}{" "}
                      <span className="font-semibold text-foreground">
                        {fr ? "« Sur l'écran d'accueil »" : '"Add to Home Screen"'}
                      </span>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">4</span>
                    <span>{fr ? "Appuyez sur « Ajouter »" : 'Tap "Add"'}</span>
                  </li>
                </ol>
              </div>

              {/* Android */}
              <div className="bg-card rounded-xl border border-border p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🤖</span>
                  <span className="font-semibold">{fr ? "Android (Chrome)" : "Android (Chrome)"}</span>
                </div>
                <ol className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">1</span>
                    <span>{fr ? "Ouvrez Chrome et allez sur ce site" : "Open Chrome and visit this site"}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">2</span>
                    <span>
                      {fr ? "Appuyez sur le menu" : "Tap the menu"}
                      {" "}<span className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs text-foreground">⋮</span>
                      {" "}{fr ? "en haut à droite" : "top right"}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">3</span>
                    <span>
                      {fr ? "Choisissez" : "Select"}{" "}
                      <span className="font-semibold text-foreground">
                        {fr ? "« Installer l'application »" : '"Install app"'}
                      </span>
                      {" "}{fr ? "ou" : "or"}{" "}
                      <span className="font-semibold text-foreground">
                        {fr ? "« Ajouter à l'écran d'accueil »" : '"Add to Home screen"'}
                      </span>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">4</span>
                    <span>{fr ? "Appuyez sur « Ajouter »" : 'Tap "Add"'}</span>
                  </li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border/50 text-center py-8 px-4 text-sm text-muted-foreground pb-28 md:pb-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <img src="/logo.svg" alt="MobileMoney" className="w-5 h-5" />
          <span className="font-semibold text-foreground">MobileMoney Manager</span>
        </div>
        <p>© {new Date().getFullYear()} — {fr ? "Tous droits réservés." : "All rights reserved."}</p>
      </footer>

      {/* ── Sticky Install Banner (mobile only) ── */}
      {isMobile && !isInstalled && !bannerDismissed && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-3 bg-background border-t border-primary/30 shadow-[0_-4px_24px_rgba(0,0,0,0.10)]">
          <div className="max-w-lg mx-auto">
            {canInstall ? (
              /* Android: install prompt is ready — show a direct button */
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">
                    {fr ? "Installez l'application" : "Install the app"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {fr ? "Accès rapide, fonctionne hors ligne" : "Fast access, works offline"}
                  </p>
                </div>
                <Button size="sm" className="shrink-0 rounded-lg px-4" onClick={install}>
                  {fr ? "Installer" : "Install"}
                </Button>
                <button onClick={dismissBanner} className="shrink-0 p-1 text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : isAndroid ? (
              /* Android: no prompt yet — guide them to Chrome menu */
              <div className="flex items-start gap-3">
                <Smartphone className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0 text-sm">
                  <p className="font-semibold text-foreground">
                    {fr ? "Ajouter à l'écran d'accueil" : "Add to Home Screen"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {fr
                      ? <>Chrome menu <span className="font-mono bg-muted px-1 rounded">⋮</span> → <strong>« Installer l'application »</strong> ou <strong>« Ajouter à l'écran d'accueil »</strong></>
                      : <>Chrome menu <span className="font-mono bg-muted px-1 rounded">⋮</span> → <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong></>
                    }
                  </p>
                </div>
                <button onClick={dismissBanner} className="shrink-0 p-1 text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* iOS: guide them to Safari share button */
              <div className="flex items-start gap-3">
                <Smartphone className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0 text-sm">
                  <p className="font-semibold text-foreground">
                    {fr ? "Ajouter à l'écran d'accueil" : "Add to Home Screen"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {fr
                      ? <>Safari → bouton Partager <span className="font-mono bg-muted px-1 rounded">⬆</span> → <strong>« Sur l'écran d'accueil »</strong></>
                      : <>Safari → Share button <span className="font-mono bg-muted px-1 rounded">⬆</span> → <strong>"Add to Home Screen"</strong></>
                    }
                  </p>
                </div>
                <button onClick={dismissBanner} className="shrink-0 p-1 text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
