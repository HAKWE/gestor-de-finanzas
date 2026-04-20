import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "fr" | "en";

interface Translations {
  [key: string]: {
    fr: string;
    en: string;
  };
}

const translations: Translations = {
  "app.title": { fr: "MobileMoney Manager", en: "MobileMoney Manager" },
  "nav.dashboard": { fr: "Tableau de bord", en: "Dashboard" },
  "nav.transactions": { fr: "Transactions", en: "Transactions" },
  "nav.reports": { fr: "Rapports", en: "Reports" },
  "nav.inventory": { fr: "Inventaire", en: "Inventory" },
  "nav.settings": { fr: "Paramètres", en: "Settings" },
  "landing.hero": { fr: "Gérez votre argent avec fierté.", en: "Manage your money with pride." },
  "landing.subhero": { fr: "Le compagnon financier des entrepreneurs africains.", en: "The financial companion for African entrepreneurs." },
  "landing.cta": { fr: "Commencer", en: "Get Started" },
  "auth.signin": { fr: "Se connecter", en: "Sign In" },
  "auth.signup": { fr: "Créer un compte", en: "Sign Up" },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem("app-language");
    return (saved as Language) || "fr";
  });

  useEffect(() => {
    localStorage.setItem("app-language", language);
  }, [language]);

  const t = (key: string) => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within a LanguageProvider");
  return context;
}
