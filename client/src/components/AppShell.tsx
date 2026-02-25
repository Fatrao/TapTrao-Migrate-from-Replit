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
  badge?: { type: "amber" | "green"; value: number };
}

/* ── Section: Menu ── */
const menuItems: NavItem[] = [
  { icon: "⊞", label: "Dashboard", href: "/dashboard" },
  { icon: "◉", label: "My Trades", href: "/trades" },
  { icon: "●", label: "Lookup", href: "/lookup" },
  { icon: "📄", label: "LC Check", href: "/lc-check" },
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

/* ── Sidebar nav item ── */
function SidebarNavItem({ item, isActive, onClick }: { item: NavItem; isActive: boolean; onClick?: () => void }) {
  return (
    <Link href={item.href}>
      <div
        onClick={onClick}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          padding: "8px 12px",
          margin: "0 6px 1px",
          borderRadius: 8,
          fontSize: 13,
          fontWeight: isActive ? 500 : 400,
          color: isActive ? "var(--green)" : "#666",
          background: isActive ? "rgba(74,140,111,0.12)" : "transparent",
          cursor: "pointer",
          transition: "all 0.15s",
          position: "relative",
        }}
        data-testid={`shell-nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
      >
        <span className="icon">{item.icon}</span>
        <span className="label">{item.label}</span>
        {item.badge && item.badge.value > 0 && (
          <span
            style={{
              fontSize: 10,
              padding: "1px 6px",
              borderRadius: 20,
              fontWeight: 600,
              ...(item.badge.type === "amber"
                ? { background: "rgba(218,60,61,0.2)", color: "#f87171" }
                : { background: "rgba(74,140,111,0.15)", color: "var(--green)" }),
            }}
          >
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
    <div className="top-nav-links">
      {links.map((link) => (
        <Link key={link.label} href={link.href}>
          <span className={link.match.some((m) => activePage.startsWith(m)) ? "active" : ""}>
            {link.label}
          </span>
        </Link>
      ))}
    </div>
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

  // Fetch recent lookups for history cards
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
      return { ...item, badge: { type: "amber" as const, value: inboxBadge } };
    if (item.label === "Alerts" && alertsBadge > 0)
      return { ...item, badge: { type: "amber" as const, value: alertsBadge } };
    return item;
  });

  const closeSidebar = () => setSidebarOpen(false);

  /* ── Sidebar content ── */
  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="sidebar-logo">
        <Link href="/">
          <div style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer" }} data-testid="shell-logo">
            <div style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              overflow: "hidden",
              flexShrink: 0,
              boxShadow: "0 0 16px rgba(74,140,111,0.4)",
            }}>
              <img src="/taptrao-green-logo.png" alt="TapTrao" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <span
              style={{
                fontFamily: "var(--fh)",
                fontWeight: 800,
                fontSize: 16,
                color: "#fff",
                letterSpacing: "0",
              }}
            >
              TapTrao
            </span>
          </div>
        </Link>
        {isMobile && (
          <button
            onClick={closeSidebar}
            className="sidebar-close-btn"
            aria-label="Close menu"
          >
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
        <span style={{
          background: "rgba(74,140,111,0.1)",
          borderRadius: 20,
          padding: "2px 8px",
          fontSize: 11,
          color: "var(--green)",
          fontWeight: 500,
          whiteSpace: "nowrap",
        }}>{balance}</span>
      </div>

      {/* Custom sidebar bottom slot */}
      {sidebarBottom}
    </>
  );

  return (
    <div
      style={{
        display: "flex",
        padding: 10,
        gap: 10,
        minHeight: "100vh",
        background: "#f3f3f3",
      }}
    >
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

      {/* MAIN AREA — rounded panel with green-to-white gradient */}
      <div style={{
        flex: 1,
        minWidth: 0,
        borderRadius: 18,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(180deg, #0e4e45 0px, #0e4e45 400px, #1a6b5a 460px, #4a9e8a 520px, #8ac0b0 570px, #bdd9ce 610px, #e4efea 650px, #f3f3f3 700px)",
        minHeight: "calc(100vh - 20px)",
      }}>
        {/* TOPNAV */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: isMobile ? "0 12px" : "0 24px",
            height: 50,
            flexShrink: 0,
            background: "transparent",
            gap: 8,
          }}
        >
          {/* Left: hamburger on mobile */}
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(true)}
              style={{
                background: "none",
                border: "none",
                color: "rgba(255,255,255,0.7)",
                padding: 6,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
              aria-label="Open menu"
              data-testid="shell-hamburger"
            >
              <Menu size={22} />
            </button>
          )}

            {/* Mobile: topCenter in middle */}
            {isMobile && (
              <div className="top-nav-links">
                {topCenter || <DefaultNavLinks activePage={location} />}
              </div>
            )}

            {/* Right: icon buttons + avatar */}
            <div className="top-nav-icons">
              {/* Notification bell */}
              <Link href="/alerts">
                <div className="icon-btn" data-testid="shell-bell-icon">
                  🔔
                  {alertsBadge > 0 && <span className="dot" />}
                </div>
              </Link>

              {/* Chat icon */}
              {!isMobile && (
                <Link href="/inbox">
                  <div className="icon-btn">💬</div>
                </Link>
              )}

              {/* Settings icon */}
              {!isMobile && (
                <Link href="/settings/profile">
                  <div className="icon-btn">⚙️</div>
                </Link>
              )}

              {/* User avatar — hidden, no auth system */}
            </div>
            <button
              onClick={() => navigate("/pricing")}
              style={{
                background: "var(--green)",
                color: "#000",
                border: "none",
                borderRadius: 50,
                padding: isMobile ? "6px 12px" : "6px 16px",
                fontFamily: "var(--fb)",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                whiteSpace: "nowrap",
                boxShadow: "0 4px 18px rgba(74,140,111,0.35)",
              }}
              data-testid="shell-buy-cta"
            >
              {isMobile ? "Buy" : "Buy trade pack"}
            </button>
          </div>

          {/* Scrollable content */}
          <div className={contentClassName || "main-content"}>
            {children}
          </div>
        </div>
      </div>
  );
}
