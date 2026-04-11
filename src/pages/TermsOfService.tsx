import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap, ArrowLeft } from "lucide-react";
import edzenIcon from "@/assets/edzen-icon.png";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function TermsOfService() {
  usePageMeta({ title: "Terms of Service – EdZen AI", description: "Read the EdZen AI terms of service governing platform usage for schools, teachers, and parents.", canonical: "/terms" });
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <img src={edzenIcon} alt="EdZen AI" className="h-6 w-6 object-contain" />
            </div>
            <span className="font-bold text-lg">EdZen AI</span>
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Link>
          </Button>
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-4 py-16 prose prose-slate dark:prose-invert">
        <h1>Terms of Service</h1>
        <p className="text-muted-foreground">Last updated: April 5, 2026</p>

        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using EdZen AI ("the Platform"), you agree to be bound by these Terms of Service. If you are using the Platform on behalf of a school or organisation, you represent that you have the authority to bind that entity to these terms.
        </p>

        <h2>2. Description of Service</h2>
        <p>
          EdZen AI is an AI-powered school management platform that provides student management, fee automation, attendance tracking, assessment management, report card generation, and parent communication tools. The Platform is offered on a subscription basis with a free trial period.
        </p>

        <h2>3. Account Registration</h2>
        <ul>
          <li>You must provide accurate and complete information during registration</li>
          <li>You are responsible for maintaining the confidentiality of your account credentials</li>
          <li>You must notify us immediately of any unauthorised use of your account</li>
          <li>One school registration per institution; multiple admin accounts are supported</li>
        </ul>

        <h2>4. Subscription & Billing</h2>
        <p>
          After the free trial period, continued use of the Platform requires an active subscription. Fees are calculated on a per-student-per-month basis. We reserve the right to modify pricing with 30 days' prior notice. Volume discounts may apply based on student count.
        </p>

        <h2>5. Acceptable Use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use the Platform for any unlawful purpose</li>
          <li>Attempt to gain unauthorised access to other accounts or systems</li>
          <li>Upload malicious content, viruses, or harmful code</li>
          <li>Misrepresent student data or fabricate records</li>
          <li>Resell or redistribute access to the Platform without authorisation</li>
        </ul>

        <h2>6. Data Ownership</h2>
        <p>
          You retain ownership of all data you input into the Platform (student records, marks, fee data, etc.). EdZen AI is granted a limited licence to process this data solely for providing the service. Upon account termination, you may export your data before deletion.
        </p>

        <h2>7. AI-Generated Content</h2>
        <p>
          The Platform uses artificial intelligence to generate insights, summaries, and recommendations. AI-generated content is provided for informational purposes only and should be reviewed by qualified educators before use in official communications or decisions.
        </p>

        <h2>8. Service Availability</h2>
        <p>
          We strive for 99.9% uptime but do not guarantee uninterrupted service. Scheduled maintenance will be communicated in advance. We are not liable for losses resulting from service interruptions beyond our reasonable control.
        </p>

        <h2>9. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by law, EdZen AI shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Platform. Our total liability shall not exceed the fees paid by you in the 12 months preceding the claim.
        </p>

        <h2>10. Termination</h2>
        <p>
          Either party may terminate the agreement with 30 days' written notice. We may suspend or terminate accounts that violate these terms. Upon termination, your data will be retained for 90 days to allow export, after which it will be permanently deleted.
        </p>

        <h2>11. Governing Law</h2>
        <p>
          These Terms shall be governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Bengaluru, Karnataka.
        </p>

        <h2>12. Contact</h2>
        <p>
          For questions about these Terms, please contact us at{" "}
          <a href="mailto:legal@edzenai.com" className="text-primary">legal@edzenai.com</a> or visit our{" "}
          <Link to="/contact" className="text-primary">Contact page</Link>.
        </p>
      </article>
    </div>
  );
}
