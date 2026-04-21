import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileImage, 
  FileText, 
  X, 
  AlertTriangle, 
  Clock, 
  CheckCircle2,
  Loader2,
  Sparkles,
  ScanLine,
} from 'lucide-react';
import { useSubmitPaymentProof, uploadProofFile, PaymentProof, REJECTION_REASON_LABELS } from '@/hooks/usePaymentProofs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDate } from '@/lib/format';

interface PaymentProofUploaderProps {
  studentId: string;
  installmentId: string;
  installmentAmount?: number;
  existingProof: PaymentProof | null;
  onSuccess?: () => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

interface OcrResult {
  ocr_status: 'success' | 'failed';
  ocr_confidence?: 'high' | 'medium' | 'low';
  amount?: number | null;
  transaction_id?: string | null;
  date?: string | null;
  reason?: string;
}

export function PaymentProofUploader({ 
  studentId, 
  installmentId, 
  installmentAmount,
  existingProof,
  onSuccess 
}: PaymentProofUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [ocr, setOcr] = useState<OcrResult | null>(null);
  const [autoFilledAmount, setAutoFilledAmount] = useState(false);
  const [autoFilledUtr, setAutoFilledUtr] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const submitProof = useSubmitPaymentProof();

  // Pre-fill amount from installment when component mounts (if not already set)
  useEffect(() => {
    if (!amountPaid && installmentAmount) {
      setAmountPaid(String(installmentAmount));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [installmentAmount]);

  // If there's a verified proof, show success state
  if (existingProof?.status === 'verified') {
    return (
      <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800 text-sm">
        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
        <span className="text-green-700 dark:text-green-300">
          Payment verified on {formatDate(existingProof.verified_at!)}
        </span>
      </div>
    );
  }

  if (existingProof?.status === 'pending') {
    return (
      <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800 text-sm">
        <Clock className="h-4 w-4 text-amber-600 flex-shrink-0" />
        <span className="text-amber-700 dark:text-amber-300">
          Proof submitted - Pending verification
        </span>
      </div>
    );
  }

  const isRejected = existingProof?.status === 'rejected';

  const runOcr = async (selectedFile: File, fileUrl: string) => {
    setIsScanning(true);
    setOcr(null);
    try {
      const { data, error } = await supabase.functions.invoke('ocr-payment-proof', {
        body: { fileUrl, mimeType: selectedFile.type },
      });
      if (error) throw error;
      const result = data as OcrResult;
      setOcr(result);

      if (result.ocr_status === 'success') {
        if (typeof result.amount === 'number' && result.amount > 0) {
          setAmountPaid(String(result.amount));
          setAutoFilledAmount(true);
        }
        if (result.transaction_id) {
          setReferenceNumber(result.transaction_id);
          setAutoFilledUtr(true);
        }
      }
    } catch (err) {
      console.warn('OCR failed:', err);
      setOcr({ ocr_status: 'failed', reason: 'Network error' });
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      toast.error('Please upload a JPG, PNG, or PDF file');
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setFile(selectedFile);
    setOcr(null);
    setAutoFilledAmount(false);
    setAutoFilledUtr(false);

    // Upload immediately so OCR can read it from the bucket URL
    setIsUploading(true);
    try {
      const url = await uploadProofFile(selectedFile, studentId, installmentId);
      setUploadedUrl(url);
      setIsUploading(false);
      // Run OCR (only for images; PDFs will return failed)
      if (selectedFile.type.startsWith('image/')) {
        await runOcr(selectedFile, url);
      } else {
        setOcr({ ocr_status: 'failed', reason: 'PDF — manual entry required' });
      }
    } catch (err: any) {
      setIsUploading(false);
      console.error('Upload failed:', err);
      toast.error(err.message || 'Failed to upload file');
      setFile(null);
    }
  };

  const handleClearFile = () => {
    setFile(null);
    setUploadedUrl(null);
    setOcr(null);
    setAutoFilledAmount(false);
    setAutoFilledUtr(false);
  };

  const handleSubmit = async () => {
    if (!file || !uploadedUrl) {
      toast.error('Please upload a screenshot first');
      return;
    }
    const amountNum = Number(amountPaid);
    if (!amountPaid || isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (!referenceNumber.trim()) {
      toast.error('Please enter the Transaction ID (UTR)');
      return;
    }

    try {
      await submitProof.mutateAsync({
        student_id: studentId,
        installment_id: installmentId,
        file_url: uploadedUrl,
        reference_number: referenceNumber.trim(),
        amount_paid: amountNum,
        ocr_amount: ocr?.amount ?? null,
        ocr_transaction_id: ocr?.transaction_id ?? null,
        ocr_date: ocr?.date ?? null,
        ocr_status: ocr?.ocr_status ?? 'failed',
        ocr_confidence: ocr?.ocr_confidence ?? null,
      });

      toast.success('Payment proof submitted successfully');
      setFile(null);
      setUploadedUrl(null);
      setReferenceNumber('');
      setAmountPaid(installmentAmount ? String(installmentAmount) : '');
      setOcr(null);
      setAutoFilledAmount(false);
      setAutoFilledUtr(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error submitting proof:', error);
      const msg: string = error?.message || '';
      if (msg.toLowerCase().includes('duplicate') || msg.includes('idx_payment_proofs_unique_utr_per_school') || msg.includes('23505')) {
        toast.error('This Transaction ID has already been submitted. Please check the UTR or contact the school.');
      } else {
        toast.error(msg || 'Failed to submit payment proof');
      }
    }
  };

  return (
    <div className="space-y-3">
      {isRejected && (
        <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-red-700 dark:text-red-300">
                Proof Rejected
              </p>
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                <span className="font-medium">Reason:</span>{' '}
                {REJECTION_REASON_LABELS[existingProof.rejection_reason!]}
              </p>
              {existingProof.rejection_message && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  <span className="font-medium">Message:</span>{' '}
                  {existingProof.rejection_message}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <Card className="border-dashed">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium">
                {isRejected ? 'Re-upload Payment Proof' : 'Upload Payment Proof'}
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                JPG, PNG, or PDF (max 5MB) — we'll auto-detect the amount & UTR
              </p>
            </div>

            {!file ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
              >
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Click to upload screenshot
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                {file.type === 'application/pdf' ? (
                  <FileText className="h-8 w-8 text-red-500" />
                ) : (
                  <FileImage className="h-8 w-8 text-blue-500" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClearFile}
                  disabled={isUploading || isScanning || submitProof.isPending}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* OCR status */}
            {file && (isUploading || isScanning) && (
              <div className="flex items-center gap-2 p-2 bg-primary/5 border border-primary/20 rounded-lg text-sm">
                <ScanLine className="h-4 w-4 text-primary animate-pulse" />
                <span className="text-primary">
                  {isUploading ? 'Uploading screenshot…' : '🔍 Scanning screenshot…'}
                </span>
              </div>
            )}

            {file && !isUploading && !isScanning && ocr?.ocr_status === 'success' && (autoFilledAmount || autoFilledUtr) && (
              <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg text-sm">
                <Sparkles className="h-4 w-4 text-green-600" />
                <span className="text-green-700 dark:text-green-300">
                  Details auto-detected — please confirm before submitting
                </span>
              </div>
            )}

            {file && !isUploading && !isScanning && ocr?.ocr_status === 'failed' && (
              <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-sm">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span className="text-amber-700 dark:text-amber-300">
                  Could not detect details — please enter manually
                </span>
              </div>
            )}

            {/* Amount Paid */}
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="amount-paid" className="text-sm">
                  Amount Paid (₹) <span className="text-destructive">*</span>
                </Label>
                {autoFilledAmount && (
                  <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                    <Sparkles className="h-2.5 w-2.5 mr-0.5" /> auto
                  </Badge>
                )}
              </div>
              <Input
                id="amount-paid"
                type="number"
                inputMode="decimal"
                placeholder="e.g. 5000"
                value={amountPaid}
                onChange={(e) => { setAmountPaid(e.target.value); setAutoFilledAmount(false); }}
                disabled={submitProof.isPending}
                className="mt-1"
              />
            </div>

            {/* Transaction ID (UTR) — required */}
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="reference" className="text-sm">
                  Transaction ID / UTR <span className="text-destructive">*</span>
                </Label>
                {autoFilledUtr && (
                  <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                    <Sparkles className="h-2.5 w-2.5 mr-0.5" /> auto
                  </Badge>
                )}
              </div>
              <Input
                id="reference"
                placeholder="UPI / Bank reference number"
                value={referenceNumber}
                onChange={(e) => { setReferenceNumber(e.target.value); setAutoFilledUtr(false); }}
                disabled={submitProof.isPending}
                className="mt-1"
              />
            </div>

            <p className="text-xs text-muted-foreground italic">
              Please confirm the details above before submitting.
            </p>

            <Button
              onClick={handleSubmit}
              disabled={!file || !uploadedUrl || isUploading || isScanning || submitProof.isPending}
              className="w-full"
            >
              {submitProof.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Submit Proof
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
