import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2, Smartphone } from "lucide-react";

interface PaymentMethodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectUPI: () => void;
  onSelectCard: () => void;
  loading: boolean;
  loadingMethod: "upi" | "card" | null;
  planLabel: string;
}

export function PaymentMethodDialog({
  open,
  onOpenChange,
  onSelectUPI,
  onSelectCard,
  loading,
  loadingMethod,
  planLabel,
}: PaymentMethodDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose Payment Method</DialogTitle>
          <DialogDescription>
            Subscribe to {planLabel}. Select how you'd like to pay.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-4">
          <Button
            variant="outline"
            className="h-auto py-4 px-4 flex items-center gap-4 justify-start border-2 hover:border-primary/60 transition-all"
            onClick={onSelectUPI}
            disabled={loading}
          >
            {loadingMethod === "upi" ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary shrink-0" />
            ) : (
              <Smartphone className="h-8 w-8 text-primary shrink-0" />
            )}
            <div className="text-left">
              <p className="font-semibold text-foreground">Pay with UPI</p>
              <p className="text-xs text-muted-foreground">
                Recommended for India • GPay, PhonePe, Paytm & more
              </p>
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-auto py-4 px-4 flex items-center gap-4 justify-start border-2 hover:border-primary/60 transition-all"
            onClick={onSelectCard}
            disabled={loading}
          >
            {loadingMethod === "card" ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary shrink-0" />
            ) : (
              <CreditCard className="h-8 w-8 text-primary shrink-0" />
            )}
            <div className="text-left">
              <p className="font-semibold text-foreground">Pay with Card / International</p>
              <p className="text-xs text-muted-foreground">
                Visa, Mastercard, Amex & PayPal
              </p>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
