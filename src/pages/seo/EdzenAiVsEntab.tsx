import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, X, Sparkles, ShieldCheck } from "lucide-react";
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

const VERDICTS = [
  {
    name: "EdZen AI",
    tag: "Best for modern Indian schools that want AI + WhatsApp-first parent communication without long contracts.",
    accent: true,
  },
  {
    name: "Entab",
    tag: "Best for large established schools that already use Entab and value its long Indian track record (since 2000).",
  },
  {
    name: "Fedena",
    tag: "Best for institutions that need self-hosted / on-premise deployment or heavy module customisation.",
  },
];

const COMPARISON: { row: string; us: string | boolean; entab: string | boolean; fedena: string | boolean }[] = [
  { row: "Starting price (per student / month)", us: "₹7 (Starter), ₹10 (Pro)", entab: "Quote-based", fedena: "Quote-based / per-user license" },
  { row: "Free trial", us: "30 days, no card", entab: false, fedena: "Limited demo" },
  { row: "Self-service signup (live in minutes)", us: true, entab: false, fedena: false },
  { row: "Setup time", us: "Under 1 day", entab: "Weeks (sales + onboarding)", fedena: "Days to weeks" },
  { row: "AI Excel student import", us: true, entab: false, fedena: false },
  { row: "AI at-risk insights & student analysis", us: true, entab: false, fedena: false },
  { row: "WhatsApp parent portal (no app install, no login)", us: true, entab: false, fedena: false },
  { row: "UPI auto-reconciliation", us: true, entab: "Partial", fedena: "Partial" },
  { row: "NEP 2020 (5+3+3+4) report cards", us: true, entab: true, fedena: false },
  { row: "Customisable report card builder", us: true, entab: true, fedena: true },
  { row: "Mobile app for parents", us: "Web link (works on any phone)", entab: true, fedena: true },
  { row: "On-premise / self-hosted option", us: false, entab: false, fedena: true },
  { row: "Track record in India", us: "Launched 2026", entab: "Since 2000", fedena: "Since 2009" },
  { row: "Best for school size", us: "50 – 5,000 students", entab: "1,000 – 10,000+ students", fedena: "Any (incl. universities)" },
];

const PRICING_300 = [
  { name: "EdZen AI Pro", monthly: "₹3,000 / mo", note: "300 × ₹10, transparent on website" },
  { name: "Entab CampusCare", monthly: "Contact sales", note: "Typically quoted annually; setup fees common" },
  { name: "Fedena Pro (cloud)", monthly: "Contact sales", note: "Per-user license, modules priced separately" },
];

