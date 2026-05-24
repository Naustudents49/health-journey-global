import { Link } from "@tanstack/react-router";
import { HeartPulse, Menu, X, Globe } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";

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
          <button
            onClick={toggleLanguage}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Globe className="h-4 w-4" />
            {language === "en" ? "العربية" : "English"}
          </button>
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
            <button
              onClick={toggleLanguage}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent"
            >
              <Globe className="h-4 w-4" />
              {language === "en" ? "العربية" : "English"}
            </button>
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
