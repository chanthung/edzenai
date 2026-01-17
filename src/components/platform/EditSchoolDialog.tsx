import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type School = Tables<"schools"> & {
  subscription_type?: string | null;
  subscription_status?: string | null;
  subscription_start_date?: string | null;
  subscription_renewal_date?: string | null;
};

interface EditSchoolDialogProps {
  school: School | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditSchoolDialog({ school, open, onOpenChange, onSuccess }: EditSchoolDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    upi_id: "",
    qr_code_url: "",
    subscription_type: "monthly",
    subscription_status: "active",
    subscription_start_date: "",
    subscription_renewal_date: "",
  });

  useEffect(() => {
    if (school) {
      setFormData({
        name: school.name || "",
        address: school.address || "",
        phone: school.phone || "",
        email: school.email || "",
        upi_id: school.upi_id || "",
        qr_code_url: school.qr_code_url || "",
        subscription_type: school.subscription_type || "monthly",
        subscription_status: school.subscription_status || "active",
        subscription_start_date: school.subscription_start_date || "",
        subscription_renewal_date: school.subscription_renewal_date || "",
      });
    }
  }, [school]);

  const handleSubmit = async () => {
    if (!school) return;
    
    if (!formData.name.trim()) {
      toast.error("School name is required");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('schools')
        .update({
          name: formData.name,
          address: formData.address || null,
          phone: formData.phone || null,
          email: formData.email || null,
          upi_id: formData.upi_id || null,
          qr_code_url: formData.qr_code_url || null,
          subscription_type: formData.subscription_type,
          subscription_status: formData.subscription_status,
          subscription_start_date: formData.subscription_start_date || null,
          subscription_renewal_date: formData.subscription_renewal_date || null,
        })
        .eq('id', school.id);

      if (error) throw error;

      toast.success("School updated successfully");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Failed to update school", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle>Edit School</DialogTitle>
          <DialogDescription>
            Update school details and subscription information.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto pr-2">
          <div className="grid gap-4 py-4 pr-2">
            {/* School Details */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">School Details</h4>
              <div className="space-y-2">
                <Label htmlFor="edit-school-name">School Name *</Label>
                <Input
                  id="edit-school-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-school-address">Address</Label>
                <Input
                  id="edit-school-address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-school-phone">Phone</Label>
                  <Input
                    id="edit-school-phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-school-email">Email</Label>
                  <Input
                    id="edit-school-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div className="border-t pt-4 space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Payment Details</h4>
              <div className="space-y-2">
                <Label htmlFor="edit-school-upi">UPI ID</Label>
                <Input
                  id="edit-school-upi"
                  placeholder="school@upi"
                  value={formData.upi_id}
                  onChange={(e) => setFormData({ ...formData, upi_id: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-school-qr">QR Code URL</Label>
                <Input
                  id="edit-school-qr"
                  placeholder="https://..."
                  value={formData.qr_code_url}
                  onChange={(e) => setFormData({ ...formData, qr_code_url: e.target.value })}
                />
              </div>
            </div>

            {/* Subscription Details */}
            <div className="border-t pt-4 space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Subscription Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Subscription Type</Label>
                  <Select
                    value={formData.subscription_type}
                    onValueChange={(value) => setFormData({ ...formData, subscription_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="annual">Annual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Subscription Status</Label>
                  <Select
                    value={formData.subscription_status}
                    onValueChange={(value) => setFormData({ ...formData, subscription_status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="trial">Trial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-sub-start">Start Date</Label>
                  <Input
                    id="edit-sub-start"
                    type="date"
                    value={formData.subscription_start_date}
                    onChange={(e) => setFormData({ ...formData, subscription_start_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-sub-renewal">Renewal Date</Label>
                  <Input
                    id="edit-sub-renewal"
                    type="date"
                    value={formData.subscription_renewal_date}
                    onChange={(e) => setFormData({ ...formData, subscription_renewal_date: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="mt-4 shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
