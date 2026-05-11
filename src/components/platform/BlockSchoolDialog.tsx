import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, ShieldX, ShieldCheck } from "lucide-react";

interface School {
  id: string;
  name: string;
  access_blocked?: boolean | null;
  access_blocked_reason?: string | null;
}

interface BlockSchoolDialogProps {
  school: School | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function BlockSchoolDialog({ school, open, onOpenChange, onSuccess }: BlockSchoolDialogProps) {
  const isCurrentlyBlocked = !!school?.access_blocked;
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && school) {
      setReason(
        school.access_blocked_reason ||
          "Suspicious login activity detected. Contact support@edzenai.com to restore access."
      );
    }
  }, [open, school]);

  const handleSubmit = async () => {
    if (!school) return;
    if (!isCurrentlyBlocked && !reason.trim()) {
      toast.error("Please provide a reason for blocking");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const updates = isCurrentlyBlocked
        ? {
            access_blocked: false,
            access_blocked_at: null,
            access_blocked_reason: null,
            access_blocked_by: null,
          }
        : {
            access_blocked: true,
            access_blocked_at: new Date().toISOString(),
            access_blocked_reason: reason.trim(),
            access_blocked_by: user?.id || null,
          };

      const { error } = await (supabase as any)
        .from("schools")
        .update(updates)
        .eq("id", school.id);

      if (error) throw error;

      toast.success(isCurrentlyBlocked ? "Access restored" : "Login access blocked");
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      console.error(err);
      toast.error(isCurrentlyBlocked ? "Failed to unblock" : "Failed to block", {
        description: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isCurrentlyBlocked ? (
              <>
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                Restore Login Access
              </>
            ) : (
              <>
                <ShieldX className="h-5 w-5 text-destructive" />
                Block Login Access
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isCurrentlyBlocked
              ? `Re-enable login for all admins, accountants, and teachers of ${school?.name}.`
              : `Deny login for all admins, accountants, and teachers of ${school?.name}. They will be signed out and shown the reason below.`}
          </DialogDescription>
        </DialogHeader>

        {!isCurrentlyBlocked && (
          <div className="space-y-2 py-2">
            <Label htmlFor="reason">Reason (shown to the user)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              placeholder="e.g. Suspicious login activity detected from multiple locations..."
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant={isCurrentlyBlocked ? "default" : "destructive"}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isCurrentlyBlocked ? "Restore Access" : "Block Login"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
