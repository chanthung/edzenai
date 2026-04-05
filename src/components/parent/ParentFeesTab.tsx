import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { formatCurrency } from '@/lib/format';
import { QrCode, CreditCard, Phone, Mail, CheckCircle2, Clock, AlertTriangle, Upload } from 'lucide-react';
import { format, parseISO, isBefore, startOfDay } from 'date-fns';
import { PaymentProofUploader } from '@/components/parent/PaymentProofUploader';
import { useState, useMemo } from 'react';
import { ParentViewData } from '@/hooks/useParentView';

interface ParentFeesTabProps {
  data: ParentViewData;
  onProofSuccess: () => void;
}

export function ParentFeesTab({ data, onProofSuccess }: ParentFeesTabProps) {
  const [expandedInstallment, setExpandedInstallment] = useState<string | null>(null);
  const [selectedInstallments, setSelectedInstallments] = useState<Set<string>>(new Set());
  const { student, school, fees, summary } = data;

  // Build a map of installment id -> pending amount for unpaid installments
  const unpaidInstallments = useMemo(() => {
    const map = new Map<string, number>();
    fees.forEach(fee => {
      fee.installments.forEach(inst => {
        const isPaid = inst.status === 'paid';
        const proofVerified = inst.proof?.status === 'verified';
        const proofPending = inst.proof?.status === 'pending';
        if (!isPaid && !proofVerified && !proofPending) {
          const pending = inst.amount - (inst.paid_amount || 0);
          if (pending > 0) map.set(inst.id, pending);
        }
      });
    });
    return map;
  }, [fees]);

  const selectedTotal = useMemo(() => {
    let total = 0;
    selectedInstallments.forEach(id => {
      total += unpaidInstallments.get(id) || 0;
    });
    return total;
  }, [selectedInstallments, unpaidInstallments]);

  const toggleInstallment = (id: string) => {
    setSelectedInstallments(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedInstallments(new Set(unpaidInstallments.keys()));
  };

  const deselectAll = () => {
    setSelectedInstallments(new Set());
  };

  const upiPayUrl = school.upi_id
    ? `upi://pay?pa=${school.upi_id}&pn=${encodeURIComponent(school.name)}${selectedTotal > 0 ? `&am=${selectedTotal}` : ''}`
    : null;

  const paidPercentage = summary.total_fee > 0 
    ? Math.round((summary.total_paid / summary.total_fee) * 100) 
    : 0;

  if (!fees || fees.length === 0) {
    return (
      <Card className="card-elevated">
        <CardContent className="py-12 text-center">
          <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Fees Assigned</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            No fees have been assigned yet. Please contact your school for more information.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card className="card-elevated shadow-lg">
        <CardContent className="p-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Fee</p>
              <p className="text-xl font-bold">{formatCurrency(summary.total_fee)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Paid</p>
              <p className="text-xl font-bold text-status-paid">{formatCurrency(summary.total_paid)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Pending</p>
              <p className="text-xl font-bold text-status-overdue">{formatCurrency(summary.total_pending)}</p>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Payment Progress</span>
              <span className="font-medium">{paidPercentage}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-status-paid rounded-full transition-all duration-500"
                style={{ width: `${paidPercentage}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment QR Code */}
      {school.qr_code_url && (
        <Card className={`card-elevated ${summary.total_pending > 0 ? 'border-primary/20 bg-primary/5' : 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30'}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              {school.upi_id ? (
                <div 
                  onClick={() => {
                    if (upiPayUrl) window.location.href = upiPayUrl;
                  }}
                  className="flex flex-col items-center p-3 bg-background rounded-xl border hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer active:scale-95"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && upiPayUrl) {
                      window.location.href = upiPayUrl;
                    }
                  }}
                >
                  <img 
                    src={school.qr_code_url} 
                    alt="Payment QR Code - Tap to Pay"
                    className="w-24 h-24 object-contain rounded-lg pointer-events-none"
                  />
                  <span className="text-xs text-primary mt-1 font-medium">📱 Tap to Pay</span>
                </div>
              ) : (
                <div className="flex flex-col items-center p-3 bg-background rounded-xl border">
                  <img 
                    src={school.qr_code_url} 
                    alt="Payment QR Code"
                    className="w-24 h-24 object-contain rounded-lg"
                  />
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <QrCode className={`h-4 w-4 ${summary.total_pending > 0 ? 'text-primary' : 'text-green-600'}`} />
                  <p className={`font-semibold ${summary.total_pending > 0 ? 'text-primary' : 'text-green-700 dark:text-green-400'}`}>
                    {summary.total_pending > 0 ? 'Scan to Pay School Fees' : 'All Fees Cleared!'}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground mb-1">
                  {selectedTotal > 0 
                    ? `Selected: ${formatCurrency(selectedTotal)}`
                    : summary.total_pending > 0 
                      ? `Pending: ${formatCurrency(summary.total_pending)}`
                      : 'Save this QR for future payments'
                  }
                </p>
                {selectedTotal > 0 && (
                  <p className="text-xs text-primary font-medium mb-2">
                    ✓ Amount will be pre-filled in UPI app
                  </p>
                )}
                {school.upi_id && summary.total_pending > 0 && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={upiPayUrl!}>
                      Open UPI App {selectedTotal > 0 ? `• ${formatCurrency(selectedTotal)}` : ''}
                    </a>
                  </Button>
                )}
              </div>
            </div>
            {school.upi_id && (
              <p className="text-xs text-muted-foreground text-center mt-3 border-t pt-2">
                UPI ID: {school.upi_id}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Fee Details */}
      {/* Select All / Deselect bar */}
      {unpaidInstallments.size > 0 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-sm text-muted-foreground">
            Select installments to pay together
          </p>
          <Button
            variant="link"
            size="sm"
            className="text-xs h-auto p-0"
            onClick={selectedInstallments.size === unpaidInstallments.size ? deselectAll : selectAll}
          >
            {selectedInstallments.size === unpaidInstallments.size ? 'Deselect All' : 'Select All'}
          </Button>
        </div>
      )}

      {fees.length === 0 ? (
        <Card className="card-elevated">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No fee structures assigned yet.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Please contact the school for more information.
            </p>
          </CardContent>
        </Card>
      ) : (
        fees.map((fee, index) => (
          <Card key={index} className="card-elevated animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{fee.category}</CardTitle>
                  <CardDescription>
                    {fee.is_mandatory ? "Mandatory" : "Optional"} • 
                    Total: {formatCurrency(fee.total_amount)}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="font-semibold text-lg">
                    {fee.pending_amount > 0 
                      ? formatCurrency(fee.pending_amount) 
                      : <span className="text-status-paid">Paid</span>
                    }
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {fee.installments.map((inst) => {
                  const isPaid = inst.status === 'paid';
                  const dueDate = parseISO(inst.due_date);
                  const today = startOfDay(new Date());
                  const isOverdue = !isPaid && isBefore(dueDate, today);
                  const isMonthlyFee = fee.category.toLowerCase().includes('monthly') || 
                                       fee.category.toLowerCase().includes('activity');
                  
                  const hasProof = !!inst.proof;
                  const proofPending = inst.proof?.status === 'pending';
                  const proofRejected = inst.proof?.status === 'rejected';
                  const proofVerified = inst.proof?.status === 'verified';
                  
                  const isExpanded = expandedInstallment === inst.id;
                  const canUploadProof = !isPaid && !proofPending && !proofVerified;
                  
                  const isSelectable = unpaidInstallments.has(inst.id);
                  const isSelected = selectedInstallments.has(inst.id);
                  
                  return (
                    <div key={inst.id} className="space-y-2">
                      <div 
                        className={`flex items-center gap-2 justify-between p-3 rounded-lg ${
                          isSelected ? 'ring-2 ring-primary/40 ' : ''
                        }${
                          isPaid || proofVerified
                            ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800' 
                            : proofPending
                              ? 'bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800'
                              : proofRejected
                                ? 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800'
                                : isOverdue 
                                  ? 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800'
                                  : 'bg-muted/50'
                        }`}
                      >
                        {isSelectable && (
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleInstallment(inst.id)}
                            className="mt-0.5 shrink-0"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {isPaid || proofVerified ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : proofPending ? (
                              <Clock className="h-4 w-4 text-blue-600" />
                            ) : isOverdue || proofRejected ? (
                              <AlertTriangle className="h-4 w-4 text-red-600" />
                            ) : (
                              <Clock className="h-4 w-4 text-amber-600" />
                            )}
                            <p className="font-medium">{inst.name}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              isPaid || proofVerified
                                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                : proofPending
                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                                  : proofRejected
                                    ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                                    : isOverdue 
                                      ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                            }`}>
                              {isPaid || proofVerified 
                                ? 'Cleared' 
                                : proofPending 
                                  ? 'Proof Submitted'
                                  : proofRejected
                                    ? 'Proof Rejected'
                                    : isOverdue 
                                      ? 'Overdue' 
                                      : 'Pending'}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {isPaid || proofVerified ? (
                              inst.payment_date 
                                ? `Paid on ${format(parseISO(inst.payment_date), 'dd MMM yyyy')}`
                                : 'Paid'
                            ) : proofPending ? (
                              <span className="text-blue-600 dark:text-blue-400">
                                Awaiting verification
                              </span>
                            ) : isMonthlyFee ? (
                              <span className="font-medium text-amber-700 dark:text-amber-400">
                                Due by 10th of the month
                              </span>
                            ) : (
                              `Due: ${format(dueDate, 'dd MMM yyyy')}`
                            )}
                          </p>
                        </div>
                        <div className="text-right flex items-center gap-2">
                          <div>
                            <p className={`font-semibold ${isPaid || proofVerified ? 'text-green-700 dark:text-green-400' : ''}`}>
                              {formatCurrency(inst.amount)}
                            </p>
                            {inst.paid_amount > 0 && inst.paid_amount < inst.amount && (
                              <p className="text-xs text-green-600">
                                Paid: {formatCurrency(inst.paid_amount)}
                              </p>
                            )}
                          </div>
                          {canUploadProof && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedInstallment(isExpanded ? null : inst.id)}
                              className="ml-2"
                            >
                              <Upload className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {/* Proof upload section */}
                      {isExpanded && canUploadProof && (
                        <div className="ml-4 animate-slide-up">
                          <PaymentProofUploader
                            studentId={student.id}
                            installmentId={inst.id}
                            existingProof={inst.proof}
                            onSuccess={onProofSuccess}
                          />
                        </div>
                      )}
                      
                      {/* Show rejection details inline if not expanded */}
                      {proofRejected && !isExpanded && (
                        <div className="ml-4">
                          <PaymentProofUploader
                            studentId={student.id}
                            installmentId={inst.id}
                            existingProof={inst.proof}
                            onSuccess={onProofSuccess}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {/* Payment Options */}
      {(school.upi_id || school.qr_code_url) && summary.total_pending > 0 && (
        <Card className="card-elevated">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Payment Options</CardTitle>
            </div>
            <CardDescription>
              After payment, upload proof for each installment above for faster verification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {school.qr_code_url && (
              <div className="flex flex-col items-center p-4 bg-muted/50 rounded-xl">
                <p className="text-sm font-medium mb-3">Scan to Pay</p>
                <img 
                  src={school.qr_code_url} 
                  alt="Payment QR Code"
                  className="max-w-[200px] rounded-lg"
                />
              </div>
            )}
            
            {school.upi_id && (
              <div className="space-y-3">
                <p className="text-sm font-medium">Or pay via UPI</p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" asChild className="flex-1">
                    <a href={upiPayUrl!}>
                      <QrCode className="h-4 w-4 mr-2" />
                      Open UPI App {selectedTotal > 0 ? `• ${formatCurrency(selectedTotal)}` : ''}
                    </a>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  UPI ID: {school.upi_id}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Contact */}
      {(school.phone || school.email) && (
        <Card className="card-elevated">
          <CardContent className="py-4">
            <p className="text-sm font-medium mb-3">Need Help?</p>
            <div className="flex flex-wrap gap-3">
              {school.phone && (
                <Button variant="outline" size="sm" asChild>
                  <a href={`tel:${school.phone}`}>
                    <Phone className="h-4 w-4 mr-1" />
                    Call School
                  </a>
                </Button>
              )}
              {school.email && (
                <Button variant="outline" size="sm" asChild>
                  <a href={`mailto:${school.email}`}>
                    <Mail className="h-4 w-4 mr-1" />
                    Email
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
