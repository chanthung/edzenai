import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import edzenIcon from "@/assets/edzen-icon.png";

export default function RefundPolicy() {
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
        <h1>Refund &amp; Cancellation Policy</h1>
        <p className="text-muted-foreground">Last updated: April 9, 2026</p>

        <h2>1. Platform Role</h2>
        <p>
          EdZen AI is a technology platform that facilitates the collection and management of school fees on behalf of educational institutions. EdZen AI is <strong>not</strong> a financial institution, payment aggregator, or party to any fee transaction between a parent/guardian and a school. All fee amounts, structures, and payment schedules are determined solely by the respective school administration.
        </p>

        <h2>2. School as Final Authority</h2>
        <p>
          Any request for a refund of school fees must be directed to the school administration. EdZen AI does not have the authority to approve, deny, or process refunds of fees collected on behalf of a school. The school retains full and sole discretion over all refund decisions, timelines, and procedures.
        </p>

        <h2>3. Double or Duplicate Payments</h2>
        <p>
          In the event that a parent or guardian inadvertently makes a duplicate payment for the same fee instalment, the school administration is responsible for reconciling the excess amount. The school may, at its discretion:
        </p>
        <ul>
          <li>Issue a direct refund of the duplicate amount to the parent/guardian, or</li>
          <li>Adjust the excess amount against future fee instalments.</li>
        </ul>
        <p>
          Parents/guardians should contact the school directly with proof of the duplicate transaction (e.g. payment receipt, bank statement) for resolution.
        </p>

        <h2>4. Platform &amp; Convenience Fees</h2>
        <p>
          Any platform or convenience fees charged by EdZen AI at the time of an online payment are <strong>non-refundable</strong>. These fees cover the cost of processing the transaction and are deemed fully rendered once the payment has been submitted, regardless of whether the underlying school fee is later refunded by the school.
        </p>

        <h2>5. Subscription Cancellation</h2>
        <p>
          Schools using EdZen AI on a subscription basis may cancel their subscription at any time by providing 30 days' written notice. Upon cancellation:
        </p>
        <ul>
          <li>Access to the platform will continue until the end of the current billing period.</li>
          <li>No pro-rata refunds will be issued for the remaining days of a billing cycle.</li>
          <li>School data will be retained for 90 days post-cancellation to allow export, after which it will be permanently deleted.</li>
        </ul>

        <h2>6. Disputes</h2>
        <p>
          For any payment dispute related to school fees, the parent/guardian must first approach the school administration. If the dispute involves a platform or convenience fee charged by EdZen AI, please contact us directly at the address below.
        </p>

        <h2>7. Contact Us</h2>
        <p>
          For questions regarding this Refund &amp; Cancellation Policy, please reach out to us:
        </p>
        <ul>
          <li>Email: <a href="mailto:support@edzenai.com" className="text-primary">support@edzenai.com</a></li>
          <li>Address: Dimapur, Nagaland, India</li>
        </ul>
        <p>
          You may also visit our <Link to="/contact" className="text-primary">Contact page</Link> for additional support options.
        </p>
      </article>
    </div>
  );
}
