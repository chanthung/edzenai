import { ReactNode, useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Navigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSchool } from "@/hooks/useSchool";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { SubscriptionBanner } from "@/components/admin/SubscriptionBanner";
import { SchoolStatusBadge } from "@/components/admin/SchoolStatusBadge";
import { PLAN_DISPLAY } from "@/config/plan-features";
import { 
  GraduationCap, 
  Users, 
  CalendarDays, 
  Receipt, 
  Settings, 
  LogOut,
  Menu,
  X,
  Lock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { HelpChatbot } from "@/components/admin/HelpChatbot";

interface AdminLayoutProps {
  children: ReactNode;
}

const navItems = [
  { href: "/admin", label: "Dashboard", icon: Receipt },
  { href: "/admin/students", label: "Students", icon: Users },
  { href: "/admin/academic-years", label: "Academic Years", icon: CalendarDays },
  { href: "/admin/fee-setup", label: "Fee Setup", icon: Receipt },
  { href: "/admin/teachers", label: "Teachers", icon: Users },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/progress", label: "Student Progress", icon: GraduationCap },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, loading: authLoading, signOut } = useAuth();
  const { data: school, isLoading: schoolLoading } = useSchool();
  const { effectiveState, daysRemaining, isRestricted, currentPlan, canAccessFeature } = useSubscriptionStatus();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  if (authLoading) {
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

  const planInfo = PLAN_DISPLAY[currentPlan];

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <header className="lg:hidden sticky top-0 z-50 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-semibold text-sm">EdZen AI</h1>
              {schoolLoading ? (
                <Skeleton className="h-3 w-20 mt-1" />
              ) : (
                <p className="text-xs text-muted-foreground truncate max-w-[150px]">{school?.name}</p>
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
          <nav className="absolute top-full left-0 right-0 z-50 bg-card border-b border-border shadow-lg animate-slide-up">
            <div className="p-2 space-y-1">
              {navItems.map((item) => {
                const isProgressLocked = item.href === '/progress' && !canAccessFeature('progress_module');
                return (
                  <Link
                    key={item.href}
                    to={isProgressLocked ? '#' : item.href}
                    onClick={(e) => {
                      if (isProgressLocked) {
                        e.preventDefault();
                      } else {
                        setMobileMenuOpen(false);
                      }
                    }}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                      location.pathname === item.href
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted",
                      isProgressLocked && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                    {isProgressLocked && <Lock className="h-3.5 w-3.5 ml-auto" />}
                  </Link>
                );
              })}
              <button
                onClick={() => { setMobileMenuOpen(false); setShowSignOutConfirm(true); }}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium w-full text-destructive hover:bg-destructive/10 transition-colors"
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
        <aside className="hidden lg:flex lg:flex-col lg:w-[260px] lg:fixed lg:inset-y-0 bg-card border-r border-border/60">
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="px-6 pt-7 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="font-bold text-foreground text-base tracking-tight">EdZen AI</h1>
                  {schoolLoading ? (
                    <Skeleton className="h-3 w-24 mt-1" />
                  ) : (
                    <p className="text-xs text-muted-foreground truncate max-w-[140px] mt-0.5">{school?.name}</p>
                  )}
                </div>
              </div>
              {/* Plan Badge + Status */}
              <div className="mt-4 flex items-center gap-2">
                <Badge className={cn("text-xs", planInfo.colorClass)}>
                  {planInfo.badge}
                </Badge>
                <SchoolStatusBadge effectiveState={effectiveState} />
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-2 space-y-0.5">
              {navItems.map((item) => {
                const isProgressLocked = item.href === '/progress' && !canAccessFeature('progress_module');
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={isProgressLocked ? '#' : item.href}
                    onClick={isProgressLocked ? (e) => e.preventDefault() : undefined}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                      isProgressLocked && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <item.icon className={cn("h-[18px] w-[18px]", isActive ? "" : "text-muted-foreground")} />
                    {item.label}
                    {isProgressLocked && <Lock className="h-3.5 w-3.5 ml-auto" />}
                  </Link>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="px-3 pb-5 pt-2 border-t border-border/40 mt-auto">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-[13px] rounded-xl"
                onClick={() => setShowSignOutConfirm(true)}
              >
                <LogOut className="h-4 w-4 mr-3" />
                Sign Out
              </Button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 lg:pl-[260px]">
          <div className="p-4 sm:p-6 lg:px-8 lg:py-7 max-w-7xl mx-auto">
            {/* Subscription Banner */}
            <SubscriptionBanner 
              effectiveState={effectiveState} 
              daysRemaining={daysRemaining}
              currentPlan={currentPlan}
              className="mb-6"
            />
            {children}
          </div>
        </main>
      </div>
      <HelpChatbot />

      <AlertDialog open={showSignOutConfirm} onOpenChange={setShowSignOutConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to sign out?</AlertDialogTitle>
            <AlertDialogDescription>
              You will be logged out of your account and redirected to the login page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => signOut()}>Sign Out</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
