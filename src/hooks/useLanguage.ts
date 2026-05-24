import { useState, useEffect, useCallback } from "react";

export type Language =
  | "ar"
  | "en"
  | "fr"
  | "es"
  | "de"
  | "tr"
  | "ur"
  | "fa"
  | "hi"
  | "zh"
  | "ru"
  | "pt"
  | "sw";

export const LANGUAGES: { code: Language; label: string; nativeLabel: string; dir: "ltr" | "rtl" }[] = [
  { code: "ar", label: "Arabic", nativeLabel: "العربية", dir: "rtl" },
  { code: "en", label: "English", nativeLabel: "English", dir: "ltr" },
  { code: "fr", label: "French", nativeLabel: "Français", dir: "ltr" },
  { code: "es", label: "Spanish", nativeLabel: "Español", dir: "ltr" },
  { code: "de", label: "German", nativeLabel: "Deutsch", dir: "ltr" },
  { code: "tr", label: "Turkish", nativeLabel: "Türkçe", dir: "ltr" },
  { code: "ur", label: "Urdu", nativeLabel: "اردو", dir: "rtl" },
  { code: "fa", label: "Persian", nativeLabel: "فارسی", dir: "rtl" },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी", dir: "ltr" },
  { code: "zh", label: "Chinese", nativeLabel: "中文", dir: "ltr" },
  { code: "ru", label: "Russian", nativeLabel: "Русский", dir: "ltr" },
  { code: "pt", label: "Portuguese", nativeLabel: "Português", dir: "ltr" },
  { code: "sw", label: "Swahili", nativeLabel: "Kiswahili", dir: "ltr" },
];

const RTL_LANGS: Language[] = ["ar", "ur", "fa"];

export function isRTL(lang: Language) {
  return RTL_LANGS.includes(lang);
}

export function useLanguage() {
  const [language, setLanguageState] = useState<Language>("ar");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("tabibi-lang") as Language | null;
    if (stored && LANGUAGES.some((l) => l.code === stored)) {
      setLanguageState(stored);
    }
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) return;
    const html = document.documentElement;
    html.lang = language;
    html.dir = isRTL(language) ? "rtl" : "ltr";
    localStorage.setItem("tabibi-lang", language);
  }, [language, isReady]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => (prev === "en" ? "ar" : "en"));
  }, []);

  /**
   * Translate helper.
   * Usage:
   *   t("Sign In", "تسجيل الدخول")  // legacy EN/AR
   *   t({ en: "Sign In", ar: "تسجيل الدخول", fr: "Connexion", ... })
   * Falls back to English, then Arabic.
   */
  function t(en: string, ar: string): string;
  function t(map: Partial<Record<Language, string>>): string;
  function t(a: string | Partial<Record<Language, string>>, b?: string): string {
    if (typeof a === "string") {
      const map: Partial<Record<Language, string>> = { en: a, ar: b ?? a };
      return map[language] ?? map.en ?? a;
    }
    return a[language] ?? a.en ?? a.ar ?? "";
  }

  return { language, setLanguage, toggleLanguage, t, isReady, isRTL: isRTL(language) };
}
