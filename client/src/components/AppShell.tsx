import { Link, useLocation } from "wouter";
import { X, LogOut, User, Hexagon } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTokenBalance } from "@/hooks/use-tokens";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { LanguageToggle } from "@/components/LanguageToggle";

interface NavItem {
  icon: string;
  label: string;
  href: string;
  matchPaths?: string[];
  hasDot?: boolean;
}

/* ── Nav items (built with translations inside component) ── */

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

/* ── Feature Request Modal ── */
function FeatureRequestModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation("common");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/feature-requests", { title: title.trim(), description: description.trim() || undefined });
      return res.json();
    },
    onSuccess: () => {
      setSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ["/api/feature-requests/mine"] });
      setTimeout(() => {
        setTitle("");
        setDescription("");
        setSubmitted(false);
        onClose();
      }, 1800);
    },
  });

  if (!open) return null;

  return (
    <>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100 }} onClick={onClose} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        background: "#fff", borderRadius: 16, padding: 28, width: "min(440px, 90vw)",
        border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 16px 48px rgba(0,0,0,0.15)",
        zIndex: 101,
      }}>
        {submitted ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--t1)" }}>{t("featureModal.thankYou")}</div>
            <div style={{ fontSize: 15, color: "var(--t3)", marginTop: 6 }}>
              {t("featureModal.thankYouMessage")}
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--t1)", margin: 0, fontFamily: "var(--fd)" }}>🗳️ {t("featureModal.title")}</h3>
              <button onClick={onClose} style={{
                background: "transparent", border: "none", color: "var(--t3)",
                cursor: "pointer", fontSize: 18, padding: 4,
              }}>✕</button>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 15, fontWeight: 600, color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                {t("featureModal.whatLabel")}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("featureModal.whatPlaceholder")}
                maxLength={120}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 15, fontWeight: 600, color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                {t("featureModal.detailsLabel")}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("featureModal.detailsPlaceholder")}
                maxLength={1000}
                rows={3}
              />
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={onClose} style={{
                padding: "8px 16px", borderRadius: 8, fontSize: 15, fontWeight: 500,
                background: "transparent", border: "1px solid rgba(0,0,0,0.12)",
                color: "var(--t2)", cursor: "pointer",
              }}>{t("button.cancel")}</button>
              <button
                onClick={() => mutation.mutate()}
                disabled={title.trim().length < 3 || mutation.isPending}
                style={{
                  padding: "8px 20px", borderRadius: 8, fontSize: 15, fontWeight: 600,
                  background: title.trim().length < 3 ? "rgba(74,124,94,0.4)" : "var(--sage)",
                  border: "none", color: "#fff", cursor: title.trim().length < 3 ? "not-allowed" : "pointer",
                  opacity: mutation.isPending ? 0.7 : 1,
                }}>
                {mutation.isPending ? t("button.submitting") : t("featureModal.submitRequest")}
              </button>
            </div>
            {mutation.isError && (
              <div style={{ marginTop: 12, fontSize: 15, color: "var(--red)" }}>
                {(mutation.error as any)?.message || t("featureModal.failedSubmit")}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

export function AppShell({ children, contentClassName }: AppShellProps) {
  const { t, i18n } = useTranslation("common");
  const [location, navigate] = useLocation();
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [featureModalOpen, setFeatureModalOpen] = useState(false);
  const tokenQuery = useTokenBalance();
  const tokenData = tokenQuery.data;
  const { user, isAuthenticated, logout } = useAuth();
  const alertsBadgeQuery = useQuery<{ count: number }>({ queryKey: ["/api/alerts/unread-count"] });
  const alertsBadge = alertsBadgeQuery.data?.count ?? 0;

  const mainItems: NavItem[] = [
    { icon: "◉", label: t("nav.myTrades"), href: "/trades", matchPaths: ["/trades"] },
    { icon: "✦", label: t("nav.newCheck"), href: "/new-check" },
    { icon: "📮", label: t("nav.suppliers"), href: "/inbox" },
  ];

  const toolsItems: NavItem[] = [
    { icon: "⌧", label: t("nav.demurrage"), href: "/demurrage" },
    { icon: "📋", label: t("nav.templates"), href: "/templates" },
    { icon: "🔔", label: t("nav.alerts"), href: "/alerts" },
  ];

  const accountItems: NavItem[] = [
    { icon: "⚙", label: t("nav.settings"), href: "/settings/profile" },
    { icon: "◫", label: t("nav.shieldBilling"), href: "/pricing" },
  ];

  const adminItems: NavItem[] = [
    { icon: "🎟️", label: t("nav.promoCodes"), href: "/admin/promo-codes" },
    { icon: "🔑", label: t("nav.apiKeys"), href: "/admin/api-keys" },
    { icon: "📢", label: t("nav.createAlert"), href: "/admin/alerts/new" },
    { icon: "🗳️", label: t("nav.requests"), href: "/admin/feature-requests" },
    { icon: "🗂️", label: t("nav.data"), href: "/admin/data" },
  ];

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  useEffect(() => {
    if (isMobile && mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isMobile, mobileOpen]);

  const userInitial = user?.displayName
    ? user.displayName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() || "?";
  const userName = user?.displayName?.split(" ")[0] || user?.email?.split("@")[0] || "";

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  /* Build nav items with live alert dot */
  const tItems: NavItem[] = toolsItems.map((item) => {
    if (item.href === "/alerts" && alertsBadge > 0)
      return { ...item, hasDot: true };
    return item;
  });

  /* ── Sidebar menu item ── */
  const MenuItem = ({ item, active, onClick }: { item: NavItem; active: boolean; onClick?: () => void }) => (
    <Link href={item.href}>
      <div
        className={`mi${active ? " active" : ""}`}
        onClick={onClick}
        style={{ position: "relative" }}
        data-testid={`shell-nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
      >
        <div className="mi-icon">{item.icon}</div>
        <span className="mi-label">{item.label}</span>
        {item.hasDot && <div className="mi-dot" />}
        <div className="mi-tip">{item.label}</div>
      </div>
    </Link>
  );

  /* ── Desktop sidebar (icon rail) ── */
  const desktopSidebar = (
    <nav className="rail">
      <div className="sidebar-v2">
        {/* Brand */}
        <Link href="/">
          <div className="mi brand" data-testid="shell-logo">
            <img src="/logo.png?v=2" alt="TapTrao" style={{ width: 28, height: 28, borderRadius: 6, objectFit: "cover" as const }} />
            <span className="mi-label" style={{ fontFamily: "var(--fd)", fontWeight: 600, fontSize: 15, color: "var(--gold, #c4a265)" }}>TapTrao</span>
          </div>
        </Link>

        {/* Main */}
        {mainItems.map((item) => (
          <MenuItem key={item.href} item={item} active={isNavActive(item, location)} />
        ))}

        <div className="sb-div" />

        {/* Tools */}
        {tItems.map((item) => (
          <MenuItem key={item.href} item={item} active={isNavActive(item, location)} />
        ))}

        <div className="sb-div" />

        {/* Account */}
        {accountItems.map((item) => (
          <MenuItem key={item.href} item={item} active={isNavActive(item, location)} />
        ))}

        {/* Feature Request (paying customers) */}
        {tokenData?.hasPurchased && (
          <div
            className="mi"
            onClick={() => setFeatureModalOpen(true)}
            style={{ position: "relative" }}
            data-testid="sidebar-feature-request-btn"
          >
            <div className="mi-icon">🗳️</div>
            <span className="mi-label">{t("nav.requestFeature")}</span>
            <div className="mi-tip">{t("nav.requestFeature")}</div>
          </div>
        )}

        {/* Admin section */}
        {tokenData?.isAdmin && (
          <>
            <div className="sb-div" />
            {adminItems.map((item) => (
              <MenuItem key={item.href} item={item} active={isNavActive(item, location)} />
            ))}
          </>
        )}

        {/* Language toggle */}
        <LanguageToggle />

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Avatar */}
        {isAuthenticated ? (
          <div className="mi-av" onClick={handleLogout} title="Log out">
            <span>{userInitial}</span>
            <span className="av-label">{userName}</span>
          </div>
        ) : (
          <Link href="/login">
            <div className="mi-av">
              <span>?</span>
              <span className="av-label">{t("auth.logIn")}</span>
            </div>
          </Link>
        )}
      </div>
    </nav>
  );

  /* ── Mobile sidebar (full overlay, expanded view) ── */
  const mobileSidebar = (
    <>
      <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />
      <div className="sidebar-mobile-v2">
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, padding: "0 4px" }}>
          <Link href="/">
            <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <img src="/logo.png?v=2" alt="TapTrao" style={{ width: 36, height: 36, borderRadius: 10, objectFit: "cover" as const }} />
              <span style={{ fontFamily: "var(--fd)", fontWeight: 600, fontSize: 16, color: "#fff" }}>TapTrao</span>
            </div>
          </Link>
          <button onClick={() => setMobileOpen(false)} style={{
            background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", padding: 4,
          }}>
            <X size={20} />
          </button>
        </div>

        {/* Token balance */}
        <Link href="/pricing">
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "8px 12px", borderRadius: 10, marginBottom: 16,
            background: "rgba(74,124,94,0.08)", border: "1px solid rgba(74,124,94,0.15)",
            cursor: "pointer",
          }}>
            <Hexagon size={14} style={{ color: "var(--sage-l)" }} />
            <span style={{ fontSize: 15, fontWeight: 600, color: "var(--sage-l)" }}>
              {t("token.shield", { count: tokenData?.balance ?? 0 })}
            </span>
            <span style={{ fontSize: 15, color: "rgba(255,255,255,0.35)", marginLeft: "auto" }}>
              {t("token.buyMore")}
            </span>
          </div>
        </Link>

        {/* Nav items */}
        <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: 1.2, textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: 6, paddingLeft: 10 }}>{t("section.main")}</div>
        {mainItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <div
              onClick={() => setMobileOpen(false)}
              style={{
                display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
                borderRadius: 8, cursor: "pointer", fontSize: 13.5,
                color: isNavActive(item, location) ? "#fff" : "rgba(255,255,255,0.5)",
                background: isNavActive(item, location) ? "rgba(255,255,255,0.1)" : "transparent",
              }}
            >
              <span style={{ fontSize: 15 }}>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          </Link>
        ))}

        <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "8px 0" }} />

        <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: 1.2, textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: 6, paddingLeft: 10 }}>{t("section.tools")}</div>
        {tItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <div
              onClick={() => setMobileOpen(false)}
              style={{
                display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
                borderRadius: 8, cursor: "pointer", fontSize: 13.5,
                color: isNavActive(item, location) ? "#fff" : "rgba(255,255,255,0.5)",
                background: isNavActive(item, location) ? "rgba(255,255,255,0.1)" : "transparent",
                position: "relative",
              }}
            >
              <span style={{ fontSize: 15 }}>{item.icon}</span>
              <span>{item.label}</span>
              {item.hasDot && (
                <span style={{
                  width: 6, height: 6, borderRadius: "50%", background: "var(--red)", marginLeft: "auto",
                }} />
              )}
            </div>
          </Link>
        ))}

        <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "8px 0" }} />

        <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: 1.2, textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: 6, paddingLeft: 10 }}>{t("section.account")}</div>
        {accountItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <div
              onClick={() => setMobileOpen(false)}
              style={{
                display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
                borderRadius: 8, cursor: "pointer", fontSize: 13.5,
                color: isNavActive(item, location) ? "#fff" : "rgba(255,255,255,0.5)",
                background: isNavActive(item, location) ? "rgba(255,255,255,0.1)" : "transparent",
              }}
            >
              <span style={{ fontSize: 15 }}>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          </Link>
        ))}

        {/* Admin */}
        {tokenData?.isAdmin && (
          <>
            <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "8px 0" }} />
            <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: 1.2, textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: 6, paddingLeft: 10 }}>{t("section.admin")}</div>
            {adminItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <div
                  onClick={() => setMobileOpen(false)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
                    borderRadius: 8, cursor: "pointer", fontSize: 13.5,
                    color: isNavActive(item, location) ? "#fff" : "rgba(255,255,255,0.5)",
                    background: isNavActive(item, location) ? "rgba(255,255,255,0.1)" : "transparent",
                  }}
                >
                  <span style={{ fontSize: 15 }}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              </Link>
            ))}
          </>
        )}

        {/* Language toggle (mobile) */}
        <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "8px 0" }} />
        <div
          onClick={() => {
            const next = i18n.language === "en" ? "fr" : "en";
            i18n.changeLanguage(next);
          }}
          style={{
            display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
            borderRadius: 8, cursor: "pointer", fontSize: 13.5, color: "rgba(255,255,255,0.5)",
          }}
        >
          <span style={{ fontSize: 15 }}>{i18n.language === "en" ? "🇫🇷" : "🇬🇧"}</span>
          <span>{i18n.language === "en" ? "Français" : "English"}</span>
        </div>

        <div style={{ flex: 1 }} />

        {/* Avatar / Auth */}
        {isAuthenticated ? (
          <div style={{
            display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
            borderRadius: 10, marginTop: 8,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "linear-gradient(135deg, var(--sage), #3a6048)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 15, fontWeight: 700, color: "#fff",
            }}>{userInitial}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>{user?.displayName || user?.email}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>
                {user?.dataRegion === "US" ? "🇺🇸" : "🇪🇺"} {user?.dataRegion || "EU"} Region
              </div>
            </div>
            <button onClick={handleLogout} style={{
              background: "none", border: "none", color: "rgba(255,255,255,0.4)",
              cursor: "pointer", padding: 4,
            }}>
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <Link href="/login">
            <div style={{
              padding: "10px 14px", textAlign: "center", borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)",
              fontSize: 15, fontWeight: 500, cursor: "pointer", marginTop: 8,
            }}>{t("auth.logIn")}</div>
          </Link>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop icon-rail sidebar */}
      {!isMobile && desktopSidebar}

      {/* Mobile overlay sidebar */}
      {isMobile && mobileOpen && mobileSidebar}

      {/* Main content area */}
      <div className="mn-area">
        {/* Mobile header bar */}
        {isMobile && (
          <div className="mobile-header">
            <button
              onClick={() => setMobileOpen(true)}
              className="hamburger-btn-v2"
              aria-label="Open menu"
              data-testid="shell-hamburger"
            >
              ☰
            </button>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
              <img src="/logo.png?v=2" alt="TapTrao" style={{ width: 26, height: 26, borderRadius: 6, objectFit: "cover" as const }} />
              <span style={{ fontFamily: "var(--fd)", fontWeight: 600, fontSize: 15, color: "var(--t1)" }}>TapTrao</span>
            </Link>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <Link href="/alerts">
                <div style={{ position: "relative", fontSize: 15, cursor: "pointer" }}>
                  🔔
                  {alertsBadge > 0 && (
                    <span style={{
                      position: "absolute", top: -2, right: -4, width: 6, height: 6,
                      borderRadius: "50%", background: "var(--red)",
                    }} />
                  )}
                </div>
              </Link>
            </div>
          </div>
        )}

        <div className={contentClassName || "main-content"}>
          {children}
        </div>
      </div>

      {/* Feature request modal */}
      <FeatureRequestModal open={featureModalOpen} onClose={() => setFeatureModalOpen(false)} />
    </>
  );
}
