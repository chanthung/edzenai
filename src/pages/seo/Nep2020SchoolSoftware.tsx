import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Sparkles, ShieldCheck, Languages, GraduationCap } from "lucide-react";
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
import { NEP_STAGES, type NepLearningStage } from "@/lib/nep-stages";
import edzenLogoFull from "@/assets/edzen-logo-full.png";

type StageDetail = {
  key: NepLearningStage;
  prescribed: string;
  edzen: string;
};

const STAGE_DETAILS: StageDetail[] = [
  {
    key: "foundational",
    prescribed:
      "Play-based and activity-based learning. Focus on Foundational Literacy & Numeracy (FLN), motor skills, listening and oral language. No formal pen-paper exams — assessment is observational.",
    edzen:
      "Auto-mapped via getNepStage() for Pre-school, Nursery, LKG, UKG and Classes 1–2. Teachers record competency observations on a 4-level Red/Amber/Green/Blue rubric instead of marks. Holistic Progress Card template ships pre-configured for this stage.",
  },
  {
    key: "preparatory",
    prescribed:
      "Transition from play to structured learning. Introduction of reading, writing, mathematics, art, science and physical activity. Formative assessment continues; light summative checks begin.",
    edzen:
      "Subjects auto-suggest from the EdZen subject library for Grades 3–5. Teachers can mix marks-based assessments with competency rubrics. Parent portal supports the regional language so parents follow progress in their mother tongue, in line with NEP's language mandate.",
  },
  {
    key: "middle",
    prescribed:
      "Experiential learning across Sciences, Mathematics, Arts, Social Sciences and Humanities. Critical thinking, coding exposure and subject-teacher model. Regular formative + summative assessments.",
    edzen:
      "Per-subject teacher assignment via the 3-way Teacher–Subject–Class mapping. Term-wise assessment templates auto-sync to live assessments. AI-powered class summaries highlight at-risk students (>15% drop or <40% score) for early intervention.",
  },
  {
    key: "secondary",
    prescribed:
      "Multidisciplinary study with subject choice and depth. Board-style summative assessments (CBSE, ICSE, State) alongside competency-based components. Career and life-skills exposure.",
    edzen:
      "Board-specific report card templates for CBSE, ICSE, ISC and State Boards. Customisable report card builder for board-aligned grading scales, plus co-scholastic and life-skills sections required by the Holistic Progress Card.",
  },
];

const TLDR = [
  "5+3+3+4 structure replaces the old 10+2 system across Foundational, Preparatory, Middle and Secondary stages.",
  "Assessment shifts from rote marks to competency-based, formative and holistic evaluation.",
  "Every learner gets a Holistic Progress Card covering scholastic, co-scholastic and life skills.",
  "Mother-tongue / regional language is the medium of instruction wherever possible up to Grade 5.",
];

const CHECKLIST: { req: string; status: "Yes" | "Partial"; note: string }[] = [
  { req: "5+3+3+4 stage auto-detection from class name", status: "Yes", note: "Built-in getNepStage() mapping" },
  { req: "Competency-based grading (4-level scale)", status: "Yes", note: "Red / Amber / Green / Blue rubric" },
  { req: "Holistic Progress Card (scholastic + co-scholastic + life skills)", status: "Yes", note: "Default template, fully editable" },
  { req: "Multilingual parent portal (7 Indian languages)", status: "Yes", note: "EN, HI, MR, TA, KN, BN, AS" },
  { req: "Continuous & formative assessment (not just terms)", status: "Yes", note: "Multiple assessment types per term" },
  { req: "Co-scholastic and life-skills tracking", status: "Yes", note: "Custom subjects + report card fields" },
  { req: "Teacher comments / qualitative remarks per competency", status: "Yes", note: "Free-text remarks on every assessment" },
  { req: "Student self-assessment & peer-assessment fields", status: "Partial", note: "On roadmap — teacher remarks ship today" },
  { req: "Board-aligned templates (CBSE / ICSE / State)", status: "Yes", note: "Pre-built + customisable" },
];

