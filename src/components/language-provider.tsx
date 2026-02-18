"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { t as translate, type Language } from "@/lib/translations";

type CurrencyType = "TRY" | "USD";
type DealerTypeValue = "TR_BAYI" | "GLOBAL_BAYI";

interface LanguageContextType {
  lang: Language;
  currency: CurrencyType;
  dealerType: DealerTypeValue;
  t: (key: string) => string;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "TR",
  currency: "TRY",
  dealerType: "TR_BAYI",
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
  const [dealerType, setDealerType] = useState<DealerTypeValue>("TR_BAYI");

  // Track whether user manually changed language — skip session overwrite if so
  const manualChangeRef = useRef(false);

  // Sync from session ONLY on initial login (not after manual changes)
  useEffect(() => {
    if (manualChangeRef.current) return; // user just changed it, don't overwrite
    if (session?.user) {
      // Set dealer type from session
      const dt = (session.user.dealerType as DealerTypeValue) || "TR_BAYI";
      setDealerType(dt);

      // For admins: use stored language preference
      if (session.user.role === "ADMIN") {
        const sessionLang = (session.user.language as Language) || "TR";
        const sessionCurrency = (session.user.currency as CurrencyType) || "TRY";
        setLang(sessionLang);
        setCurrency(sessionCurrency);
        localStorage.setItem("b2b-language", sessionLang);
        localStorage.setItem("b2b-currency", sessionCurrency);
      } else {
        // Dealer: auto-derive from dealerType
        const derivedLang: Language = dt === "GLOBAL_BAYI" ? "EN" : "TR";
        const derivedCurrency: CurrencyType = dt === "GLOBAL_BAYI" ? "USD" : "TRY";
        setLang(derivedLang);
        setCurrency(derivedCurrency);
        localStorage.setItem("b2b-language", derivedLang);
        localStorage.setItem("b2b-currency", derivedCurrency);
      }
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
    <LanguageContext.Provider value={{ lang, currency, dealerType, t: tFn, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
