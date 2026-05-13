import { Link } from "react-router-dom";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import edzenIcon from "@/assets/edzen-icon.png";

export default function DataDeletion() {
  usePageMeta({
    title: "Data Deletion Instructions – EdZen AI",
    description:
      "How to request deletion of your school, student, and parent data from EdZen AI. Compliant with India's DPDP Act 2023 and Meta Platform Policy.",
    canonical: "/data-deletion",
  });

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
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Link>
          </Button>
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-4 py-16 prose prose-slate dark:prose-invert">
        <h1>Data Deletion Instructions</h1>
        <p className="text-muted-foreground">Last updated: May 13, 2026</p>

        <p>
          EdZen AI is a school management platform used by School Administrators, Teachers, and Parents.
          You can request deletion of your account and all associated data at any time using the steps below.
        </p>

        <h2>1. How to Request Deletion</h2>
        <p>
          Send an email to{" "}
          <a href="mailto:privacy@edzenai.com" className="text-primary">
            privacy@edzenai.com
          </a>{" "}
          from the email address registered with your EdZen AI account, with the following details:
        </p>
        <ul>
          <li>
            <strong>Subject:</strong> "Data Deletion Request"
          </li>
          <li>School name (as registered on EdZen AI)</li>
          <li>Registered admin email or phone number</li>
          <li>Reason for deletion (optional)</li>
        </ul>
        <p>
          For social-login users (Google / Facebook), include the email address linked to that login so we can
          locate and remove the associated identity record.
        </p>

        <h2>2. What Gets Deleted</h2>
        <ul>
          <li>School profile, branding, and settings</li>
          <li>All student records, parent contacts, and access tokens</li>
          <li>Attendance, marks, assessments, and report cards</li>
          <li>Fee structures, installments, payments, and uploaded payment proofs</li>
          <li>Teacher and staff accounts created under your school</li>
          <li>Authentication identities (email, Google, Facebook) linked to deleted accounts</li>
          <li>Uploaded files in storage (logos, QR codes, payment proofs, documents)</li>
        </ul>

        <h2>3. Timeline</h2>
        <ul>
          <li>
            <strong>Confirmation:</strong> within 3 business days of receiving your request.
          </li>
          <li>
            <strong>Full deletion:</strong> within 30 days, in line with the Digital Personal Data Protection
            Act, 2023 (DPDP Act) and Meta Platform Policy.
          </li>
        </ul>

        <h2>4. What May Be Retained</h2>
        <p>
          A limited subset of records may be retained where required by law or for fraud prevention:
        </p>
        <ul>
          <li>Anonymised, aggregated usage analytics that cannot identify any individual</li>
          <li>Financial records (invoices, tax records) for up to 7 years as required by Indian tax law</li>
          <li>Records under legal hold or active dispute</li>
        </ul>

        <h2>5. Self-Service Options</h2>
        <p>
          School Administrators can delete individual student records, teacher accounts, and uploaded files
          directly from the admin panel at any time. Full school account deletion requires an emailed request
          (above) to prevent accidental loss of multi-user data.
        </p>

        <h2>6. Contact</h2>
        <p>
          For any questions about data deletion, write to{" "}
          <a href="mailto:privacy@edzenai.com" className="text-primary">
            privacy@edzenai.com
          </a>{" "}
          or visit our <Link to="/contact" className="text-primary">Contact page</Link>. See also our{" "}
          <Link to="/privacy" className="text-primary">Privacy Policy</Link>.
        </p>
      </article>
    </div>
  );
}
