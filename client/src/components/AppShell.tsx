import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, type ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface NavItem {
  icon: string;
  label: string;
  href: string;
  matchPaths?: string[];
  badge?: { type: "amber" | "green"; value: number };
}

/* ── Section: Menu ── */
const menuItems: NavItem[] = [
  { icon: "\u229E", label: "Dashboard", href: "/dashboard" },
  { icon: "\u25C9", label: "My Trades", href: "/trades" },
  { icon: "\u25CF", label: "Lookup", href: "/lookup" },
  { icon: "\uD83D\uDCC4", label: "LC Check", href: "/lc-check" },
];

/* ── Section: Compliance ── */
const complianceItems: NavItem[] = [
  { icon: "\uD83D\uDCEC", label: "Supplier Inbox", href: "/inbox" },
  { icon: "\uD83D\uDD14", label: "Alerts", href: "/alerts" },
  { icon: "\uD83D\uDCCB", label: "Templates", href: "/templates" },
];

function isNavActive(item: NavItem, pathname: string): boolean {
  if (item.matchPaths) return item.matchPaths.some((p) => pathname.startsWith(p));
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
        className={`sidebar-item${isActive ? " active" : ""}`}
        onClick={onClick}
        data-testid={`shell-nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
      >
        <span className="icon">{item.icon}</span>
        {item.label}
        {item.badge && item.badge.value > 0 && (
          <span className={`badge ${item.badge.type === "amber" ? "badge-red" : "badge-green"}`}>
            {item.badge.value}
          </span>
        )}
      </div>
    </Link>
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

export function AppShell({ children, topCenter, sidebarBottom, contentClassName = "content-area" }: AppShellProps) {
  const [location] = useLocation();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* Badge counts */
  const inboxBadgeQuery = useQuery<{ count: number }>({ queryKey: ["/api/supplier-inbox/badge-count"] });
  const inboxBadge = inboxBadgeQuery.data?.count ?? 0;
  const alertsBadgeQuery = useQuery<{ count: number }>({ queryKey: ["/api/alerts/unread-count"] });
  const alertsBadge = alertsBadgeQuery.data?.count ?? 0;

  /* Recent lookups for history cards */
  const recentLookupsQuery = useQuery<any[]>({ queryKey: ["/api/lookups/recent"] });
  const recentLookups = recentLookupsQuery.data?.slice(0, 3) ?? [];

  useEffect(() => { setSidebarOpen(false); }, [location]);

  useEffect(() => {
    if (isMobile && sidebarOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isMobile, sidebarOpen]);

  /* Build nav items with live badge counts */
  const mItems: NavItem[] = menuItems.map((item) => {
    if (item.label === "My Trades" && inboxBadge > 0)
      return { ...item, badge: { type: "green" as const, value: inboxBadge } };
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
          <span data-testid="shell-logo">
            <img src="/logo.png" alt="TapTrao" />
            <span>TapTrao</span>
          </span>
        </Link>
        {isMobile && (
          <button className="sidebar-close" onClick={closeSidebar} aria-label="Close menu">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Menu section */}
      <div className="sidebar-section">
        <div className="sidebar-section-label">Menu</div>
        {mItems.map((item) => (
          <SidebarNavItem key={item.href} item={item} isActive={isNavActive(item, location)} onClick={closeSidebar} />
        ))}
      </div>

      {/* Compliance section */}
      <div className="sidebar-section">
        <div className="sidebar-section-label">Compliance</div>
        {cItems.map((item) => (
          <SidebarNavItem key={item.href} item={item} isActive={isNavActive(item, location)} onClick={closeSidebar} />
        ))}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* History section */}
      <div className="sidebar-section">
        <div className="sidebar-section-label">History</div>
        <div className="sidebar-history">
          {recentLookups.length > 0 ? (
            recentLookups.map((lookup: any) => {
              const originFlag = lookup.originFlag || "";
              const destFlag = lookup.destinationFlag || "";
              const originCode = lookup.originCode || "";
              const destCode = lookup.destinationCode || "";
              const commodity = lookup.commodityName || "Trade";
              const title = `${originFlag} ${commodity} ${originCode} \u2192 ${destFlag} ${destCode}`;
              return <HistoryCard key={lookup.id} title={title} tags={["Lookup"]} />;
            })
          ) : (
            <>
              <HistoryCard title="\uD83C\uDDE8\uD83C\uDDEE Cashew CI \u2192 \uD83C\uDDEC\uD83C\uDDE7 UK Q1 2026" tags={["LC Check", "$126k"]} />
              <HistoryCard title="\uD83C\uDDEC\uD83C\uDDED Cocoa Beans GH \u2192 \uD83C\uDDEA\uD83C\uDDFA EU" tags={["LC Check", "$84k"]} />
              <HistoryCard title="\uD83C\uDDEA\uD83C\uDDF9 Sesame Seeds ET \u2192 \uD83C\uDDEA\uD83C\uDDFA EU" tags={["Lookup", "$43k"]} />
            </>
          )}
        </div>
      </div>

      {/* Custom sidebar bottom slot */}
      {sidebarBottom}
    </>
  );

  return (
    <div className="app-layout">
      {/* SIDEBAR — desktop */}
      {!isMobile && <aside className="sidebar">{sidebarContent}</aside>}

      {/* Mobile sidebar overlay */}
      {isMobile && sidebarOpen && (
        <>
          <div className="sidebar-backdrop" onClick={closeSidebar} />
          <aside className="sidebar sidebar-mobile">{sidebarContent}</aside>
        </>
      )}

      {/* MAIN CONTENT */}
      <div className="main-wrapper">
        <div className="main-box">
          <div className={contentClassName}>
            {/* NAV BAR — inside content area at top */}
            <div className="top-nav">
              {isMobile ? (
                <button
                  className="hamburger-btn"
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Open menu"
                  data-testid="shell-hamburger"
                >
                  <Menu size={22} />
                </button>
              ) : (
                <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
                  {topCenter || <DefaultNavLinks activePage={location} />}
                </div>
              )}

              {isMobile && (
                <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
                  {topCenter || <DefaultNavLinks activePage={location} />}
                </div>
              )}

              {/* Right: icon buttons + avatar */}
              <div className="top-nav-icons">
                <Link href="/alerts">
                  <div className="icon-btn" data-testid="shell-bell-icon">
                    {"\uD83D\uDD14"}
                    {alertsBadge > 0 && <div className="dot" />}
                  </div>
                </Link>
                {!isMobile && (
                  <Link href="/inbox">
                    <div className="icon-btn">{"\uD83D\uDCAC"}</div>
                  </Link>
                )}
                {!isMobile && (
                  <Link href="/settings/profile">
                    <div className="icon-btn">{"\u2699\uFE0F"}</div>
                  </Link>
                )}
                <div className="user-avatar" data-testid="shell-user-avatar">F</div>
              </div>
            </div>

            {/* Scrollable content */}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
