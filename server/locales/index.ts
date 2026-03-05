import { en } from './en';
import { fr } from './fr';

const translations: Record<string, Record<string, string>> = { en, fr };

/**
 * Read the preferred locale from the taptrao_lang cookie.
 * Falls back to 'en' if unset or unrecognised.
 */
export function getLocale(req: { cookies?: Record<string, string> }): string {
  return req.cookies?.taptrao_lang === 'fr' ? 'fr' : 'en';
}

/**
 * Look up a translated string by key.
 *  - Falls back to the English value when the key is missing in the requested locale.
 *  - Falls back to the raw key if it doesn't exist in any locale.
 *  - Interpolates `{{param}}` placeholders from the optional `params` map.
 */
export function t(key: string, locale: string, params?: Record<string, string | number>): string {
  let text = translations[locale]?.[key] || translations.en[key] || key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v));
    }
  }
  return text;
}
