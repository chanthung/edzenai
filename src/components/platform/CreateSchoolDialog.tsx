import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";
import { INDIAN_STATES } from "@/lib/indian-states";

interface CreateSchoolDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const generateTempPassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const special = '!@#$%&*';
  let pwd = '';
  for (let i = 0; i < 8; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
  pwd += special[Math.floor(Math.random() * special.length)];
  pwd += Math.floor(Math.random() * 90 + 10);
  return pwd;
};

export function CreateSchoolDialog({ open, onOpenChange, onSuccess }: CreateSchoolDialogProps) {
  const [schoolName, setSchoolName] = useState("");
  const [schoolEmail, setSchoolEmail] = useState("");
  const [schoolPhone, setSchoolPhone] = useState("");
  const [schoolAddress, setSchoolAddress] = useState("");
  const [schoolState, setSchoolState] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState(() => generateTempPassword());
  const [loading, setLoading] = useState(false);
  const [emailingPassword, setEmailingPassword] = useState(false);

  // Regenerate password each time dialog opens
  useEffect(() => {
    if (open) {
      setAdminPassword(generateTempPassword());
    }
  }, [open]);

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
      const fullAddress = [schoolAddress.trim(), schoolState].filter(Boolean).join(", ");

      const { data, error } = await supabase.functions.invoke('create-school', {
        body: {
          schoolName: schoolName.trim(),
          schoolEmail: schoolEmail.trim() || null,
          schoolPhone: schoolPhone.trim() || null,
          schoolAddress: fullAddress || null,
          adminEmail: adminEmail.trim(),
          adminPassword,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("School created successfully!", {
        description: `Admin account created for ${adminEmail}`,
      });

      resetForm();
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

  const handleEmailPassword = async () => {
    if (!adminEmail.trim() || !adminPassword.trim()) {
      toast.error("Please enter admin email and password first");
      return;
    }

    setEmailingPassword(true);
    try {
      // Use Supabase's built-in password reset as the email mechanism
      const { error } = await supabase.auth.resetPasswordForEmail(adminEmail.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast.success("Password reset link sent!", {
        description: `A password reset email has been sent to ${adminEmail}. The school admin can use it to set their own password.`,
      });
    } catch (error: any) {
      toast.error("Failed to send email", {
        description: error.message || "Please try again",
      });
    } finally {
      setEmailingPassword(false);
    }
  };

  const resetForm = () => {
    setSchoolName("");
    setSchoolEmail("");
    setSchoolPhone("");
    setSchoolAddress("");
    setSchoolState("");
    setAdminEmail("");
    setAdminPassword("");
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
                  <Label htmlFor="schoolState">State / UT *</Label>
                  <Select value={schoolState} onValueChange={setSchoolState}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDIAN_STATES.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schoolAddress">Address</Label>
                  <Textarea
                    id="schoolAddress"
                    placeholder="123, Main Street, City - PIN Code"
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
                  <PasswordInput
                    id="adminPassword"
                    placeholder="••••••••"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Share this password with the school admin.
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1.5 text-primary"
                      onClick={handleEmailPassword}
                      disabled={emailingPassword || !adminEmail.trim()}
                    >
                      {emailingPassword ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Mail className="h-3 w-3" />
                      )}
                      Email Reset Link
                    </Button>
                  </div>
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
