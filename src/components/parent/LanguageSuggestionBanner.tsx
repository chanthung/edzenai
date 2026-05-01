import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useT } from '@/i18n/parent';
import { fetchGeoState } from '@/i18n/parent/geo';
import { LANG_LABELS, suggestedLanguagesForState, suggestionFlagKey, type Lang } from '@/i18n/parent/detect';

export function LanguageSuggestionBanner() {
  const { token, lang, setLang, t, hasUserChosen } = useT();
  const [state, setState] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Lang[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (hasUserChosen) return;
    let already = false;
    try {
      already = localStorage.getItem(suggestionFlagKey(token)) === '1';
    } catch {
      /* ignore */
    }
    if (already) return;

    const ctrl = new AbortController();
    fetchGeoState(ctrl.signal).then((res) => {
      if (!res || !res.state) return;
      const langs = suggestedLanguagesForState(res.state).filter((l) => l !== lang);
      if (langs.length === 0) return;
      setState(res.state);
      setSuggestions(langs);
    });
    return () => ctrl.abort();
  }, [hasUserChosen, lang, token]);

  if (dismissed || suggestions.length === 0) return null;

  const dismissForever = () => {
    setDismissed(true);
    try {
      localStorage.setItem(suggestionFlagKey(token), '1');
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 mt-3">
      <div className="rounded-2xl border border-primary/20 bg-primary/5 backdrop-blur-sm p-3 sm:p-4 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            {t('banner.detected', { state: state ?? '' })}{' '}
            <span className="text-muted-foreground font-normal">{t('banner.prefer')}</span>
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {suggestions.map((l) => (
              <Button
                key={l}
                size="sm"
                variant="default"
                className="h-8 px-3 text-xs"
                onClick={() => {
                  setLang(l);
                  setDismissed(true);
                }}
              >
                {LANG_LABELS[l]}
              </Button>
            ))}
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-3 text-xs"
              onClick={() => {
                setLang('en');
                setDismissed(true);
              }}
            >
              {t('banner.keepEnglish')}
            </Button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismissForever}
          aria-label={t('banner.dismiss')}
          className="text-muted-foreground hover:text-foreground transition-colors p-1 -m-1"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
