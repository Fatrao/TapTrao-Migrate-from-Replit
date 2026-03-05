import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enCommon from "../locales/en/common.json";
import frCommon from "../locales/fr/common.json";

import enHome from "../locales/en/home.json";
import frHome from "../locales/fr/home.json";

import enLookup from "../locales/en/lookup.json";
import frLookup from "../locales/fr/lookup.json";

import enLcCheck from "../locales/en/lcCheck.json";
import frLcCheck from "../locales/fr/lcCheck.json";

import enTrades from "../locales/en/trades.json";
import frTrades from "../locales/fr/trades.json";

import enPricing from "../locales/en/pricing.json";
import frPricing from "../locales/fr/pricing.json";

import enDashboard from "../locales/en/dashboard.json";
import frDashboard from "../locales/fr/dashboard.json";

import enAuth from "../locales/en/auth.json";
import frAuth from "../locales/fr/auth.json";

import enSettings from "../locales/en/settings.json";
import frSettings from "../locales/fr/settings.json";

import enInbox from "../locales/en/inbox.json";
import frInbox from "../locales/fr/inbox.json";

import enTemplates from "../locales/en/templates.json";
import frTemplates from "../locales/fr/templates.json";

import enAlerts from "../locales/en/alerts.json";
import frAlerts from "../locales/fr/alerts.json";

import enEudr from "../locales/en/eudr.json";
import frEudr from "../locales/fr/eudr.json";

import enDemurrage from "../locales/en/demurrage.json";
import frDemurrage from "../locales/fr/demurrage.json";

import enLegal from "../locales/en/legal.json";
import frLegal from "../locales/fr/legal.json";

import enAdmin from "../locales/en/admin.json";
import frAdmin from "../locales/fr/admin.json";

import enErrors from "../locales/en/errors.json";
import frErrors from "../locales/fr/errors.json";

import enSupplierUpload from "../locales/en/supplierUpload.json";
import frSupplierUpload from "../locales/fr/supplierUpload.json";

function getInitialLang(): string {
  const match = document.cookie.match(/(?:^|; )taptrao_lang=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : "en";
}

i18n.use(initReactI18next).init({
  resources: {
    en: {
      common: enCommon,
      home: enHome,
      lookup: enLookup,
      lcCheck: enLcCheck,
      trades: enTrades,
      pricing: enPricing,
      dashboard: enDashboard,
      auth: enAuth,
      settings: enSettings,
      inbox: enInbox,
      templates: enTemplates,
      alerts: enAlerts,
      eudr: enEudr,
      demurrage: enDemurrage,
      legal: enLegal,
      admin: enAdmin,
      errors: enErrors,
      supplierUpload: enSupplierUpload,
    },
    fr: {
      common: frCommon,
      home: frHome,
      lookup: frLookup,
      lcCheck: frLcCheck,
      trades: frTrades,
      pricing: frPricing,
      dashboard: frDashboard,
      auth: frAuth,
      settings: frSettings,
      inbox: frInbox,
      templates: frTemplates,
      alerts: frAlerts,
      eudr: frEudr,
      demurrage: frDemurrage,
      legal: frLegal,
      admin: frAdmin,
      errors: frErrors,
      supplierUpload: frSupplierUpload,
    },
  },
  lng: getInitialLang(),
  fallbackLng: "en",
  defaultNS: "common",
  interpolation: { escapeValue: false },
});

i18n.on("languageChanged", (lng) => {
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);
  document.cookie = `taptrao_lang=${lng}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
});

export default i18n;
