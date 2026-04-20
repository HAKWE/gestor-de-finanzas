import { Link } from "wouter";
import { useLanguage } from "../lib/language-context";
import { Button } from "@/components/ui/button";
import { usePwaInstall } from "../hooks/use-pwa-install";
import {
  ArrowRight,
  Wallet,
  TrendingUp,
  ShieldCheck,
  UserPlus,
  PlusCircle,
  BarChart2,
  Smartphone,
  CheckCircle,
} from "lucide-react";

export default function Home() {
  const { language } = useLanguage();
  const { canInstall, isInstalled, install } = usePwaInstall();

  const fr = language === "fr";

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
      <section className="flex flex-col items-center justify-center flex-1 text-center px-4 py-20 md:py-32 space-y-8">
        <div className="flex justify-center">
          <img src="/logo.svg" alt="MobileMoney Manager" className="w-20 h-20 md:w-28 md:h-28 drop-shadow-md" />
        </div>

        <div className="space-y-4 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground tracking-tight leading-tight">
            {fr ? "Gérez votre argent avec fierté." : "Manage your money with pride."}
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground">
            {fr
              ? "Le compagnon financier des entrepreneurs africains."
              : "The financial companion for African entrepreneurs."}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Link href="/sign-up">
            <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              {fr ? "Commencer gratuitement" : "Get started for free"}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <Link href="/sign-in">
            <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8 py-6 rounded-xl">
              {fr ? "Se connecter" : "Sign in"}
            </Button>
          </Link>
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
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-8 md:p-10 text-center space-y-5">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
            <Smartphone className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold">
            {fr ? "Toujours avec vous" : "Always with you"}
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {fr
              ? "Installez MobileMoney sur votre téléphone comme une app native — sans passer par un App Store. Accès rapide, même sans connexion internet."
              : "Install MobileMoney on your phone like a native app — no App Store needed. Fast access, even without internet."}
          </p>

          {isInstalled ? (
            <div className="inline-flex items-center gap-2 text-green-600 font-medium">
              <CheckCircle className="w-5 h-5" />
              {fr ? "Application déjà installée !" : "App already installed!"}
            </div>
          ) : canInstall ? (
            <Button size="lg" className="rounded-xl px-8 py-6 text-lg shadow" onClick={install}>
              <Smartphone className="mr-2 w-5 h-5" />
              {fr ? "Installer l'application" : "Install app"}
            </Button>
          ) : (
            <div className="text-sm text-muted-foreground space-y-2 max-w-sm mx-auto text-left">
              <p>
                <span className="font-semibold text-foreground">iOS Safari : </span>
                {fr ? "Bouton Partager " : "Tap the Share button "}
                <span className="font-mono bg-muted px-1 rounded text-xs">⬆</span>
                {fr ? " → \"Sur l'écran d'accueil\"" : " → \"Add to Home Screen\""}
              </p>
              <p>
                <span className="font-semibold text-foreground">Android Chrome : </span>
                {fr
                  ? "Menu ⋮ → \"Ajouter à l'écran d'accueil\""
                  : "Menu ⋮ → \"Add to Home screen\""}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border/50 text-center py-8 px-4 text-sm text-muted-foreground">
        <div className="flex items-center justify-center gap-2 mb-2">
          <img src="/logo.svg" alt="MobileMoney" className="w-5 h-5" />
          <span className="font-semibold text-foreground">MobileMoney Manager</span>
        </div>
        <p>© {new Date().getFullYear()} — {fr ? "Tous droits réservés." : "All rights reserved."}</p>
      </footer>
    </div>
  );
}
