import { Link } from "@tanstack/react-router";
import { HeartPulse } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

const footerContent = {
  en: {
    tagline: "Your Health, Connected",
    description: "Connecting patients with trusted doctors across the Arab world. Book appointments, consult online, and manage your health.",
    patients: "For Patients",
    patientsLinks: [
      { label: "Find a Doctor", to: "/doctors" },
      { label: "Book Appointment", to: "/doctors" },
      { label: "Online Consultation", to: "/online" },
      { label: "Medical Records", to: "/records" },
    ],
    doctors: "For Doctors",
    doctorsLinks: [
      { label: "Join as Doctor", to: "/join-doctor" },
      { label: "Doctor Dashboard", to: "/doctor-dashboard" },
      { label: "Pricing", to: "/pricing" },
    ],
    company: "Company",
    companyLinks: [
      { label: "About Us", to: "/about" },
      { label: "How It Works", to: "/how-it-works" },
      { label: "Contact", to: "/contact" },
    ],
    legal: "Legal",
    legalLinks: [
      { label: "Privacy Policy", to: "/privacy" },
      { label: "Terms of Service", to: "/terms" },
    ],
    copyright: "© 2025 Tabibi. All rights reserved.",
  },
  ar: {
    tagline: "صحتك، متصلة",
    description: "نربط المرضى بأطباء موثوق بهم في جميع أنحاء العالم العربي. احجز مواعيد، استشر أونلاين، وادارء صحتك.",
    patients: "للمرضى",
    patientsLinks: [
      { label: "ابحث عن طبيب", to: "/doctors" },
      { label: "احجز موعد", to: "/doctors" },
      { label: "استشارة أونلاين", to: "/online" },
      { label: "السجل الطبي", to: "/records" },
    ],
    doctors: "للأطباء",
    doctorsLinks: [
      { label: "انضم كطبيب", to: "/join-doctor" },
      { label: "لوحة تحكم الطبيب", to: "/doctor-dashboard" },
      { label: "الأسعار", to: "/pricing" },
    ],
    company: "الشركة",
    companyLinks: [
      { label: "من نحن", to: "/about" },
      { label: "كيف يعمل", to: "/how-it-works" },
      { label: "تواصل معنا", to: "/contact" },
    ],
    legal: "قانوني",
    legalLinks: [
      { label: "سياسة الخصوصية", to: "/privacy" },
      { label: "شروط الخدمة", to: "/terms" },
    ],
    copyright: "© 2025 طبيبي. جميع الحقوق محفوظة.",
  },
};

export function Footer() {
  const { language } = useLanguage();
  const content = (footerContent as Record<string, typeof footerContent.en>)[language] ?? footerContent.en;
  const isRTL = language === "ar";

  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-teal">
                <HeartPulse className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground">
                Tabibi
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              {content.description}
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">{content.patients}</h3>
            <ul className="mt-4 space-y-2">
              {content.patientsLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">{content.company}</h3>
            <ul className="mt-4 space-y-2">
              {content.companyLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              {content.legalLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">{content.doctors}</h3>
            <ul className="mt-4 space-y-2">
              {content.doctorsLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-8">
          <p className="text-center text-sm text-muted-foreground">
            {content.copyright}
          </p>
        </div>
      </div>
    </footer>
  );
}