const FAQS = [
  {
    q: "Is EdZen AI cheaper than Entab and Fedena?",
    a: "For most small and mid-sized Indian schools, yes. EdZen AI publishes flat pricing at ₹7 (Starter) and ₹10 (Pro) per student per month with no setup fee and a 30-day free Pro trial. Entab and Fedena are quote-based and typically include onboarding fees plus annual contracts, which can work out higher for schools under ~1,500 students.",
  },
  {
    q: "Does Fedena support NEP 2020 report cards?",
    a: "Fedena offers a general gradebook and customisable report templates, but it does not ship NEP 2020-aligned 5+3+3+4 templates out of the box — schools typically configure them manually or rely on a partner. EdZen AI ships NEP 2020 templates and competency tracking by default; Entab also provides board-specific report cards for CBSE, ICSE and State Boards.",
  },
  {
    q: "Which is best for a small school under 500 students?",
    a: "EdZen AI is generally the strongest fit at this size — predictable per-student pricing, self-service signup, and no minimum-seat contracts. Entab is built around larger deployments and is rarely cost-effective below 1,000 students. Fedena suits small schools that specifically need on-premise hosting.",
  },
  {
    q: "Can I migrate from Entab or Fedena to EdZen AI?",
    a: "Yes. EdZen AI includes an AI-powered Excel import that maps student rosters, fee structures and historical marks from any format — including Entab and Fedena exports. Most schools complete the switch in a single working day.",
  },
  {
    q: "Do parents need to install an app with EdZen AI?",
    a: "No. Parents receive a private secure link over WhatsApp and view fees, attendance, marks and report cards in any browser. Entab and Fedena both push parents to install a mobile app, which can be a barrier on low-end Android devices common in Tier 2 and Tier 3 cities.",
  },
  {
    q: "Where do Entab and Fedena win over EdZen AI?",
    a: "Entab has a 20+ year track record in India and is a known brand among large CBSE/ICSE schools. Fedena offers self-hosted / on-premise deployment, which is valuable for institutions with strict data-residency policies. EdZen AI is cloud-only and was launched in 2026.",
  },
  {
    q: "Is EdZen AI safe for school data?",
    a: "Yes. Each school's data is fully isolated using PostgreSQL Row-Level Security, parent links use unguessable tokens, payments run through Razorpay/UPI, and data is encrypted in transit and at rest. There is no shared database across schools.",
  },
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

export default function EdzenAiVsEntab() {
  usePageMeta({
    title: "EdZen AI vs Entab vs Fedena (2026) — Honest Comparison",
    description:
      "Side-by-side comparison of EdZen AI, Entab and Fedena for Indian schools: pricing, AI features, WhatsApp parent portal, NEP 2020 report cards and setup time.",
    canonical: "/edzenai-vs-entab",
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
    const breadcrumb = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://edzenai.com/" },
        { "@type": "ListItem", position: 2, name: "EdZen AI vs Entab vs Fedena", item: "https://edzenai.com/edzenai-vs-entab" },
      ],
    };
    const product = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "EdZen AI",
      description:
        "Cloud school management platform for Indian schools — AI insights, WhatsApp parent portal, UPI fee collection, NEP 2020 report cards.",
      url: "https://edzenai.com/edzenai-vs-entab",
      applicationCategory: "EducationalApplication",
      applicationSubCategory: "School Management Software",
      operatingSystem: "Web, Android, iOS",
      offers: {
        "@type": "AggregateOffer",
        lowPrice: "7",
        highPrice: "10",
        priceCurrency: "INR",
      },
      areaServed: "IN",
    };
    const tags: HTMLScriptElement[] = [];
    [faq, breadcrumb, product].forEach((obj) => {
      const s = document.createElement("script");
      s.type = "application/ld+json";
      s.text = JSON.stringify(obj);
      s.dataset.seoPage = "edzenai-vs-entab";
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
        {/* Hero + verdict */}
        <section className="px-4 pt-16 pb-12">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-5 bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Comparison · Updated May 2026
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              EdZen AI vs Entab vs Fedena
            </h1>
            <p className="mt-5 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              An honest, side-by-side comparison of the three most-asked-about school management
              platforms in India — pricing, features, and where each one actually wins.
            </p>
            <Card className="mt-8 rounded-2xl border-border/60 text-left">
              <CardContent className="p-6">
                <p className="text-sm font-semibold text-primary mb-2">Short answer</p>
                <p className="text-base text-foreground">
                  <strong>EdZen AI</strong> is the best fit for small-to-mid Indian schools (50–5,000 students)
                  that want transparent per-student pricing, AI insights and a WhatsApp parent portal.
                  <strong> Entab</strong> remains a strong choice for large established CBSE/ICSE schools that
                  prefer a long-standing brand. <strong>Fedena</strong> is the right call when on-premise
                  hosting or deep module customisation is non-negotiable.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Verdict cards */}
        <section className="px-4 pb-16">
          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-4">
            {VERDICTS.map((v) => (
              <Card
                key={v.name}
                className={`rounded-2xl ${v.accent ? "border-2 border-primary shadow-lg" : "border-border/60"}`}
              >
                <CardContent className="p-6">
                  <div className={`text-sm font-semibold ${v.accent ? "text-primary" : "text-muted-foreground"}`}>
                    {v.name}
                  </div>
                  <p className="mt-2 text-foreground">{v.tag}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Comparison table */}
        <section className="px-4 py-16 bg-background">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl sm:text-4xl font-bold">Feature comparison</h2>
              <p className="mt-3 text-muted-foreground">
                Researched from each vendor's public documentation, May 2026.
              </p>
            </div>
            <Card className="rounded-2xl overflow-hidden border-border/60">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <caption className="sr-only">EdZen AI vs Entab vs Fedena feature-by-feature comparison</caption>
                  <thead className="bg-secondary/50">
                    <tr>
                      <th className="text-left p-4 font-semibold">Capability</th>
                      <th className="p-4 font-semibold text-primary">EdZen AI</th>
                      <th className="p-4 font-semibold">Entab</th>
                      <th className="p-4 font-semibold">Fedena</th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARISON.map((r) => (
                      <tr key={r.row} className="border-t border-border/60">
                        <td className="p-4 font-medium">{r.row}</td>
                        <td className="p-4 text-center bg-primary/5"><Cell value={r.us} /></td>
                        <td className="p-4 text-center"><Cell value={r.entab} /></td>
                        <td className="p-4 text-center"><Cell value={r.fedena} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </section>

        {/* Pricing comparison */}
        <section className="px-4 py-16">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl sm:text-4xl font-bold">Pricing for a 300-student school</h2>
              <p className="mt-3 text-muted-foreground">
                Indicative monthly cost. EdZen AI publishes pricing; Entab and Fedena require a sales call.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {PRICING_300.map((p, i) => (
                <Card
                  key={p.name}
                  className={`rounded-2xl ${i === 0 ? "border-2 border-primary shadow-lg" : "border-border/60"}`}
                >
                  <CardContent className="p-6">
                    <div className={`text-sm font-semibold ${i === 0 ? "text-primary" : "text-muted-foreground"}`}>
                      {p.name}
                    </div>
                    <div className="mt-2 text-2xl font-bold">{p.monthly}</div>
                    <p className="mt-2 text-sm text-muted-foreground">{p.note}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <p className="mt-6 text-xs text-muted-foreground text-center">
              Sources: vendor websites and published pricing pages as of May 2026. Entab and Fedena pricing
              varies by modules, school size and contract length.
            </p>
          </div>
        </section>

        {/* Deep-dive sections */}
        <section className="px-4 py-16 bg-background">
          <div className="max-w-4xl mx-auto space-y-10">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold">Fee collection</h2>
              <p className="mt-3 text-muted-foreground">
                EdZen AI ships UPI deep-linking, auto-reconciliation and WhatsApp reminders out of the box —
                parents tap a link, pay via any UPI app, and the payment lands on the school dashboard
                instantly. Entab supports online fees through gateway integrations but tends to require
                heavier configuration. Fedena offers a Fees module with multiple payment gateways but UPI
                deep-linking is not a first-class feature.
              </p>
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold">Parent communication</h2>
              <p className="mt-3 text-muted-foreground">
                EdZen AI uses a no-login WhatsApp link — parents see fees, attendance, marks and report
                cards in any browser. Both Entab and Fedena rely on a dedicated parent mobile app, which
                adds installation friction on low-end Android phones common across Tier 2 and Tier 3 India.
              </p>
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold">Report cards & NEP 2020</h2>
              <p className="mt-3 text-muted-foreground">
                EdZen AI and Entab both provide board-specific report card templates for CBSE, ICSE, ISC and
                State Boards. EdZen AI ships NEP 2020 (5+3+3+4) templates by default and supports
                competency-based grading on a 4-level scale. Fedena offers a generic gradebook that schools
                customise themselves.
              </p>
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold">AI features</h2>
              <p className="mt-3 text-muted-foreground">
                EdZen AI is the only product of the three with built-in AI — AI Excel import for student
                rosters and historical marks, AI class summaries, individual student insights, and an
                at-risk early-warning system. Entab and Fedena do not currently market AI-driven academic
                analytics.
              </p>
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold">Setup, support and contracts</h2>
              <p className="mt-3 text-muted-foreground">
                EdZen AI supports self-service signup with a 30-day Pro trial, no credit card and no annual
                lock-in. Entab and Fedena typically require a sales conversation, onboarding period and
                annual contract — which suits larger schools but slows down smaller ones.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <ShieldCheck className="h-12 w-12 mx-auto text-primary mb-4" />
            <h2 className="text-3xl sm:text-4xl font-bold">See it for yourself</h2>
            <p className="mt-3 text-muted-foreground">
              Try EdZen AI Pro free for 30 days. No card, no contract — and a working dashboard for your
              school in under a day.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" className="rounded-xl">
                <Link to="/signup">Start free trial <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-xl">
                <Link to="/book-demo">Book a demo</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="px-4 py-16 bg-background">
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

        {/* Final note */}
        <section className="px-4 py-16">
          <div className="max-w-3xl mx-auto text-center text-sm text-muted-foreground">
            Entab and Fedena are trademarks of their respective owners. This comparison reflects publicly
            available information as of May 2026 and our own product. We welcome corrections — email{" "}
            <a href="mailto:hello@edzenai.com" className="underline">hello@edzenai.com</a>.
          </div>
        </section>
      </main>
    </div>
  );
}
