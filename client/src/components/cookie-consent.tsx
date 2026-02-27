import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const COOKIE_KEY = "taptrao_cookie_consent";
const GTAG_ID = "AW-17979733086";

function loadGA4() {
  if (!GTAG_ID || GTAG_ID === "G-XXXXXXXXXX") return;
  if (document.getElementById("ga4-script")) return;

  const script = document.createElement("script");
  script.id = "ga4-script";
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GTAG_ID}`;
  document.head.appendChild(script);

  const inline = document.createElement("script");
  inline.id = "ga4-inline";
  inline.textContent = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${GTAG_ID}');
  `;
  document.head.appendChild(inline);
}

function removeGA4() {
  document.getElementById("ga4-script")?.remove();
  document.getElementById("ga4-inline")?.remove();
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
  removeGA4();
  window.location.reload();
}

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = getConsent();
    if (consent === null) {
      setVisible(true);
    } else if (consent === "accepted") {
      loadGA4();
    }
  }, []);

  const handleAccept = () => {
    setConsent("accepted");
    loadGA4();
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
