import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode } from 'react';
import en from './locales/en.json';
import hi from './locales/hi.json';
import as from './locales/as.json';
import bn from './locales/bn.json';
import { resolveInitialLanguage, SUPPORTED_LANGS, storageKey, suggestionFlagKey, type Lang } from './detect';

const DICTIONARIES: Record<Lang, Record<string, string>> = { en, hi, as, bn };

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang, opts?: { persist?: boolean }) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  token: string;
  hasUserChosen: boolean;
}

const Ctx = createContext<I18nCtx | null>(null);

interface ProviderProps {
  token: string;
  initialLangFromDb?: Lang | null;
  children: ReactNode;
  /** Called when the user explicitly picks a language (best-effort persist to DB). */
  onPersist?: (lang: Lang) => void;
}

export function ParentI18nProvider({ token, initialLangFromDb, children, onPersist }: ProviderProps) {
  const [lang, setLangState] = useState<Lang>(() =>
    resolveInitialLanguage({ token, dbLang: initialLangFromDb ?? null })
  );
  // Track whether user has explicitly picked (to gate banner)
  const [hasUserChosen, setHasUserChosen] = useState<boolean>(() => {
    if (initialLangFromDb && SUPPORTED_LANGS.includes(initialLangFromDb)) return true;
    try {
      return !!localStorage.getItem(storageKey(token));
    } catch {
      return false;
    }
  });
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

  const setLang = useCallback(
    (l: Lang, opts?: { persist?: boolean }) => {
      if (!SUPPORTED_LANGS.includes(l)) return;
      setLangState(l);
      setHasUserChosen(true);
      try {
        localStorage.setItem(storageKey(token), l);
        // Also dismiss the suggestion banner forever once user picks
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

  const value = useMemo<I18nCtx>(() => ({ lang, setLang, t, token, hasUserChosen }), [lang, setLang, t, token, hasUserChosen]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useT() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    // Safe fallback: identity translator if used outside provider (shouldn't happen)
    return {
      lang: 'en' as Lang,
      setLang: () => {},
      t: (k: string) => k,
      token: '',
      hasUserChosen: false,
    } satisfies I18nCtx;
  }
  return ctx;
}

export type { Lang };
export { SUPPORTED_LANGS };
