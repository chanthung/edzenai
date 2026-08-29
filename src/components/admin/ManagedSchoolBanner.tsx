import { useNavigate } from "react-router-dom";
import { Shield, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useManagedSchoolId, setManagedSchoolId } from "@/contexts/ManagedSchoolContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useSchool } from "@/hooks/useSchool";

export function ManagedSchoolBanner() {
  const managedId = useManagedSchoolId();
  const { isPlatformAdmin } = useUserRole();
  const { data: school } = useSchool();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  if (!isPlatformAdmin || !managedId) return null;

  const exit = () => {
    setManagedSchoolId(null);
    queryClient.clear();
    navigate("/platform");
  };

  return (
    <div className="mb-4 flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5">
      <Shield className="h-4 w-4 text-primary shrink-0" />
      <p className="text-sm text-foreground truncate">
        <span className="text-muted-foreground">Managing as Platform Admin:</span>{" "}
        <span className="font-semibold">{school?.name ?? "…"}</span>
      </p>
      <Button variant="outline" size="sm" className="ml-auto rounded-lg" onClick={exit}>
        <LogOut className="h-3.5 w-3.5 mr-2" />
        Exit
      </Button>
    </div>
  );
}
