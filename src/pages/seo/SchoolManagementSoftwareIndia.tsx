import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Check,
  X,
  IndianRupee,
  MessageCircle,
  Brain,
  CalendarCheck,
  FileText,
  BarChart3,
  ShieldCheck,
  GraduationCap,
  Building2,
  Calculator,
  Sparkles,
} from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import edzenLogoFull from "@/assets/edzen-logo-full.png";

const FAQS = [
  {
    q: "Which is the best school management software in India for 2026?",
    a: "EdZen AI is purpose-built for Indian private schools — supporting CBSE, ICSE, ISC and all State Boards with NEP 2020-aligned report cards, UPI fee collection, and a no-app WhatsApp parent portal. Schools can be live in under a day with a 30-day free Pro trial, no credit card required.",
  },
  {
    q: "Does EdZen AI support CBSE, ICSE and State Board report cards?",
    a: "Yes. EdZen AI ships NEP 2020-compliant assessment templates for the 5+3+3+4 structure and supports CBSE, ICSE, ISC and all State Boards. Report cards are fully customisable and can be printed to PDF in A4 format.",
  },
  {
    q: "Do parents need to install an app?",
    a: "No. Parents receive a private, secure link over WhatsApp and view fees, attendance, marks and report cards in any browser — no app install, no login. Works on low-end Android phones with patchy networks.",
  },
  {
    q: "How is data security handled?",
    a: "Each school's data is fully isolated using PostgreSQL Row-Level Security. Parent links use unguessable tokens, payments are processed via Razorpay/UPI, and the platform follows industry-standard encryption in transit and at rest.",
  },
  {
    q: "Can we switch from Entab, Fedena or Edunext?",
    a: "Yes. EdZen AI includes AI-powered Excel import that maps your existing student rosters, fee structures and historical marks automatically. Most schools complete migration within a single working day.",
  },
  {
    q: "Is the pricing affordable for small schools?",
    a: "Yes. Starter is ₹7 per student per month with basic features for small schools. Pro is ₹10 per student per month and includes the full AI-powered intelligence suite with a 30-day free trial — predictable and affordable for Tier 2 and Tier 3 schools.",
  },
];

const FEATURES = [
  { icon: IndianRupee, title: "UPI fee collection", body: "Auto-reconciled UPI payments with one-tap deep links for parents." },
  { icon: MessageCircle, title: "WhatsApp reminders", body: "Automated fee reminders and parent updates on WhatsApp — no app needed." },
  { icon: FileText, title: "NEP 2020 report cards", body: "Ready templates for CBSE, ICSE, ISC and State Boards aligned to 5+3+3+4." },
  { icon: Brain, title: "AI at-risk monitoring", body: "Spot students who need support before grades slip with AI insights." },
  { icon: CalendarCheck, title: "Daily attendance", body: "Tap-to-toggle attendance with parent visibility and trend reports." },
  { icon: BarChart3, title: "Marks & competencies", body: "Term-wise marks entry plus competency tracking on a 4-level scale." },
];

const AUDIENCES = [
  { icon: Building2, title: "School Principals", body: "Run a Tier 2 / Tier 3 school with a single dashboard for fees, academics and parent comms." },
  { icon: Calculator, title: "Accountants", body: "Auto-reconcile UPI, send polite WhatsApp reminders, and close the books faster every month." },
  { icon: GraduationCap, title: "Teachers", body: "Enter marks once, generate report cards instantly, and share progress with parents in two taps." },
];

const COMPARISON = [
  { row: "Setup time", us: "Under 1 day", entab: "Weeks", fedena: "Days", edunext: "Days" },
  { row: "WhatsApp parent portal (no app install)", us: true, entab: false, fedena: false, edunext: false },
  { row: "UPI auto-reconciliation", us: true, entab: false, fedena: false, edunext: false },
  { row: "NEP 2020 report card templates", us: true, entab: true, fedena: false, edunext: false },
  { row: "AI at-risk insights", us: true, entab: false, fedena: false, edunext: false },
  { row: "Pricing model", us: "₹7 (Starter) / ₹10 (Pro) per student / mo", entab: "Quote-based", fedena: "Per-user license", edunext: "Quote-based" },
  { row: "Free trial", us: "30 days, no card", entab: false, fedena: "Limited", edunext: false },
];

