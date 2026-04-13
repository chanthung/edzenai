import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

declare global {
  interface Window {
    Razorpay: any;
  }
}

let razorpayLoaded = false;

function loadRazorpayScript(): Promise<void> {
  if (razorpayLoaded) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => {
      razorpayLoaded = true;
      resolve();
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

interface RazorpayCheckoutOptions {
  schoolId: string;
  userId: string;
  plan: "starter" | "pro";
  billingCycle: "monthly" | "annual";
  studentCount: number;
  customerEmail?: string;
  customerName?: string;
  onSuccess?: () => void;
}

export function useRazorpayCheckout() {
  const [loading, setLoading] = useState(false);

  const openCheckout = async (options: RazorpayCheckoutOptions) => {
    setLoading(true);
    try {
      await loadRazorpayScript();

      // Create order via edge function
      const { data, error } = await supabase.functions.invoke(
        "create-razorpay-order",
        {
          body: {
            schoolId: options.schoolId,
            userId: options.userId,
            plan: options.plan,
            billingCycle: options.billingCycle,
            studentCount: options.studentCount,
          },
        }
      );

      if (error || !data?.orderId) {
        throw new Error(error?.message || "Failed to create order");
      }

      // Open Razorpay checkout
      const rzp = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "EdZen AI",
        description: `${options.plan === "pro" ? "Pro" : "Starter"} Plan - ${
          options.billingCycle === "annual" ? "Annual" : "Monthly"
        }`,
        order_id: data.orderId,
        prefill: {
          email: options.customerEmail || "",
          name: options.customerName || "",
        },
        theme: {
          color: "#6366f1",
        },
        handler: async (response: any) => {
          // Verify payment on backend
          try {
            const { error: verifyError } = await supabase.functions.invoke(
              "verify-razorpay-payment",
              {
                body: {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  schoolId: options.schoolId,
                  userId: options.userId,
                  plan: options.plan,
                  billingCycle: options.billingCycle,
                  studentCount: options.studentCount,
                },
              }
            );

            if (verifyError) {
              toast.error("Payment verification failed. Please contact support.");
              return;
            }

            toast.success("Payment successful! Your subscription is now active.");
            options.onSuccess?.();
          } catch {
            toast.error("Payment verification failed. Please contact support.");
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      });

      rzp.on("payment.failed", (response: any) => {
        console.error("Payment failed:", response.error);
        toast.error(`Payment failed: ${response.error.description}`);
        setLoading(false);
      });

      rzp.open();
    } catch (err: any) {
      console.error("Razorpay checkout error:", err);
      toast.error("Failed to open payment. Please try again.");
      setLoading(false);
      throw err;
    }
  };

  return { openCheckout, loading };
}
