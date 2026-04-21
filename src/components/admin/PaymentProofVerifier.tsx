import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  User, 
  Calendar, 
  FileText,
  Loader2,
  AlertTriangle,
  Lock
} from 'lucide-react';
import { 
  useVerifyPaymentProof, 
  useRejectPaymentProof, 
  ProofRejectionReason,
  REJECTION_REASON_LABELS 
} from '@/hooks/usePaymentProofs';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { RestrictedButton } from '@/components/admin/RestrictedOverlay';
import { OcrComparisonPanel } from '@/components/admin/OcrComparisonPanel';
import { formatCurrency, formatDate } from '@/lib/format';
import { toast } from 'sonner';

interface ProofWithDetails {
  id: string;
  file_url: string;
  reference_number: string | null;
  created_at: string;
  amount_paid?: number | null;
  ocr_amount?: number | null;
  ocr_transaction_id?: string | null;
  ocr_date?: string | null;
  ocr_status?: 'pending' | 'success' | 'failed' | null;
  ocr_confidence?: 'high' | 'medium' | 'low' | null;
  students: {
    id: string;
    name: string;
    class_name: string | null;
    section: string | null;
    roll_number: string | null;
  };
  installments: {
    id: string;
    name: string;
    amount: number;
    due_date: string;
    fee_structures: {
      id: string;
      fee_categories: {
        id: string;
        name: string;
      };
    };
  };
}

interface PaymentProofVerifierProps {
  proof: ProofWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const WORD_LIMIT = 30;

export function PaymentProofVerifier({ proof, open, onOpenChange }: PaymentProofVerifierProps) {
  const [mode, setMode] = useState<'view' | 'reject'>('view');
  const [bankVerified, setBankVerified] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState<ProofRejectionReason | ''>('');
  const [rejectionMessage, setRejectionMessage] = useState('');
  const { isRestricted } = useSubscriptionStatus();

  const verifyProof = useVerifyPaymentProof();
  const rejectProof = useRejectPaymentProof();

  const wordCount = rejectionMessage.trim().split(/\s+/).filter(Boolean).length;
  const isOverLimit = wordCount > WORD_LIMIT;

  const resetState = () => {
    setMode('view');
    setBankVerified(false);
    setAdminNotes('');
    setRejectionReason('');
    setRejectionMessage('');
  };

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  const handleVerify = async () => {
    if (!proof) return;

    // Use parent-entered amount when present, fallback to installment amount
    const amountToRecord = typeof proof.amount_paid === 'number' && proof.amount_paid > 0
      ? proof.amount_paid
      : proof.installments.amount;

    try {
      await verifyProof.mutateAsync({
        proofId: proof.id,
        bankVerified,
        adminNotes: adminNotes || undefined,
        studentId: proof.students.id,
        installmentId: proof.installments.id,
        amount: amountToRecord,
      });

      // Fire-and-forget WhatsApp confirmation
      supabase.functions.invoke('send-payment-confirmation', {
        body: { studentId: proof.students.id, amount: proof.installments.amount },
      }).then(({ error }) => {
        if (error) console.warn('WhatsApp confirmation failed:', error);
      }).catch(console.warn);

      // Fire-and-forget payment receipt email
      if ((proof.students as any).parent_email) {
        supabase.functions.invoke('send-transactional-email', {
          body: {
            templateName: 'payment-receipt',
            recipientEmail: (proof.students as any).parent_email,
            idempotencyKey: `payment-receipt-proof-${proof.id}`,
            templateData: {
              studentName: proof.students.name,
              amount: proof.installments.amount.toLocaleString('en-IN'),
              paymentDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
            },
          },
        }).catch(err => console.warn('Payment email failed:', err));
      }

      toast.success('Payment verified and recorded successfully');
      handleClose();
    } catch (error: any) {
      console.error('Error verifying proof:', error);
      toast.error(error.message || 'Failed to verify payment');
    }
  };

  const handleReject = async () => {
    if (!proof || !rejectionReason) return;

    if (isOverLimit) {
      toast.error(`Message must be ${WORD_LIMIT} words or less`);
      return;
    }

    try {
      await rejectProof.mutateAsync({
        proofId: proof.id,
        rejectionReason,
        rejectionMessage: rejectionMessage || undefined,
      });

      toast.success('Payment proof rejected');
      handleClose();
    } catch (error: any) {
      console.error('Error rejecting proof:', error);
      toast.error(error.message || 'Failed to reject proof');
    }
  };

  if (!proof) return null;

  const student = proof.students;
  const installment = proof.installments;
  const category = installment.fee_structures.fee_categories;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Verify Payment Proof</DialogTitle>
          <DialogDescription>
            Review the payment proof and verify or reject it
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Restriction Banner */}
          {isRestricted && (
            <Alert className="border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20">
              <Lock className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-700 dark:text-amber-300">
                School is inactive. Verification actions are disabled.
              </AlertDescription>
            </Alert>
          )}

