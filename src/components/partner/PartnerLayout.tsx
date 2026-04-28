import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, Handshake } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import edzenIcon from "@/assets/edzen-icon.png";

export function PartnerLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <img src={edzenIcon} alt="EdZen AI" className="h-6 w-6 object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Handshake className="h-5 w-5 text-primary" />
                Partner Dashboard
              </h1>
              <p className="text-sm text-muted-foreground">Track your referrals and earnings</p>
            </div>
          </div>
          <Button variant="ghost" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />Sign Out
          </Button>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
