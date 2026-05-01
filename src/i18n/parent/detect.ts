export type Lang = 'en' | 'hi' | 'as' | 'bn' | 'ta' | 'kn' | 'mr';

export const SUPPORTED_LANGS: Lang[] = ['en', 'hi', 'as', 'bn', 'ta', 'kn', 'mr'];

export const LANG_LABELS: Record<Lang, string> = {
  en: 'English',
  hi: 'हिन्दी',
  as: 'অসমীয়া',
  bn: 'বাংলা',
};

export const storageKey = (token: string) => `parent_lang_${token}`;
export const suggestionFlagKey = (token: string) => `parent_lang_suggested_${token}`;

/**
 * State → ordered list of preferred languages (most relevant first).
 * Languages outside the v1 supported set (en/hi/as/bn) are intentionally
 * still listed for future expansion; the banner filters them down to
 * supported ones, and silently does nothing if the supported set is empty.
 */
export const STATE_LANGUAGE_MAP: Record<string, Lang[]> = {
  // Northeast
  Assam: ['as', 'bn'],
  'West Bengal': ['bn', 'hi'],
  Tripura: ['bn', 'hi'],
  // Hindi belt
  'Uttar Pradesh': ['hi'],
  'Madhya Pradesh': ['hi'],
  Bihar: ['hi'],
  Rajasthan: ['hi'],
  Haryana: ['hi'],
  Delhi: ['hi'],
  Uttarakhand: ['hi'],
  'Himachal Pradesh': ['hi'],
  Jharkhand: ['hi'],
  Chhattisgarh: ['hi'],
  // Other states (no v1 native language → no banner)
  Maharashtra: [],
  Gujarat: [],
  Punjab: [],
  Goa: [],
  Odisha: [],
  Sikkim: [],
  'Arunachal Pradesh': [],
  Manipur: [],
  Meghalaya: [],
  Mizoram: [],
  Nagaland: [],
  'Tamil Nadu': [],
  Karnataka: [],
  Kerala: [],
  'Andhra Pradesh': [],
  Telangana: [],
  // Union territories
  Chandigarh: ['hi'],
  'Jammu and Kashmir': ['hi'],
  Ladakh: [],
  Puducherry: [],
  Lakshadweep: [],
  'Andaman and Nicobar Islands': [],
  'Dadra and Nagar Haveli and Daman and Diu': [],
};

interface ResolveArgs {
  token: string;
  dbLang: Lang | null;
}

function fromBrowser(): Lang | null {
  try {
    const raw = (navigator.language || '').toLowerCase();
    if (raw.startsWith('hi')) return 'hi';
    if (raw.startsWith('as')) return 'as';
    if (raw.startsWith('bn')) return 'bn';
    if (raw.startsWith('en')) return 'en';
  } catch {
    /* ignore */
  }
  return null;
}

export function resolveInitialLanguage({ token, dbLang }: ResolveArgs): Lang {
  // 1. DB
  if (dbLang && SUPPORTED_LANGS.includes(dbLang)) return dbLang;
  // 2. localStorage
  try {
    const stored = localStorage.getItem(storageKey(token));
    if (stored && SUPPORTED_LANGS.includes(stored as Lang)) return stored as Lang;
  } catch {
    /* ignore */
  }
  // 3. browser language
  const fromNav = fromBrowser();
  if (fromNav) return fromNav;
  // 4. default
  return 'en';
}

export function suggestedLanguagesForState(state: string | null | undefined): Lang[] {
  if (!state) return [];
  const candidates = STATE_LANGUAGE_MAP[state] ?? [];
  return candidates.filter(l => SUPPORTED_LANGS.includes(l));
}
