import { Link, useLocation } from "wouter";
import { useTokenBalance } from "@/hooks/use-tokens";
import { LayoutGrid, Settings, Plus, Search, FileCheck, Bell, Calculator, Bookmark, Menu, X } from "lucide-react";
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

const workspaceItems: NavItem[] = [
  { icon: Search, label: "Compliance Lookup", href: "/lookup" },
  { icon: FileCheck, label: "LC Checker", href: "/lc-check" },
  { icon: LayoutGrid, label: "My Trades", href: "/trades", matchPaths: ["/trades", "/dashboard"] },
];

const toolsItems: NavItem[] = [
  { icon: Bookmark, label: "Templates", href: "/templates" },
  { icon: Bell, label: "Alerts", href: "/alerts" },
  { icon: Calculator, label: "Demurrage Calc", href: "/demurrage" },
];

const accountItems: NavItem[] = [
  { icon: Settings, label: "Settings", href: "/settings/profile" },
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
          background: isActive ? "rgba(74,195,41,0.12)" : "transparent",
          cursor: "pointer",
          transition: "all 0.15s",
          position: "relative",
        }}
        data-testid={`shell-nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.background = "rgba(255,255,255,0.05)";
            e.currentTarget.style.color = "#999";
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "#666";
          }
        }}
      >
        {/* Active indicator bar */}
        {isActive && (
          <div style={{
            position: "absolute",
            left: 0,
            top: "50%",
            transform: "translateY(-50%)",
            width: 3,
            height: 18,
            background: "var(--green)",
            borderRadius: "0 3px 3px 0",
          }} />
        )}
        <item.icon
          size={14}
          style={{
            flexShrink: 0,
            opacity: 0.6,
          }}
        />
        <span style={{ flex: 1 }}>{item.label}</span>
        {item.badge && item.badge.value > 0 && (
          <span
            style={{
              fontSize: 10,
              padding: "1px 6px",
              borderRadius: 20,
              fontWeight: 600,
              ...(item.badge.type === "amber"
                ? { background: "rgba(218,60,61,0.2)", color: "#f87171" }
                : { background: "rgba(74,195,41,0.15)", color: "var(--green)" }),
            }}
          >
            {item.badge.value}
          </span>
        )}
      </div>
    </Link>
  );
}

function NavLabel({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.12em",
        color: "rgba(255,255,255,0.25)",
        textTransform: "uppercase",
        padding: "0 16px",
        marginBottom: 5,
        marginTop: 16,
      }}
    >
      {children}
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

  const wsItems: NavItem[] = workspaceItems.map((item) => {
    if (item.label === "My Trades" && inboxBadge > 0)
      return { ...item, badge: { type: "amber" as const, value: inboxBadge } };
    return item;
  });
  const tlItems: NavItem[] = toolsItems.map((item) => {
    if (item.label === "Alerts" && alertsBadge > 0)
      return { ...item, badge: { type: "green" as const, value: alertsBadge } };
    return item;
  });

  const closeSidebar = () => setSidebarOpen(false);

  const sidebarContent = (
    <>
      {/* Logo area */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 16px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          marginBottom: 12,
        }}
      >
        <Link href="/">
          <div style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer" }} data-testid="shell-logo">
            <div style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              overflow: "hidden",
              flexShrink: 0,
              boxShadow: "0 0 16px rgba(74,195,41,0.4)",
            }}>
              <img src="/logo.png" alt="TapTrao" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <span
              style={{
                fontFamily: "var(--fh)",
                fontWeight: 800,
                fontSize: 16,
                color: "#fff",
                letterSpacing: "-0.03em",
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
              color: "#999",
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

      {/* WORKSPACE */}
      <NavLabel>Workspace</NavLabel>
      {wsItems.map((item) => (
        <SidebarNavItem key={item.href} item={item} isActive={isNavActive(item, location)} onClick={closeSidebar} />
      ))}

      {/* TOOLS */}
      <NavLabel>Tools</NavLabel>
      {tlItems.map((item) => (
        <SidebarNavItem key={item.href} item={item} isActive={isNavActive(item, location)} onClick={closeSidebar} />
      ))}

      {/* ACCOUNT */}
      <NavLabel>Account</NavLabel>
      {accountItems.map((item) => (
        <SidebarNavItem key={item.href} item={item} isActive={isNavActive(item, location)} onClick={closeSidebar} />
      ))}

      {/* Spacer + bottom */}
      <div style={{ flex: 1 }} />

      {/* History cards placeholder */}
      {sidebarBottom}

      {/* Sidebar footer */}
      <div style={{
        marginTop: "auto",
        padding: "14px 12px 16px",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        alignItems: "center",
        gap: 9,
      }}>
        <div style={{
          width: 30,
          height: 30,
          borderRadius: "50%",
          background: "linear-gradient(135deg, var(--green), var(--teal))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 800,
          fontSize: 12,
          color: "#000",
          fontFamily: "var(--fh)",
          flexShrink: 0,
        }}>T</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#ccc" }}>Trader</div>
          <div style={{ fontSize: 10, color: "#555" }}>TapTrao User</div>
        </div>
        <span style={{
          background: "rgba(74,195,41,0.1)",
          borderRadius: 20,
          padding: "2px 8px",
          fontSize: 11,
          color: "var(--green)",
          fontWeight: 500,
          whiteSpace: "nowrap",
        }}>{balance}</span>
      </div>
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
      {/* SIDEBAR — desktop: always visible */}
      {!isMobile && (
        <div
          style={{
            width: 210,
            minWidth: 210,
            background: "#1c1c1e",
            borderRadius: 18,
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
              background: "#1c1c1e",
              borderRadius: "0 18px 18px 0",
              zIndex: 999,
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

      {/* MAIN AREA — rounded panel with green-to-white gradient */}
      <div style={{
        flex: 1,
        minWidth: 0,
        borderRadius: 18,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(180deg, #1a3832 0%, #1d3d35 8%, #1d3d35 16%, #243f37 26%, rgba(24,46,32,0.92) 36%, rgba(22,42,30,0.72) 46%, rgba(20,38,27,0.45) 56%, rgba(18,34,24,0.2) 66%, rgba(255,255,255,0.6) 76%, #ffffff 86%, #ffffff 100%)",
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
                  background: "var(--green)",
                  borderRadius: "50%",
                  display: "inline-block",
                }}
              />
              <span style={{ fontWeight: 500, color: "var(--green)" }}>{balance}</span>
              <span style={{ display: isMobile ? "none" : "inline" }}>credits</span>
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
                boxShadow: "0 4px 18px rgba(74,195,41,0.35)",
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
