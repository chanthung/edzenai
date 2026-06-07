import { Link, useNavigate } from "react-router-dom";
import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Autoplay from "embla-carousel-autoplay";
import edzenIcon from "@/assets/edzen-icon.png";
import edzenLogoFull from "@/assets/edzen-logo-full.png";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";
import { useSubscriptionPricing, DEFAULT_STARTER_RATE, DEFAULT_PRO_RATE } from "@/hooks/useSubscriptionPricing";
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

const LandingChatbot = lazy(() => import("@/components/landing/LandingChatbot").then(m => ({ default: m.LandingChatbot })));

export default function Index() {
  usePageMeta({
    title: "EdZen AI – School Fee Management & AI Student Progress Platform",
    description:
      "School management platform with fee transparency for parents and AI-powered student progress analysis for teachers. Track payments, attendance, NEP 2020 report cards.",
    canonical: "/",
  });
  const { data: pricing } = useSubscriptionPricing();
  const { data: discountTiers = [] } = useVolumeDiscounts();
  const starterRate = pricing?.find((p) => p.plan === "starter")?.per_student_fee ?? DEFAULT_STARTER_RATE;
  const proRate = pricing?.find((p) => p.plan === "pro")?.per_student_fee ?? DEFAULT_PRO_RATE;

  // Safety net: if an authenticated user lands on the marketing page
  // (e.g. via OAuth callback that didn't reach /login), route them correctly.
  const { user, session, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (authLoading || !session || !user) return;
    if (!user.email_confirmed_at) return;

    let cancelled = false;
    (async () => {
      const { data: isPlatformAdmin } = await supabase.rpc('is_platform_admin');
      if (cancelled) return;
      if (isPlatformAdmin) { navigate("/platform", { replace: true }); return; }

      const { data: schoolAdmin } = await supabase
        .from('school_admins').select('school_id').eq('user_id', user.id).maybeSingle();
      if (cancelled) return;
      if (schoolAdmin) { navigate("/admin", { replace: true }); return; }

      const { data: staffMember } = await supabase
        .from('school_teachers').select('school_id, role')
        .eq('user_id', user.id).eq('is_active', true).maybeSingle();
      if (cancelled) return;
      if (staffMember) {
        const r = (staffMember as any).role || 'teacher';
        navigate(r === 'accountant' ? "/admin" : "/progress", { replace: true });
        return;
      }

      // Authenticated but no school yet → onboarding
      navigate("/onboard", { replace: true });
    })();
    return () => { cancelled = true; };
  }, [authLoading, session, user, navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/40 bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 pt-4 pb-2">
            <img src={edzenLogoFull} alt="EdZen AI" className="h-14 sm:h-16 object-contain" />
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">
              Features
            </a>
            <Link to="/about" className="hover:text-foreground transition-colors">
              About
            </Link>
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
              <Link
                to="/book-demo"
                aria-label="Book a demo call"
                className="inline-flex items-center justify-center h-12 min-w-[180px] text-base font-medium rounded-full border border-border/60 bg-transparent text-foreground hover:bg-muted/60 transition-all duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-ring/40 px-6"
              >
                Book a Demo
              </Link>
            </div>
          </div>

          {/* Right — Live Activity Mockup */}
          <div className="relative flex justify-center lg:justify-end">
            {/* Decorative glow */}
            <div className="absolute -inset-8 bg-gradient-to-tr from-primary/20 via-accent/10 to-transparent blur-3xl rounded-full opacity-60 pointer-events-none" />

            {/* Main phone-style card */}
            <div className="relative w-full max-w-sm">
              <Card className="rounded-3xl shadow-2xl shadow-primary/10 border-border/60 overflow-hidden bg-card">
                {/* Gradient header */}
                <div className="relative bg-gradient-to-br from-primary via-primary to-accent p-6 pb-8 text-primary-foreground">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                        <GraduationCap className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[11px] opacity-80">Welcome back</p>
                        <p className="text-sm font-semibold leading-tight">Aarav's Parent</p>
                      </div>
                    </div>
                    <Badge className="bg-white/20 hover:bg-white/20 text-white border-0 text-[10px] backdrop-blur">
                      <span className="h-1.5 w-1.5 rounded-full bg-status-paid mr-1.5 animate-pulse" />
                      Live
                    </Badge>
                  </div>
                  <p className="text-xs opacity-80 mb-1">Outstanding this term</p>
                  <p className="text-4xl font-extrabold tracking-tight">₹4,200</p>
                  <p className="text-xs opacity-80 mt-1">Due in 7 days · Auto-reminder set</p>
                </div>

                {/* Activity feed */}
                <CardContent className="p-5 space-y-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Recent activity
                  </p>

                  <ActivityRow
                    icon={CheckCircle2}
                    iconBg="bg-status-paid/10"
                    iconColor="text-status-paid"
                    title="Tuition Fee paid"
                    meta="UPI · 2 min ago"
                    amount="₹8,500"
                    amountClass="text-status-paid"
                  />

                  <ActivityRow
                    icon={Sparkles}
                    iconBg="bg-accent/10"
                    iconColor="text-accent"
                    title="AI flagged: Maths attention"
                    meta="Aarav · Class 7"
                    amount="View"
                    amountClass="text-accent"
                  />

                  <ActivityRow
                    icon={CalendarCheck}
                    iconBg="bg-primary/10"
                    iconColor="text-primary"
                    title="Attendance: Present"
                    meta="Today · 8:42 AM"
                    amount="98%"
                    amountClass="text-primary"
                  />

                  <div className="pt-2 mt-1 border-t border-border/50 flex items-center justify-between">
                    <p className="text-[11px] text-muted-foreground">WhatsApp updates ON</p>
                    <div className="flex items-center gap-1">
                      <div className="h-1.5 w-1.5 rounded-full bg-status-paid" />
                      <span className="text-[11px] font-medium text-status-paid">Synced</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Floating badge top-right */}
              <div className="absolute -top-3 -right-3 sm:-right-6 bg-card rounded-2xl shadow-xl border border-border/60 px-3.5 py-2.5 flex items-center gap-2 animate-fade-in">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground leading-tight">Saved this month</p>
                  <p className="text-sm font-bold leading-tight">12 hrs admin</p>
                </div>
              </div>

              {/* Floating badge bottom-left */}
              <div className="absolute -bottom-4 -left-3 sm:-left-6 bg-card rounded-2xl shadow-xl border border-border/60 px-3.5 py-2.5 flex items-center gap-2 animate-fade-in">
                <div className="h-8 w-8 rounded-xl bg-status-paid/10 flex items-center justify-center shrink-0">
                  <TrendingUp className="h-4 w-4 text-status-paid" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground leading-tight">Collection rate</p>
                  <p className="text-sm font-bold leading-tight text-status-paid">+38% ↑</p>
                </div>
              </div>
            </div>
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

      {/* ═══ SOLUTION — "One platform. Every workflow." ═══ */}
      <section className="py-20 md:py-28 px-4 sm:px-6 bg-gradient-to-b from-muted/30 via-background to-muted/30 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-1/4 -left-32 h-72 w-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -right-32 h-72 w-72 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center relative">
          {/* Visual — Stat grid mockup */}
          <div className="relative order-2 lg:order-1">
            <div className="grid grid-cols-2 gap-4">
              <StatTile
                icon={IndianRupee}
                label="Collected this month"
                value="₹3.2L"
                trend="+38%"
                accent="primary"
                tall
              />
              <div className="space-y-4">
                <StatTile icon={Users} label="Active students" value="487" trend="+12" accent="accent" />
                <StatTile icon={CalendarCheck} label="Avg attendance" value="94%" trend="+3%" accent="paid" />
              </div>
              <div className="col-span-2">
                <Card className="rounded-3xl border-border/60 shadow-lg overflow-hidden bg-gradient-to-br from-primary/[0.08] via-card to-accent/[0.08]">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                          <Brain className="h-4 w-4 text-white" />
                        </div>
                        <p className="text-sm font-semibold">AI Insight</p>
                      </div>
                      <Badge className="bg-accent/15 text-accent border-accent/20 text-[10px]">Just now</Badge>
                    </div>
                    <p className="text-sm leading-relaxed text-foreground/90">
                      <span className="font-semibold">3 students</span> in Class 7 show declining performance in Maths.
                      <span className="text-primary font-medium"> Recommend extra revision class.</span>
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Text */}
          <div className="order-1 lg:order-2">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 hover:bg-primary/15">
              <Sparkles className="h-3 w-3 mr-1.5" />
              Built for modern schools
            </Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 tracking-tight leading-tight">
              One platform.<br />
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Every workflow.
              </span>
            </h2>
            <p className="text-muted-foreground mb-8 leading-relaxed text-lg">
              From fee collection to attendance, parent updates to AI-powered student insights — replace 5 disconnected
              tools with one calm, intelligent dashboard.
            </p>

            <div className="space-y-4 mb-8">
              <FeatureRow icon={Zap} text="Set up your entire school in under 60 seconds" />
              <FeatureRow icon={MessageSquareWarning} text="Auto WhatsApp reminders for fees & updates" />
              <FeatureRow icon={Brain} text="AI flags at-risk students before report card day" />
              <FeatureRow icon={ShieldCheck} text="Parents view fees & progress — no app required" />
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Button size="lg" asChild className="h-12 shadow-md shadow-primary/20">
                <Link to="/signup?plan=pro">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-status-paid" />
                <span>30-day free trial · No card required</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ DASHBOARD SHOWCASE ═══ */}
      <section className="py-20 md:py-28 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          {/* Hero text above carousel */}
          <div className="text-center pb-5">
            <h2 className="text-[28px] font-bold text-foreground leading-tight">
              AI-Powered School Management with <span className="text-primary">WhatsApp Integration</span>
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Fee collection · AI insights · Parent updates · Bulk import
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-3">
              {["WhatsApp Reminders", "AI Chatbot", "Parent Portal", "Fee Reports", "Bulk Import", "AI Analysis"].map(
                (tag) => (
                  <span
                    key={tag}
                    className="text-xs px-3.5 py-1 rounded-full bg-[hsl(245_100%_97%)] text-primary border border-[hsl(262_52%_79%)]"
                  >
                    {tag}
                  </span>
                ),
              )}
            </div>
          </div>

          {/* Carousel — full width above text */}
          <DashboardCarousel />
          <p className="text-xs text-muted-foreground text-center mt-3">
            Trusted by schools across India · Zero setup fees · Import in minutes
          </p>

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
            <Link
              to="/book-demo"
              aria-label="Book a demo call"
              className="inline-flex items-center justify-center h-12 min-w-[160px] text-base font-medium rounded-full border border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 transition-all duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary-foreground/40 px-6"
            >
              Book a Demo
            </Link>
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
                <Link to="/about" className="block text-muted-foreground hover:text-foreground transition-colors">
                  About
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
                <Link to="/data-deletion" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Data Deletion
                </Link>
                <Link to="/edzenai-vs-entab" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Compare vs Entab &amp; Fedena
                </Link>
                <Link to="/nep-2020-school-software" className="block text-muted-foreground hover:text-foreground transition-colors">
                  NEP 2020 Software
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

      <Suspense fallback={null}>
        <LandingChatbot />
      </Suspense>
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
    <Card className="group rounded-2xl border-border/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
      <CardContent className="p-6">
        <div className="w-14 h-14 rounded-2xl bg-destructive/8 flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
          <Icon className="h-7 w-7 text-destructive/70" />
        </div>
        <h3 className="font-semibold text-base mb-1.5">{title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}

