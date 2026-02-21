import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Menu, X, Settings } from "lucide-react";
import { useState } from "react";
import { useTokenBalance } from "@/hooks/use-tokens";

const navLinks = [
  { href: "/lookup", label: "Lookup" },
  { href: "/lc-check", label: "LC Checker" },
  { href: "/trades", label: "My Trades" },
  { href: "/templates", label: "Templates", showCount: true },
  { href: "/pricing", label: "Pricing" },
  { href: "/settings/profile", label: "Settings" },
];

export function NavBar() {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const tokenQuery = useTokenBalance();
  const balance = tokenQuery.data?.balance ?? 0;

  const templateCountQuery = useQuery<{ count: number }>({
    queryKey: ["/api/templates/count"],
  });
  const templateCount = templateCountQuery.data?.count ?? 0;

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-[#E2D9CC]">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 px-6 h-16">
        <Link href="/" data-testid="link-home">
          <span className="flex items-center gap-2" data-testid="text-nav-logo">
            <img src="/logo.png" alt="TapTrao" className="w-8 h-8 rounded-md" />
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
                  data-testid={`nav-link-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
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
          <span
            className="inline-flex items-center rounded-full bg-primary/10 text-primary px-3 py-1 text-sm font-medium"
            data-testid="badge-token-balance"
          >
            {balance} {balance === 1 ? "trade" : "trades"}
          </span>
          <Link href="/pricing">
            <Button size="sm" variant="default" data-testid="button-top-up">
              Top up
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
        <div className="md:hidden border-t border-[#E2D9CC] bg-background px-6 pb-4 pt-2" data-testid="nav-mobile">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => {
              const isActive = location === link.href;
              return (
                <Link key={link.href} href={link.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setMobileOpen(false)}
                    data-testid={`nav-mobile-link-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
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
            <div className="flex items-center gap-2 pt-2 border-t border-[#E2D9CC] mt-1">
              <span
                className="inline-flex items-center rounded-full bg-primary/10 text-primary px-3 py-1 text-sm font-medium"
                data-testid="badge-token-balance-mobile"
              >
                {balance} {balance === 1 ? "trade" : "trades"}
              </span>
              <Link href="/pricing">
                <Button size="sm" variant="default" onClick={() => setMobileOpen(false)} data-testid="button-top-up-mobile">
                  Top up
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
