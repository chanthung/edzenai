import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, IndianRupee, Banknote, Wallet, Building2, Copy, Pencil, Mail } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RecordPayoutDialog } from "@/components/platform/RecordPayoutDialog";
import { EditPartnerDialog } from "@/components/platform/EditPartnerDialog";
import { usePartnerById } from "@/hooks/usePartners";
import { usePartnerSchools, usePartnerCommissions, usePartnerPayouts } from "@/hooks/usePartner";
import { SystemStateBadge } from "@/components/ui/system-state-badge";

export default function PartnerDetail() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [showPayout, setShowPayout] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [resending, setResending] = useState(false);

  const { data: partner, refetch: refetchPartner } = usePartnerById(id);
  const { data: schools = [] } = usePartnerSchools(id);
  const { data: commissions = [] } = usePartnerCommissions(id);
  const { data: payouts = [] } = usePartnerPayouts(id);

  useEffect(() => {
    if (!authLoading && !user) { navigate("/login"); return; }
    if (user) supabase.rpc("is_platform_admin").then(({ data }) => setIsAdmin(!!data));
  }, [user, authLoading, navigate]);

  const stats = useMemo(() => {
    const totalEarnings = commissions.reduce((s, c) => s + Number(c.amount), 0);
    const pending = commissions.filter(c => c.status === "pending").reduce((s, c) => s + Number(c.amount), 0);
    const paid = commissions.filter(c => c.status === "paid").reduce((s, c) => s + Number(c.amount), 0);
    return { totalEarnings, pending, paid };
  }, [commissions]);

  const pendingCommissions = useMemo(() => commissions.filter(c => c.status === "pending"), [commissions]);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["partner-commissions", id] });
    qc.invalidateQueries({ queryKey: ["partner-payouts", id] });
  };

  const copyLink = () => {
    if (!partner) return;
    navigator.clipboard.writeText(`https://www.edzenai.com/signup?ref=${partner.referral_code}`);
    toast.success("Referral link copied");
  };

  const handleResendInvite = async () => {
    if (!partner) return;
    setResending(true);
    try {
      const { data, error } = await supabase.functions.invoke("resend-partner-invite", {
        body: { partner_id: partner.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(data.emailSent ? "Invite email resent successfully" : "Invite renewed but email delivery failed — try again or share invite link manually");
    } catch (err: any) {
      toast.error("Failed to resend invite", { description: err.message });
    } finally {
      setResending(false);
    }
  };

  const inviteNotAccepted = partner && !partner.user_id;

  if (authLoading || isAdmin === null || !partner) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  if (!isAdmin) { navigate("/login"); return null; }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/platform/partners")}>
              <ArrowLeft className="h-4 w-4 mr-2" />Partners
            </Button>
            <div>
              <h1 className="text-xl font-bold">{partner.name}</h1>
              <p className="text-sm text-muted-foreground">{partner.email} · Code <span className="font-mono">{partner.referral_code}</span> · {partner.commission_percent}%</p>
            </div>
          </div>
          <div className="flex gap-2">
            {inviteNotAccepted && (
              <Button variant="outline" onClick={handleResendInvite} disabled={resending}>
                {resending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
                Resend Invite
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowEdit(true)}>
              <Pencil className="h-4 w-4 mr-2" />Edit
            </Button>
            <Button variant="outline" onClick={copyLink}><Copy className="h-4 w-4 mr-2" />Copy Link</Button>
            <Button onClick={() => setShowPayout(true)} disabled={pendingCommissions.length === 0}>
              <Banknote className="h-4 w-4 mr-2" />Record Payout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard icon={Building2} label="Schools Referred" value={String(schools.length)} />
          <StatCard icon={IndianRupee} label="Total Earnings" value={`₹${stats.totalEarnings.toLocaleString("en-IN")}`} />
          <StatCard icon={Wallet} label="Pending" value={`₹${stats.pending.toLocaleString("en-IN")}`} accent="amber" />
          <StatCard icon={Banknote} label="Paid Out" value={`₹${stats.paid.toLocaleString("en-IN")}`} accent="emerald" />
        </div>

        {/* Referred Schools */}
        <Card>
          <CardHeader>
            <CardTitle>Referred Schools</CardTitle>
            <CardDescription>{schools.length} school{schools.length !== 1 ? "s" : ""} referred by this partner</CardDescription>
          </CardHeader>
          <CardContent>
            {schools.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground text-sm">No schools referred yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>School Name</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schools.map((s: any) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>
                        <SystemStateBadge state={s.system_state || (s.subscription_status === 'active' ? 'subscription_active' : 'trial_active')} size="sm" />
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={s.subscription_status === 'active' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : ''}>
                          {s.subscription_status || 'trial'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{format(new Date(s.created_at), "dd MMM yyyy")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Commissions */}
        <Card>
          <CardHeader>
            <CardTitle>Commissions</CardTitle>
            <CardDescription>{commissions.length} record{commissions.length !== 1 ? "s" : ""}</CardDescription>
          </CardHeader>
          <CardContent>
            {commissions.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground text-sm">No commissions yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>School</TableHead>
                    <TableHead className="text-right">Payment</TableHead>
                    <TableHead className="text-right">%</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissions.map((c: any) => {
                    const school = schools.find((s: any) => s.id === c.school_id);
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="text-sm">{format(new Date(c.created_at), "dd MMM yyyy")}</TableCell>
                        <TableCell>{school?.name || "—"}</TableCell>
                        <TableCell className="text-right tabular-nums">₹{Number(c.payment_amount).toLocaleString("en-IN")}</TableCell>
                        <TableCell className="text-right tabular-nums">{c.commission_percent}%</TableCell>
                        <TableCell className="text-right tabular-nums font-medium">₹{Number(c.amount).toLocaleString("en-IN")}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={c.status === "paid" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-amber-500/10 text-amber-600 border-amber-500/20"}>
                            {c.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Payout History */}
        <Card>
          <CardHeader>
            <CardTitle>Payout History</CardTitle>
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
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payouts.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-sm">{format(new Date(p.paid_at), "dd MMM yyyy")}</TableCell>
                      <TableCell className="font-mono text-sm">{p.reference_number || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.notes || "—"}</TableCell>
                      <TableCell className="text-right tabular-nums font-medium">₹{Number(p.total_amount).toLocaleString("en-IN")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      <RecordPayoutDialog
        partnerId={partner.id}
        partnerName={partner.name}
        pendingCommissions={pendingCommissions as any}
        open={showPayout}
        onOpenChange={setShowPayout}
        onSuccess={refresh}
      />

      <EditPartnerDialog
        partner={partner}
        open={showEdit}
        onOpenChange={setShowEdit}
        onSuccess={() => {
          refetchPartner();
          qc.invalidateQueries({ queryKey: ["partners"] });
        }}
      />
    </div>
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
