import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Building2, IndianRupee, Wallet, Banknote, Copy, Handshake } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { PartnerLayout } from "@/components/partner/PartnerLayout";
import { useCurrentPartner, usePartnerSchools, usePartnerCommissions, usePartnerPayouts } from "@/hooks/usePartner";

export default function PartnerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { data: partner, isLoading: pLoading } = useCurrentPartner();
  const { data: schools = [] } = usePartnerSchools(partner?.id);
  const { data: commissions = [] } = usePartnerCommissions(partner?.id);
  const { data: payouts = [] } = usePartnerPayouts(partner?.id);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading, navigate]);

  const stats = useMemo(() => {
    const activeStates = ["subscription_active", "trial_active"];
    const active = schools.filter((s: any) => activeStates.includes(s.system_state)).length;
    const totalEarnings = commissions.reduce((s, c) => s + Number(c.amount), 0);
    const pending = commissions.filter(c => c.status === "pending").reduce((s, c) => s + Number(c.amount), 0);
    return { active, totalEarnings, pending };
  }, [schools, commissions]);

  const referralLink = partner ? `https://www.edzenai.com/signup?ref=${partner.referral_code}` : "";

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success("Referral link copied");
  };

  if (authLoading || pLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!partner) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <Handshake className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <CardTitle>Partner account not found</CardTitle>
            <CardDescription>Your account isn't linked as a partner. Contact support.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Per-school earnings
  const earningsBySchool = commissions.reduce<Record<string, number>>((acc, c) => {
    acc[c.school_id] = (acc[c.school_id] || 0) + Number(c.amount);
    return acc;
  }, {});

  return (
    <PartnerLayout>
      <div className="space-y-8">
        {/* Referral Link */}
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="text-base">Your Referral Link</CardTitle>
            <CardDescription>Share this link. Earn {partner.commission_percent}% on every payment from referred schools.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 items-center">
              <code className="flex-1 px-4 py-3 rounded-xl bg-background border text-sm font-mono break-all">{referralLink}</code>
              <Button onClick={copyLink}><Copy className="h-4 w-4 mr-2" />Copy</Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard icon={Building2} label="Total Schools" value={String(schools.length)} />
          <StatCard icon={Building2} label="Active Schools" value={String(stats.active)} accent="emerald" />
          <StatCard icon={IndianRupee} label="Total Earnings" value={`₹${stats.totalEarnings.toLocaleString("en-IN")}`} />
          <StatCard icon={Wallet} label="Pending Payouts" value={`₹${stats.pending.toLocaleString("en-IN")}`} accent="amber" />
        </div>

        {/* Schools */}
        <Card>
          <CardHeader>
            <CardTitle>Referred Schools</CardTitle>
            <CardDescription>{schools.length} school{schools.length !== 1 ? "s" : ""}</CardDescription>
          </CardHeader>
          <CardContent>
            {schools.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground text-sm">No schools have signed up with your link yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>School</TableHead>
                    <TableHead>Signed Up</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total Commission</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schools.map((s: any) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="text-sm">{format(new Date(s.created_at), "dd MMM yyyy")}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{(s.system_state || "").replace(/_/g, " ")}</Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        ₹{(earningsBySchool[s.id] || 0).toLocaleString("en-IN")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Payout History */}
        <Card>
          <CardHeader>
            <CardTitle>Payout History</CardTitle>
            <CardDescription>Past payments to you</CardDescription>
          </CardHeader>
          <CardContent>
            {payouts.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground text-sm">No payouts yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payouts.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-sm">{format(new Date(p.paid_at), "dd MMM yyyy")}</TableCell>
                      <TableCell className="font-mono text-sm">{p.reference_number || "—"}</TableCell>
                      <TableCell className="text-right tabular-nums font-medium">₹{Number(p.total_amount).toLocaleString("en-IN")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </PartnerLayout>
  );
}

function StatCard({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string; accent?: "amber" | "emerald" }) {
  const color = accent === "amber" ? "text-amber-600" : accent === "emerald" ? "text-emerald-600" : "";
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold tabular-nums ${color}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