          {/* Student Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{student.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Class {student.class_name}{student.section && `-${student.section}`}
                    {student.roll_number && ` • Roll: ${student.roll_number}`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fee Details */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Fee Category</p>
              <p className="font-medium">{category.name}</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Installment</p>
              <p className="font-medium">{installment.name}</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Amount</p>
              <p className="font-medium text-lg">{formatCurrency(installment.amount)}</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Due Date</p>
              <p className="font-medium">{formatDate(installment.due_date)}</p>
            </div>
          </div>

          {/* Proof Details */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Payment Proof</Label>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                Uploaded {formatDate(proof.created_at)}
              </div>
            </div>
            
            <a
              href={proof.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <div className="border rounded-lg overflow-hidden hover:border-primary transition-colors">
                {proof.file_url.toLowerCase().endsWith('.pdf') ? (
                  <div className="p-8 bg-muted/50 flex flex-col items-center gap-2">
                    <FileText className="h-12 w-12 text-red-500" />
                    <span className="text-sm text-muted-foreground">PDF Document</span>
                  </div>
                ) : (
                  <img
                    src={proof.file_url}
                    alt="Payment proof"
                    className="w-full max-h-64 object-contain bg-muted/50"
                  />
                )}
                <div className="p-2 bg-muted/30 flex items-center justify-center gap-2 text-sm text-primary">
                  <ExternalLink className="h-4 w-4" />
                  Open in new tab
                </div>
              </div>
            </a>

            {proof.reference_number && (
              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                <span className="text-sm text-muted-foreground">Reference:</span>
                <Badge variant="outline">{proof.reference_number}</Badge>
              </div>
            )}
          </div>

          {/* OCR Comparison Panel */}
          <OcrComparisonPanel
            expectedAmount={installment.amount}
            enteredAmount={proof.amount_paid ?? null}
            enteredUtr={proof.reference_number}
            ocrAmount={proof.ocr_amount ?? null}
            ocrUtr={proof.ocr_transaction_id ?? null}
            ocrDate={proof.ocr_date ?? null}
            ocrStatus={proof.ocr_status ?? null}
            ocrConfidence={proof.ocr_confidence ?? null}
          />

          {/* Verification Mode */}
          {mode === 'view' && (
            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="bank-verified"
                  checked={bankVerified}
                  onCheckedChange={(checked) => setBankVerified(checked === true)}
                  disabled={isRestricted}
                />
                <Label htmlFor="bank-verified" className={`text-sm font-medium ${isRestricted ? 'text-muted-foreground cursor-not-allowed' : 'cursor-pointer'}`}>
                  Verified against bank credit / SMS
                </Label>
              </div>

              <div>
                <Label htmlFor="admin-notes" className="text-sm">
                  Internal Notes (Optional)
                </Label>
                <Textarea
                  id="admin-notes"
                  placeholder="Add any internal notes about this verification..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="mt-1"
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* Rejection Mode */}
          {mode === 'reject' && (
            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-950/30 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-700 dark:text-red-300">
                  Rejecting this proof will notify the parent
                </span>
              </div>

              <div>
                <Label htmlFor="rejection-reason" className="text-sm font-medium">
                  Rejection Reason <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={rejectionReason}
                  onValueChange={(v) => setRejectionReason(v as ProofRejectionReason)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(REJECTION_REASON_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="rejection-message" className="text-sm">
                    Custom Message (Optional)
                  </Label>
                  <span className={`text-xs ${isOverLimit ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {wordCount}/{WORD_LIMIT} words
                  </span>
                </div>
                <Textarea
                  id="rejection-message"
                  placeholder="Provide additional guidance to the parent..."
                  value={rejectionMessage}
                  onChange={(e) => setRejectionMessage(e.target.value)}
                  className={`mt-1 ${isOverLimit ? 'border-destructive' : ''}`}
                  rows={2}
                />
                {isOverLimit && (
                  <p className="text-xs text-destructive mt-1">
                    Message exceeds {WORD_LIMIT} word limit
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {mode === 'view' ? (
            <>
              <RestrictedButton isRestricted={isRestricted}>
                <Button
                  variant="outline"
                  onClick={() => setMode('reject')}
                  className="text-destructive hover:text-destructive"
                  disabled={isRestricted}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Proof
                </Button>
              </RestrictedButton>
              <RestrictedButton isRestricted={isRestricted}>
                <Button
                  onClick={handleVerify}
                  disabled={verifyProof.isPending || isRestricted}
                >
                  {verifyProof.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  )}
                  Verify & Mark Paid
                </Button>
              </RestrictedButton>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setMode('view')}>
                Back
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={!rejectionReason || isOverLimit || rejectProof.isPending}
              >
                {rejectProof.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4 mr-2" />
                )}
                Confirm Rejection
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
