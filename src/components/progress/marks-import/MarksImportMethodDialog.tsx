import { Card } from '@/components/ui/card';
import { FileSpreadsheet, FileImage, PenLine } from 'lucide-react';
import type { ImportMode } from '@/hooks/progress/useMarksImport';

interface Props {
  onPick: (mode: ImportMode) => void;
}

const METHODS: Array<{ mode: ImportMode; title: string; desc: string; icon: any; accept: string }> = [
  { mode: 'excel', title: 'Excel / CSV', desc: 'Upload a .xlsx or .csv file. AI maps columns automatically.', icon: FileSpreadsheet, accept: '.xlsx,.csv' },
  { mode: 'printed', title: 'Printed marksheet', desc: 'Photo of a printed marksheet. AI reads the table.', icon: FileImage, accept: 'image/*' },
  { mode: 'handwritten', title: 'Handwritten (assistive)', desc: 'Photo of a handwritten sheet. Always preview & correct before saving.', icon: PenLine, accept: 'image/*' },
];

export function MarksImportMethodDialog({ onPick }: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-3 py-2">
      {METHODS.map((m) => {
        const Icon = m.icon;
        return (
          <Card
            key={m.mode}
            onClick={() => onPick(m.mode)}
            className="cursor-pointer rounded-xl border-border/60 p-4 transition-all hover:border-primary hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <div className="text-sm font-semibold">{m.title}</div>
            <div className="mt-1 text-xs text-muted-foreground">{m.desc}</div>
          </Card>
        );
      })}
    </div>
  );
}

export const METHOD_ACCEPT: Record<ImportMode, string> = {
  excel: '.xlsx,.csv',
  printed: 'image/*',
  handwritten: 'image/*',
};
