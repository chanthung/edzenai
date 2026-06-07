import { Link } from "react-router-dom";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, Wallet, Sparkles, Flag, School, MessageCircle, ShieldCheck, Quote } from "lucide-react";
import edzenLogoFull from "@/assets/edzen-logo-full.png";

export default function About() {
  usePageMeta({
    title: "About EdZen AI – Built for Schools. Powered by AI.",
    description:
      "EdZen AI was created to simplify school management for every principal, teacher, and parent across India — AI-powered automation for schools of every size.",
    canonical: "/about",
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/40 bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 pt-4 pb-2">
            <img src={edzenLogoFull} alt="EdZen AI" className="h-14 sm:h-16 object-contain" />
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link to="/#features" className="hover:text-foreground transition-colors">
              Features
            </Link>
            <Link to="/about" className="text-foreground transition-colors">
              About
            </Link>
            <Link to="/pricing" className="hover:text-foreground transition-colors">
              Pricing
            </Link>
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

      {/* Hero */}
      <section className="py-20 sm:py-28 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground">
            Built for Schools.{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Powered by AI.
            </span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-muted-foreground leading-relaxed">
            EdZen AI was created to simplify school management for every principal, teacher, and parent across India.
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-5">Our Story</h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Managing a school shouldn't mean drowning in paperwork, chasing fee payments, or spending hours on Excel
            sheets. EdZen AI was built to change that — bringing AI-powered automation to schools of every size, across
            India.
          </p>
        </div>
      </section>

      {/* What We Do */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">What We Do</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              icon={GraduationCap}
              title="Student Management"
              description="Import, manage and track every student record with zero manual effort."
            />
            <FeatureCard
              icon={Wallet}
              title="Fee Collection"
              description="Automated fee tracking, payment proof, and WhatsApp reminders — all in one place."
            />
            <FeatureCard
              icon={Sparkles}
              title="AI Insights"
              description="Real-time AI analysis for fees, attendance, and student progress — available instantly."
            />
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="relative rounded-2xl bg-secondary/60 border-l-4 border-primary p-8 sm:p-10">
            <Quote className="absolute top-4 right-4 h-8 w-8 text-primary/30" />
            <p className="text-xl sm:text-2xl font-medium text-foreground leading-snug italic">
              "To make world-class school management tools accessible to every school in India — regardless of size or
              budget."
            </p>
            <p className="mt-4 text-sm uppercase tracking-wider text-muted-foreground font-semibold">— Our Mission</p>
          </div>
        </div>
      </section>

      {/* Built With */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">Built With Purpose</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <BuiltWithItem icon={Flag} label="Made in India" />
            <BuiltWithItem icon={School} label="Designed for Indian Schools" />
            <BuiltWithItem icon={MessageCircle} label="WhatsApp-first approach" />
            <BuiltWithItem icon={ShieldCheck} label="Secure & private student data" />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-3xl bg-gradient-to-br from-primary to-accent p-10 sm:p-14 text-center text-primary-foreground shadow-lg">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to simplify your school?</h2>
            <p className="text-primary-foreground/80 mb-8 text-base sm:text-lg">
              Join schools across India saving hours every week with EdZen AI.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" variant="secondary">
                <Link to="/signup?plan=pro">Start Free Trial</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="bg-transparent border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                <Link to="/contact">Contact Us</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
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
                <Link to="/#features" className="block text-muted-foreground hover:text-foreground transition-colors">
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

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <Card className="h-full transition-smooth hover:shadow-[var(--shadow-md)]">
      <CardContent className="p-7">
        <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-5">
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}

function BuiltWithItem({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-4">
      <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <Icon className="h-5 w-5" />
      </div>
      <span className="font-medium text-foreground">{label}</span>
    </div>
  );
}
