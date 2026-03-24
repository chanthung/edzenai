import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  GraduationCap, 
  Shield, 
  Clock, 
  Users, 
  CheckCircle2, 
  ArrowRight,
  Smartphone,
  Eye,
  Brain,
  BarChart3,
  CalendarCheck,
  FileText,
  Sparkles,
  AlertTriangle,
  BookOpen,
  TrendingUp,
  Check,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Index() {
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
              <span className="text-[10px] text-muted-foreground leading-tight hidden sm:block">AI-Powered School Management</span>
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
            AI-Powered School Management for India
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            Fees, Progress & AI Insights —{" "}
            <span className="text-primary">All in One Platform</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
            EdZen AI unifies fee transparency, student progress tracking, attendance, 
            and AI-powered analytics. Detect at-risk students, generate NEP 2020 report cards, 
            and run smarter PTMs — without the manual work.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
            <Button size="lg" asChild className="min-w-[200px]">
              <Link to="/signup">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-3">No credit card required · Free for 30 days</p>
        </div>
      </section>

      {/* Core Features Grid */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Everything your school needs</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From fee collection to AI-powered academic insights — one platform that replaces scattered spreadsheets, WhatsApp groups, and paper registers.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={Users}
              title="Student & Fee Management"
              description="Bulk import students via Excel, auto-assign fees by class, record payments, and share real-time fee statements with parents."
            />
            <FeatureCard
              icon={Brain}
              title="AI-Powered Insights"
              description="Get AI-generated class summaries, individual student analysis, and intelligent PTM talking points — powered by Gemini AI."
              badge="Pro"
            />
            <FeatureCard
              icon={BarChart3}
              title="Performance Analytics"
              description="Trend charts, subject comparisons, radar plots, and class distribution analysis — spot patterns at a glance."
              badge="Pro"
            />
            <FeatureCard
              icon={AlertTriangle}
              title="At-Risk Detection"
              description="Automatically flag students showing declining performance or learning gaps. Intervene before it's too late."
              badge="Pro"
            />
            <FeatureCard
              icon={CalendarCheck}
              title="Attendance Tracking"
              description="Mark daily attendance by class, track leave records, and give parents real-time visibility into their child's presence."
            />
            <FeatureCard
              icon={FileText}
              title="NEP 2020 Report Cards"
              description="Auto-generated report cards with competency-based assessments, term-wise marks, and grade mappings aligned to NEP 2020."
              badge="Pro"
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How EdZen AI works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Get your school running on EdZen AI in under 30 minutes.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <FeatureItem
                icon={Users}
                title="1. Add students & configure fees"
                description="Bulk import via Excel or add manually. Set up fee categories, structures, and auto-assign to classes."
              />
              <FeatureItem
                icon={Smartphone}
                title="2. Parents get instant access"
                description="Each student gets a unique link — parents see fees, payments, attendance, and progress without any login."
              />
              <FeatureItem
                icon={BookOpen}
                title="3. Teachers enter marks & attendance"
                description="Minimal-click marks entry with assessment templates. AI generates insights automatically."
              />
              <FeatureItem
                icon={Sparkles}
                title="4. AI does the heavy lifting"
                description="Smart class summaries, at-risk alerts, competency tracking, and PTM-ready reports — generated in seconds."
              />
            </div>
            {/* Mock UI Preview */}
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-3xl p-8">
              <div className="bg-card rounded-2xl shadow-lg p-6 space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <GraduationCap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Delhi Public School</p>
                    <p className="text-sm text-muted-foreground">Student Dashboard</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center py-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Fees Paid</p>
                    <p className="font-bold text-status-paid">₹42,500</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Attendance</p>
                    <p className="font-bold text-primary">94%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Avg Score</p>
                    <p className="font-bold text-accent">82%</p>
                  </div>
                </div>
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between p-3 bg-status-paid-bg rounded-lg">
                    <span className="text-sm">Q1 Fees</span>
                    <span className="text-xs font-medium text-status-paid px-2 py-1 rounded-full bg-status-paid/10">Paid</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                    <span className="text-sm">Math Assessment</span>
                    <span className="text-xs font-medium text-primary px-2 py-1 rounded-full bg-primary/10">A+</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-accent/5 rounded-lg">
                    <span className="text-sm">AI Insight</span>
                    <span className="text-xs font-medium text-accent px-2 py-1 rounded-full bg-accent/10">Improving</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Simple, per-student pricing</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Pay only for active students. No hidden charges. Start free for 30 days.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Starter */}
            <Card className="card-elevated relative">
              <CardContent className="pt-8 pb-8">
                <h3 className="text-xl font-bold mb-1">Starter</h3>
                <p className="text-muted-foreground text-sm mb-4">Core school operations</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold">₹5</span>
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
            {/* Pro */}
            <Card className="card-elevated relative border-primary/50 shadow-lg shadow-primary/5">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground px-4 py-1">Recommended</Badge>
              </div>
              <CardContent className="pt-8 pb-8">
                <h3 className="text-xl font-bold mb-1">Pro</h3>
                <p className="text-muted-foreground text-sm mb-4">Full AI intelligence suite</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold">₹8</span>
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
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Built for Indian schools</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Designed by educators, engineered for how schools in India actually work.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <TrustItem
              icon={Shield}
              title="NEP 2020 Aligned"
              description="Competency-based assessment and report cards following national guidelines."
            />
            <TrustItem
              icon={Smartphone}
              title="Parent-First Design"
              description="No app downloads. Parents access everything via a simple link."
            />
            <TrustItem
              icon={TrendingUp}
              title="Teacher-First UX"
              description="Minimal clicks for marks entry. AI handles the analysis."
            />
            <TrustItem
              icon={Eye}
              title="Full Transparency"
              description="Real-time fee visibility and payment proof verification built in."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to transform how your school runs?
          </h2>
          <p className="text-primary-foreground/80 text-lg mb-8 max-w-2xl mx-auto">
            Join schools across India using EdZen AI to reduce admin workload, 
            improve parent trust, and make data-driven academic decisions.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/signup">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="ghost" className="text-primary-foreground hover:text-primary-foreground/80 hover:bg-primary-foreground/10" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
          <p className="text-sm text-primary-foreground/60 mt-4">No credit card required · Free for 30 days · Cancel anytime</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            <span className="font-semibold">EdZen AI</span>
          </div>
          <p className="text-sm text-muted-foreground">
            AI-Powered School Management System
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────────── */

function FeatureCard({
  icon: Icon,
  title,
  description,
  badge,
}: {
  icon: typeof CheckCircle2;
  title: string;
  description: string;
  badge?: string;
}) {
  return (
    <Card className="card-elevated group hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          {badge && (
            <Badge variant="secondary" className="text-xs bg-purple-500/10 text-purple-600 border-purple-500/20">
              {badge}
            </Badge>
          )}
        </div>
        <h3 className="font-semibold text-lg mb-2">{title}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </CardContent>
    </Card>
  );
}

function FeatureItem({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof CheckCircle2;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <h3 className="font-semibold mb-1">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
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

function TrustItem({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Shield;
  title: string;
  description: string;
}) {
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
