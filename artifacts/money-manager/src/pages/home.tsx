import { Link } from "wouter";
import { useLanguage } from "../lib/language-context";
import { Button } from "@/components/ui/button";
import { ArrowRight, Wallet, TrendingUp, ShieldCheck } from "lucide-react";

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl mx-auto space-y-16 py-12">
        <div className="text-center space-y-6">
          <div className="flex justify-center mb-8">
            <img src="/logo.svg" alt="MobileMoney Manager" className="w-24 h-24" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-foreground tracking-tight">
            {t("landing.hero") || "Gérez votre argent avec fierté."}
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            {t("landing.subhero") || "Le compagnon financier des entrepreneurs africains."}
          </p>
          <div className="pt-8">
            <Link href="/sign-up">
              <Button size="lg" className="w-full md:w-auto text-lg px-8 py-6 rounded-xl animate-in fade-in zoom-in duration-500 hover-elevate">
                {t("landing.cta") || "Commencer"}
                <ArrowRight className="ml-2 w-6 h-6" />
              </Button>
            </Link>
          </div>
          <div className="mt-4">
             <Link href="/sign-in" className="text-primary font-medium hover:underline text-lg">
                {t("auth.signin") || "Se connecter"}
             </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 pt-12 border-t border-border/50">
          <div className="bg-card p-6 rounded-2xl border shadow-sm">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-4">
              <Wallet className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Multi-Wallets</h3>
            <p className="text-muted-foreground">Orange Money, Wave, MTN MoMo, Cash. Everything in one place.</p>
          </div>
          <div className="bg-card p-6 rounded-2xl border shadow-sm">
            <div className="w-12 h-12 bg-accent/20 text-accent-foreground rounded-xl flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Clear Reports</h3>
            <p className="text-muted-foreground">Know exactly where your money goes. Simple, visual breakdowns.</p>
          </div>
          <div className="bg-card p-6 rounded-2xl border shadow-sm">
            <div className="w-12 h-12 bg-secondary/10 text-secondary rounded-xl flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Secure & Private</h3>
            <p className="text-muted-foreground">Your business data belongs to you. Always protected.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
