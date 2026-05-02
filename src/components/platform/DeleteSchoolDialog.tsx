import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  school: { id: string; name: string } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DeleteSchoolDialog({ school, open, onOpenChange, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const canDelete = confirmText.trim().toLowerCase() === (school?.name || "").trim().toLowerCase();

  const handleDelete = async () => {
    if (!school || !canDelete) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("schools").delete().eq("id", school.id);
      if (error) throw error;
      toast.success(`"${school.name}" has been deleted`);
      setConfirmText("");
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error("Failed to delete school", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) setConfirmText(""); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <DialogTitle>Delete School</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            This action is <span className="font-semibold text-destructive">permanent and irreversible</span>. All students, fees, payments, academic records, and settings for <span className="font-semibold">"{school?.name}"</span> will be permanently deleted.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Label>
            Type <span className="font-mono font-semibold">{school?.name}</span> to confirm
          </Label>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type school name here…"
            autoComplete="off"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={!canDelete || loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Delete School Permanently
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
