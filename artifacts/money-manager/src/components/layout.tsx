import React from "react";
import { useLanguage } from "../lib/language-context";
import { Link, useLocation } from "wouter";
import { UserButton } from "@clerk/react";
import { LayoutDashboard, Receipt, BarChart3, Package, Settings, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { Button } from "./ui/button";

export function Layout({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  const [location] = useLocation();

  const links = [
    { href: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { href: "/transactions", label: t("nav.transactions"), icon: Receipt },
    { href: "/reports", label: t("nav.reports"), icon: BarChart3 },
    { href: "/inventory", label: t("nav.inventory"), icon: Package },
    { href: "/settings", label: t("nav.settings"), icon: Settings },
  ];

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
          <div className="ml-auto">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col p-4 md:p-8 w-full max-w-6xl mx-auto">
        {children}
      </main>
    </div>
  );
}
