import { Link, useLocation } from "wouter";
import { useTokenBalance } from "@/hooks/use-tokens";
import { LayoutGrid, BarChart3, Settings, Search, FileCheck, Bell, Calculator, Bookmark, Menu, X, Inbox } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, type ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface NavItem {
  icon: typeof LayoutGrid;
  label: string;
  href: string;
  matchPaths?: string[];
  badge?: { type: "amber" | "green"; value: number };
}

/* ── Section: Menu ── */
const menuItems: NavItem[] = [
  { icon: BarChart3, label: "Dashboard", href: "/dashboard" },
  { icon: LayoutGrid, label: "My Trades", href: "/trades" },
  { icon: Search, label: "Lookup", href: "/lookup" },
  { icon: FileCheck, label: "LC Check", href: "/lc-check" },
];

/* ── Section: Compliance ── */
const complianceItems: NavItem[] = [
  { icon: Inbox, label: "Supplier Inbox", href: "/inbox" },
  { icon: Bell, label: "Alerts", href: "/alerts" },
  { icon: Bookmark, label: "Templates", href: "/templates" },
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
          gap: 10,
          padding: isActive ? "9px 10px 9px 7px" : "9px 10px",
          borderRadius: 8,
          fontSize: 13.5,
          fontWeight: isActive ? 500 : 400,
          color: isActive ? "#4ade80" : "rgba(255,255,255,0.5)",
          background: isActive ? "rgba(74, 222, 128, 0.1)" : "transparent",
          borderLeft: isActive ? "3px solid #4ade80" : "3px solid transparent",
          cursor: "pointer",
          transition: "all 0.15s",
          textDecoration: "none",
        }}
        data-testid={`shell-nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.background = "rgba(255,255,255,0.05)";
            e.currentTarget.style.color = "rgba(255,255,255,0.8)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "rgba(255,255,255,0.5)";
          }
        }}
      >
        <item.icon
          size={15}
          style={{
            flexShrink: 0,
            width: 20,
            textAlign: "center",
          }}
        />
        <span style={{ flex: 1 }}>{item.label}</span>
        {item.badge && item.badge.value > 0 && (
          <span
            style={{
              fontSize: 11,
              padding: "1px 7px",
              borderRadius: 10,
              fontWeight: 600,
              marginLeft: "auto",
              color: "#fff",
              background: item.badge.type === "amber" ? "#ef4444" : "#6b9080",
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
    <div
      style={{
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "1.2px",
        color: "rgba(255,255,255,0.25)",
        textTransform: "uppercase",
        paddingLeft: 10,
        marginBottom: 6,
        marginTop: 20,
      }}
    >
      {children}
    </div>
  );
}

/* ── History card ── */
function HistoryCard({ title, tags }: { title: string; tags: string[] }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        borderRadius: 8,
        padding: "10px 12px",
        marginBottom: 6,
        cursor: "pointer",
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
    >
      <div style={{ fontSize: 12.5, fontWeight: 500, color: "rgba(255,255,255,0.85)", marginBottom: 5 }}>
        {title}
      </div>
      <div style={{ display: "flex", gap: 5 }}>
        {tags.map((tag, i) => (
          <span
            key={i}
            style={{
              fontSize: 10,
              padding: "2px 7px",
              borderRadius: 4,
              background: "rgba(255,255,255,0.07)",
              color: "rgba(255,255,255,0.4)",
            }}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

export function AppShell({ children, topCenter, sidebarBottom }: AppShellProps) {
  const [location, navigate] = useLocation();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const tokenQuery = useTokenBalance();
  const balance = tokenQuery.data?.balance ?? 0;
  const inboxBadgeQuery = useQuery<{ count: number }>({ queryKey: ["/api/supplier-inbox/badge-count"] });
  const inboxBadge = inboxBadgeQuery.data?.count ?? 0;
  const alertsBadgeQuery = useQuery<{ count: number }>({ queryKey: ["/api/alerts/unread-count"] });
  const alertsBadge = alertsBadgeQuery.data?.count ?? 0;

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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 8px",
          marginBottom: 30,
        }}
      >
        <Link href="/">
          <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} data-testid="shell-logo">
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              overflow: "hidden",
              flexShrink: 0,
            }}>
              <img src="/logo.png" alt="TapTrao" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <span
              style={{
                fontFamily: "'Clash Display', sans-serif",
                fontWeight: 600,
                fontSize: 17,
                color: "#fff",
              }}
            >
              TapTrao
            </span>
          </div>
        </Link>
        {isMobile && (
          <button
            onClick={closeSidebar}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.5)",
              padding: 4,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Menu section */}
      <SidebarLabel>Menu</SidebarLabel>
      {mItems.map((item) => (
        <SidebarNavItem key={item.href} item={item} isActive={isNavActive(item, location)} onClick={closeSidebar} />
      ))}

      {/* Compliance section */}
      <SidebarLabel>Compliance</SidebarLabel>
      {cItems.map((item) => (
        <SidebarNavItem key={item.href} item={item} isActive={isNavActive(item, location)} onClick={closeSidebar} />
      ))}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* History section */}
      <SidebarLabel>History</SidebarLabel>
      <div style={{ marginTop: 4, padding: "0 2px" }}>
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
        background: "#000",
      }}
    >
      {/* SIDEBAR — desktop */}
      {!isMobile && (
        <div
          style={{
            width: 240,
            minWidth: 240,
            background: "#242428",
            borderRadius: 18,
            padding: "20px 14px",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            position: "sticky",
            top: 10,
            height: "calc(100vh - 20px)",
            flexShrink: 0,
            zIndex: 10,
          }}
        >
          {sidebarContent}
        </div>
      )}

      {/* Mobile sidebar overlay */}
      {isMobile && sidebarOpen && (
        <>
          <div
            onClick={closeSidebar}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              zIndex: 998,
            }}
          />
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              bottom: 0,
              width: 260,
              maxWidth: "80vw",
              background: "#242428",
              borderRadius: "0 18px 18px 0",
              zIndex: 999,
              padding: "20px 14px",
              display: "flex",
              flexDirection: "column",
              overflowY: "auto",
              boxShadow: "4px 0 24px rgba(0,0,0,0.4)",
            }}
          >
            {sidebarContent}
          </div>
        </>
      )}

      {/* MAIN AREA — 22-stop dark-to-light gradient */}
      <div style={{
        flex: 1,
        minWidth: 0,
        borderRadius: 18,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        background: `linear-gradient(180deg,
          #1a1a1c 0%, #1c2420 3%, #1e2e28 6%, #1f3830 9%,
          #214232 12%, #264a38 16%, #2c5540 20%, #356248 25%,
          #3f7056 30%, #4a7e64 35%, #578d74 40%, #659b82 45%,
          #74a890 50%, #85b49e 55%, #96bfab 60%, #a8cab8 65%,
          #bbd5c6 70%, #cddfd3 75%, #dde8e1 80%, #eaf0ec 85%,
          #f2f4f3 90%, #f5f5f5 95%
        )`,
        minHeight: "calc(100vh - 20px)",
      }}>
        {/* TOP NAV */}
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

          {/* Center (breadcrumb / page title) */}
          <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
            {topCenter}
          </div>

          {/* Right: token badge + buy CTA */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <div
              style={{
                background: "rgba(255,255,255,0.07)",
                borderRadius: 8,
                padding: "5px 10px",
                fontSize: 11,
                color: "rgba(255,255,255,0.45)",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
              data-testid="shell-token-chip"
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  background: "#6b9080",
                  borderRadius: "50%",
                  display: "inline-block",
                }}
              />
              <span style={{ fontWeight: 500, color: "#6b9080" }}>{balance}</span>
              <span style={{ display: isMobile ? "none" : "inline" }}>credits</span>
            </div>
            <button
              onClick={() => navigate("/pricing")}
              style={{
                background: "#6b9080",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: isMobile ? "6px 12px" : "8px 20px",
                fontFamily: "'Inter', sans-serif",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
              data-testid="shell-buy-cta"
            >
              {isMobile ? "Buy" : "Buy trade pack"}
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflow: "auto", padding: "0 0 60px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