const LANGUAGES = ["English", "हिन्दी (Hindi)", "मराठी (Marathi)", "தமிழ் (Tamil)", "ಕನ್ನಡ (Kannada)", "বাংলা (Bengali)", "অসমীয়া (Assamese)"];

const COMPETENCY_LEVELS = [
  { color: "bg-red-500", label: "Beginner", desc: "Needs significant support to demonstrate the competency." },
  { color: "bg-amber-500", label: "Progressing", desc: "Developing the competency with some guidance." },
  { color: "bg-emerald-500", label: "Proficient", desc: "Independently demonstrates the competency." },
  { color: "bg-blue-500", label: "Advanced", desc: "Applies the competency in new and complex contexts." },
];

const FAQS = [
  {
    q: "What is the 5+3+3+4 structure in NEP 2020?",
    a: "NEP 2020 replaces the old 10+2 school structure with a 5+3+3+4 design: Foundational (5 years — Pre-school to Class 2), Preparatory (3 years — Classes 3–5), Middle (3 years — Classes 6–8) and Secondary (4 years — Classes 9–12). It aligns formal schooling with how children actually develop cognitively.",
  },
  {
    q: "What is a Holistic Progress Card?",
    a: "The Holistic Progress Card (HPC) is the NEP 2020-prescribed replacement for traditional marks-only report cards. It captures scholastic performance, co-scholastic activities, life skills, teacher remarks and parent feedback — and is meant to reflect the child as a whole learner, not just an exam score.",
  },
  {
    q: "Is EdZen AI NEP 2020 compliant?",
    a: "Yes. EdZen AI auto-maps every class to the correct 5+3+3+4 stage, supports competency-based grading on a 4-level scale, ships a Holistic Progress Card template, and offers a multilingual parent portal in seven Indian languages — covering the core NEP 2020 requirements that affect day-to-day school operations.",
  },
  {
    q: "Does EdZen AI support competency-based assessment?",
    a: "Yes. Alongside numeric marks, teachers can grade students against named competencies on a four-level rubric — Beginner (Red), Progressing (Amber), Proficient (Green) and Advanced (Blue) — and add qualitative remarks for each one. Competency progress flows into the Holistic Progress Card automatically.",
  },
  {
    q: "Which Indian languages does EdZen AI support for parents?",
    a: "The parent portal currently ships in English, Hindi, Marathi, Tamil, Kannada, Bengali and Assamese. This is aligned with NEP 2020's mother-tongue / regional-language mandate for the Foundational and Preparatory stages.",
  },
  {
    q: "How does EdZen AI map a class to a NEP stage automatically?",
    a: "EdZen AI uses a built-in mapping (getNepStage) that recognises Pre-school, Nursery, LKG, UKG and any numeric class name. Pre-school to Class 2 maps to Foundational, Classes 3–5 to Preparatory, Classes 6–8 to Middle and Classes 9–12 to Secondary — so the right report card template and assessment style is suggested by default.",
  },
  {
    q: "Can CBSE and ICSE schools use EdZen AI for NEP 2020 report cards?",
    a: "Yes. EdZen AI ships pre-built CBSE, ICSE, ISC and State Board report card templates, and the customisable report card builder lets schools add NEP 2020 co-scholastic and life-skills sections without engineering work.",
  },
  {
    q: "Is NEP 2020 mandatory for private schools in 2026?",
    a: "NEP 2020 is being phased in nationwide. Several State Boards and the CBSE have already begun aligning curricula and report cards with NEP 2020 principles, and most private schools are expected to be compliant well before the 2030 horizon. Adopting NEP-ready software now avoids painful migrations later.",
  },
];

