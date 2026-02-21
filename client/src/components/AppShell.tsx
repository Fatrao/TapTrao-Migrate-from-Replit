import { Link, useLocation } from "wouter";
import { useTokenBalance } from "@/hooks/use-tokens";
import { LayoutGrid, Settings, Plus, Search, FileCheck, Bell, Calculator, Bookmark } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";

interface NavItem {
  icon: typeof LayoutGrid;
  label: string;
  href: string;
  matchPaths?: string[];
  badge?: { type: "amber" | "blue"; value: number };
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

function SidebarNavItem({ item, isActive }: { item: NavItem; isActive: boolean }) {
  return (
    <Link href={item.href}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "7px 8px",
          borderRadius: 6,
          fontSize: 13,
          fontWeight: 500,
          color: isActive ? "var(--t1)" : "var(--t2)",
          background: isActive ? "rgba(66,126,255,0.12)" : "transparent",
          cursor: "pointer",
          transition: "all 0.12s",
        }}
        data-testid={`shell-nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.background = "rgba(255,255,255,0.05)";
            e.currentTarget.style.color = "var(--t1)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--t2)";
          }
        }}
      >
        <item.icon
          size={14}
          style={{
            flexShrink: 0,
            width: 16,
            textAlign: "center",
            color: isActive ? "var(--blue)" : "var(--t3)",
          }}
        />
        <span style={{ flex: 1 }}>{item.label}</span>
        {item.badge && item.badge.value > 0 && (
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 8,
              padding: "1px 5px",
              borderRadius: 3,
              fontWeight: 500,
              ...(item.badge.type === "amber"
                ? { background: "var(--amber)", color: "#000" }
                : {
                    background: "var(--blue-dim)",
                    border: "1px solid var(--blue-bd)",
                    color: "var(--blue)",
                  }),
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
        fontFamily: "'DM Mono', monospace",
        fontSize: 9,
        letterSpacing: "0.08em",
        color: "var(--t3)",
        textTransform: "uppercase",
        padding: "0 8px",
        marginBottom: 4,
        marginTop: 16,
      }}
    >
      {children}
    </div>
  );
}

export function AppShell({ children, topCenter, sidebarBottom }: AppShellProps) {
  const [location, navigate] = useLocation();
  const tokenQuery = useTokenBalance();
  const balance = tokenQuery.data?.balance ?? 0;
  const inboxBadgeQuery = useQuery<{ count: number }>({ queryKey: ["/api/supplier-inbox/badge-count"] });
  const inboxBadge = inboxBadgeQuery.data?.count ?? 0;
  const alertsBadgeQuery = useQuery<{ count: number }>({ queryKey: ["/api/alerts/unread-count"] });
  const alertsBadge = alertsBadgeQuery.data?.count ?? 0;

  const wsItems: NavItem[] = workspaceItems.map((item) => {
    if (item.label === "My Trades" && inboxBadge > 0)
      return { ...item, badge: { type: "amber" as const, value: inboxBadge } };
    return item;
  });
  const tlItems: NavItem[] = toolsItems.map((item) => {
    if (item.label === "Alerts" && alertsBadge > 0)
      return { ...item, badge: { type: "blue" as const, value: alertsBadge } };
    return item;
  });

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        background: "var(--bg)",
      }}
    >
      {/* SIDEBAR — 200px, no borders */}
      <div
        style={{
          width: 200,
          minWidth: 200,
          background: "var(--bg)",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          padding: 0,
        }}
      >
        {/* Logo area */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            padding: "14px 16px",
          }}
        >
          <Link href="/">
            <div style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer" }} data-testid="shell-logo">
              <img src="/logo.png" alt="TapTrao" style={{ width: 36, height: 36, objectFit: "contain", borderRadius: 8 }} />
              <span
                style={{
                  fontFamily: "'Fraunces', serif",
                  fontWeight: 700,
                  fontSize: 16,
                  color: "var(--t1)",
                  letterSpacing: "-0.3px",
                }}
              >
                TapTrao
              </span>
            </div>
          </Link>
        </div>

        {/* + New Lookup button */}
        <div style={{ margin: "0 12px 4px" }}>
          <button
            onClick={() => navigate("/lookup")}
            style={{
              background: "var(--blue)",
              color: "white",
              border: "none",
              borderRadius: 7,
              padding: "8px 12px",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
            data-testid="shell-new-lookup"
          >
            <Plus size={14} />
            New Lookup
          </button>
        </div>

        {/* WORKSPACE */}
        <NavLabel>Workspace</NavLabel>
        {wsItems.map((item) => (
          <div key={item.href} style={{ padding: "0 4px" }}>
            <SidebarNavItem item={item} isActive={isNavActive(item, location)} />
          </div>
        ))}

        {/* TOOLS */}
        <NavLabel>Tools</NavLabel>
        {tlItems.map((item) => (
          <div key={item.href} style={{ padding: "0 4px" }}>
            <SidebarNavItem item={item} isActive={isNavActive(item, location)} />
          </div>
        ))}

        {/* ACCOUNT */}
        <NavLabel>Account</NavLabel>
        {accountItems.map((item) => (
          <div key={item.href} style={{ padding: "0 4px" }}>
            <SidebarNavItem item={item} isActive={isNavActive(item, location)} />
          </div>
        ))}

        {/* Spacer + optional bottom content */}
        <div style={{ flex: 1 }} />
        {sidebarBottom}
      </div>

      {/* MAIN AREA */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* TOPBAR — no border */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 24px",
            height: 52,
            flexShrink: 0,
          }}
        >
          {/* Center (breadcrumb / page title) */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {topCenter}
          </div>

          {/* Right: token badge + buy CTA */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <div
              style={{
                background: "var(--card)",
                borderRadius: 6,
                padding: "5px 10px",
                fontFamily: "'DM Mono', monospace",
                fontSize: 11,
                color: "var(--t2)",
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
                  background: "var(--blue)",
                  borderRadius: "50%",
                  display: "inline-block",
                }}
              />
              <span style={{ fontWeight: 500 }}>{balance}</span>
              <span>credits</span>
            </div>
            <button
              onClick={() => navigate("/pricing")}
              style={{
                background: "var(--blue)",
                color: "white",
                border: "none",
                borderRadius: 6,
                padding: "6px 14px",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
              data-testid="shell-buy-cta"
            >
              Buy trade pack
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflow: "auto" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
