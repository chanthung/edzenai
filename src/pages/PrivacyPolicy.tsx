import { Link } from "react-router-dom";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Button } from "@/components/ui/button";
import { GraduationCap, ArrowLeft } from "lucide-react";
import edzenIcon from "@/assets/edzen-icon.png";

export default function PrivacyPolicy() {
  usePageMeta({ title: "Privacy Policy – EdZen AI", description: "Learn how EdZen AI protects school, student, and parent data. Compliant with India's DPDP Act 2023.", canonical: "/privacy" });
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
        <h1>Privacy Policy</h1>
        <p className="text-muted-foreground">Last updated: April 5, 2026</p>

        <h2>1. Information We Collect</h2>
        <p>
          EdZen AI collects information you provide when registering your school, adding students, or using our platform. This includes school details, administrator contact information, student records (name, class, roll number, parent contact), attendance data, assessment marks, and fee payment information.
        </p>

        <h2>2. How We Use Your Information</h2>
        <ul>
          <li>To provide and maintain our school management services</li>
          <li>To generate report cards, analytics, and AI-powered insights</li>
          <li>To process fee payments and send reminders</li>
          <li>To communicate important updates about our service</li>
          <li>To improve our platform through anonymised usage analytics</li>
        </ul>

        <h2>3. Data Storage & Security</h2>
        <p>
          All data is stored on encrypted servers with industry-standard security measures. We use TLS encryption for data in transit and AES-256 encryption for data at rest. Access to student data is restricted through role-based permissions (Admin, Teacher, Parent).
        </p>

        <h2>4. Data Sharing</h2>
        <p>
          We do not sell, trade, or rent personal information to third parties. Data may be shared with trusted service providers (cloud hosting, communication services) strictly for platform operation, under binding data protection agreements.
        </p>

        <h2>5. Parental Data & Consent</h2>
        <p>
          Student data is managed by authorised school administrators. Parents can access their child's information through secure parent portal links. Schools are responsible for obtaining necessary parental consent for data collection as required under applicable Indian law including the Digital Personal Data Protection Act (DPDP Act, 2023).
        </p>

        <h2>6. Data Retention</h2>
        <p>
          We retain school and student data for as long as the school's account is active. Upon account deletion, all associated data is permanently removed within 90 days, except where retention is required by law.
        </p>

        <h2>7. Your Rights</h2>
        <p>
          You have the right to access, correct, or request deletion of your personal data. School administrators can export or delete student records at any time. For data-related requests, contact us at <a href="mailto:privacy@edzenai.com" className="text-primary">privacy@edzenai.com</a>.
        </p>

        <h2>8. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. Changes will be communicated via email to registered school administrators and posted on this page.
        </p>

        <h2>9. Contact Us</h2>
        <p>
          If you have questions about this Privacy Policy, please contact us at{" "}
          <a href="mailto:privacy@edzenai.com" className="text-primary">privacy@edzenai.com</a> or visit our{" "}
          <Link to="/contact" className="text-primary">Contact page</Link>.
        </p>
      </article>
    </div>
  );
}
