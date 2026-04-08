import { ReactNode, useState } from "react";
import edzenIcon from "@/assets/edzen-icon.png";
import { Navigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  GraduationCap, 
  BookOpen, 
  ClipboardList, 
  Edit3, 
  BarChart3,
  CalendarCheck,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TeacherLayoutProps {
  children: ReactNode;
}

const navItems = [
  { href: "/progress", label: "Dashboard", icon: BarChart3 },
  { href: "/progress/subjects", label: "Subjects", icon: BookOpen },
  { href: "/progress/assessments", label: "Assessments", icon: ClipboardList },
  { href: "/progress/marks", label: "Marks Entry", icon: Edit3 },
  { href: "/progress/attendance", label: "Attendance", icon: CalendarCheck },
];

export function TeacherLayout({ children }: TeacherLayoutProps) {
  const { user, loading: authLoading, signOut } = useAuth();
  const { isTeacher, isLoading: roleLoading } = useUserRole();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-2xl" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Only redirect if explicitly not a teacher (after role is loaded)
  if (!roleLoading && !isTeacher) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile header */}
      <header className="lg:hidden sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <img src={edzenIcon} alt="EdZen AI" className="h-6 w-6 object-contain" />
            </div>
            <div>
              <h1 className="font-semibold text-sm">Student Progress</h1>
              <p className="text-xs text-muted-foreground">Teacher Portal</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile navigation */}
        {mobileMenuOpen && (
          <>
          <div className="fixed inset-0 z-40" onClick={() => setMobileMenuOpen(false)} />
          <nav className="absolute top-full left-0 right-0 z-50 bg-card border-b border-border/50 shadow-lg">
            <div className="p-2 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                    location.pathname === item.href
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "hover:bg-muted/60"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              ))}
              <button
                onClick={() => signOut()}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium w-full text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </button>
            </div>
          </nav>
          </>
        )}
      </header>

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-card border-r border-border/50">
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="p-6 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <img src={edzenIcon} alt="EdZen AI" className="h-7 w-7 object-contain" />
                </div>
                <div>
                  <h1 className="font-bold text-foreground">Student Progress</h1>
                  <p className="text-xs text-muted-foreground">Teacher Portal</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      isActive ? "bg-primary-foreground/20" : "bg-muted/80"
                    )}>
                      <item.icon className="h-4 w-4" />
                    </div>
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-border/50">
              <Button
                variant="ghost"
                className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl"
                onClick={() => signOut()}
              >
                <LogOut className="h-5 w-5 mr-3" />
                Sign Out
              </Button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 lg:pl-64">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
