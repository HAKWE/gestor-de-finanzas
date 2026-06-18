import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "es" | "en";

interface Translations {
  [key: string]: {
    es: string;
    en: string;
  };
}

const translations: Translations = {
  "app.title": { es: "Gestor de Finanzas", en: "Finance Manager" },
  "nav.dashboard": { es: "Panel", en: "Dashboard" },
  "nav.transactions": { es: "Transacciones", en: "Transactions" },
  "nav.reports": { es: "Reportes", en: "Reports" },
  "nav.inventory": { es: "Inventario", en: "Inventory" },
  "nav.settings": { es: "Configuración", en: "Settings" },
  "landing.hero": { es: "Gestiona tu dinero con confianza.", en: "Manage your money with confidence." },
  "landing.subhero": { es: "El gestor financiero para emprendedores latinoamericanos.", en: "The financial manager for Latin American entrepreneurs." },
  "landing.cta": { es: "Comenzar", en: "Get Started" },
  "auth.signin": { es: "Iniciar sesión", en: "Sign In" },
  "auth.signup": { es: "Crear cuenta", en: "Sign Up" },
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
    if (saved === "es" || saved === "en") return saved;
    return "es";
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
