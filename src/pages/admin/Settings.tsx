import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSchool, useUpdateSchool } from "@/hooks/useSchool";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Save, Loader2, Building, QrCode, Phone, Mail, Lock } from "lucide-react";

export default function Settings() {
  const { data: school, isLoading } = useSchool();
  const updateSchool = useUpdateSchool();
  const { changePassword } = useAuth();

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
    try {
      await updateSchool.mutateAsync(formData);
      toast.success("Settings saved successfully");
    } catch (error: any) {
      toast.error("Failed to save settings", { description: error.message });
    }
  };

  const handleChangePassword = async () => {
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
        <Button onClick={handleSave} disabled={updateSchool.isPending}>
          {updateSchool.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Changes
        </Button>
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  placeholder="123 School Street, City"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
              />
              <p className="text-sm text-muted-foreground">
                This will be shown to parents for making payments via GPay, PhonePe, etc.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="qr_code_url">QR Code Image URL</Label>
              <Input
                id="qr_code_url"
                placeholder="https://example.com/qr-code.png"
                value={formData.qr_code_url}
                onChange={(e) => setFormData({ ...formData, qr_code_url: e.target.value })}
              />
              <p className="text-sm text-muted-foreground">
                Upload your payment QR code somewhere and paste the URL here. Parents can scan this to pay.
              </p>
            </div>
            
            {formData.qr_code_url && (
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium mb-3">QR Code Preview</p>
                <img 
                  src={formData.qr_code_url} 
                  alt="Payment QR Code" 
                  className="max-w-[200px] rounded-lg border"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
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
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Password must be at least 6 characters long.
            </p>
            <Button 
              onClick={handleChangePassword} 
              disabled={isChangingPassword || !passwordData.newPassword || !passwordData.confirmPassword}
              variant="destructive"
            >
              {isChangingPassword ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Lock className="h-4 w-4 mr-2" />
              )}
              Change Password
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
