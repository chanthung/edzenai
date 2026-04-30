import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Upload } from 'lucide-react';

interface Props {
  accept: string;
  isLoading: boolean;
  onFile: (file: File) => void;
  hint: string;
}

export function MarksImportUploader({ accept, isLoading, onFile, hint }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handle = (file?: File | null) => {
    if (!file) return;
    onFile(file);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        handle(e.dataTransfer.files?.[0]);
      }}
      className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
        dragOver ? 'border-primary bg-primary/5' : 'border-border bg-muted/30'
      }`}
    >
      <Upload className="mb-3 h-10 w-10 text-muted-foreground" />
      <p className="mb-1 text-sm font-medium">Drop your file here, or click to browse</p>
      <p className="mb-4 text-xs text-muted-foreground">{hint}</p>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handle(e.target.files?.[0])}
      />
      <Button onClick={() => inputRef.current?.click()} disabled={isLoading}>
        {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Parsing…</>) : 'Choose file'}
      </Button>
    </div>
  );
}
