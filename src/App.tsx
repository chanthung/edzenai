import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";

// Parent view: keep on its own chunk, prioritized for low-bandwidth parents
const ParentView = lazy(() => import("./pages/parent/ParentView"));

// Public marketing
const Index = lazy(() => import("./pages/Index"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Contact = lazy(() => import("./pages/Contact"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));
const RefundPolicy = lazy(() => import("./pages/RefundPolicy"));
const BookDemo = lazy(() => import("./pages/BookDemo"));
const UserManual = lazy(() => import("./pages/UserManual"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Auth
const Login = lazy(() => import("./pages/auth/Login"));
const Signup = lazy(() => import("./pages/auth/Signup"));
const Onboard = lazy(() => import("./pages/auth/Onboard"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));
const AcceptInvite = lazy(() => import("./pages/auth/AcceptInvite"));
const AcceptPartnerInvite = lazy(() => import("./pages/auth/AcceptPartnerInvite"));

// School Admin
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const Students = lazy(() => import("./pages/admin/Students"));
const AcademicYears = lazy(() => import("./pages/admin/AcademicYears"));
const FeeSetup = lazy(() => import("./pages/admin/FeeSetup"));
const Settings = lazy(() => import("./pages/admin/Settings"));
const Teachers = lazy(() => import("./pages/admin/Teachers"));
const GettingStarted = lazy(() => import("./pages/admin/GettingStarted"));

// Platform / Partner
const PlatformDashboard = lazy(() => import("./pages/platform/PlatformDashboard"));
const SubscriptionSettings = lazy(() => import("./pages/platform/SubscriptionSettings"));
const Partners = lazy(() => import("./pages/platform/Partners"));
const PartnerDetail = lazy(() => import("./pages/platform/PartnerDetail"));
const PartnerDashboard = lazy(() => import("./pages/partner/PartnerDashboard"));

// Progress module
const ProgressDashboard = lazy(() => import("./pages/progress/ProgressDashboard"));
const ProgressSubjects = lazy(() => import("./pages/progress/Subjects"));
const ProgressAssessments = lazy(() => import("./pages/progress/Assessments"));
const ProgressMarksEntry = lazy(() => import("./pages/progress/MarksEntry"));
const StudentProgress = lazy(() => import("./pages/progress/StudentProgress"));
const ReportCards = lazy(() => import("./pages/progress/ReportCards"));
const ReportCardTemplates = lazy(() => import("./pages/progress/ReportCardTemplates"));
const ReportCardTemplateEditor = lazy(() => import("./pages/progress/ReportCardTemplateEditor"));
const Attendance = lazy(() => import("./pages/progress/Attendance"));

const queryClient = new QueryClient();

const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/unsubscribe" element={<Unsubscribe />} />
              <Route path="/refund-policy" element={<RefundPolicy />} />
              <Route path="/book-demo" element={<BookDemo />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/onboard" element={<Onboard />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/auth/accept-invite" element={<AcceptInvite />} />
              <Route path="/auth/accept-partner-invite" element={<AcceptPartnerInvite />} />

              {/* Parent view - unique link access */}
              <Route path="/view/:name/:token" element={<ParentView />} />

              {/* Platform Admin routes */}
              <Route path="/platform" element={<PlatformDashboard />} />
              <Route path="/platform/subscription-settings" element={<SubscriptionSettings />} />
              <Route path="/platform/partners" element={<Partners />} />
              <Route path="/platform/partners/:id" element={<PartnerDetail />} />

              {/* Partner routes */}
              <Route path="/partner" element={<PartnerDashboard />} />

              {/* School Admin routes */}
              <Route path="/admin" element={<Dashboard />} />
              <Route path="/admin/students" element={<Students />} />
              <Route path="/admin/academic-years" element={<AcademicYears />} />
              <Route path="/admin/fee-setup" element={<FeeSetup />} />
              <Route path="/admin/settings" element={<Settings />} />
              <Route path="/admin/teachers" element={<Teachers />} />
              <Route path="/admin/getting-started" element={<GettingStarted />} />
              <Route path="/admin/user-manual" element={<UserManual />} />

              {/* Student Progress Module */}
              <Route path="/progress" element={<ProgressDashboard />} />
              <Route path="/progress/subjects" element={<ProgressSubjects />} />
              <Route path="/progress/assessments" element={<ProgressAssessments />} />
              <Route path="/progress/marks" element={<ProgressMarksEntry />} />
              <Route path="/progress/student/:studentId" element={<StudentProgress />} />
              <Route path="/progress/attendance" element={<Attendance />} />
              <Route path="/progress/report-cards" element={<ReportCards />} />
              <Route path="/progress/report-card-templates" element={<ReportCardTemplates />} />
              <Route path="/progress/report-card-templates/:id" element={<ReportCardTemplateEditor />} />

              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
