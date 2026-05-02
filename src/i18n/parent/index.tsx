import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode } from 'react';
import en from './locales/en.json';
import hi from './locales/hi.json';
import as from './locales/as.json';
import bn from './locales/bn.json';
import ta from './locales/ta.json';
import kn from './locales/kn.json';
import mr from './locales/mr.json';
import { resolveInitialLanguage, SUPPORTED_LANGS, storageKey, suggestionFlagKey, suggestedLanguagesForState, type Lang } from './detect';
import { fetchGeoState } from './geo';

const DICTIONARIES: Record<Lang, Record<string, string>> = { en, hi, as, bn, ta, kn, mr };

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang, opts?: { persist?: boolean }) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  token: string;
  hasUserChosen: boolean;
  /** Detected Indian state from IP geolocation (null until resolved) */
  detectedState: string | null;
  /** Languages suggested for the detected state */
  suggestedLangs: Lang[];
  /** Whether geo auto-set has been applied */
  geoApplied: boolean;
}

const Ctx = createContext<I18nCtx | null>(null);

interface ProviderProps {
  token: string;
  initialLangFromDb?: Lang | null;
  children: ReactNode;
  onPersist?: (lang: Lang) => void;
}

export function ParentI18nProvider({ token, initialLangFromDb, children, onPersist }: ProviderProps) {
  const [lang, setLangState] = useState<Lang>(() =>
    resolveInitialLanguage({ token, dbLang: initialLangFromDb ?? null })
  );
  const [hasUserChosen, setHasUserChosen] = useState<boolean>(() => {
    if (initialLangFromDb && SUPPORTED_LANGS.includes(initialLangFromDb)) return true;
    try {
      return !!localStorage.getItem(storageKey(token));
    } catch {
      return false;
    }
  });
  const [detectedState, setDetectedState] = useState<string | null>(null);
  const [suggestedLangs, setSuggestedLangs] = useState<Lang[]>([]);
  const [geoApplied, setGeoApplied] = useState(false);

  const onPersistRef = useRef(onPersist);
  onPersistRef.current = onPersist;

  // If DB lang arrives later, adopt it (only if user hasn't already chosen on this device)
  useEffect(() => {
    if (initialLangFromDb && SUPPORTED_LANGS.includes(initialLangFromDb)) {
      try {
        if (!localStorage.getItem(storageKey(token))) {
          setLangState(initialLangFromDb);
        }
      } catch {
        setLangState(initialLangFromDb);
      }
      setHasUserChosen(true);
    }
  }, [initialLangFromDb, token]);

  // Geo auto-detect: run once on mount if user hasn't chosen
  useEffect(() => {
    if (hasUserChosen) return;
    // Also skip if DB lang was set
    if (initialLangFromDb && SUPPORTED_LANGS.includes(initialLangFromDb)) return;

    const ctrl = new AbortController();
    fetchGeoState(ctrl.signal).then((res) => {
      if (!res || !res.state) return;
      const langs = suggestedLanguagesForState(res.state);
      setDetectedState(res.state);
      setSuggestedLangs(langs);

      // Auto-set to the first suggested language (if not English)
      if (langs.length > 0) {
        const autoLang = langs[0];
        setLangState(autoLang);
        setGeoApplied(true);
        // Don't mark hasUserChosen — let banner offer alternatives
      }
    });
    return () => ctrl.abort();
  }, [hasUserChosen, initialLangFromDb, token]);

  const setLang = useCallback(
    (l: Lang, opts?: { persist?: boolean }) => {
      if (!SUPPORTED_LANGS.includes(l)) return;
      setLangState(l);
      setHasUserChosen(true);
      setGeoApplied(false);
      try {
        localStorage.setItem(storageKey(token), l);
        localStorage.setItem(suggestionFlagKey(token), '1');
      } catch {
        /* ignore */
      }
      if (opts?.persist !== false) {
        try {
          onPersistRef.current?.(l);
        } catch {
          /* ignore */
        }
      }
    },
    [token]
  );

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const dict = DICTIONARIES[lang] || DICTIONARIES.en;
      let str = dict[key] ?? DICTIONARIES.en[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          str = str.split(`{${k}}`).join(String(v));
        }
      }
      return str;
    },
    [lang]
  );

  const value = useMemo<I18nCtx>(
    () => ({ lang, setLang, t, token, hasUserChosen, detectedState, suggestedLangs, geoApplied }),
    [lang, setLang, t, token, hasUserChosen, detectedState, suggestedLangs, geoApplied]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useT() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    return {
      lang: 'en' as Lang,
      setLang: () => {},
      t: (k: string) => k,
      token: '',
      hasUserChosen: false,
      detectedState: null,
      suggestedLangs: [],
      geoApplied: false,
    } satisfies I18nCtx;
  }
  return ctx;
}

export type { Lang };
export { SUPPORTED_LANGS };
