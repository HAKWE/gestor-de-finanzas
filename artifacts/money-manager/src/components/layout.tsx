import React, { useEffect, useState } from "react";
import { useLanguage } from "../lib/language-context";
import { Link, useLocation } from "wouter";
import { UserButton } from "@clerk/react";
import { LayoutDashboard, Receipt, BarChart3, Package, Settings, Menu, Crown, Star, CreditCard, Send } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { Button } from "./ui/button";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

interface SubInfo { plan: string; label: string }

function useSubscription(): SubInfo | null {
  const [sub, setSub] = useState<SubInfo | null>(null);
  useEffect(() => {
    fetch(`${basePath}/api/stripe/subscription-status`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d && d.plan && d.plan !== "free") setSub({ plan: d.plan, label: d.planLabel || d.plan });
      })
      .catch(() => {});
  }, []);
  return sub;
}

function PlanPill({ plan, label }: { plan: string; label: string }) {
  const isPro = plan === "pro";
  return (
    <Link href="/subscription">
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700,
        backgroundColor: isPro ? "#f97316" : "#fff7ed",
        color: isPro ? "white" : "#f97316",
        border: isPro ? "none" : "1.5px solid #f97316",
        whiteSpace: "nowrap", cursor: "pointer",
        textDecoration: "none",
      }}>
        {isPro
          ? <Crown style={{ width: 11, height: 11 }} />
          : <Star style={{ width: 11, height: 11 }} />
        }
        {label}
      </span>
    </Link>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  const [location] = useLocation();
  const sub = useSubscription();
  const isPaid = sub !== null;

  const baseLinks = [
    { href: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { href: "/transactions", label: t("nav.transactions"), icon: Receipt },
    { href: "/reports", label: t("nav.reports"), icon: BarChart3 },
    { href: "/inventory", label: t("nav.inventory"), icon: Package },
    { href: "/settings", label: t("nav.settings"), icon: Settings },
  ];

  const subLink = { href: "/subscription", label: "Mon abonnement", icon: CreditCard };
  const payoutLink = { href: "/payout", label: "Payer avec Mobile Money", icon: Send };
  const links = isPaid ? [...baseLinks, subLink, payoutLink] : [...baseLinks, payoutLink];

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-4 border-b bg-background px-4 md:px-6">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-6 w-6 text-primary" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 sm:max-w-xs">
            <nav className="grid gap-6 text-lg font-medium mt-6">
              <div className="flex items-center gap-2 px-2 pb-4">
                <img src="/logo.svg" alt="Logo" className="w-8 h-8" />
                <span className="font-bold text-primary">MobileMoney</span>
              </div>
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-4 px-2 py-2 rounded-lg ${
                    location.startsWith(link.href)
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <link.icon className="h-5 w-5" />
                  {link.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4 justify-between md:justify-end">
          <div className="hidden md:flex md:flex-1">
            <div className="flex items-center gap-2">
              <img src="/logo.svg" alt="Logo" className="w-8 h-8" />
              <span className="font-bold text-primary text-xl">MobileMoney</span>
            </div>
          </div>

          <nav className="hidden md:flex gap-6 mx-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 text-sm transition-colors ${
                  location.startsWith(link.href)
                    ? "text-primary font-semibold border-b-2 border-primary pb-1 -mb-1"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: "auto" }}>
            {sub && <PlanPill plan={sub.plan} label={sub.label} />}
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col p-4 md:p-8 w-full max-w-6xl mx-auto">
        {children}
      </main>

      <footer style={{
        borderTop: "1px solid #f0ede9",
        padding: "14px 24px",
        display: "flex", flexWrap: "wrap", alignItems: "center",
        justifyContent: "space-between", gap: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <img src="/logo.svg" alt="MobileMoney" style={{ width: 16, height: 16 }} />
          <span style={{ fontSize: 12, color: "#9ca3af" }}>
            © {new Date().getFullYear()} MobileMoney Manager · Luxembourg
          </span>
        </div>
        <nav style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
          {[
            { href: "mailto:support@mobilemoneymanager.africa", label: "Contact" },
            { href: "/confidentialite", label: "Confidentialité" },
            { href: "/conditions", label: "Conditions d'utilisation" },
            { href: "/mentions-legales", label: "Mentions légales" },
            { href: "/pricing", label: "Tarifs" },
          ].map(({ href, label }) => (
            <a key={label} href={href} style={{ fontSize: 12, color: "#9ca3af", textDecoration: "none" }}>
              {label}
            </a>
          ))}
        </nav>
      </footer>
    </div>
  );
}