export default function Nep2020SchoolSoftware() {
  usePageMeta({
    title: "NEP 2020 School Management Software (2026) | EdZen AI",
    description:
      "Complete guide to the NEP 2020 5+3+3+4 stages and how EdZen AI implements each — competency grading, Holistic Progress Card, multilingual parent portal.",
    canonical: "/nep-2020-school-software",
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
        { "@type": "ListItem", position: 2, name: "NEP 2020 School Management Software", item: "https://edzenai.com/nep-2020-school-software" },
      ],
    };
    const product = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "EdZen AI",
      description:
        "NEP 2020-ready cloud school management platform for Indian schools — 5+3+3+4 auto-stage mapping, competency grading, Holistic Progress Card and multilingual parent portal.",
      url: "https://edzenai.com/nep-2020-school-software",
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
      s.dataset.seoPage = "nep-2020-school-software";
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
        <section className="px-4 pt-16 pb-12">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-5 bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" /> NEP 2020 · Updated May 2026
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              NEP 2020 School Management Software
            </h1>
            <p className="mt-5 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              A complete, no-fluff guide to the 5+3+3+4 structure prescribed by India's National
              Education Policy 2020 — and exactly how EdZen AI implements each stage today.
            </p>
            <Card className="mt-8 rounded-2xl border-border/60 text-left">
              <CardContent className="p-6">
                <p className="text-sm font-semibold text-primary mb-2">Short answer</p>
                <p className="text-base text-foreground">
                  EdZen AI is a NEP 2020-ready school management platform for Indian schools. It
                  auto-maps every class to the correct Foundational / Preparatory / Middle /
                  Secondary stage, supports competency-based grading on a 4-level rubric, ships a
                  Holistic Progress Card template, and delivers parent communication in seven
                  Indian languages.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* TL;DR */}
        <section className="px-4 pb-16">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold">What NEP 2020 actually changes</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {TLDR.map((t) => (
                <Card key={t} className="rounded-2xl border-border/60">
                  <CardContent className="p-5 flex gap-3">
                    <Check className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                    <p className="text-foreground">{t}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Stage deep-dive */}
        <section className="px-4 py-16 bg-background">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl sm:text-4xl font-bold">The four NEP 2020 stages</h2>
              <p className="mt-3 text-muted-foreground">
                The 5+3+3+4 structure mapped to grades, ages, and EdZen AI features.
              </p>
            </div>
            <div className="space-y-6">
              {STAGE_DETAILS.map((s, i) => {
                const meta = NEP_STAGES[s.key];
                return (
                  <Card key={s.key} className="rounded-2xl border-border/60 overflow-hidden">
                    <CardContent className="p-0">
                      <div className="grid md:grid-cols-[220px,1fr]">
                        <div className="bg-primary/5 p-6 border-r border-border/60">
                          <div className="text-xs font-semibold text-primary uppercase tracking-wider">
                            Stage {i + 1}
                          </div>
                          <div className="mt-2 text-2xl font-bold">{meta.label}</div>
                          <div className="mt-3 text-sm text-muted-foreground">{meta.grades}</div>
                          <div className="text-sm text-muted-foreground">{meta.ages}</div>
                        </div>
                        <div className="p-6 space-y-4">
                          <div>
                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                              What NEP 2020 prescribes
                            </div>
                            <p className="text-foreground">{s.prescribed}</p>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-1.5">
                              How EdZen AI implements it
                            </div>
                            <p className="text-foreground">{s.edzen}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Compliance checklist */}
        <section className="px-4 py-16">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl sm:text-4xl font-bold">NEP 2020 compliance checklist</h2>
              <p className="mt-3 text-muted-foreground">
                Where EdZen AI is fully compliant — and where we're honest about the gaps.
              </p>
            </div>
            <Card className="rounded-2xl overflow-hidden border-border/60">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <caption className="sr-only">NEP 2020 requirements vs EdZen AI support</caption>
                  <thead className="bg-secondary/50">
                    <tr>
                      <th className="text-left p-4 font-semibold">NEP 2020 requirement</th>
                      <th className="p-4 font-semibold text-primary">EdZen AI</th>
                      <th className="text-left p-4 font-semibold">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CHECKLIST.map((r) => (
                      <tr key={r.req} className="border-t border-border/60">
                        <td className="p-4 font-medium">{r.req}</td>
                        <td className="p-4 text-center bg-primary/5">
                          <Badge
                            variant="outline"
                            className={
                              r.status === "Yes"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }
                          >
                            {r.status}
                          </Badge>
                        </td>
                        <td className="p-4 text-muted-foreground">{r.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </section>

        {/* Competency framework */}
        <section className="px-4 py-16 bg-background">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <GraduationCap className="h-10 w-10 mx-auto text-primary mb-3" />
              <h2 className="text-3xl sm:text-4xl font-bold">Competency framework (4-level rubric)</h2>
              <p className="mt-3 text-muted-foreground">
                NEP 2020 moves assessment away from marks-only. EdZen AI uses a colour-coded 4-level
                rubric that teachers apply per competency, per assessment.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {COMPETENCY_LEVELS.map((l) => (
                <Card key={l.label} className="rounded-2xl border-border/60">
                  <CardContent className="p-5">
                    <div className={`${l.color} h-2 w-12 rounded-full mb-3`} />
                    <div className="font-semibold text-foreground">{l.label}</div>
                    <p className="mt-2 text-sm text-muted-foreground">{l.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Holistic Progress Card */}
        <section className="px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center">The Holistic Progress Card</h2>
            <p className="mt-4 text-muted-foreground text-center">
              NEP 2020's replacement for the marks-only report card. EdZen AI ships a default template
              covering everything required.
            </p>
            <div className="mt-8 grid sm:grid-cols-2 gap-4">
              {[
                ["Scholastic performance", "Marks and grades per subject, term-wise."],
                ["Co-scholastic activities", "Sports, arts, music, clubs and project work."],
                ["Life skills", "Communication, collaboration, critical thinking and citizenship."],
                ["Teacher remarks", "Qualitative feedback per competency, not just a number."],
                ["Attendance summary", "Daily attendance rolled up term-wise."],
                ["Multilingual delivery", "Parents view the card in their language via a private link."],
              ].map(([title, desc]) => (
                <Card key={title} className="rounded-2xl border-border/60">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                      <div>
                        <div className="font-semibold">{title}</div>
                        <p className="text-sm text-muted-foreground mt-1">{desc}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Multilingual */}
        <section className="px-4 py-16 bg-background">
          <div className="max-w-4xl mx-auto text-center">
            <Languages className="h-10 w-10 mx-auto text-primary mb-3" />
            <h2 className="text-3xl sm:text-4xl font-bold">Mother-tongue parent portal</h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              NEP 2020 mandates that, wherever possible, the medium of instruction should be the
              child's mother tongue or regional language up to Grade 5. EdZen AI's no-login parent
              portal currently ships in seven Indian languages — added without any app install.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-2">
              {LANGUAGES.map((l) => (
                <Badge key={l} variant="outline" className="px-3 py-1.5 text-sm bg-background">
                  {l}
                </Badge>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <ShieldCheck className="h-12 w-12 mx-auto text-primary mb-4" />
            <h2 className="text-3xl sm:text-4xl font-bold">Run a NEP 2020-ready school</h2>
            <p className="mt-3 text-muted-foreground">
              Start with a 30-day Pro trial — no card, no contract. Your classes, subjects and report
              card templates are pre-mapped to the right NEP stage from day one.
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

        {/* Cross-links */}
        <section className="px-4 py-12">
          <div className="max-w-3xl mx-auto text-center text-sm text-muted-foreground">
            Related reading:{" "}
            <Link to="/school-management-software-india" className="underline">Best school management software in India</Link>
            {" · "}
            <Link to="/edzenai-vs-entab" className="underline">EdZen AI vs Entab vs Fedena</Link>
            {" · "}
            <Link to="/fee-collection-software-schools-india" className="underline">Fee collection software</Link>
          </div>
        </section>
      </main>
    </div>
  );
}
