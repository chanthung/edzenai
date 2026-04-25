import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Upload, Trash2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { removeBackground } from "@/lib/bg-remove";

interface LogoUploaderProps {
  /** Storage bucket id (must be public) */
  bucket: string;
  /** Folder path inside the bucket — usually the school id */
  folder: string;
  /** Current public URL (or empty) */
  value: string;
  /** Called with the new public URL after upload (or "" after removal) */
  onChange: (url: string) => void;
  disabled?: boolean;
  /** Label shown above the uploader */
  label?: string;
  helpText?: string;
  /** Max file size in bytes (default 2MB) */
  maxBytes?: number;
}

/**
 * Reusable image uploader with optional client-side background removal.
 * Use for logos, signatures, stamps, etc.
 */
export function LogoUploader({
  bucket,
  folder,
  value,
  onChange,
  disabled,
  label = "Logo",
  helpText = "PNG/JPG up to 2MB. Used in printouts.",
  maxBytes = 2 * 1024 * 1024,
}: LogoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [removeBg, setRemoveBg] = useState(true);

  const upload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > maxBytes) {
      toast.error(`File must be smaller than ${Math.round(maxBytes / 1024 / 1024)}MB`);
      return;
    }

    setBusy(true);
    try {
      let blob: Blob = file;
      let ext = file.name.split(".").pop() || "png";

      if (removeBg) {
        toast.info("Removing background…", { description: "First run downloads the AI model (~50MB)." });
        blob = await removeBackground(file);
        ext = "png";
      }

      const path = `${folder}/logo-${Date.now()}.${ext}`;

      // Best-effort cleanup of previous logo
      if (value) {
        const oldPath = value.split(`/${bucket}/`)[1];
        if (oldPath) await supabase.storage.from(bucket).remove([oldPath]);
      }

      const { error: upErr } = await supabase.storage
        .from(bucket)
        .upload(path, blob, { upsert: true, contentType: blob.type || "image/png" });
      if (upErr) throw upErr;

      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      onChange(data.publicUrl);
      toast.success("Logo uploaded");
    } catch (e: any) {
      console.error(e);
      toast.error("Upload failed", { description: e?.message ?? "Unknown error" });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    if (!value) return;
    setBusy(true);
    try {
      const oldPath = value.split(`/${bucket}/`)[1];
      if (oldPath) await supabase.storage.from(bucket).remove([oldPath]);
      onChange("");
      toast.success("Logo removed");
    } catch (e: any) {
      toast.error("Could not remove logo", { description: e?.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <Label>{label}</Label>

      <div className="flex items-center gap-3">
        <Switch id="bg-remove" checked={removeBg} onCheckedChange={setRemoveBg} disabled={disabled || busy} />
        <Label htmlFor="bg-remove" className="text-sm flex items-center gap-1.5 cursor-pointer">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Auto-remove background
        </Label>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        disabled={disabled || busy}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
        }}
      />

      {value ? (
        <div className="p-4 bg-muted/50 rounded-lg space-y-3">
          <div className="bg-[conic-gradient(at_top_left,_#f3f4f6_25%,_#e5e7eb_25%_50%,_#f3f4f6_50%_75%,_#e5e7eb_75%)] bg-[length:16px_16px] inline-block rounded-lg p-3 border">
            <img
              src={value}
              alt="Logo preview"
              className="max-h-32 max-w-[200px] object-contain"
              onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
            />
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" disabled={disabled || busy} onClick={() => inputRef.current?.click()}>
              {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              Replace
            </Button>
            <Button type="button" variant="outline" size="sm" disabled={disabled || busy} onClick={handleRemove} className="text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled || busy}
          onClick={() => inputRef.current?.click()}
          className={`w-full border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center transition-colors ${
            disabled || busy ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:border-primary/50"
          }`}
        >
          {busy ? (
            <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin text-muted-foreground" />
          ) : (
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          )}
          <p className="text-sm font-medium">Click to upload {label.toLowerCase()}</p>
          <p className="text-xs text-muted-foreground mt-1">{helpText}</p>
        </button>
      )}
    </div>
  );
}
