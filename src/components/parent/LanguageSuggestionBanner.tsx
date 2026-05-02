import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useT } from '@/i18n/parent';
import { LANG_LABELS, suggestionFlagKey, type Lang } from '@/i18n/parent/detect';

/**
 * Shows after geo auto-set:
 * - If language was auto-set to a regional lang, offer "Keep {lang}" or "Switch to English"
 * - If geo detected other langs the user might prefer, show those too
 */
export function LanguageSuggestionBanner() {
  const { token, lang, setLang, t, hasUserChosen, geoApplied, suggestedLangs, detectedState } = useT();
  const [dismissed, setDismissed] = useState(false);

  // Only show when geo auto-applied a non-English language and user hasn't explicitly chosen
  if (dismissed || hasUserChosen || !geoApplied || lang === 'en') return null;

  const dismissForever = () => {
    setDismissed(true);
    try {
      localStorage.setItem(suggestionFlagKey(token), '1');
    } catch { /* ignore */ }
  };

  // Other suggested languages the user might want (excluding the current auto-set one)
  const alternatives = suggestedLangs.filter((l) => l !== lang);

  return (
    <div className="max-w-2xl mx-auto px-4 mt-3">
      <div className="rounded-2xl border border-primary/20 bg-primary/5 backdrop-blur-sm p-3 sm:p-4 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            {t('banner.detected', { state: detectedState ?? '' })}{' '}
            <span className="text-muted-foreground font-normal">{t('banner.autoSet', { lang: LANG_LABELS[lang] })}</span>
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {/* Confirm current auto-set language */}
            <Button
              size="sm"
              variant="default"
              className="h-8 px-3 text-xs"
              onClick={() => {
                setLang(lang);
                setDismissed(true);
              }}
            >
              {t('banner.keep', { lang: LANG_LABELS[lang] })}
            </Button>
            {/* Other regional alternatives */}
            {alternatives.map((l) => (
              <Button
                key={l}
                size="sm"
                variant="outline"
                className="h-8 px-3 text-xs"
                onClick={() => {
                  setLang(l);
                  setDismissed(true);
                }}
              >
                {LANG_LABELS[l]}
              </Button>
            ))}
            {/* Switch back to English */}
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
