import { Globe, Check, MapPin } from 'lucide-react';
import { useT, SUPPORTED_LANGS, type Lang } from '@/i18n/parent';
import { LANG_LABELS } from '@/i18n/parent/detect';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function LanguageSwitcher() {
  const { lang, setLang, t, suggestedLangs, detectedState } = useT();

  // Build ordered list: suggested langs first (including 'en'), then the rest
  const prioritized: Lang[] = [];
  const rest: Lang[] = [];

  if (suggestedLangs.length > 0) {
    // Always include English in the priority group
    const prioritySet = new Set<Lang>([...suggestedLangs, 'en']);
    for (const l of SUPPORTED_LANGS) {
      if (prioritySet.has(l)) prioritized.push(l);
      else rest.push(l);
    }
  }

  const hasPriority = prioritized.length > 0 && rest.length > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/15 hover:bg-primary-foreground/25 transition-colors px-3 py-1.5 text-xs font-medium backdrop-blur-sm"
        aria-label={t('lang.label')}
      >
        <Globe className="h-3.5 w-3.5" />
        <span>{LANG_LABELS[lang]}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[10rem]">
        {hasPriority ? (
          <>
            {detectedState && (
              <div className="px-2 py-1.5 text-[10px] text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {detectedState}
              </div>
            )}
            {prioritized.map((l) => (
              <LangItem key={l} l={l} current={lang} onSelect={setLang} />
            ))}
            <DropdownMenuSeparator />
            {rest.map((l) => (
              <LangItem key={l} l={l} current={lang} onSelect={setLang} />
            ))}
          </>
        ) : (
          SUPPORTED_LANGS.map((l) => (
            <LangItem key={l} l={l} current={lang} onSelect={setLang} />
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function LangItem({ l, current, onSelect }: { l: Lang; current: Lang; onSelect: (l: Lang) => void }) {
  return (
    <DropdownMenuItem
      onClick={() => onSelect(l)}
      className="flex items-center justify-between cursor-pointer"
    >
      <span>{LANG_LABELS[l]}</span>
      {l === current && <Check className="h-3.5 w-3.5 text-primary" />}
    </DropdownMenuItem>
  );
}
