## Goal

Replace the existing minimal `SoftwareApplication` JSON-LD in `index.html` with a richer schema (AggregateOffer, featureList, audience, language, areaServed) tailored to EdZen AI.

## Changes

**File: `index.html**` — replace the current `<script type="application/ld+json">…</script>` block in `<head>` with the new schema below. Keep all other meta tags untouched.

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "EdZen AI",
  "description": "School management SaaS platform for Indian private schools. Handles fee collection, attendance, marks entry, CBSE/CISE-ICSE/state board report cards, WhatsApp parent portal, and AI student progress tracking.",
  "url": "https://edzenai.com",
  "applicationCategory": "EducationalApplication",
  "applicationSubCategory": "School Management Software",
  "operatingSystem": "Web, Android, iOS",
  "offers": {
    "@type": "AggregateOffer",
    "lowPrice": "7",
     
    "priceCurrency": "INR",
    "priceSpecification": [
      { "@type": "UnitPriceSpecification", "name": "Starter", "price": "7", "priceCurrency": "INR" },
      { "@type": "UnitPriceSpecification", "name": "Pro",     "price": "10",  "priceCurrency": "INR", "referenceQuantity": { "@type": "QuantitativeValue", "value": 1, "unitText": "student/month" } },
      
    ]
  },
  "featureList": [
    "UPI fee collection with WhatsApp reminders",
    "CBSE CISE-ICSE State NEP 2020 report card generation",
    "AI-powered at-risk student monitoring",
    "Parent WhatsApp portal — no app install",
    "Daily attendance management",
    "Marks entry and competency tracking"
  ],
  "audience": {
    "@type": "Audience",
    "audienceType": "School principals, teachers, accountants, India private schools"
  },
  "inLanguage": ["en", "hi"],
  "areaServed": "IN",
  "author": {
    "@type": "Organization",
    "name": "EdZen AI",
    "url": "https://edzenai.com",
    "email": "support@edzenai.com",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Dimapur",
      "addressRegion": "Nagaland",
      "addressCountry": "IN"
    }
  }
}
```

## Notes

- Pricing aligned with project memory: Starter 7, Pro ₹10/student/mo, 30 days free trial for Pro.
- Author/Organization block preserved from current schema (Dimapur, NG, IN + support email) so we don't lose org metadata.
- Single JSON-LD in `index.html` — applies to all routes since SPA. Per-page schema (FAQ, Article, Product) can be added later via `usePageMeta` if desired; not in scope here.