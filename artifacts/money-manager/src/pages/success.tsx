import { Link } from "wouter";
import { useLanguage } from "../lib/language-context";
import { Button } from "@/components/ui/button";
import { CheckCircle, LayoutDashboard } from "lucide-react";

export default function Success() {
  const { language } = useLanguage();
  const fr = language === "fr";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            {fr ? "Merci pour votre abonnement !" : "Thank you for subscribing!"}
          </h1>
          <p className="text-muted-foreground">
            {fr
              ? "Votre abonnement est actif. Profitez de toutes les fonctionnalités de MobileMoney Manager."
              : "Your subscription is active. Enjoy all features of MobileMoney Manager."}
          </p>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 space-y-2">
          <p className="font-semibold text-foreground">
            {fr ? "Ce qui vous attend :" : "What's included:"}
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 text-left">
            <li>✓ {fr ? "Accès complet à toutes les fonctionnalités" : "Full access to all features"}</li>
            <li>✓ {fr ? "Transactions et rapports illimités" : "Unlimited transactions and reports"}</li>
            <li>✓ {fr ? "Support prioritaire" : "Priority support"}</li>
          </ul>
        </div>

        <Link href="/dashboard">
          <Button className="w-full h-12 rounded-xl text-base font-semibold">
            <LayoutDashboard className="w-4 h-4 mr-2" />
            {fr ? "Accéder au tableau de bord" : "Go to dashboard"}
          </Button>
        </Link>

        <p className="text-xs text-muted-foreground">
          {fr
            ? "Un reçu vous a été envoyé par e-mail. Gérez votre abonnement depuis les paramètres."
            : "A receipt has been sent to your email. Manage your subscription in settings."}
        </p>
      </div>
    </div>
  );
}
