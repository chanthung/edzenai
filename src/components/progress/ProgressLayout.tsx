import { ReactNode, useState } from "react";
import { Navigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSchool } from "@/hooks/useSchool";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SubscriptionBanner } from "@/components/admin/SubscriptionBanner";
import { SchoolStatusBadge } from "@/components/admin/SchoolStatusBadge";
import { 
  BarChart3, 
  BookOpen, 
  ClipboardList, 
  PenLine,
  FileText,
  CalendarCheck,
  LogOut,
  Menu,
  X,
  ArrowLeft,
  Lock,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProgressLayoutProps {
  children: ReactNode;
}

const navItems = [
  { href: "/progress", label: "Dashboard", icon: BarChart3 },
  { href: "/progress/subjects", label: "Subjects", icon: BookOpen },
  { href: "/progress/assessments", label: "Assessments", icon: ClipboardList },
  { href: "/progress/marks", label: "Marks Entry", icon: PenLine },
  { href: "/progress/attendance", label: "Attendance", icon: CalendarCheck },
  { href: "/progress/report-cards", label: "Report Cards", icon: FileText },
];

export function ProgressLayout({ children }: ProgressLayoutProps) {
  const { user, loading: authLoading, signOut } = useAuth();
  const { data: school, isLoading: schoolLoading } = useSchool();
  const { effectiveState, daysRemaining, canAccessFeature, currentPlan } = useSubscriptionStatus();
  const { isTeacher, isSchoolAdmin, isAccountant, isLoading: roleLoading } = useUserRole();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-muted animate-pulse" />
          <div className="h-4 w-32 bg-muted animate-pulse rounded" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has access (either teacher or school admin, NOT accountant)
  if (!isTeacher && !isSchoolAdmin) {
    return <Navigate to="/login" replace />;
  }

  // Accountants cannot access progress module
  if (isAccountant) {
    return <Navigate to="/admin" replace />;
  }

  // Gate progress module for non-Pro schools (admin-only check; teachers always get access via their school)
  if (isSchoolAdmin && !isTeacher && !canAccessFeature('progress_module')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto">
            <Lock className="h-8 w-8 text-purple-600" />
          </div>
          <h1 className="text-2xl font-bold">Upgrade Required</h1>
          <p className="text-muted-foreground">
            The Student Progress module — including subjects, assessments, marks entry, report cards, and AI insights — is available on the Pro plan.
          </p>
          <p className="text-sm text-muted-foreground">
            Contact your administrator to upgrade your subscription.
          </p>
          <div className="flex gap-3 justify-center mt-2">
            <Link to="/pricing">
              <Button>
                <Sparkles className="h-4 w-4 mr-2" />
                Upgrade Now
              </Button>
            </Link>
            <Link to="/admin">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Teachers don't see the subscription banner or back to fee management link
  const showAdminFeatures = isSchoolAdmin && !isTeacher;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile header */}
      <header className="lg:hidden sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-semibold text-sm">Student Progress</h1>
              {schoolLoading ? (
                <div className="h-3 w-20 mt-1 bg-muted animate-pulse rounded" />
              ) : (
                <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                  {isTeacher ? "Teacher Portal" : school?.name}
                </p>
              )}
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
              {showAdminFeatures && (
                <>
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted/60 transition-colors"
                  >
                    <ArrowLeft className="h-5 w-5" />
                    Back to Fee Management
                  </Link>
                  <div className="border-t border-border/50 my-2" />
                </>
              )}
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
              <div className="border-t border-border/50 my-2" />
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
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="font-bold text-foreground">Student Progress</h1>
                  {schoolLoading ? (
                    <div className="h-3 w-24 mt-1 bg-muted animate-pulse rounded" />
                  ) : (
                    <p className="text-xs text-muted-foreground truncate max-w-[140px]">
                      {isTeacher ? "Teacher Portal" : school?.name}
                    </p>
                  )}
                </div>
              </div>
              {/* School Status Badge - only for admins */}
              {showAdminFeatures && (
                <div className="mt-3">
                  <SchoolStatusBadge effectiveState={effectiveState} />
                </div>
              )}
            </div>

            {/* Back to Fee Management - only for admins */}
            {showAdminFeatures && (
              <div className="px-4 pt-4">
                <Link
                  to="/admin"
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-medium text-muted-foreground hover:bg-muted/60 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Fee Management
                </Link>
              </div>
            )}

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
            {/* Subscription Banner - only for admins */}
            {showAdminFeatures && (
              <SubscriptionBanner 
                effectiveState={effectiveState} 
                daysRemaining={daysRemaining}
                currentPlan={currentPlan}
                className="mb-6"
              />
            )}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