function ActivityRow({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  meta,
  amount,
  amountClass,
}: {
  icon: typeof CheckCircle2;
  iconBg: string;
  iconColor: string;
  title: string;
  meta: string;
  amount: string;
  amountClass: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0", iconBg)}>
        <Icon className={cn("h-4 w-4", iconColor)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight truncate">{title}</p>
        <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{meta}</p>
      </div>
      <span className={cn("text-sm font-bold shrink-0", amountClass)}>{amount}</span>
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  trend,
  accent,
  tall = false,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  trend: string;
  accent: "primary" | "accent" | "paid";
  tall?: boolean;
}) {
  const accentMap = {
    primary: { icon: "text-primary", bg: "bg-primary/10", trend: "text-primary" },
    accent: { icon: "text-accent", bg: "bg-accent/10", trend: "text-accent" },
    paid: { icon: "text-status-paid", bg: "bg-status-paid/10", trend: "text-status-paid" },
  }[accent];

  return (
    <Card className={cn("rounded-3xl border-border/60 shadow-md hover:shadow-lg transition-shadow", tall && "h-full")}>
      <CardContent className={cn("p-5 flex flex-col", tall && "h-full justify-between min-h-[200px]")}>
        <div className={cn("h-10 w-10 rounded-2xl flex items-center justify-center mb-4", accentMap.bg)}>
          <Icon className={cn("h-5 w-5", accentMap.icon)} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">{label}</p>
          <div className="flex items-baseline gap-2">
            <p className={cn("font-extrabold tracking-tight", tall ? "text-4xl" : "text-2xl")}>{value}</p>
            <span className={cn("text-xs font-semibold", accentMap.trend)}>{trend}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FeatureRow({ icon: Icon, text }: { icon: typeof Zap; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <p className="text-base text-foreground/90 pt-1.5 leading-snug">{text}</p>
    </div>
  );
}

import slide1 from "@/assets/slide-1.png";
import slide2 from "@/assets/slide-2.png";
import slide3 from "@/assets/slide-3.png";
import slide4 from "@/assets/slide-4.png";
import slide5 from "@/assets/slide-5.png";
import slide6 from "@/assets/slide-6.png";
import slide7 from "@/assets/slide-7.png";
import slide8 from "@/assets/slide-8.png";
import slide9 from "@/assets/slide-9.png";
import slide10 from "@/assets/slide-10.png";

const dashboardSlides: { image: string; label: string }[] = [
  { image: slide1, label: "Online Payment Proof Verification" },
  { image: slide2, label: "Instant Payment Proof Updates" },
  { image: slide3, label: "Monthly Fee Collection Report" },
  { image: slide4, label: "Bulk WhatsApp Fee Reminders" },
  { image: slide5, label: "Student Fees with AI Chatbot" },
  { image: slide6, label: "Student List & WhatsApp Messaging" },
  { image: slide7, label: "Daily Attendance" },
  { image: slide8, label: "WhatsApp Notification to Parents" },
  { image: slide9, label: "Parent Portal — Fees, Progress & Attendance" },
  { image: slide10, label: "AI Analysis for Students" },
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
    <div className="flex flex-col items-center gap-5 w-full max-w-[900px] mx-auto">
      <div className="gradient-border-wrapper w-full">
        <Carousel
          setApi={setApi}
          opts={{ loop: true }}
          plugins={[Autoplay({ delay: 3000, stopOnInteraction: false, stopOnMouseEnter: true })]}
          className="w-full bg-background rounded-xl"
        >
          <CarouselContent>
            {dashboardSlides.map((slide) => (
              <CarouselItem key={slide.label}>
                <div className="w-full max-h-[520px] overflow-hidden">
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
      </div>
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
