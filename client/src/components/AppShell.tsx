import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, type ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTokenBalance } from "@/hooks/use-tokens";

interface NavItem {
  icon: string;
  label: string;
  href: string;
  matchPaths?: string[];
  badge?: { type: "red" | "green"; value: number };
}

/* ── Section: Menu ── */
const menuItems: NavItem[] = [
  { icon: "⊞", label: "Dashboard", href: "/dashboard" },
  { icon: "◉", label: "My Trades", href: "/trades" },
  { icon: "●", label: "Lookup", href: "/lookup" },
];

/* ── Section: Compliance ── */
const complianceItems: NavItem[] = [
  { icon: "📬", label: "Supplier Inbox", href: "/inbox" },
  { icon: "🔔", label: "Alerts", href: "/alerts" },
  { icon: "📋", label: "Templates", href: "/templates" },
];

function isNavActive(item: NavItem, pathname: string): boolean {
  if (item.matchPaths) {
    return item.matchPaths.some((p) => pathname.startsWith(p));
  }
  return pathname.startsWith(item.href);
}

interface AppShellProps {
  children: ReactNode;
  topCenter?: ReactNode;
  sidebarBottom?: ReactNode;
  contentClassName?: string;
}

/* ── Sidebar nav item — uses CSS classes from index.css ── */
function SidebarNavItem({ item, isActive, onClick }: { item: NavItem; isActive: boolean; onClick?: () => void }) {
  return (
    <Link href={item.href}>
      <div
        onClick={onClick}
        className={`sidebar-item${isActive ? " active" : ""}`}
        data-testid={`shell-nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
      >
        <span className="icon">{item.icon}</span>
        <span className="label">{item.label}</span>
        {item.badge && item.badge.value > 0 && (
          <span className={`badge badge-${item.badge.type}`}>
            {item.badge.value}
          </span>
        )}
      </div>
    </Link>
  );
}

/* ── Section label ── */
function SidebarLabel({ children }: { children: ReactNode }) {
  return (
    <div className="sidebar-section-label">
      {children}
    </div>
  );
}

/* ── History card ── */
function HistoryCard({ title, tags }: { title: string; tags: string[] }) {
  return (
    <div className="history-card">
      <div className="title">{title}</div>
      <div className="tags">
        {tags.map((tag, i) => (
          <span key={i} className="tag">{tag}</span>
        ))}
      </div>
    </div>
  );
}

/* ── Default nav links (shown when topCenter is not provided) ── */
function DefaultNavLinks({ activePage }: { activePage: string }) {
  const links = [
    { label: "Dashboard", href: "/dashboard", match: ["/dashboard", "/trades"] },
    { label: "Commodities", href: "/lookup", match: ["/lookup", "/demurrage"] },
    { label: "Suppliers", href: "/inbox", match: ["/inbox"] },
    { label: "Compliance", href: "/alerts", match: ["/alerts", "/lc-check", "/templates", "/eudr"] },
    { label: "Messages", href: "/inbox", match: [] },
  ];
  return (
    <>
      {links.map((link) => (
        <Link key={link.label} href={link.href}>
          <a className={link.match.some((m) => activePage.startsWith(m)) ? "active" : ""}>
            {link.label}
          </a>
        </Link>
      ))}
    </>
  );
}

export function AppShell({ children, topCenter, sidebarBottom, contentClassName }: AppShellProps) {
  const [location, navigate] = useLocation();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const tokenQuery = useTokenBalance();
  const balance = tokenQuery.data?.balance ?? 0;
  const inboxBadgeQuery = useQuery<{ count: number }>({ queryKey: ["/api/supplier-inbox/badge-count"] });
  const inboxBadge = inboxBadgeQuery.data?.count ?? 0;
  const alertsBadgeQuery = useQuery<{ count: number }>({ queryKey: ["/api/alerts/unread-count"] });
  const alertsBadge = alertsBadgeQuery.data?.count ?? 0;
  const tradesBadgeQuery = useQuery<{ count: number }>({ queryKey: ["/api/trades/pending-count"] });
  const tradesBadge = tradesBadgeQuery.data?.count ?? 0;

  const recentLookupsQuery = useQuery<any[]>({ queryKey: ["/api/lookups/recent"] });
  const recentLookups = recentLookupsQuery.data?.slice(0, 3) ?? [];

  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  useEffect(() => {
    if (isMobile && sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isMobile, sidebarOpen]);

  /* Build nav items with live badge counts */
  const mItems: NavItem[] = menuItems.map((item) => {
    if (item.label === "My Trades" && tradesBadge > 0)
      return { ...item, badge: { type: "green" as const, value: tradesBadge } };
    return item;
  });
  const cItems: NavItem[] = complianceItems.map((item) => {
    if (item.label === "Supplier Inbox" && inboxBadge > 0)
      return { ...item, badge: { type: "red" as const, value: inboxBadge } };
    if (item.label === "Alerts" && alertsBadge > 0)
      return { ...item, badge: { type: "red" as const, value: alertsBadge } };
    return item;
  });

  const closeSidebar = () => setSidebarOpen(false);

  /* ── Sidebar content ── */
  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="sidebar-logo">
        <Link href="/">
          <div className="logo-link" data-testid="shell-logo">
            <img className="logo-img" src="/taptrao-green-logo.png" alt="TapTrao" />
            <span>TapTrao</span>
          </div>
        </Link>
        {isMobile && (
          <button onClick={closeSidebar} className="sidebar-close-btn" aria-label="Close menu">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Menu section */}
      <div className="sidebar-section">
        <SidebarLabel>Menu</SidebarLabel>
        {mItems.map((item) => (
          <SidebarNavItem key={item.href} item={item} isActive={isNavActive(item, location)} onClick={closeSidebar} />
        ))}
      </div>

      {/* Compliance section */}
      <div className="sidebar-section">
        <SidebarLabel>Compliance</SidebarLabel>
        {cItems.map((item) => (
          <SidebarNavItem key={item.href} item={item} isActive={isNavActive(item, location)} onClick={closeSidebar} />
        ))}
      </div>

      {/* Spacer */}
      <div className="sidebar-spacer" />

      {/* History section */}
      <div className="sidebar-section">
        <SidebarLabel>History</SidebarLabel>
        <div className="sidebar-history">
          {recentLookups.length > 0 ? (
            recentLookups.map((lookup: any) => {
              const originFlag = lookup.originFlag || "";
              const destFlag = lookup.destinationFlag || "";
              const originCode = lookup.originCode || "";
              const destCode = lookup.destinationCode || "";
              const commodity = lookup.commodityName || "Trade";
              const title = `${originFlag} ${commodity} ${originCode} → ${destFlag} ${destCode}`;
              const tags = ["Lookup"];
              return <HistoryCard key={lookup.id} title={title} tags={tags} />;
            })
          ) : (
            <>
              <HistoryCard title="🇨🇮 Cashew CI → 🇬🇧 UK Q1 2026" tags={["LC Check", "$126k"]} />
              <HistoryCard title="🇬🇭 Cocoa Beans GH → 🇪🇺 EU" tags={["LC Check", "$84k"]} />
              <HistoryCard title="🇪🇹 Sesame Seeds ET → 🇪🇺 EU" tags={["Lookup", "$43k"]} />
            </>
          )}
        </div>
      </div>

      {sidebarBottom}
    </>
  );

  return (
    <>
      {/* SIDEBAR — desktop: always visible */}
      {!isMobile && (
        <div className="sidebar">
          {sidebarContent}
        </div>
      )}

      {/* Mobile sidebar overlay */}
      {isMobile && sidebarOpen && (
        <>
          <div className="sidebar-overlay" onClick={closeSidebar} />
          <div className="sidebar-mobile">
            {sidebarContent}
          </div>
        </>
      )}

      {/* MAIN AREA */}
      <div className="main-box">
        {/* Content area wraps BOTH nav and children — gradient flows behind nav */}
        <div className={contentClassName || "main-content"}>
          {/* TOP NAV — inside the content area per design ref */}
          <div className="top-nav">
            {/* Left: hamburger on mobile, nav links on desktop */}
            {isMobile ? (
              <button onClick={() => setSidebarOpen(true)} className="hamburger-btn" aria-label="Open menu" data-testid="shell-hamburger">
                <Menu size={22} />
              </button>
            ) : (
              <div className="top-nav-links">
                {topCenter || <DefaultNavLinks activePage={location} />}
              </div>
            )}

            {/* Right: icon buttons + avatar */}
            <div className="top-nav-icons">
              <Link href="/alerts">
                <div className="icon-btn" data-testid="shell-bell-icon">
                  🔔
                  {alertsBadge > 0 && <span className="dot" />}
                </div>
              </Link>

              {!isMobile && (
                <Link href="/inbox">
                  <div className="icon-btn">💬</div>
                </Link>
              )}

              {!isMobile && (
                <Link href="/settings/profile">
                  <div className="icon-btn">⚙️</div>
                </Link>
              )}

              <div className="user-avatar">F</div>
            </div>
          </div>

          {children}
        </div>
      </div>
    </>
  );
}
