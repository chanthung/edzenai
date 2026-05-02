import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send, Loader2, Calendar, Rocket, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

/* ─── Types ─── */
type Msg = { role: "user" | "assistant"; content: string };

/* ─── Predefined FAQ knowledge base ─── */
const FAQ_MAP: Record<string, string> = {
  "What is EdZen AI?": `EdZen AI is an all-in-one school management platform designed to simplify operations.

It helps schools manage:
• **Fees & payments** — track, collect, and report
• **Attendance** — daily marking with parent notifications
• **Student performance** — NEP 2020 aligned assessments & report cards
• **Parent communication** — via WhatsApp, no app needed

It also includes **AI-based insights** to improve student outcomes.`,

  "How does fee collection work?": `EdZen AI allows schools to:

• Send **fee reminders via WhatsApp** automatically
• Share **parent payment links** (no app required)
• Track **paid/pending fees** instantly
• Accept **UPI / QR-based payments**

Admins get a clear dashboard of all collections with class-wise breakdowns.`,

  "Pricing?": `Pricing depends on the size of your school.

We offer flexible plans with:
• **No setup cost**
• **Monthly or yearly** options (save 10% annually)
• Starts at just **₹7/student/month**

👉 Would you like a quick quote based on your school size?`,

  "Free trial?": `Yes! We offer a **30-day free Pro trial**.

• No credit card required
• Access **all features** including progress module
• Full support during trial

You can explore everything before deciding.`,

  "WhatsApp integration?": `Yes — EdZen AI uses WhatsApp to:

• Send **fee reminders** automatically
• Share **payment links** directly
• Notify parents **instantly** about attendance & updates

No separate app download needed for parents — they just receive messages.`,

  "CBSE/ICSE support?": `Yes — EdZen AI supports:

• **CBSE**
• **CISCE** (ICSE/ISC)
• **State Boards**

It adapts subjects, reports, and assessment workflows based on your board. NEP 2020 competency-based assessments are built in.`,
};

/* ─── Intent matching for free-text questions ─── */
const INTENT_KEYWORDS: { keywords: string[]; answer: string }[] = [
  { keywords: ["what is", "about edzen", "tell me about", "what does"], answer: FAQ_MAP["What is EdZen AI?"]! },
  { keywords: ["fee", "payment", "collect", "billing", "upi"], answer: FAQ_MAP["How does fee collection work?"]! },
  { keywords: ["price", "pricing", "cost", "plan", "how much", "rate"], answer: FAQ_MAP["Pricing?"]! },
  { keywords: ["trial", "free", "demo try"], answer: FAQ_MAP["Free trial?"]! },
  { keywords: ["whatsapp", "message", "sms", "notify", "notification"], answer: FAQ_MAP["WhatsApp integration?"]! },
  { keywords: ["cbse", "icse", "cisce", "board", "state board", "nep"], answer: FAQ_MAP["CBSE/ICSE support?"]! },
  { keywords: ["attendance"], answer: "EdZen AI includes a **daily attendance module**. Teachers tap to mark Present, Absent, Late, or Leave. Parents can view attendance through their unique access link — no app download needed." },
  { keywords: ["report card", "progress", "marks", "assessment"], answer: "EdZen AI has a full **Student Progress module** — create assessments, enter marks, and generate beautiful report cards. It supports NEP 2020 competency-based assessments across all boards." },
];

function matchIntent(text: string): string | null {
  const lower = text.toLowerCase().trim();
  // Exact FAQ match first
  for (const [q, a] of Object.entries(FAQ_MAP)) {
    if (lower === q.toLowerCase() || lower === q.toLowerCase().replace("?", "")) return a;
  }
  // Keyword matching
  for (const { keywords, answer } of INTENT_KEYWORDS) {
    if (keywords.some((kw) => lower.includes(kw))) return answer;
  }
  return null;
}

/* ─── Constants ─── */
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/help-assistant`;
const HISTORY_KEY = "edzen_landing_chat";
const WHATSAPP_URL = "https://wa.me/919876543210?text=Hi%2C%20I%20want%20to%20know%20more%20about%20EdZen%20AI";

const QUICK_CHIPS = [
  "What is EdZen AI?",
  "How does fee collection work?",
  "Pricing?",
  "Free trial?",
  "WhatsApp integration?",
  "CBSE/ICSE support?",
];

const GREETING: Msg = {
  role: "assistant",
  content: `Hi there! 👋 I'm the EdZen AI assistant.\n\nAsk me anything about how EdZen AI helps schools manage fees, attendance, marks, and parent communication.\n\nWhat would you like to know?`,
};