function Cell({ value }: { value: string | boolean }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check className="h-5 w-5 text-emerald-600 mx-auto" aria-label="Yes" />
    ) : (
      <X className="h-5 w-5 text-muted-foreground/50 mx-auto" aria-label="No" />
    );
  }
  return <span className="text-sm">{value}</span>;
}

export default function SchoolManagementSoftwareIndia() {
  usePageMeta({
    title: "Best School Management Software in India 2026 | EdZen AI",
    description:
      "EdZen AI — UPI fee collection, WhatsApp parent portal, NEP 2020 report cards & AI insights for CBSE/ICSE/State-board schools. 30-day free trial, no credit card.",
    canonical: "/school-management-software-india",
  });

  // JSON-LD: FAQPage + SoftwareApplication
  useEffect(() => {
    const faq = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQS.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    };
    const product = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "EdZen AI",
      description:
        "School management SaaS for Indian private schools — UPI fee collection, WhatsApp parent portal, NEP 2020 report cards and AI insights.",
      url: "https://edzenai.com/school-management-software-india",
      applicationCategory: "EducationalApplication",
      applicationSubCategory: "School Management Software",
      operatingSystem: "Web, Android, iOS",
      offers: {
        "@type": "AggregateOffer",
        lowPrice: "7",
        highPrice: "10",
        priceCurrency: "INR",
      },
      audience: {
        "@type": "Audience",
        audienceType: "School principals, teachers, accountants, India private schools",
      },
      inLanguage: ["en", "hi"],
      areaServed: "IN",
    };
    const tags: HTMLScriptElement[] = [];
    [faq, product].forEach((obj) => {
      const s = document.createElement("script");
      s.type = "application/ld+json";
      s.text = JSON.stringify(obj);
      s.dataset.seoPage = "school-management-software-india";
      document.head.appendChild(s);
      tags.push(s);
    });
    return () => tags.forEach((t) => t.remove());
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      {/* Minimal nav */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/70 border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img src={edzenLogoFull} alt="EdZen AI" className="h-10 sm:h-12 w-auto" />
          </Link>
          <nav className="flex items-center gap-2 sm:gap-4">
            <Link to="/pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground hidden sm:inline">Pricing</Link>
            <Link to="/contact" className="text-sm font-medium text-muted-foreground hover:text-foreground hidden sm:inline">Contact</Link>
            <Button asChild size="sm" variant="ghost"><Link to="/login">Sign in</Link></Button>
            <Button asChild size="sm"><Link to="/signup">Start free</Link></Button>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="px-4 pt-16 pb-20">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-5 bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Built for Indian schools · 2026
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              Best School Management Software in India
            </h1>
            <p className="mt-5 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              EdZen AI runs fees, attendance, NEP 2020 report cards and parent communication for CBSE,
              ICSE and State Board private schools — without the bloat or yearly contracts.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" className="rounded-xl">
                <Link to="/signup">Start 30-day free trial <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-xl">
                <Link to="/book-demo">Book a demo</Link>
              </Button>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 justify-center text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-600" /> No credit card</span>
              <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-600" /> Setup in 1 day</span>
              <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-600" /> WhatsApp parent portal</span>
            </div>
          </div>
        </section>

        {/* What is EdZen AI */}
        <section className="px-4 py-16 bg-background">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <h2 className="text-3xl sm:text-4xl font-bold">What is EdZen AI?</h2>
              <p className="mt-3 text-muted-foreground">
                A modern, cloud-based school management platform that replaces fragmented spreadsheets,
                WhatsApp groups and legacy ERPs with one calm dashboard.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {FEATURES.map((f) => (
                <Card key={f.title} className="rounded-2xl border-border/60">
                  <CardContent className="p-6">
                    <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                      <f.icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-semibold text-lg">{f.title}</h3>
                    <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Who it's for */}
        <section className="px-4 py-16">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl sm:text-4xl font-bold">Who it's for</h2>
              <p className="mt-3 text-muted-foreground">Designed around the day-to-day of an Indian private school.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {AUDIENCES.map((a) => (
                <Card key={a.title} className="rounded-2xl border-border/60">
                  <CardContent className="p-6">
                    <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                      <a.icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-semibold text-lg">{a.title}</h3>
                    <p className="mt-1.5 text-sm text-muted-foreground">{a.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing snapshot */}
        <section className="px-4 py-16 bg-background">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl sm:text-4xl font-bold">Simple, predictable pricing</h2>
              <p className="mt-3 text-muted-foreground">No hidden setup fees. No annual lock-ins.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
              <Card className="rounded-2xl border-border/60">
                <CardContent className="p-6">
                  <div className="text-sm font-medium text-muted-foreground">Starter</div>
                  <div className="mt-2 text-3xl font-bold">₹7<span className="text-base font-normal text-muted-foreground">/student/mo</span></div>
                  <p className="mt-1 text-sm text-muted-foreground">Basic features for small schools</p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-2 border-primary shadow-lg">
                <CardContent className="p-6">
                  <div className="text-sm font-medium text-primary">Pro · Most popular</div>
                  <div className="mt-2 text-3xl font-bold">₹10<span className="text-base font-normal text-muted-foreground">/student/mo</span></div>
                  <p className="mt-1 text-sm text-muted-foreground">Full AI-powered intelligence suite · 30-day free trial included</p>
                </CardContent>
              </Card>
            </div>
            <div className="text-center mt-8">
              <Button asChild variant="outline" className="rounded-xl"><Link to="/pricing">See full pricing <ArrowRight className="h-4 w-4" /></Link></Button>
            </div>
          </div>
        </section>

        {/* Comparison */}
        <section className="px-4 py-16">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl sm:text-4xl font-bold">EdZen AI vs Entab, Fedena, Edunext</h2>
              <p className="mt-3 text-muted-foreground">A factual side-by-side on what matters to Indian schools.</p>
            </div>
            <Card className="rounded-2xl overflow-hidden border-border/60">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/50">
                    <tr>
                      <th className="text-left p-4 font-semibold">Capability</th>
                      <th className="p-4 font-semibold text-primary">EdZen AI</th>
                      <th className="p-4 font-semibold">Entab</th>
                      <th className="p-4 font-semibold">Fedena</th>
                      <th className="p-4 font-semibold">Edunext</th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARISON.map((r) => (
                      <tr key={r.row} className="border-t border-border/60">
                        <td className="p-4 font-medium">{r.row}</td>
                        <td className="p-4 text-center bg-primary/5"><Cell value={r.us} /></td>
                        <td className="p-4 text-center"><Cell value={r.entab} /></td>
                        <td className="p-4 text-center"><Cell value={r.fedena} /></td>
                        <td className="p-4 text-center"><Cell value={r.edunext} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </section>

        {/* Free trial */}
        <section className="px-4 py-16 bg-background">
          <div className="max-w-3xl mx-auto text-center">
            <ShieldCheck className="h-12 w-12 mx-auto text-primary mb-4" />
            <h2 className="text-3xl sm:text-4xl font-bold">Try Pro free for 30 days</h2>
            <p className="mt-3 text-muted-foreground">
              Full access to AI insights, NEP 2020 report cards, WhatsApp parent portal and Excel import.
              No credit card. Cancel anytime.
            </p>
            <Button asChild size="lg" className="mt-7 rounded-xl">
              <Link to="/signup">Start your free trial <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </section>

        {/* FAQ */}
        <section className="px-4 py-16">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-10">Frequently asked questions</h2>
            <Accordion type="single" collapsible className="space-y-3">
              {FAQS.map((f, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="bg-background rounded-2xl border border-border/60 px-5">
                  <AccordionTrigger className="text-left font-semibold hover:no-underline">{f.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-4 py-20">
          <div className="max-w-4xl mx-auto rounded-3xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-10 sm:p-14 text-center shadow-xl">
            <h2 className="text-3xl sm:text-4xl font-bold">Ready to run a calmer school?</h2>
            <p className="mt-3 text-primary-foreground/85 max-w-xl mx-auto">
              Join Indian private schools modernising fee collection, parent communication and academics with EdZen AI.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" variant="secondary" className="rounded-xl">
                <Link to="/signup">Start 30-day free trial</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-xl bg-transparent border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                <Link to="/book-demo">Book a demo</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/50 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <div>© {new Date().getFullYear()} EdZen AI. All rights reserved.</div>
          <div className="flex gap-5">
            <Link to="/pricing" className="hover:text-foreground">Pricing</Link>
            <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link to="/terms" className="hover:text-foreground">Terms</Link>
            <Link to="/contact" className="hover:text-foreground">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
