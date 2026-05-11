import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Check,
  X,
  IndianRupee,
  MessageCircle,
  Smartphone,
  Bell,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Layers,
  BarChart3,
  Users,
  CalendarClock,
  FileCheck2,
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
    q: "Do parents need to install an app to pay school fees?",
    a: "No. Parents receive a private WhatsApp link that opens their fee dues in any browser — no app, no login. They tap to pay via UPI on their existing GPay, PhonePe, Paytm or BHIM app.",
  },
  {
    q: "Which UPI apps are supported for fee payments?",
    a: "Every Indian UPI app. EdZen AI generates a standard upi://pay deep-link with the school's VPA, amount and installment reference, so parents can pay using GPay, PhonePe, Paytm, BHIM, Amazon Pay, or any bank UPI app.",
  },
  {
    q: "Do you charge per-transaction fees on UPI payments?",
    a: "No. UPI payments go directly from parent to school via the school's own VPA — there is no payment gateway in between, so there are no per-transaction cuts on fee collection.",
  },
  {
    q: "How are fee reminders sent to parents?",
    a: "Reminders are sent automatically over WhatsApp at 8 AM IST: 5 days before the due date, on the due date, and 1 day after if still unpaid. Schools can also bulk-share parent links with built-in throttling.",
  },
  {
    q: "Can parents pay school fees in installments?",
    a: "Yes. EdZen AI supports flexible fee structures — annual one-shot, term-wise, or monthly installments. You can also add optional categories like transport, lab or exam fees, and group siblings under a single parent phone.",
  },
  {
    q: "Is payment proof verification automatic?",
    a: "Parents upload a UPI screenshot or photo of the payment receipt directly from the parent portal. The admin sees a clear preview and one-tap approve/reject. Once approved, fee status flips from Pending to Paid automatically — derived live from the payment record, never stale.",
  },
];

const STEPS = [
  { icon: Layers, title: "1. Set fee structure", body: "Configure annual or monthly installments per class, with optional categories like transport, lab or exam." },
  { icon: MessageCircle, title: "2. Share parent link", body: "Send each family a private WhatsApp link — no app install, no login. Bulk share supported." },
  { icon: Smartphone, title: "3. Parent pays via UPI", body: "One tap opens GPay / PhonePe / Paytm pre-filled with school VPA, amount and reference." },
  { icon: FileCheck2, title: "4. Verify proof", body: "Parent uploads receipt; admin approves; status auto-updates to Paid in real time." },
];

const FLEX_FEES = [
  { icon: CalendarClock, title: "Annual or monthly", body: "Flat annual fee or split into term-wise / monthly installments per class." },
  { icon: Layers, title: "Optional categories", body: "Add transport, lab, exam or any custom category — mark them optional or compulsory." },
  { icon: Users, title: "Sibling grouping", body: "Family fees grouped automatically by shared parent phone — one link covers all kids." },
  { icon: ReceiptText, title: "Auto-assignment", body: "Set up fees once; new students get the right structure assigned retroactively." },
];

const REPORTING = [
  { icon: BarChart3, title: "Collection rate", body: "Live collection % by class, category and academic year — capped at 100%, never inflated." },
  { icon: Bell, title: "Overdue list", body: "Filter dues by class or by parent — send a follow-up WhatsApp in two taps." },
  { icon: ReceiptText, title: "Payment history", body: "Per-student ledger with installment breakdown, dates and uploaded proofs." },
  { icon: ShieldCheck, title: "Anomaly detection", body: "AI flags unusual collection drops or duplicate payments before they become a problem." },
];

