"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { t as translate, type Language } from "@/lib/translations";

type CurrencyType = "TRY" | "USD";

interface LanguageContextType {
  lang: Language;
  currency: CurrencyType;
  t: (key: string) => string;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "TR",
  currency: "TRY",
  t: (key: string) => key,
  setLanguage: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { data: session, update: updateSession } = useSession();
  const [lang, setLang] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("b2b-language") as Language;
      if (stored === "EN" || stored === "TR") return stored;
    }
    return "TR";
  });
  const [currency, setCurrency] = useState<CurrencyType>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("b2b-currency") as CurrencyType;
      if (stored === "USD" || stored === "TRY") return stored;
    }
    return "TRY";
  });

  // Track whether user manually changed language — skip session overwrite if so
  const manualChangeRef = useRef(false);

  // Sync from session ONLY on initial login (not after manual changes)
  useEffect(() => {
    if (manualChangeRef.current) return; // user just changed it, don't overwrite
    if (session?.user?.language) {
      const sessionLang = session.user.language as Language;
      const sessionCurrency = (session.user.currency as CurrencyType) || "TRY";
      setLang(sessionLang);
      setCurrency(sessionCurrency);
      localStorage.setItem("b2b-language", sessionLang);
      localStorage.setItem("b2b-currency", sessionCurrency);
    }
  }, [session]);

  const setLanguage = useCallback(
    async (newLang: Language) => {
      const newCurrency: CurrencyType = newLang === "EN" ? "USD" : "TRY";
      manualChangeRef.current = true;
      setLang(newLang);
      setCurrency(newCurrency);
      localStorage.setItem("b2b-language", newLang);
      localStorage.setItem("b2b-currency", newCurrency);
      // If logged in, persist to DB and refresh session
      if (session?.user?.id) {
        try {
          await fetch("/api/dealers/language", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ language: newLang, currency: newCurrency }),
          });
          await updateSession();
        } catch {}
      }
      // Reset flag after session update completes
      setTimeout(() => { manualChangeRef.current = false; }, 2000);
    },
    [session, updateSession]
  );

  const tFn = useCallback((key: string) => translate(key, lang), [lang]);

  return (
    <LanguageContext.Provider value={{ lang, currency, t: tFn, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
