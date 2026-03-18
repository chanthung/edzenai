import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";

// Pages
import Index from "./pages/Index";
import Login from "./pages/auth/Login";
import Dashboard from "./pages/admin/Dashboard";
import Students from "./pages/admin/Students";
import AcademicYears from "./pages/admin/AcademicYears";
import FeeSetup from "./pages/admin/FeeSetup";
import Settings from "./pages/admin/Settings";
import Teachers from "./pages/admin/Teachers";
import ParentView from "./pages/parent/ParentView";
import PlatformDashboard from "./pages/platform/PlatformDashboard";
import NotFound from "./pages/NotFound";

// Progress Module Pages
import ProgressDashboard from "./pages/progress/ProgressDashboard";
import ProgressSubjects from "./pages/progress/Subjects";
import ProgressAssessments from "./pages/progress/Assessments";
import ProgressMarksEntry from "./pages/progress/MarksEntry";
import StudentProgress from "./pages/progress/StudentProgress";
import ReportCards from "./pages/progress/ReportCards";
import Attendance from "./pages/progress/Attendance";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            
            {/* Parent view - unique link access */}
            <Route path="/view/:name/:token" element={<ParentView />} />
            
            {/* Platform Admin routes */}
            <Route path="/platform" element={<PlatformDashboard />} />
            
            {/* School Admin routes */}
            <Route path="/admin" element={<Dashboard />} />
            <Route path="/admin/students" element={<Students />} />
            <Route path="/admin/academic-years" element={<AcademicYears />} />
            <Route path="/admin/fee-setup" element={<FeeSetup />} />
            <Route path="/admin/settings" element={<Settings />} />
            <Route path="/admin/teachers" element={<Teachers />} />
            
            {/* Student Progress Module */}
            <Route path="/progress" element={<ProgressDashboard />} />
            <Route path="/progress/subjects" element={<ProgressSubjects />} />
            <Route path="/progress/assessments" element={<ProgressAssessments />} />
            <Route path="/progress/marks" element={<ProgressMarksEntry />} />
            <Route path="/progress/student/:studentId" element={<StudentProgress />} />
            <Route path="/progress/report-cards" element={<ReportCards />} />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
