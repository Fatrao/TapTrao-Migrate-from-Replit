import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Menu, X, Settings, Globe } from "lucide-react";
import { useState } from "react";
import { useTokenBalance } from "@/hooks/use-tokens";

export function NavBar() {
  const { t, i18n } = useTranslation("common");
  const isEn = i18n.language === "en";
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const tokenQuery = useTokenBalance();
  const balance = tokenQuery.data?.balance ?? 0;

  const templateCountQuery = useQuery<{ count: number }>({
    queryKey: ["/api/templates/count"],
  });
  const templateCount = templateCountQuery.data?.count ?? 0;

  const navLinks = [
    { href: "/lookup", label: t("nav.lookup"), testId: "lookup" },
    { href: "/lc-check", label: t("nav.lcChecker"), testId: "lc-checker" },
    { href: "/trades", label: t("nav.myTrades"), testId: "my-trades" },
    { href: "/templates", label: t("nav.templates"), showCount: true, testId: "templates" },
    { href: "/pricing", label: t("nav.pricing"), testId: "pricing" },
    { href: "/settings/profile", label: t("nav.settings"), testId: "settings" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 px-6 h-16">
        <Link href="/" data-testid="link-home">
          <span className="flex items-center gap-2" data-testid="text-nav-logo">
            <img src="/logo.png?v=2" alt="TapTrao" className="w-8 h-8 rounded-md" />
            <span className="font-heading font-extrabold text-xl text-foreground">TapTrao</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1" data-testid="nav-desktop">
          {navLinks.map((link) => {
            const isActive = location === link.href;
            return (
              <Link key={link.href} href={link.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  data-testid={`nav-link-${link.testId}`}
                >
                  {link.label}
                  {link.showCount && templateCount > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs" data-testid="badge-template-count">
                      {templateCount}
                    </Badge>
                  )}
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => i18n.changeLanguage(isEn ? "fr" : "en")}
            title={isEn ? "Passer en français" : "Switch to English"}
            data-testid="language-toggle-desktop"
          >
            <Globe className="w-4 h-4 mr-1" />
            {isEn ? "FR" : "EN"}
          </Button>
          <span
            className="inline-flex items-center rounded-full bg-primary/10 text-primary px-3 py-1 text-sm font-medium"
            data-testid="badge-token-balance"
          >
            {t("token.trade", { count: balance })}
          </span>
          <Link href="/pricing">
            <Button size="sm" variant="default" data-testid="button-top-up">
              {t("token.topUp")}
            </Button>
          </Link>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          data-testid="button-mobile-menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background px-6 pb-4 pt-2" data-testid="nav-mobile">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => {
              const isActive = location === link.href;
              return (
                <Link key={link.href} href={link.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setMobileOpen(false)}
                    data-testid={`nav-mobile-link-${link.testId}`}
                  >
                    {link.label}
                    {link.showCount && templateCount > 0 && (
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {templateCount}
                      </Badge>
                    )}
                  </Button>
                </Link>
              );
            })}
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => i18n.changeLanguage(isEn ? "fr" : "en")}
              data-testid="language-toggle-mobile"
            >
              <Globe className="w-4 h-4 mr-2" />
              {isEn ? "Français" : "English"}
            </Button>
            <div className="flex items-center gap-2 pt-2 border-t border-border mt-1">
              <span
                className="inline-flex items-center rounded-full bg-primary/10 text-primary px-3 py-1 text-sm font-medium"
                data-testid="badge-token-balance-mobile"
              >
                {t("token.trade", { count: balance })}
              </span>
              <Link href="/pricing">
                <Button size="sm" variant="default" onClick={() => setMobileOpen(false)} data-testid="button-top-up-mobile">
                  {t("token.topUp")}
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <NavBar />
      <main className="flex-1">{children}</main>
    </div>
  );
}
