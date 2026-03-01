import { Link, useLocation } from "wouter";
import { Menu, X, LogOut, User, Hexagon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, type ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTokenBalance } from "@/hooks/use-tokens";
import { useAuth } from "@/hooks/use-auth";

interface NavItem {
  icon: string;
  label: string;
  href: string;
  matchPaths?: string[];
  badge?: { type: "red" | "green"; value: number };
}

/* ── Section: Main ── */
const mainItems: NavItem[] = [
  { icon: "⊞", label: "Dashboard", href: "/dashboard" },
  { icon: "✦", label: "New Check", href: "/new-check" },
  { icon: "◉", label: "My Trades", href: "/trades", matchPaths: ["/trades"] },
  { icon: "📬", label: "Suppliers", href: "/inbox" },
];

/* ── Section: Tools ── */
const toolsItems: NavItem[] = [
  { icon: "⧖", label: "Demurrage Calc", href: "/demurrage" },
  { icon: "📋", label: "Templates", href: "/templates" },
  { icon: "🔔", label: "Alerts", href: "/alerts" },
];

/* ── Section: Account ── */
const accountItems: NavItem[] = [
  { icon: "◬", label: "Settings", href: "/settings/profile" },
  { icon: "◫", label: "Billing", href: "/pricing" },
];

