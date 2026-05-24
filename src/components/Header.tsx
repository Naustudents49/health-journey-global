import { Link } from "@tanstack/react-router";
import { HeartPulse, Menu, X, Globe, Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLanguage, LANGUAGES, type Language } from "@/hooks/useLanguage";

const navLinks = {
  en: [
    { label: "Home", to: "/" },
    { label: "Doctors", to: "/doctors" },
    { label: "How It Works", to: "/how-it-works" },
    { label: "About", to: "/about" },
  ],
  ar: [
    { label: "الرئيسية", to: "/" },
    { label: "الأطباء", to: "/doctors" },
    { label: "كيف يعمل", to: "/how-it-works" },
    { label: "من نحن", to: "/about" },
  ],
};

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  const links = (navLinks as Record<string, typeof navLinks.en>)[language] ?? navLinks.en;
  const currentLang = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-teal">
            <HeartPulse className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">
            Tabibi
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              activeProps={{ className: "text-primary bg-primary/10" }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-2">
          <LanguageDropdown
            language={language}
            setLanguage={setLanguage}
            currentLabel={currentLang.nativeLabel}
            open={langOpen}
            setOpen={setLangOpen}
          />
          <Link
            to="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            {t("Sign In", "تسجيل الدخول")}
          </Link>
          <Link
            to="/signup"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("Get Started", "ابدأ الآن")}
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="inline-flex md:hidden items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-accent"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 py-4">
          <nav className="flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
            <div className="grid grid-cols-2 gap-1 max-h-64 overflow-y-auto rounded-lg border border-border p-1">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => {
                    setLanguage(l.code);
                    setMobileOpen(false);
                  }}
                  className={`flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                    l.code === language
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-accent"
                  }`}
                >
                  <span>{l.nativeLabel}</span>
                  {l.code === language && <Check className="h-3.5 w-3.5" />}
                </button>
              ))}
            </div>
            <Link
              to="/login"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-4 py-2 text-center text-sm font-medium text-muted-foreground transition-colors hover:bg-accent"
            >
              {t("Sign In", "تسجيل الدخول")}
            </Link>
            <Link
              to="/signup"
              onClick={() => setMobileOpen(false)}
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {t("Get Started", "ابدأ الآن")}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
