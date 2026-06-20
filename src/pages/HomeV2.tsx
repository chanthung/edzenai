import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import edzenLogoFull from "@/assets/edzen-logo-full.png";
import dashboardShowcase from "@/assets/dashboard-showcase.png";
import dashboardOverview from "@/assets/dashboard-overview.png";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Users,
  IndianRupee,
  CalendarCheck,
  BarChart3,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  Smartphone,
  Brain,
  Upload,
  Lock,
  CheckCircle2,
  Receipt,
  BookOpen,
} from "lucide-react";

const ROTATING_WORDS = ["Simplify.", "Connect.", "Succeed."] as const;

export default function HomeV2() {
  usePageMeta({
    title: "EdZen AI — School Management, Reimagined",
    description:
      "Unify admissions, fees, attendance, and progress in one AI-powered platform — built for Indian schools.",
    canonical: "/home-v2",
  });

  // noindex this alternate landing until promoted
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => {
      document.head.removeChild(meta);
    };
  }, []);

  const [wordIndex, setWordIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setWordIndex((i) => (i + 1) % ROTATING_WORDS.length), 2400);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation (mirrors Index.tsx) */}
      <nav className="border-b border-border/40 bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 pt-4 pb-2">
            <Link to="/">
              <img src={edzenLogoFull} alt="EdZen AI" className="h-14 sm:h-16 object-contain" />
            </Link>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">Features</Link>
            <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
            <Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
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
      <section className="relative py-20 md:py-28 px-4 sm:px-6 overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.10),transparent_60%)]"
        />
        <div className="relative max-w-5xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border/60 bg-card/60 backdrop-blur text-xs font-medium text-muted-foreground mb-8">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            AI-Powered School ERP
          </span>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05]">
            <span className="block text-foreground/90">School Management,</span>
            <span className="block text-foreground/90">Reimagined to</span>
            <span
              key={wordIndex}
              aria-live="polite"
              className="block bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent animate-fade-in"
            >
              {ROTATING_WORDS[wordIndex]}
            </span>
          </h1>

          <p className="mt-7 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Unify admissions, fees, attendance, and progress in one AI-powered platform —
            built for Indian schools.
          </p>

          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" asChild className="min-w-[200px] h-12 text-base shadow-md shadow-primary/20">
              <Link to="/signup?plan=pro">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="min-w-[200px] h-12 text-base rounded-full">
              <Link to="/book-demo">Book a Demo</Link>
            </Button>
          </div>

          {/* Stacked product previews */}
          <div className="relative mt-16 mx-auto max-w-4xl">
            <div className="relative rounded-3xl border border-border/60 bg-card shadow-floating overflow-hidden">
              <img
                src={dashboardShowcase}
                alt="EdZen AI dashboard preview"
                loading="lazy"
                className="w-full h-auto object-cover"
              />
            </div>
            <div className="hidden sm:block absolute -bottom-10 -right-6 w-56 md:w-72 rounded-2xl border border-border/60 bg-card shadow-floating overflow-hidden rotate-3">
              <img
                src={dashboardOverview}
                alt="EdZen AI overview"
                loading="lazy"
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ MARQUEE ═══ */}
      <section className="py-14 border-y border-border/40 bg-muted/30">
        <p className="text-center text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase mb-6">
          Trusted capabilities, in one platform
        </p>
        <div
          className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]"
          role="list"
          aria-label="Platform capabilities"
        >
          <div className="flex w-max gap-3 animate-marquee hover:[animation-play-state:paused] motion-reduce:animate-none">
            {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
              <MarqueePill key={i} icon={item.icon} label={item.label} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SOLUTIONS GRID ═══ */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
              Everything your school runs on
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Six connected modules — built around the way Indian schools actually work.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SOLUTIONS.map((s) => (
              <SolutionCard key={s.title} {...s} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="px-4 sm:px-6 pb-24">
        <div className="max-w-5xl mx-auto rounded-3xl bg-gradient-to-br from-primary via-primary to-accent p-10 md:p-16 text-center text-primary-foreground shadow-floating">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
            Ready to simplify your school?
          </h2>
          <p className="text-base md:text-lg text-primary-foreground/85 max-w-xl mx-auto mb-8">
            Join schools using EdZen AI to cut admin work and give parents real-time clarity.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" asChild variant="secondary" className="min-w-[200px] h-12 text-base">
              <Link to="/signup?plan=pro">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              asChild
              variant="outline"
              className="min-w-[200px] h-12 text-base rounded-full bg-transparent border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <Link to="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER (mirrors Index.tsx) ═══ */}
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
                <Link to="/" className="block text-muted-foreground hover:text-foreground transition-colors">Features</Link>
                <Link to="/about" className="block text-muted-foreground hover:text-foreground transition-colors">About</Link>
                <Link to="/pricing" className="block text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
                <Link to="/login" className="block text-muted-foreground hover:text-foreground transition-colors">School Portal</Link>
              </nav>
            </div>
            <div>
              <p className="font-semibold text-sm mb-3 uppercase tracking-wider text-muted-foreground">Legal</p>
              <nav className="space-y-2 text-sm">
                <Link to="/privacy" className="block text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link>
                <Link to="/terms" className="block text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link>
                <Link to="/contact" className="block text-muted-foreground hover:text-foreground transition-colors">Contact Support</Link>
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

/* ───────────── Helpers ───────────── */

const MARQUEE_ITEMS: { icon: typeof ShieldCheck; label: string }[] = [
  { icon: ShieldCheck, label: "NEP 2020 Compliant" },
  { icon: MessageSquare, label: "WhatsApp-First Communication" },
  { icon: IndianRupee, label: "UPI / Razorpay Payments" },
  { icon: Brain, label: "AI Progress Reports" },
  { icon: CalendarCheck, label: "Attendance Tracking" },
  { icon: Lock, label: "Multi-School RLS Security" },
  { icon: Smartphone, label: "Parent No-Login Access" },
  { icon: Upload, label: "Bulk Student Import" },
  { icon: Receipt, label: "Email + SMS Reminders" },
  { icon: CheckCircle2, label: "Token-Based Sharing" },
];

function MarqueePill({ icon: Icon, label }: { icon: typeof ShieldCheck; label: string }) {
  return (
    <div
      role="listitem"
      className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-border/60 bg-card/80 backdrop-blur text-sm font-medium text-foreground/80"
    >
      <Icon className="h-4 w-4 text-primary" />
      {label}
    </div>
  );
}

const SOLUTIONS: { icon: typeof Users; title: string; description: string; to?: string }[] = [
  {
    icon: Users,
    title: "Student Management",
    description: "Single source of truth for student records, families, and class rosters.",
  },
  {
    icon: IndianRupee,
    title: "Fee Collection",
    description: "Transparent fee plans with UPI, payment proofs, and real-time parent visibility.",
    to: "/fee-collection-software-schools-india",
  },
  {
    icon: CalendarCheck,
    title: "Attendance",
    description: "Tap-to-mark daily attendance with timestamped records for every class.",
  },
  {
    icon: BarChart3,
    title: "Academic Progress",
    description: "NEP 2020-aligned assessments, competencies, and printable report cards.",
    to: "/nep-2020-school-software",
  },
  {
    icon: MessageSquare,
    title: "Parent Communication",
    description: "WhatsApp-first reminders and a no-login parent portal via secure token links.",
  },
  {
    icon: Brain,
    title: "AI Insights",
    description: "Identify at-risk students and surface trend-based recommendations automatically.",
  },
];

function SolutionCard({
  icon: Icon,
  title,
  description,
  to,
}: {
  icon: typeof Users;
  title: string;
  description: string;
  to?: string;
}) {
  const inner = (
    <div className="h-full rounded-2xl border border-border/60 bg-card p-6 hover:shadow-elevated hover:border-primary/30 transition-all group">
      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/15 transition-colors">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed mb-3">{description}</p>
      {to && (
        <span className="inline-flex items-center text-sm font-medium text-primary group-hover:gap-1.5 gap-1 transition-all">
          Learn more <ArrowRight className="h-3.5 w-3.5" />
        </span>
      )}
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}
