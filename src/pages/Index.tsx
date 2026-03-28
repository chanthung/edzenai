import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSubscriptionPricing } from "@/hooks/useSubscriptionPricing";
import {
  GraduationCap,
  ArrowRight,
  Users,
  CheckCircle2,
  Brain,
  BarChart3,
  CalendarCheck,
  FileText,
  Sparkles,
  AlertTriangle,
  Shield,
  ShieldCheck,
  TrendingUp,
  Upload,
  BookOpen,
  Check,
  X,
  Lock,
  CloudUpload,
  IndianRupee,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Index() {
  const { data: pricing } = useSubscriptionPricing();
  const starterRate = pricing?.find(p => p.plan === 'starter')?.per_student_fee ?? 5;
  const proRate = pricing?.find(p => p.plan === 'pro')?.per_student_fee ?? 8;

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg leading-tight">EdZen AI</span>
              <span className="text-[10px] text-muted-foreground leading-tight hidden sm:block">
                AI-Powered School Management
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/login">Sign In</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/signup">Start Free Trial</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            AI-Powered School Management
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            Run Your School Smarter <span className="text-primary">with AI</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
            Automate reports, track student performance, and reduce teacher workload — all in one simple platform.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
            <Button size="lg" asChild className="min-w-[200px]">
              <Link to="/signup">
                Start Free 30-Day Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/login">Book Demo</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            No credit card required · Built for Indian schools · NEP aligned
          </p>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">Managing a school shouldn't feel overwhelming</h2>
          <div className="grid sm:grid-cols-2 gap-6 text-left max-w-2xl mx-auto">
            <ProblemPoint text="Teachers spend hours on reports and evaluations" />
            <ProblemPoint text="Student performance is hard to track" />
            <ProblemPoint text="Fee management is repetitive and manual" />
            <ProblemPoint text="Too many disconnected systems" />
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">One platform. Everything simplified.</h2>
          <div className="grid sm:grid-cols-2 gap-6 text-left max-w-2xl mx-auto">
            <SolutionPoint text="Manage students, classes, and attendance" />
            <SolutionPoint text="Automatically assign and track fees" />
            <SolutionPoint text="Generate report cards in seconds" />
            <SolutionPoint text="Get AI-powered student insights" />
          </div>
        </div>
      </section>

      {/* AI Insights Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Brain className="h-4 w-4" />
            Key Differentiator
          </div>
          <h2 className="text-3xl font-bold mb-8">Let AI do the hard work</h2>
          <div className="grid sm:grid-cols-3 gap-6 mb-8">
            <AIInsightCard icon={AlertTriangle} title="Detect weak students instantly" />
            <AIInsightCard icon={TrendingUp} title="Identify performance trends across classes" />
            <AIInsightCard icon={CalendarCheck} title="Get alerts for attendance and academic risks" />
          </div>
          <Button size="lg" variant="outline" asChild>
            <Link to="/signup">
              See How It Works
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Built for real school workflows</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={Users}
              title="Student Management"
              description="Add, organize, and manage all student data in one place"
            />
            <FeatureCard
              icon={BarChart3}
              title="Fee Automation"
              description="Assign fees automatically — no manual work"
            />
            <FeatureCard icon={FileText} title="Report Generation" description="Generate report cards instantly" />
            <FeatureCard
              icon={Upload}
              title="Excel Import"
              description="Upload student data and get started in minutes"
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Get started in minutes</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <StepCard step={1} title="Upload your student list" />
            <StepCard step={2} title="Set up classes and subjects" />
            <StepCard step={3} title="Start tracking and generating reports" />
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Simple, transparent pricing</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="card-elevated relative">
              <CardContent className="pt-8 pb-8">
                <h3 className="text-xl font-bold mb-1">Starter</h3>
                <p className="text-muted-foreground text-sm mb-4">For core school operations</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold">₹{starterRate}</span>
                  <span className="text-muted-foreground">/student/month</span>
                </div>
                <div className="space-y-3 mb-8">
                  <PricingFeature included>Student management & bulk import</PricingFeature>
                  <PricingFeature included>Fee structures & payments</PricingFeature>
                  <PricingFeature included>Attendance tracking</PricingFeature>
                  <PricingFeature included>Parent Link & Telegram</PricingFeature>
                  <PricingFeature included>AI Excel Import</PricingFeature>
                  <PricingFeature included>AI Class Summary (3/month)</PricingFeature>
                  <PricingFeature>Student Progress module</PricingFeature>
                  <PricingFeature>NEP 2020 Report Cards</PricingFeature>
                  <PricingFeature>At-Risk detection</PricingFeature>
                </div>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/signup">Get Started</Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="card-elevated relative border-primary/50 shadow-lg shadow-primary/5">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground px-4 py-1">Recommended</Badge>
              </div>
              <CardContent className="pt-8 pb-8">
                <h3 className="text-xl font-bold mb-1">Pro</h3>
                <p className="text-muted-foreground text-sm mb-4">For AI insights and automation</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold">₹{proRate}</span>
                  <span className="text-muted-foreground">/student/month</span>
                </div>
                <div className="space-y-3 mb-8">
                  <PricingFeature included>Everything in Starter</PricingFeature>
                  <PricingFeature included>Unlimited AI Insights</PricingFeature>
                  <PricingFeature included>PTM Summary generation</PricingFeature>
                  <PricingFeature included>Subjects, assessments & marks</PricingFeature>
                  <PricingFeature included>Competency tracking</PricingFeature>
                  <PricingFeature included>NEP 2020 Report Cards</PricingFeature>
                  <PricingFeature included>Performance charts & analytics</PricingFeature>
                  <PricingFeature included>At-Risk detection & learning gaps</PricingFeature>
                  <PricingFeature included>CSV/PDF exports</PricingFeature>
                  <PricingFeature included>AI Help Assistant (Chatbot)</PricingFeature>
                </div>
                <Button asChild className="w-full">
                  <Link to="/signup">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
          <p className="text-center text-muted-foreground text-sm mt-6">
            Volume discounts available for larger schools
          </p>
          <div className="text-center mt-4">
            <Button variant="link" asChild>
              <Link to="/signup">View Pricing →</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Security & Compliance Section */}
      <section className="py-20 px-4 bg-white dark:bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-4">
            <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 mb-6">
              <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
              GDPR & DPDP Compliant
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-foreground">
              Bank-Grade Security for Your School's Future
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Your school's data deserves the highest level of protection. EdZen AI is built with enterprise-grade security from the ground up.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            <SecurityCard
              icon={ShieldCheck}
              title="Student Data Protection"
              description="Fully compliant with global privacy standards. All sensitive student records are encrypted at rest and in transit."
            />
            <SecurityCard
              icon={IndianRupee}
              title="Secure Fee Management"
              description="UPI-based payment verification with encrypted proof uploads. Automatically track and assign fees with full audit trails."
            />
            <SecurityCard
              icon={Lock}
              title="Role-Based Permissions"
              description="Strict access levels for Admins, Teachers, and Parents. Ensure only authorized staff can modify grades or attendance."
            />
            <SecurityCard
              icon={CloudUpload}
              title="99.9% Uptime & Backups"
              description="Never lose a report card. Automated daily backups and real-time syncing across secure cloud servers."
            />
          </div>
          <div className="text-center mt-10">
            <Button variant="outline" size="lg" className="border-indigo-300 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-300 dark:hover:bg-indigo-950">
              <FileText className="mr-2 h-4 w-4" />
              Security Whitepaper
            </Button>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Built for modern Indian schools</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            <TrustItem
              icon={Shield}
              title="NEP 2020 aligned"
              description="Competency-based assessment and report cards following national guidelines."
            />
            <TrustItem
              icon={BookOpen}
              title="Designed for busy teachers"
              description="Minimal clicks for marks entry. AI handles the analysis."
            />
            <TrustItem
              icon={GraduationCap}
              title="Works for all boards"
              description="CBSE, ICSE, State Boards — one platform fits all."
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Start your free trial today</h2>
          <p className="text-primary-foreground/80 text-lg mb-8 max-w-2xl mx-auto">
            Set up your school in minutes. No risk.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link to="/signup">
              Start Free Trial
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <p className="text-sm text-primary-foreground/60 mt-4">
            No credit card required · Free for 30 days · Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            <span className="font-semibold">EdZen AI</span>
          </div>
          <p className="text-sm text-muted-foreground">AI-Powered School Management System</p>
        </div>
      </footer>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────────── */

function ProblemPoint({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/5 border border-destructive/10">
      <X className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
      <span className="text-sm text-foreground">{text}</span>
    </div>
  );
}

function SolutionPoint({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/10">
      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
      <span className="text-sm text-foreground">{text}</span>
    </div>
  );
}

function AIInsightCard({ icon: Icon, title }: { icon: typeof Brain; title: string }) {
  return (
    <div className="p-6 rounded-xl bg-card border text-center">
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <p className="font-medium text-sm">{title}</p>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: typeof Users; title: string; description: string }) {
  return (
    <Card className="card-elevated group hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <h3 className="font-semibold text-lg mb-2">{title}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </CardContent>
    </Card>
  );
}

function StepCard({ step, title }: { step: number; title: string }) {
  return (
    <div className="text-center p-6">
      <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-lg font-bold">
        {step}
      </div>
      <p className="font-medium">{title}</p>
    </div>
  );
}

function PricingFeature({ children, included = false }: { children: React.ReactNode; included?: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {included ? (
        <Check className="h-4 w-4 text-primary flex-shrink-0" />
      ) : (
        <X className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
      )}
      <span className={cn(!included && "text-muted-foreground/60")}>{children}</span>
    </div>
  );
}

function TrustItem({ icon: Icon, title, description }: { icon: typeof Shield; title: string; description: string }) {
  return (
    <div className="text-center p-6">
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}
