import { Link } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import Autoplay from "embla-carousel-autoplay";
import edzenIcon from "@/assets/edzen-icon.png";
import edzenLogoFull from "@/assets/edzen-logo-full.png";
import slideStudents from "@/assets/slide-students.png";
import slideExcelAi1 from "@/assets/slide-excel-ai1.png";
import slideExcelAi2 from "@/assets/slide-excel-ai2.png";
import slideWhatsapp1 from "@/assets/slide-whatsapp1.png";
import slideWhatsapp2 from "@/assets/slide-whatsapp2.png";
import slideParentLink from "@/assets/slide-parent-link.png";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";
import { useSubscriptionPricing } from "@/hooks/useSubscriptionPricing";
import { useVolumeDiscounts } from "@/hooks/useVolumeDiscounts";
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
  Eye,
  MessageSquareWarning,
  Receipt,
  Clock,
  Zap,
  RefreshCw,
  Quote,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Index() {
  usePageMeta({
    title: "EdZen AI – School Fee Management & AI Student Progress Platform",
    description:
      "School management platform with fee transparency for parents and AI-powered student progress analysis for teachers. Track payments, attendance, NEP 2020 report cards.",
    canonical: "/",
  });
  const { data: pricing } = useSubscriptionPricing();
  const { data: discountTiers = [] } = useVolumeDiscounts();
  const starterRate = pricing?.find((p) => p.plan === "starter")?.per_student_fee ?? 8;
  const proRate = pricing?.find((p) => p.plan === "pro")?.per_student_fee ?? 10;

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/40 bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={edzenLogoFull} alt="EdZen AI" className="h-44 sm:h-56 object-contain" />
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#pricing" className="hover:text-foreground transition-colors">
              Pricing
            </a>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/login">Login</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/signup?plan=pro">Start Free Trial</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="py-20 md:py-32 px-4 sm:px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left */}
          <div className="text-center lg:text-left">
            <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight leading-[1.1] mb-6">
              Know Exactly What <br className="hidden sm:block" />
              You <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Owe</span> —
              No Surprises
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg mx-auto lg:mx-0 mb-8 leading-relaxed">
              Clear, real-time fee visibility for parents and schools. Eliminate manual tracking and miscommunication
              with a single source of truth.
            </p>
            <div className="flex flex-col sm:flex-row items-center lg:items-start gap-3">
              <Button size="lg" asChild className="min-w-[180px] h-12 text-base shadow-md shadow-primary/20">
                <Link to="/signup?plan=pro">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <a
                href="https://calendly.com/edzenai-admin/30min"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Book a demo call"
                className="inline-flex items-center justify-center h-12 min-w-[180px] text-base font-medium rounded-full border border-border/60 bg-transparent text-foreground hover:bg-muted/60 transition-all duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-ring/40 px-6"
              >
                Book a Demo
              </a>
            </div>
          </div>

          {/* Right — Fee Summary Card */}
          <div className="flex justify-center lg:justify-end">
            <Card className="w-full max-w-sm rounded-3xl shadow-xl shadow-primary/5 border-border/60 overflow-hidden">
              <CardContent className="p-0">
                <div className="p-6 pb-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Balance</p>
                  <p className="text-4xl font-extrabold tracking-tight">₹1,200.00</p>
                  <Badge className="mt-2 bg-primary/10 text-primary border-primary/20 text-xs">Up to date</Badge>
                </div>
                <div className="px-6 pb-6 space-y-3">
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-status-paid/5 border border-status-paid/15">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4.5 w-4.5 text-status-paid" />
                      <span className="text-sm font-medium">Paid Amount</span>
                    </div>
                    <span className="font-bold text-status-paid">₹800</span>
                  </div>
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-status-due/5 border border-status-due/15">
                    <div className="flex items-center gap-2.5">
                      <Clock className="h-4.5 w-4.5 text-status-due" />
                      <span className="text-sm font-medium">Pending</span>
                    </div>
                    <span className="font-bold text-status-due">₹400</span>
                  </div>
                </div>
                <div className="px-6 pb-6 flex items-center justify-between text-xs text-muted-foreground border-t border-border/40 pt-4">
                  <span>Due Date</span>
                  <span className="font-medium text-foreground">
                    {new Intl.DateTimeFormat("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    }).format(new Date(Date.now() + 20 * 86400000))}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ═══ PROBLEM SECTION — "Why Fee Confusion Happens" ═══ */}
      <section className="py-20 md:py-28 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Fee Confusion Happens</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Traditional systems create blind spots that frustrate both parents and administrators.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <ProblemCard
              icon={MessageSquareWarning}
              title="Fragmented comms"
              description="Scattered in emails, WhatsApp, papers, and phone calls."
            />
            <ProblemCard
              icon={Receipt}
              title="Lost receipts"
              description="No digital archive of past payments leading to proof disputes."
            />
            <ProblemCard
              icon={BarChart3}
              title="Unclear balances"
              description="Parents never know the remaining fees or upcoming due dates."
            />
            <ProblemCard
              icon={AlertTriangle}
              title="Late surprises"
              description="Monthly fees and add-ons keep creating unnecessary stress."
            />
          </div>
        </div>
      </section>

      {/* ═══ SOLUTION — "A Single Source of Truth" ═══ */}
      <section className="py-20 md:py-28 px-4 sm:px-6 bg-muted/30">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          {/* Visual Card */}
          <div>
            <Card className="rounded-3xl shadow-lg border-border/50 overflow-hidden">
              <CardContent className="p-0">
                <div className="p-5 bg-muted/40">
                  <p className="text-2xs uppercase text-muted-foreground tracking-wider mb-1">Pending Settled</p>
                  <p className="text-3xl font-extrabold">₹0.00</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Remaining balance</p>
                </div>
                <div className="p-5 border-t border-border/30">
                  <p className="text-2xs uppercase text-muted-foreground tracking-wider mb-1">Total Paid</p>
                  <p className="text-3xl font-extrabold text-primary">₹150.00</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Out of ₹150</p>
                </div>
              </CardContent>
            </Card>
          </div>
          {/* Text */}
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">A Single Source of Truth</h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              We prioritize clarity over complexity. Our dashboard shows the Status First, so you never have to
              interpret the numbers yourself.
            </p>
            <div className="space-y-4">
              <SolutionBullet text="Instant status verification" />
              <SolutionBullet text="Automated breakdown of every payment" />
              <SolutionBullet text="Transparent installment tracking" />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ DASHBOARD SHOWCASE ═══ */}
      <section className="py-20 md:py-28 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          {/* Carousel — full width above text */}
          <DashboardCarousel />

          {/* Text content below */}
          <div className="text-center mt-12 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">Powerful Admin Dashboard for Schools</h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Manage students, track fees, and monitor school performance — all in one place.
            </p>
            <div className="flex flex-wrap justify-center gap-6 mb-8">
              <SolutionBullet text="Real-time fee tracking" />
              <SolutionBullet text="Easy student management" />
              <SolutionBullet text="Instant reports & insights" />
            </div>
            <Button size="lg" asChild className="min-w-[180px] h-12 text-base shadow-md shadow-primary/20">
              <Link to="/signup?plan=pro">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section id="pricing" className="py-20 md:py-28 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-muted-foreground">Choose the plan that fits your school's needs.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Starter */}
            <Card className="rounded-3xl border-border/60 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold mb-1">Starter</h3>
                <p className="text-muted-foreground text-sm mb-5">Basic features for small schools</p>
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-4xl font-extrabold">₹{starterRate}</span>
                  <span className="text-muted-foreground text-sm">/student/month</span>
                </div>
                <div className="space-y-3 mb-8">
                  <PricingFeature included>Student management & bulk import</PricingFeature>
                  <PricingFeature included>Fee structures & payments</PricingFeature>
                  <PricingFeature included>Attendance tracking</PricingFeature>
                  <PricingFeature included>Parent Link & WhatsApp</PricingFeature>
                  <PricingFeature included>AI Excel Import</PricingFeature>
                  <PricingFeature included>AI Class Summary (3/month)</PricingFeature>
                  <PricingFeature>Student Progress module</PricingFeature>
                  <PricingFeature>NEP 2020 Report Cards</PricingFeature>
                  <PricingFeature>At-Risk detection</PricingFeature>
                </div>
                <Button asChild variant="outline" className="w-full h-11 rounded-xl">
                  <Link to="/signup?plan=starter">Get Started</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Pro */}
            <Card className="rounded-3xl border-primary/40 shadow-lg shadow-primary/8 relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary to-accent" />
              <div className="absolute right-6 top-0">
                <Badge className="bg-primary text-primary-foreground rounded-b-xl rounded-t-none px-4 py-1.5 text-xs">
                  ⭐ Most Popular
                </Badge>
              </div>
              <CardContent className="p-8 pt-10">
                <h3 className="text-xl font-bold mb-1">Pro</h3>
                <p className="text-muted-foreground text-sm mb-5">Full AI-powered intelligence suite</p>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-extrabold">₹{proRate}</span>
                  <span className="text-muted-foreground text-sm">/student/month</span>
                </div>
                <p className="text-xs text-primary font-medium mb-6">30-day free trial included</p>
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
                <Button asChild className="w-full h-11 rounded-xl shadow-sm">
                  <Link to="/signup?plan=pro">
                    Try Pro Free for 30 Days
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
          {discountTiers.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-3 mt-8">
              {discountTiers.map((t) => (
                <Badge key={t.id} variant="outline" className="text-xs">
                  {t.max_students != null ? `${t.min_students}–${t.max_students}` : `${t.min_students}+`} students →{" "}
                  {t.discount_percent}% off
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground text-sm mt-8">
              Volume discounts available for larger schools
            </p>
          )}
        </div>
      </section>

      {/* ═══ 3 STEPS TO CLARITY ═══ */}
      <section className="py-20 md:py-28 px-4 sm:px-6 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">3 Steps to Clarity</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <StepCard
              step={1}
              title="School uploads data"
              description="Administrators sync current fee data via secure API or CSV upload."
            />
            <StepCard
              step={2}
              title="Parent opens link"
              description="No app to download, no login to remember. Access via secure unique link."
            />
            <StepCard
              step={3}
              title="View status"
              description="Parents see real-time status and pay reliably with zero friction."
            />
          </div>
        </div>
      </section>

      {/* ═══ FEATURES — "Built for Transparency" ═══ */}
      <section id="features" className="py-20 md:py-28 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Built for Transparency</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={Lock}
              title="No Login Required"
              description="Access everything through a secure, unique access token for each student."
            />
            <FeatureCard
              icon={Shield}
              title="Secure Access"
              description="Bank-grade encryption for all financial records and student identity data."
            />
            <FeatureCard
              icon={BarChart3}
              title="Installment Breakdown"
              description="Automated fee schedules and installment tracking based on your plan."
            />
            <FeatureCard
              icon={AlertTriangle}
              title="Dynamic Due Dates"
              description="Automated reminders adjusted based on your personalized payment plan."
            />
            <FeatureCard
              icon={IndianRupee}
              title="QR/UPI Payment"
              description="Scan and pay in seconds. Auto-updates your ledger status instantly."
            />
            <FeatureCard
              icon={RefreshCw}
              title="Instant Sync"
              description="Everything works in real-time. As soon as you pay, your records update."
            />
          </div>
        </div>
      </section>

      {/* ═══ FOR PARENTS / FOR SCHOOLS split ═══ */}
      <section className="py-20 md:py-28 px-4 sm:px-6 bg-muted/30">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
          <Card className="rounded-3xl border-border/50">
            <CardContent className="p-8">
              <p className="text-xs uppercase tracking-wider text-primary font-semibold mb-3">For Parents</p>
              <h3 className="text-2xl font-bold mb-6">Confidence in Every Payment</h3>
              <div className="space-y-4">
                <BenefitItem
                  icon={CheckCircle2}
                  title="No surprises"
                  description="Know exactly what's due, including tuition, transport, and extras."
                />
                <BenefitItem
                  icon={Clock}
                  title="Always know status"
                  description="Access your full payment history and download receipts anytime."
                />
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-3xl border-border/50">
            <CardContent className="p-8">
              <p className="text-xs uppercase tracking-wider text-primary font-semibold mb-3">For Schools</p>
              <h3 className="text-2xl font-bold mb-6">Efficiency in Every Collection</h3>
              <div className="space-y-4">
                <BenefitItem
                  icon={TrendingUp}
                  title="Reduce fee queries"
                  description="Cut admin calls by 70% by giving parents self-service access."
                />
                <BenefitItem
                  icon={Zap}
                  title="Save admin time"
                  description="Automated fee collection means your team spends less time chasing spreadsheets."
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="py-24 px-4 sm:px-6 bg-gradient-to-br from-primary via-primary/95 to-accent text-primary-foreground">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Bring clarity to fee communication</h2>
          <p className="text-primary-foreground/80 text-lg mb-10 max-w-xl mx-auto">
            Join hundreds of schools that have simplified their fee management.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" variant="secondary" asChild className="h-12 text-base min-w-[160px]">
              <Link to="/signup?plan=pro">Start Free Trial</Link>
            </Button>
            <a
              href="https://calendly.com/edzenai-admin/30min"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Book a demo call"
              className="inline-flex items-center justify-center h-12 min-w-[160px] text-base font-medium rounded-full border border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 transition-all duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary-foreground/40 px-6"
            >
              Book a Demo
            </a>
          </div>
          <p className="text-sm text-primary-foreground/60 mt-5">
            No credit card required · 30-day Pro trial · Cancel anytime
          </p>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="py-12 px-4 sm:px-6 border-t border-border/40">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <img src={edzenLogoFull} alt="EdZen AI" className="h-10 object-contain" />
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Affordably. Transparently. Educational finance through clarity.
              </p>
            </div>
            <div>
              <p className="font-semibold text-sm mb-3 uppercase tracking-wider text-muted-foreground">Platform</p>
              <nav className="space-y-2 text-sm">
                <Link to="/signup" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Features
                </Link>
                <Link to="/pricing" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Pricing
                </Link>
                <Link to="/login" className="block text-muted-foreground hover:text-foreground transition-colors">
                  School Portal
                </Link>
              </nav>
            </div>
            <div>
              <p className="font-semibold text-sm mb-3 uppercase tracking-wider text-muted-foreground">Legal</p>
              <nav className="space-y-2 text-sm">
                <Link to="/privacy" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
                <Link to="/terms" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
                <Link
                  to="/refund-policy"
                  className="block text-muted-foreground hover:text-foreground transition-colors"
                >
                  Refund &amp; Cancellation
                </Link>
                <Link to="/contact" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Contact Support
                </Link>
              </nav>
            </div>
          </div>
          <div className="border-t border-border/30 pt-6 text-center">
            <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} EdZen AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────────── */

function ProblemCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof AlertTriangle;
  title: string;
  description: string;
}) {
  return (
    <Card className="rounded-2xl border-border/50 hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="w-11 h-11 rounded-2xl bg-destructive/8 flex items-center justify-center mb-4">
          <Icon className="h-5 w-5 text-destructive/70" />
        </div>
        <h3 className="font-semibold text-base mb-1.5">{title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}

const dashboardSlides = [
  { image: slideStudents, label: "Student Management" },
  { image: slideExcelAi1, label: "AI Excel Import" },
  { image: slideExcelAi2, label: "Smart Data Mapping" },
  { image: slideWhatsapp1, label: "WhatsApp Integration" },
  { image: slideWhatsapp2, label: "Send Parent Link" },
  { image: slideParentLink, label: "Parent Portal" },
];

function DashboardCarousel() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  const onSelect = useCallback(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
  }, [api]);

  useEffect(() => {
    if (!api) return;
    onSelect();
    api.on("select", onSelect);
    api.on("reInit", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api, onSelect]);

  return (
    <div className="flex flex-col items-center gap-5 w-full">
      <Carousel
        setApi={setApi}
        opts={{ loop: true }}
        plugins={[Autoplay({ delay: 3000, stopOnInteraction: false, stopOnMouseEnter: true })]}
        className="w-full"
      >
        <CarouselContent>
          {dashboardSlides.map((slide) => (
            <CarouselItem key={slide.label}>
              <div className="w-full h-[580px] md:h-[640px] lg:h-[680px] rounded-2xl shadow-2xl shadow-primary/10 border border-border/40 overflow-hidden">
                <img
                  src={slide.image}
                  alt={`EdZen AI — ${slide.label}`}
                  loading="lazy"
                  className="w-full h-full object-cover object-top"
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      <div className="flex items-center gap-3">
        {dashboardSlides.map((slide, i) => (
          <button
            key={slide.label}
            onClick={() => api?.scrollTo(i)}
            className={`h-2.5 rounded-full transition-all duration-300 ${i === current ? "w-8 bg-primary" : "w-2.5 bg-muted-foreground/30"}`}
            aria-label={`Go to ${slide.label}`}
          />
        ))}
        <span className="text-sm font-medium text-muted-foreground ml-3">{dashboardSlides[current]?.label}</span>
      </div>
    </div>
  );
}

function SolutionBullet({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
      <span className="text-sm font-medium">{text}</span>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: typeof Users; title: string; description: string }) {
  return (
    <Card className="rounded-2xl border-border/50 hover:shadow-md transition-all group">
      <CardContent className="p-6">
        <div className="w-11 h-11 rounded-2xl bg-primary/8 flex items-center justify-center mb-4 group-hover:bg-primary/12 transition-colors">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <h3 className="font-semibold text-base mb-1.5">{title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}

function StepCard({ step, title, description }: { step: number; title: string; description: string }) {
  return (
    <div className="text-center p-6">
      <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-5 text-xl font-bold shadow-md shadow-primary/20">
        {step}
      </div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function PricingFeature({ children, included = false }: { children: React.ReactNode; included?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 text-sm">
      {included ? (
        <Check className="h-4 w-4 text-primary flex-shrink-0" />
      ) : (
        <X className="h-4 w-4 text-muted-foreground/30 flex-shrink-0" />
      )}
      <span className={cn(!included && "text-muted-foreground/50")}>{children}</span>
    </div>
  );
}

function BenefitItem({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof CheckCircle2;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <h4 className="font-semibold text-sm mb-0.5">{title}</h4>
        <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function TestimonialCard({ quote, name, title }: { quote: string; name: string; title: string }) {
  return (
    <Card className="rounded-3xl border-border/40">
      <CardContent className="p-8">
        <Quote className="h-6 w-6 text-primary/30 mb-4" />
        <p className="text-foreground/90 leading-relaxed mb-6 italic">"{quote}"</p>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
            {name.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-sm">{name}</p>
            <p className="text-xs text-muted-foreground">{title}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
