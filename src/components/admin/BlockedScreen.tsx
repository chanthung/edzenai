import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldX, Mail, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import edzenIcon from "@/assets/edzen-icon.png";

interface BlockedScreenProps {
  schoolName?: string;
  reason?: string;
}

export function BlockedScreen({ schoolName, reason }: BlockedScreenProps) {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4">
      <Card className="max-w-lg w-full shadow-xl">
        <CardContent className="p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-2xl bg-destructive/15 flex items-center justify-center">
              <ShieldX className="h-10 w-10 text-destructive" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <img src={edzenIcon} alt="EdZen AI" className="h-4 w-4" />
              <span>EdZen AI</span>
            </div>
            <h1 className="text-2xl font-bold">Account Access Blocked</h1>
            {schoolName && <p className="text-sm text-muted-foreground">{schoolName}</p>}
          </div>

          <div className="text-muted-foreground space-y-3">
            <p className="text-sm bg-destructive/10 text-destructive p-4 rounded-xl text-left">
              {reason || "Your account has been blocked by our security team due to suspicious activity. Please contact support to restore access."}
            </p>
            <p className="text-xs">
              Permission to sign in has been denied. Your data is preserved.
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button size="lg" asChild className="w-full">
              <a href="mailto:support@edzenai.com">
                <Mail className="h-4 w-4 mr-2" />Contact Support
              </a>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => signOut()} className="text-muted-foreground">
              <LogOut className="h-3.5 w-3.5 mr-2" />Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
