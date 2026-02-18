"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
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
  const [lang, setLang] = useState<Language>("TR");
  const [currency, setCurrency] = useState<CurrencyType>("TRY");

  // Initialize from session or localStorage
  useEffect(() => {
    if (session?.user?.language) {
      const sessionLang = session.user.language as Language;
      setLang(sessionLang);
      setCurrency((session.user.currency as CurrencyType) || "TRY");
      localStorage.setItem("b2b-language", sessionLang);
    } else {
      const stored = localStorage.getItem("b2b-language") as Language;
      if (stored === "EN" || stored === "TR") {
        setLang(stored);
      }
    }
  }, [session]);

  const setLanguage = useCallback(
    async (newLang: Language) => {
      setLang(newLang);
      localStorage.setItem("b2b-language", newLang);
      // If logged in, persist to DB
      if (session?.user?.id) {
        try {
          await fetch("/api/dealers/language", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ language: newLang }),
          });
          // Update session so other components see the change
          await updateSession();
        } catch {}
      }
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
