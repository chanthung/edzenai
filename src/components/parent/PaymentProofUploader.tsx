import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Upload, 
  FileImage, 
  FileText, 
  X, 
  AlertTriangle, 
  Clock, 
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { useSubmitPaymentProof, uploadProofFile, PaymentProof, REJECTION_REASON_LABELS } from '@/hooks/usePaymentProofs';
import { toast } from 'sonner';
import { formatDate } from '@/lib/format';

interface PaymentProofUploaderProps {
  studentId: string;
  installmentId: string;
  existingProof: PaymentProof | null;
  onSuccess?: () => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

export function PaymentProofUploader({ 
  studentId, 
  installmentId, 
  existingProof,
  onSuccess 
}: PaymentProofUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const submitProof = useSubmitPaymentProof();

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

  // If there's a pending proof, show pending state
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

  // If there's a rejected proof, show rejection details + re-upload option
  const isRejected = existingProof?.status === 'rejected';

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    setIsUploading(true);
    try {
      // Upload file to storage
      const fileUrl = await uploadProofFile(file, studentId, installmentId);

      // Submit proof record
      await submitProof.mutateAsync({
        student_id: studentId,
        installment_id: installmentId,
        file_url: fileUrl,
        reference_number: referenceNumber || undefined,
      });

      toast.success('Payment proof submitted successfully');
      setFile(null);
      setReferenceNumber('');
      onSuccess?.();
    } catch (error: any) {
      console.error('Error submitting proof:', error);
      toast.error(error.message || 'Failed to submit payment proof');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Rejection notice */}
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

      {/* Upload form */}
      <Card className="border-dashed">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium">
                {isRejected ? 'Re-upload Payment Proof' : 'Upload Payment Proof'}
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                JPG, PNG, or PDF (max 5MB)
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
                  onClick={() => setFile(null)}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            <div>
              <Label htmlFor="reference" className="text-sm">
                Reference Number (Optional)
              </Label>
              <Input
                id="reference"
                placeholder="UPI/Bank reference number"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                disabled={isUploading}
                className="mt-1"
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!file || isUploading}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
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
