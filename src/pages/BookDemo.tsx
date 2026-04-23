import { useSearchParams, Link } from "react-router-dom";
import { CalEmbed } from "@/components/CalEmbed";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

const BookDemo = () => {
  usePageMeta({
    title: "Book a Demo · EdZen AI",
    description: "Schedule a 15-minute demo of EdZen AI — see how schools automate fees, attendance, and progress in minutes.",
  });

  const [params] = useSearchParams();
  const name = params.get("name") ?? undefined;
  const email = params.get("email") ?? undefined;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <Link to="/" className="font-semibold tracking-tight">EdZen AI</Link>
          <div className="w-[88px]" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Book a 15-min demo</h1>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            Pick a time that works for you. We'll walk you through fees, attendance, parent access, and the progress module.
          </p>
        </div>
        <CalEmbed name={name} email={email} height={760} />
      </main>
    </div>
  );
};

export default BookDemo;
