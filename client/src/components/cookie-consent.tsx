import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

const COOKIE_KEY = "taptrao_cookie_consent";
const GA4_ID = "G-HDN0GN0RVB";
const GADS_ID = "AW-17979733086";

function loadGtag() {
  if (document.getElementById("gtag-script")) return;

  // Load gtag.js with the GA4 ID as primary
  const script = document.createElement("script");
  script.id = "gtag-script";
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`;
  document.head.appendChild(script);

  // Configure both GA4 and Google Ads
  const inline = document.createElement("script");
  inline.id = "gtag-inline";
  inline.textContent = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${GA4_ID}', { send_page_view: false });
    gtag('config', '${GADS_ID}');
  `;
  document.head.appendChild(inline);
}

function removeGtag() {
  document.getElementById("gtag-script")?.remove();
  document.getElementById("gtag-inline")?.remove();
}

/** Send a page_view event — call on every SPA route change */
export function trackPageView(path: string) {
  if (typeof window.gtag === "function") {
    window.gtag("event", "page_view", {
      page_path: path,
      page_title: document.title,
    });
  }
}

function getConsent(): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_KEY}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setConsent(value: "accepted" | "rejected") {
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);
  document.cookie = `${COOKIE_KEY}=${value}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
}

export function resetCookieConsent() {
  document.cookie = `${COOKIE_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  removeGtag();
  window.location.reload();
}

/** Hook: tracks SPA page views on every route change */
export function usePageViewTracking() {
  const [location] = useLocation();
  useEffect(() => {
    trackPageView(location);
  }, [location]);
}

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = getConsent();
    if (consent === null) {
      setVisible(true);
    } else if (consent === "accepted") {
      loadGtag();
    }
  }, []);

  const handleAccept = () => {
    setConsent("accepted");
    loadGtag();
    setVisible(false);
  };

  const handleReject = () => {
    setConsent("rejected");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[10000] bg-[#080E18] border-t border-white/10"
      data-testid="banner-cookie-consent"
    >
      <div className="max-w-4xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="text-white/80 text-sm flex-1" data-testid="text-cookie-message">
          We use essential cookies to run TapTrao. We'd also like to use Google Analytics to
          understand how people use the site. Do you accept analytics cookies?{" "}
          <Link href="/privacy-policy">
            <span className="underline text-white/60 cursor-pointer hover:text-white">Learn more</span>
          </Link>
        </p>
        <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
          <Button
            onClick={handleAccept}
            size="sm"
            className="bg-[#1A3D2B] text-white border-[#1A3D2B]"
            data-testid="button-accept-analytics"
          >
            Accept Analytics
          </Button>
          <Button
            onClick={handleReject}
            variant="outline"
            size="sm"
            className="text-white/70 border-white/20"
            data-testid="button-essential-only"
          >
            Essential Only
          </Button>
        </div>
      </div>
    </div>
  );
}