/* ─── Component ─── */
export function LandingChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>(() => {
    try {
      const saved = sessionStorage.getItem(HISTORY_KEY);
      return saved ? JSON.parse(saved) : [GREETING];
    } catch {
      return [GREETING];
    }
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [exchangeCount, setExchangeCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Persist chat
  useEffect(() => {
    try { sessionStorage.setItem(HISTORY_KEY, JSON.stringify(messages)); } catch { /* */ }
  }, [messages]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (scrollRef.current) {
        const vp = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]");
        if (vp) vp.scrollTop = vp.scrollHeight;
      }
    }, 60);
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);
  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);

  /* ─── AI streaming fallback ─── */
  const streamAI = async (allMessages: Msg[]) => {
    const controller = new AbortController();
    abortRef.current = controller;
    let assistantSoFar = "";

    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: allMessages, context: "landing" }),
        signal: controller.signal,
      });

      if (!resp.ok || !resp.body) {
        upsert("I'm having trouble connecting right now. Please try the **Book Demo** button below — our team will be happy to help!");
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let done = false;

      while (!done) {
        const { done: rd, value } = await reader.read();
        if (rd) break;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, nl);
          buf = buf.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || !line.trim() || !line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { done = true; break; }
          try {
            const c = JSON.parse(json).choices?.[0]?.delta?.content;
            if (c) upsert(c);
          } catch {
            buf = line + "\n" + buf;
            break;
          }
        }
      }
    } catch (e: any) {
      if (e.name !== "AbortError") {
        upsert("Sorry, something went wrong. You can also reach us directly via WhatsApp or book a demo!");
      }
    } finally {
      abortRef.current = null;
    }
  };

  /* ─── Send message ─── */
  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    const all = [...messages, userMsg];
    setMessages(all);
    setInput("");
    setIsLoading(true);

    const newCount = exchangeCount + 1;
    setExchangeCount(newCount);

    // Try predefined response first
    const predefined = matchIntent(text);
    if (predefined) {
      // Small delay for natural feel
      await new Promise((r) => setTimeout(r, 300));
      setMessages((prev) => [...prev, { role: "assistant", content: predefined }]);
    } else {
      // AI fallback
      await streamAI(all);
    }

    setIsLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const showCTA = exchangeCount >= 2;
  const showChips = messages.length <= 1;

  return (
    <>
      {/* Floating trigger button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center hover:scale-105 active:scale-95"
          aria-label="Chat with EdZen AI"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[540px] max-h-[calc(100vh-3rem)] flex flex-col rounded-2xl shadow-2xl border border-border/40 bg-background overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-sm leading-tight">EdZen AI Assistant</p>
                <p className="text-[11px] text-white/80 flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-400" />
                  Online — here to help
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="h-8 w-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 px-4 py-3" ref={scrollRef}>
            {/* Date separator */}
            <div className="flex justify-center mb-3">
              <span className="text-[11px] text-muted-foreground bg-muted px-3 py-0.5 rounded-full">Today</span>
            </div>

            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn("mb-3 text-sm", msg.role === "user" ? "flex justify-end" : "flex justify-start")}
              >
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center text-white text-[10px] font-bold mr-2 mt-0.5 shrink-0">
                    E
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-3.5 py-2.5",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm"
                  )}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:my-1 [&_ul]:my-1 [&_li]:my-0.5">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}

            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex justify-start mb-3">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center text-white text-[10px] font-bold mr-2 shrink-0">
                  E
                </div>
                <div className="bg-muted rounded-2xl px-3.5 py-2.5 rounded-bl-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}

            {/* Quick chips - shown only at start */}
            {showChips && !isLoading && (
              <div className="flex flex-wrap gap-2 mt-2 mb-1">
                {QUICK_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    onClick={() => sendMessage(chip)}
                    className="text-xs px-3 py-1.5 rounded-full border border-border hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}

            {/* CTA buttons after 2+ exchanges */}
            {showCTA && !isLoading && (
              <div className="mt-3 mb-1 p-3 rounded-xl bg-primary/5 border border-primary/10">
                <p className="text-xs text-muted-foreground mb-2.5">Would you like to take the next step?</p>
                <div className="flex flex-col gap-2">
                  <Button size="sm" className="h-8 text-xs justify-start gap-2" asChild>
                    <Link to="/book-demo">
                      <Calendar className="h-3.5 w-3.5" />
                      Book a Demo (10 min)
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 text-xs justify-start gap-2" asChild>
                    <Link to="/signup">
                      <Rocket className="h-3.5 w-3.5" />
                      Start Free Trial
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 text-xs justify-start gap-2" asChild>
                    <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                      <Phone className="h-3.5 w-3.5" />
                      Talk to Sales (WhatsApp)
                    </a>
                  </Button>
                </div>
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3 border-t border-border">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about EdZen AI..."
              className="text-sm h-9 rounded-full"
              disabled={isLoading}
            />
            <Button type="submit" size="icon" className="h-9 w-9 shrink-0 rounded-full" disabled={!input.trim() || isLoading}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
