import { useState, useEffect, useRef } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSchool, useUpdateSchool } from "@/hooks/useSchool";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { RestrictedButton, RestrictedOverlay } from "@/components/admin/RestrictedOverlay";
import { TemplateList } from "@/components/admin/templates/TemplateList";
import { TemplateEditor } from "@/components/admin/templates/TemplateEditor";
import { ClassAssignment } from "@/components/admin/templates/ClassAssignment";
import type { AssessmentTemplate } from "@/hooks/progress/useAssessmentTemplates";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, Loader2, Building, QrCode, Phone, Mail, Lock, Upload, Trash2, ClipboardList } from "lucide-react";

export default function Settings() {
  const { data: school, isLoading } = useSchool();
  const updateSchool = useUpdateSchool();
  const { changePassword } = useAuth();
  const { isRestricted, canPerform } = useSubscriptionStatus();

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    upi_id: "",
    qr_code_url: "",
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isUploadingQr, setIsUploadingQr] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Assessment template editing state
  const [editingTemplate, setEditingTemplate] = useState<AssessmentTemplate | null | undefined>(undefined);
  // undefined = list view, null = creating new, AssessmentTemplate = editing

  useEffect(() => {
    if (school) {
      setFormData({
        name: school.name || "",
        address: school.address || "",
        phone: school.phone || "",
        email: school.email || "",
        upi_id: school.upi_id || "",
        qr_code_url: school.qr_code_url || "",
      });
    }
  }, [school]);

  const handleSave = async () => {
    if (isRestricted) {
      toast.error("Operation not permitted", { description: "School is in restricted mode." });
      return;
    }
    
    try {
      await updateSchool.mutateAsync(formData);
      toast.success("Settings saved successfully");
    } catch (error: any) {
      toast.error("Failed to save settings", { description: error.message });
    }
  };

  const handleQrUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (isRestricted) {
      toast.error("Operation not permitted", { description: "School is in restricted mode." });
      return;
    }
    
    const file = event.target.files?.[0];
    if (!file || !school) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be less than 2MB");
      return;
    }

    setIsUploadingQr(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${school.id}/qr-code.${fileExt}`;

      // Delete old file if exists
      if (formData.qr_code_url) {
        const oldPath = formData.qr_code_url.split('/school-qr-codes/')[1];
        if (oldPath) {
          await supabase.storage.from('school-qr-codes').remove([oldPath]);
        }
      }

      // Upload new file
      const { error: uploadError } = await supabase.storage
        .from('school-qr-codes')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('school-qr-codes')
        .getPublicUrl(fileName);

      setFormData({ ...formData, qr_code_url: publicUrl });
      toast.success("QR code uploaded successfully");
    } catch (error: any) {
      toast.error("Failed to upload QR code", { description: error.message });
    } finally {
      setIsUploadingQr(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveQr = async () => {
    if (isRestricted) {
      toast.error("Operation not permitted", { description: "School is in restricted mode." });
      return;
    }
    
    if (!school || !formData.qr_code_url) return;

    try {
      const path = formData.qr_code_url.split('/school-qr-codes/')[1];
      if (path) {
        await supabase.storage.from('school-qr-codes').remove([path]);
      }
      setFormData({ ...formData, qr_code_url: '' });
      toast.success("QR code removed");
    } catch (error: any) {
      toast.error("Failed to remove QR code", { description: error.message });
    }
  };

  const handleChangePassword = async () => {
    if (isRestricted) {
      toast.error("Operation not permitted", { description: "School is in restricted mode." });
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await changePassword(passwordData.newPassword);
      if (error) throw error;
      toast.success("Password changed successfully");
      setPasswordData({ newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      toast.error("Failed to change password", { description: error.message });
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <PageHeader title="Settings" />
        <div className="mt-6 space-y-6">
          {[1, 2].map((i) => (
            <Card key={i} className="card-elevated">
              <CardHeader>
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-60" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <PageHeader title="Settings" description="Manage your school information and payment settings">
        <RestrictedButton isRestricted={isRestricted}>
          <Button onClick={handleSave} disabled={updateSchool.isPending || isRestricted}>
            {updateSchool.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </RestrictedButton>
      </PageHeader>

      <div className="mt-6 space-y-6">
        {/* School Information */}
        <Card className="card-elevated">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>School Information</CardTitle>
                <CardDescription>Basic details about your school</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">School Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={isRestricted}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  placeholder="123 School Street, City"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  disabled={isRestricted}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">
                  <Phone className="h-4 w-4 inline mr-1" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={isRestricted}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">
                  <Mail className="h-4 w-4 inline mr-1" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="info@school.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={isRestricted}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Settings */}
        <Card className="card-elevated">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                <QrCode className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <CardTitle>Payment Settings</CardTitle>
                <CardDescription>Configure UPI and QR code for parent payments</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="upi_id">UPI ID</Label>
              <Input
                id="upi_id"
                placeholder="school@upi"
                value={formData.upi_id}
                onChange={(e) => setFormData({ ...formData, upi_id: e.target.value })}
                disabled={isRestricted}
              />
              <p className="text-sm text-muted-foreground">
                This will be shown to parents for making payments via GPay, PhonePe, etc.
              </p>
            </div>
            <RestrictedOverlay isRestricted={isRestricted}>
              <div className="space-y-2">
                <Label>Payment QR Code</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleQrUpload}
                  className="hidden"
                  disabled={isRestricted}
                />
                
                {formData.qr_code_url ? (
                  <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                    <p className="text-sm font-medium">QR Code Preview</p>
                    <img 
                      src={formData.qr_code_url} 
                      alt="Payment QR Code" 
                      className="max-w-[200px] rounded-lg border"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingQr || isRestricted}
                      >
                        {isUploadingQr ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4 mr-2" />
                        )}
                        Replace
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveQr}
                        className="text-destructive hover:text-destructive"
                        disabled={isRestricted}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div 
                    className={`border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center transition-colors ${
                      isRestricted ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-primary/50'
                    }`}
                    onClick={() => !isRestricted && fileInputRef.current?.click()}
                  >
                    {isUploadingQr ? (
                      <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin text-muted-foreground" />
                    ) : (
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    )}
                    <p className="text-sm font-medium">Click to upload QR code</p>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 2MB</p>
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  Upload your payment QR code. Parents can scan this to pay fees.
                </p>
              </div>
            </RestrictedOverlay>
          </CardContent>
        </Card>

        {/* Account Security - Change Password */}
        <Card className="card-elevated">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <Lock className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <CardTitle>Account Security</CardTitle>
                <CardDescription>Change your account password</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Enter new password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  disabled={isRestricted}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  disabled={isRestricted}
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Password must be at least 6 characters long.
            </p>
            <RestrictedButton isRestricted={isRestricted}>
              <Button 
                onClick={handleChangePassword} 
                disabled={isChangingPassword || !passwordData.newPassword || !passwordData.confirmPassword || isRestricted}
                variant="destructive"
              >
                {isChangingPassword ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Lock className="h-4 w-4 mr-2" />
                )}
                Change Password
              </Button>
            </RestrictedButton>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