/* ── Section: Admin (only visible when isAdmin) ── */
const adminItems: NavItem[] = [
  { icon: "🎟️", label: "Promo Codes", href: "/admin/promo-codes" },
  { icon: "🔑", label: "API Keys", href: "/admin/api-keys" },
  { icon: "📢", label: "Create Alert", href: "/admin/alerts/new" },
  { icon: "🗂️", label: "Data", href: "/admin/data" },
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
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const tokenQuery = useTokenBalance();
  const tokenData = tokenQuery.data;
  const balance = tokenData?.balance ?? 0;
  const { user, isAuthenticated, logout } = useAuth();
  const inboxBadgeQuery = useQuery<{ count: number }>({ queryKey: ["/api/supplier-inbox/badge-count"] });
  const inboxBadge = inboxBadgeQuery.data?.count ?? 0;
  const alertsBadgeQuery = useQuery<{ count: number }>({ queryKey: ["/api/alerts/unread-count"] });
  const alertsBadge = alertsBadgeQuery.data?.count ?? 0;
  const tradesBadgeQuery = useQuery<{ count: number }>({ queryKey: ["/api/trades/pending-count"] });
  const tradesBadge = tradesBadgeQuery.data?.count ?? 0;

  const recentLookupsQuery = useQuery<any[]>({ queryKey: ["/api/lookups/recent"] });
  const recentLookups = recentLookupsQuery.data?.slice(0, 3) ?? [];
  const lcCasesQuery = useQuery<any[]>({ queryKey: ["/api/lc-cases"] });
  const activeLcCases = (lcCasesQuery.data ?? []).filter((c: any) => c.status === "discrepancy" || c.status === "pending_correction").length;

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
  const mItems: NavItem[] = mainItems.map((item) => {
    if (item.label === "My Trades" && tradesBadge > 0)
      return { ...item, badge: { type: "green" as const, value: tradesBadge } };
    if (item.label === "Suppliers" && inboxBadge > 0)
      return { ...item, badge: { type: "red" as const, value: inboxBadge } };
    return item;
  });
  const tItems: NavItem[] = toolsItems.map((item) => {
    if (item.label === "Alerts" && alertsBadge > 0)
      return { ...item, badge: { type: "red" as const, value: alertsBadge } };
    return item;
  });

  const closeSidebar = () => setSidebarOpen(false);

  const userInitial = user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "?";

  const handleLogout = async () => {
    setUserDropdownOpen(false);
    await logout();
    navigate("/");
  };

  /* ── Sidebar content ── */
  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="sidebar-logo">
        <Link href="/">
          <div className="logo-link" data-testid="shell-logo">
            <img className="logo-img" src="/logo.png" alt="TapTrao" />
            <span>TapTrao</span>
          </div>
        </Link>
        {isMobile && (
          <button onClick={closeSidebar} className="sidebar-close-btn" aria-label="Close menu">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Token balance pill */}
      <div style={{ padding: "0 16px 8px" }}>
        <Link href="/pricing">
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            borderRadius: 10,
            background: "rgba(74,222,128,0.08)",
            border: "1px solid rgba(74,222,128,0.15)",
            cursor: "pointer",
          }}>
            <Hexagon size={14} style={{ color: "#4ade80" }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#4ade80" }}>
              {balance} {balance === 1 ? "check" : "checks"}
            </span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginLeft: "auto" }}>
              Buy More
            </span>
          </div>
        </Link>
      </div>

      {/* Main section */}
      <div className="sidebar-section">
        <SidebarLabel>Main</SidebarLabel>
        {mItems.map((item) => (
          <SidebarNavItem key={item.href} item={item} isActive={isNavActive(item, location)} onClick={closeSidebar} />
        ))}
      </div>

      {/* Tools section */}
      <div className="sidebar-section">
        <SidebarLabel>Tools</SidebarLabel>
        {tItems.map((item) => (
          <SidebarNavItem key={item.href} item={item} isActive={isNavActive(item, location)} onClick={closeSidebar} />
        ))}
      </div>

      {/* Account section */}
      <div className="sidebar-section">
        <SidebarLabel>Account</SidebarLabel>
        {accountItems.map((item) => (
          <SidebarNavItem key={item.href} item={item} isActive={isNavActive(item, location)} onClick={closeSidebar} />
        ))}
      </div>

      {/* Admin section (only if admin) */}
      {tokenData?.isAdmin && (
        <div className="sidebar-section">
          <SidebarLabel>Admin</SidebarLabel>
          {adminItems.map((item) => (
            <SidebarNavItem key={item.href} item={item} isActive={isNavActive(item, location)} onClick={closeSidebar} />
          ))}
        </div>
      )}

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

              {isAuthenticated ? (
                <div style={{ position: "relative" }}>
                  <div
                    className="user-avatar"
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    style={{ cursor: "pointer" }}
                    data-testid="shell-user-avatar"
                  >
                    {userInitial}
                  </div>
                  {userDropdownOpen && (
                    <>
                      <div
                        style={{ position: "fixed", inset: 0, zIndex: 40 }}
                        onClick={() => setUserDropdownOpen(false)}
                      />
                      <div style={{
                        position: "absolute",
                        top: "calc(100% + 8px)",
                        right: 0,
                        background: "#242428",
                        borderRadius: 10,
                        padding: "6px 0",
                        minWidth: 180,
                        boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        zIndex: 50,
                      }}>
                        <div style={{ padding: "8px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>
                            {user?.displayName || user?.email}
                          </div>
                          {user?.displayName && (
                            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                              {user.email}
                            </div>
                          )}
                        </div>
                        <Link href="/settings/profile">
                          <div
                            onClick={() => setUserDropdownOpen(false)}
                            style={{
                              display: "flex", alignItems: "center", gap: 8,
                              padding: "8px 14px", cursor: "pointer", fontSize: 13,
                              color: "rgba(255,255,255,0.7)",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          >
                            <User size={14} /> Settings
                          </div>
                        </Link>
                        <div
                          onClick={handleLogout}
                          style={{
                            display: "flex", alignItems: "center", gap: 8,
                            padding: "8px 14px", cursor: "pointer", fontSize: 13,
                            color: "rgba(255,255,255,0.7)",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <LogOut size={14} /> Log out
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <Link href="/login">
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: "rgba(255,255,255,0.7)",
                      cursor: "pointer",
                      padding: "6px 14px",
                      borderRadius: 8,
                      border: "1px solid rgba(255,255,255,0.15)",
                    }}
                    data-testid="shell-login-btn"
                  >
                    Log in
                  </div>
                </Link>
              )}
            </div>
          </div>

          {children}
        </div>
      </div>
    </>
  );
}