const COMPARISON = [
  { row: "Parent app required", us: "No — opens in WhatsApp + browser", legacy: "Yes — separate app install" },
  { row: "UPI deep-link payment", us: true, legacy: false },
  { row: "WhatsApp reminders included", us: true, legacy: false },
  { row: "Per-transaction gateway fees", us: "₹0 (direct UPI)", legacy: "1.5–2% per payment" },
  { row: "Payment proof verification", us: "In-app, one-tap approve", legacy: "Manual / email" },
  { row: "Setup time", us: "Under 1 day", legacy: "Weeks" },
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

export default function FeeCollectionSoftwareIndia() {
  usePageMeta({
    title: "School Fee Collection Software with UPI & WhatsApp | EdZen AI",
    description:
      "Collect school fees via UPI deep-link and WhatsApp — no parent app, no transaction fees. Auto reminders, payment proof verification, flexible installments. 30-day free trial.",
    canonical: "/fee-collection-software-schools-india",
  });

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
      name: "EdZen AI — Fee Collection",
      description:
        "School fee collection software for Indian schools — UPI deep-link payments, WhatsApp reminders, payment proof verification and flexible installments.",
      url: "https://edzenai.com/fee-collection-software-schools-india",
      applicationCategory: "FinanceApplication",
      applicationSubCategory: "School Fee Collection Software",
      operatingSystem: "Web, Android, iOS",
      offers: {
        "@type": "AggregateOffer",
        lowPrice: "7",
        highPrice: "10",
        priceCurrency: "INR",
      },
      audience: {
        "@type": "Audience",
        audienceType: "School principals, accountants, India private schools",
      },
      inLanguage: ["en", "hi"],
      areaServed: "IN",
    };
    const tags: HTMLScriptElement[] = [];
    [faq, product].forEach((obj) => {
      const s = document.createElement("script");
      s.type = "application/ld+json";
      s.text = JSON.stringify(obj);
      s.dataset.seoPage = "fee-collection-software-schools-india";
      document.head.appendChild(s);
      tags.push(s);
    });
    return () => tags.forEach((t) => t.remove());
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
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
              <Sparkles className="h-3.5 w-3.5 mr-1.5" /> UPI + WhatsApp · Built for India
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              School Fee Collection Software with UPI & WhatsApp
            </h1>
            <p className="mt-5 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Collect school fees in minutes — parents pay via UPI from any app, get gentle WhatsApp reminders,
              and upload proof in one tap. Zero gateway fees. Zero parent app installs.
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
              <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-600" /> Works with every UPI app</span>
              <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-600" /> Auto WhatsApp reminders</span>
              <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-600" /> No parent app install</span>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="px-4 py-16 bg-background">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <h2 className="text-3xl sm:text-4xl font-bold">How fee collection works</h2>
              <p className="mt-3 text-muted-foreground">From setup to settled — four simple steps.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {STEPS.map((s) => (
                <Card key={s.title} className="rounded-2xl border-border/60">
                  <CardContent className="p-6">
                    <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                      <s.icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-semibold text-lg">{s.title}</h3>
                    <p className="mt-1.5 text-sm text-muted-foreground">{s.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* UPI deep-link */}
        <section className="px-4 py-16">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8 items-center">
            <div>
              <Badge className="mb-3 bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">UPI deep-link</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold">One tap. Any UPI app. Zero gateway fees.</h2>
              <p className="mt-4 text-muted-foreground">
                EdZen AI generates a standard <code className="px-1.5 py-0.5 rounded bg-secondary text-foreground text-sm">upi://pay</code> deep-link
                pre-filled with your school's VPA, the exact installment amount and a reference. Parents tap it
                and their default UPI app — GPay, PhonePe, Paytm, BHIM or any bank app — opens ready to pay.
              </p>
              <ul className="mt-5 space-y-2 text-sm">
                <li className="flex gap-2"><Check className="h-5 w-5 text-emerald-600 shrink-0" /> Works on every Indian UPI app</li>
                <li className="flex gap-2"><Check className="h-5 w-5 text-emerald-600 shrink-0" /> No payment gateway, no per-transaction cut</li>
                <li className="flex gap-2"><Check className="h-5 w-5 text-emerald-600 shrink-0" /> Money lands directly in the school's bank</li>
              </ul>
            </div>
            <Card className="rounded-2xl border-border/60 bg-background">
              <CardContent className="p-6">
                <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Generated link</div>
                <div className="font-mono text-xs sm:text-sm break-all bg-secondary rounded-xl p-4">
                  upi://pay?pa=school@hdfcbank&pn=Stepping%20Stones&am=12500&cu=INR&tn=Term-1%20Fees
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <IndianRupee className="h-4 w-4 text-primary" />
                  Pre-filled amount, school name, term reference
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* WhatsApp reminders */}
        <section className="px-4 py-16 bg-background">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8 items-center">
            <Card className="rounded-2xl border-border/60 order-2 md:order-1">
              <CardContent className="p-6 space-y-3">
                {[
                  { when: "5 days before due", text: "Friendly heads-up with parent link." },
                  { when: "On due date", text: "Reminder with one-tap UPI link." },
                  { when: "1 day after", text: "Polite follow-up if still unpaid." },
                ].map((r) => (
                  <div key={r.when} className="flex items-start gap-3 p-3 rounded-xl bg-secondary/50">
                    <Bell className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <div className="font-medium text-sm">{r.when}</div>
                      <div className="text-sm text-muted-foreground">{r.text}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <div className="order-1 md:order-2">
              <Badge className="mb-3 bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">WhatsApp reminders</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold">Automated, polite, on time.</h2>
              <p className="mt-4 text-muted-foreground">
                Reminders go out automatically every morning at 8 AM IST — five days before the due date, on the
                day, and once after. Sent over WhatsApp through our verified business number, so parents see a
                familiar channel they already use. Bulk parent-link sharing is throttled to keep delivery clean.
              </p>
            </div>
          </div>
        </section>

        {/* Proof verification */}
        <section className="px-4 py-16">
          <div className="max-w-5xl mx-auto text-center">
            <Badge className="mb-3 bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">Proof verification</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold">Payment proof in, fee status updated.</h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              Once a parent pays, they upload a UPI screenshot or receipt photo from the parent portal. Your admin
              sees a clear preview, taps Approve, and the student's fee status flips from Pending to Paid instantly.
              Status is derived live from the payment record — never stale, never out of sync.
            </p>
            <div className="mt-8 grid sm:grid-cols-3 gap-4 text-left max-w-3xl mx-auto">
              {[
                { title: "Parent uploads", body: "Screenshot or receipt from the no-login parent portal." },
                { title: "Admin verifies", body: "One-tap approve or reject from the dashboard." },
                { title: "Status auto-updates", body: "Pending → Paid, derived live across reports." },
              ].map((s) => (
                <Card key={s.title} className="rounded-2xl border-border/60">
                  <CardContent className="p-5">
                    <h3 className="font-semibold">{s.title}</h3>
                    <p className="mt-1.5 text-sm text-muted-foreground">{s.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Flexible fees */}
        <section className="px-4 py-16 bg-background">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl sm:text-4xl font-bold">Flexible fee structures</h2>
              <p className="mt-3 text-muted-foreground">Built for the way Indian schools actually charge.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {FLEX_FEES.map((f) => (
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

        {/* Reporting */}
        <section className="px-4 py-16">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl sm:text-4xl font-bold">Reporting & reconciliation</h2>
              <p className="mt-3 text-muted-foreground">Close the books faster, every month.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {REPORTING.map((f) => (
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

        {/* Comparison */}
        <section className="px-4 py-16 bg-background">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl sm:text-4xl font-bold">EdZen AI vs gateway-based fee software</h2>
              <p className="mt-3 text-muted-foreground">Direct UPI beats wrapped gateways for Indian schools.</p>
            </div>
            <Card className="rounded-2xl overflow-hidden border-border/60">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/50">
                    <tr>
                      <th className="text-left p-4 font-semibold">Capability</th>
                      <th className="p-4 font-semibold text-primary">EdZen AI</th>
                      <th className="p-4 font-semibold">Traditional fee software</th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARISON.map((r) => (
                      <tr key={r.row} className="border-t border-border/60">
                        <td className="p-4 font-medium">{r.row}</td>
                        <td className="p-4 text-center bg-primary/5"><Cell value={r.us} /></td>
                        <td className="p-4 text-center"><Cell value={r.legacy} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
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
            <h2 className="text-3xl sm:text-4xl font-bold">Start collecting fees on UPI + WhatsApp in 1 day</h2>
            <p className="mt-3 text-primary-foreground/85 max-w-xl mx-auto">
              Join Indian private schools modernising fee collection with EdZen AI — UPI deep-links, WhatsApp reminders, and instant proof verification.
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
