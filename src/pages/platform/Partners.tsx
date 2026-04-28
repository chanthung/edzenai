import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, ArrowLeft, Copy, Handshake } from "lucide-react";
import { toast } from "sonner";
import { CreatePartnerDialog } from "@/components/platform/CreatePartnerDialog";
import { usePartners } from "@/hooks/usePartners";
import { useQueryClient } from "@tanstack/react-query";

export default function Partners() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const { data: partners = [], isLoading, refetch } = usePartners();

  useEffect(() => {
    if (!authLoading && !user) { navigate("/login"); return; }
    if (user) {
      supabase.rpc("is_platform_admin").then(({ data }) => setIsAdmin(!!data));
    }
  }, [user, authLoading, navigate]);

  const copyLink = (code: string) => {
    const link = `https://www.edzenai.com/signup?ref=${code}`;
    navigator.clipboard.writeText(link);
    toast.success("Referral link copied");
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    const { error } = await supabase.from("partners" as any).update({ is_active: !isActive } as any).eq("id", id);
    if (error) toast.error("Update failed");
    else { toast.success(isActive ? "Partner deactivated" : "Partner activated"); refetch(); qc.invalidateQueries({ queryKey: ["partners"] }); }
  };

  if (authLoading || isAdmin === null) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  if (!isAdmin) { navigate("/login"); return null; }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/platform")}>
              <ArrowLeft className="h-4 w-4 mr-2" />Back
            </Button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2"><Handshake className="h-5 w-5 text-primary" />Partners</h1>
              <p className="text-sm text-muted-foreground">Manage affiliate partners and referral codes</p>
            </div>
          </div>
          <Button onClick={() => setShowCreate(true)}><Plus className="mr-2 h-4 w-4" />Add Partner</Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>All Partners</CardTitle>
            <CardDescription>{partners.length} partner{partners.length !== 1 ? "s" : ""}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : partners.length === 0 ? (
              <div className="text-center py-12">
                <Handshake className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No partners yet</h3>
                <Button onClick={() => setShowCreate(true)}><Plus className="mr-2 h-4 w-4" />Add First Partner</Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead className="text-right">Commission %</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="w-[140px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partners.map((p: any) => (
                    <TableRow key={p.id} className="cursor-pointer" onClick={() => navigate(`/platform/partners/${p.id}`)}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{p.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">{p.referral_code}</Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{p.commission_percent}%</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Switch checked={p.is_active} onCheckedChange={() => toggleActive(p.id, p.is_active)} />
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" onClick={() => copyLink(p.referral_code)}>
                          <Copy className="h-4 w-4 mr-1" />Link
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      <CreatePartnerDialog open={showCreate} onOpenChange={setShowCreate} onSuccess={() => { refetch(); qc.invalidateQueries({ queryKey: ["partners"] }); }} />
    </div>
  );
}
