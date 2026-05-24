import { useState, useEffect, useCallback } from "react";

type Language = "en" | "ar";

export function useLanguage() {
  const [language, setLanguageState] = useState<Language>("ar");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("tabibi-lang") as Language | null;
    if (stored && (stored === "en" || stored === "ar")) {
      setLanguageState(stored);
    }
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) return;
    const html = document.documentElement;
    html.lang = language;
    html.dir = language === "ar" ? "rtl" : "ltr";
    localStorage.setItem("tabibi-lang", language);
  }, [language, isReady]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => (prev === "en" ? "ar" : "en"));
  }, []);

  const t = useCallback(
    (en: string, ar: string) => {
      return language === "ar" ? ar : en;
    },
    [language]
  );

  return { language, setLanguage, toggleLanguage, t, isReady };
}
