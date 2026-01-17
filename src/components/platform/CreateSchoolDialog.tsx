import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface CreateSchoolDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateSchoolDialog({ open, onOpenChange, onSuccess }: CreateSchoolDialogProps) {
  const [schoolName, setSchoolName] = useState("");
  const [schoolEmail, setSchoolEmail] = useState("");
  const [schoolPhone, setSchoolPhone] = useState("");
  const [schoolAddress, setSchoolAddress] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!schoolName.trim()) {
      toast.error("School name is required");
      return;
    }

    if (!adminEmail.trim() || !adminPassword.trim()) {
      toast.error("Admin email and password are required");
      return;
    }

    if (adminPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      // Call edge function to create school and admin
      const { data, error } = await supabase.functions.invoke('create-school', {
        body: {
          schoolName: schoolName.trim(),
          schoolEmail: schoolEmail.trim() || null,
          schoolPhone: schoolPhone.trim() || null,
          schoolAddress: schoolAddress.trim() || null,
          adminEmail: adminEmail.trim(),
          adminPassword,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast.success("School created successfully!", {
        description: `Admin account created for ${adminEmail}`,
      });

      // Reset form
      setSchoolName("");
      setSchoolEmail("");
      setSchoolPhone("");
      setSchoolAddress("");
      setAdminEmail("");
      setAdminPassword("");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error("Error creating school:", error);
      toast.error("Failed to create school", {
        description: error.message || "Please try again",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle>Add New School</DialogTitle>
          <DialogDescription>
            Create a new school and its admin account. The admin will receive login credentials.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto pr-2">
            <div className="grid gap-4 py-4 pr-2">
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground">School Details</h4>
                <div className="space-y-2">
                  <Label htmlFor="schoolName">School Name *</Label>
                  <Input
                    id="schoolName"
                    placeholder="Delhi Public School"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="schoolEmail">Email</Label>
                    <Input
                      id="schoolEmail"
                      type="email"
                      placeholder="info@school.com"
                      value={schoolEmail}
                      onChange={(e) => setSchoolEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="schoolPhone">Phone</Label>
                    <Input
                      id="schoolPhone"
                      placeholder="+91 98765 43210"
                      value={schoolPhone}
                      onChange={(e) => setSchoolPhone(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schoolAddress">Address</Label>
                  <Textarea
                    id="schoolAddress"
                    placeholder="123, Main Street, City, State - PIN Code"
                    value={schoolAddress}
                    onChange={(e) => setSchoolAddress(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>

              <div className="border-t pt-4 space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground">Admin Account</h4>
                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Admin Email *</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    placeholder="admin@school.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminPassword">Temporary Password *</Label>
                  <Input
                    id="adminPassword"
                    type="password"
                    placeholder="••••••••"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <p className="text-xs text-muted-foreground">
                    Share this password with the school admin. They should change it after first login.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create School
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
