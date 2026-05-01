import { Globe, Check } from 'lucide-react';
import { useT, SUPPORTED_LANGS, type Lang } from '@/i18n/parent';
import { LANG_LABELS } from '@/i18n/parent/detect';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function LanguageSwitcher() {
  const { lang, setLang, t } = useT();

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
        {SUPPORTED_LANGS.map((l: Lang) => (
          <DropdownMenuItem
            key={l}
            onClick={() => setLang(l)}
            className="flex items-center justify-between cursor-pointer"
          >
            <span>{LANG_LABELS[l]}</span>
            {l === lang && <Check className="h-3.5 w-3.5 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
