import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  GraduationCap, 
  Shield, 
  Clock, 
  Users, 
  CheckCircle2, 
  ArrowRight,
  Smartphone,
  QrCode,
  Eye
} from "lucide-react";

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">SchoolFees</span>
          </div>
          <Button asChild>
            <Link to="/login">Sign In</Link>
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Shield className="h-4 w-4" />
            Trusted by schools across India
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Fee transparency that{" "}
            <span className="text-primary">builds trust</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Stop the endless phone calls about fee status. Give parents a clear, 
            real-time view of their child's fees — no login required.
          </p>
          <Button size="lg" asChild className="min-w-[200px]">
            <Link to="/login">
              School Admin Login
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">The fee confusion ends here</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Fee information scattered across circulars, WhatsApp groups, and diaries 
              creates anxiety for parents and endless work for school staff.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="card-elevated">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6 text-destructive" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Unclear Due Dates</h3>
                <p className="text-muted-foreground">
                  Parents miss payment deadlines because information is buried in old notices.
                </p>
              </CardContent>
            </Card>
            <Card className="card-elevated">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-xl bg-status-due/10 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-status-due" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Repetitive Queries</h3>
                <p className="text-muted-foreground">
                  Staff waste hours answering the same "how much is pending?" questions.
                </p>
              </CardContent>
            </Card>
            <Card className="card-elevated">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Trust Issues</h3>
                <p className="text-muted-foreground">
                  Without clear records, fee disputes damage the school-parent relationship.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How SchoolFees works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A simple, transparent system that works for everyone.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <FeatureItem 
                icon={Users}
                title="School sets up fee structure"
                description="Define fee categories, amounts, and installment due dates for each academic year."
              />
              <FeatureItem 
                icon={Smartphone}
                title="Parents get a unique link"
                description="Each student has a secure, shareable link — no login or password needed."
              />
              <FeatureItem 
                icon={Eye}
                title="Real-time fee visibility"
                description="Parents see total, paid, pending amounts, and upcoming due dates in seconds."
              />
              <FeatureItem 
                icon={QrCode}
                title="Easy payment guidance"
                description="Display your school's UPI QR code. Payments recorded manually by admin."
              />
            </div>
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-3xl p-8">
              <div className="bg-card rounded-2xl shadow-lg p-6 space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <GraduationCap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Delhi Public School</p>
                    <p className="text-sm text-muted-foreground">Fee Statement</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center py-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="font-bold">₹85,000</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Paid</p>
                    <p className="font-bold text-status-paid">₹42,500</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Pending</p>
                    <p className="font-bold text-status-overdue">₹42,500</p>
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full w-1/2 bg-status-paid rounded-full" />
                </div>
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between p-3 bg-status-paid-bg rounded-lg">
                    <span className="text-sm">Q1 Payment</span>
                    <span className="text-xs status-paid px-2 py-1 rounded-full">Paid</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-status-due-bg rounded-lg">
                    <span className="text-sm">Q2 Payment</span>
                    <span className="text-xs status-due px-2 py-1 rounded-full">Due Soon</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to reduce fee-related stress?
          </h2>
          <p className="text-primary-foreground/80 text-lg mb-8 max-w-2xl mx-auto">
            Contact our team to get your school onboarded. 
            Set up in minutes, not weeks.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link to="/login">
              Sign In to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            <span className="font-semibold">SchoolFees</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Built for schools. Loved by parents.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureItem({ 
  icon: Icon, 
  title, 
  description 
}: { 
  icon: typeof CheckCircle2; 
  title: string; 
  description: string; 
}) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <h3 className="font-semibold mb-1">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
