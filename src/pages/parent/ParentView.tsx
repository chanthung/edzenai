import { useParams } from "react-router-dom";
import { useParentView } from "@/hooks/useParentView";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/format";
import { GraduationCap, Phone, Mail, QrCode, CreditCard, AlertCircle, CheckCircle2, Clock, AlertTriangle, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, parseISO, isBefore, startOfDay } from "date-fns";
import { PaymentProofUploader } from "@/components/parent/PaymentProofUploader";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

export default function ParentView() {
  const { token } = useParams<{ token: string }>();
  const { data, isLoading, error } = useParentView(token);
  const queryClient = useQueryClient();
  const [expandedInstallment, setExpandedInstallment] = useState<string | null>(null);

  if (isLoading) {
    return <ParentViewSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Link Not Found</h2>
            <p className="text-muted-foreground">
              This fee link is invalid or has expired. Please contact your school for a new link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { student, school, fees, summary } = data;
  const paidPercentage = summary.total_fee > 0 
    ? Math.round((summary.total_paid / summary.total_fee) * 100) 
    : 0;

  const handleProofSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['parent-view', token] });
    setExpandedInstallment(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-semibold text-lg">{school.name}</h1>
              <p className="text-primary-foreground/80 text-sm">Fee Statement</p>
            </div>
          </div>
          
          <div className="bg-primary-foreground/10 rounded-xl p-4">
            <p className="text-primary-foreground/80 text-sm mb-1">Student</p>
            <p className="font-semibold text-xl">{student.name}</p>
            {student.class_name && (
              <p className="text-primary-foreground/80 text-sm mt-1">
                Class {student.class_name}{student.section && `-${student.section}`}
                {student.roll_number && ` • Roll: ${student.roll_number}`}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* Summary Card */}
      <div className="max-w-2xl mx-auto px-4 -mt-4">
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
      </div>

      {/* Payment QR Code - Always visible if available */}
      {school.qr_code_url && (
        <div className="max-w-2xl mx-auto px-4 mt-4">
          <Card className={`card-elevated ${summary.total_pending > 0 ? 'border-primary/20 bg-primary/5' : 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30'}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                {school.upi_id && summary.total_pending > 0 ? (
                  <a 
                    href={`upi://pay?pa=${school.upi_id}&pn=${encodeURIComponent(school.name)}`}
                    className="flex flex-col items-center p-3 bg-background rounded-xl border hover:border-primary transition-colors cursor-pointer"
                  >
                    <img 
                      src={school.qr_code_url} 
                      alt="Payment QR Code - Tap to Pay"
                      className="w-24 h-24 object-contain rounded-lg"
                    />
                    <span className="text-xs text-primary mt-1 font-medium">Tap to Pay</span>
                  </a>
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
                  <p className="text-sm text-muted-foreground mb-2">
                    {summary.total_pending > 0 
                      ? `Pending: ${formatCurrency(summary.total_pending)}`
                      : 'Save this QR for future payments'
                    }
                  </p>
                  {school.upi_id && summary.total_pending > 0 && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={`upi://pay?pa=${school.upi_id}&pn=${encodeURIComponent(school.name)}`}>
                        Open UPI App
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
        </div>
      )}

      {/* Fee Details */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
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
                    
                    return (
                      <div key={inst.id} className="space-y-2">
                        <div 
                          className={`flex items-center justify-between p-3 rounded-lg ${
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
                              onSuccess={handleProofSuccess}
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
                              onSuccess={handleProofSuccess}
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
                      <a href={`upi://pay?pa=${school.upi_id}&pn=${encodeURIComponent(school.name)}`}>
                        <QrCode className="h-4 w-4 mr-2" />
                        Open UPI App
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

      {/* Footer */}
      <footer className="max-w-2xl mx-auto px-4 pb-8 text-center">
        <p className="text-xs text-muted-foreground">
          Upload payment proof after making a payment for faster verification by the school.
        </p>
      </footer>
    </div>
  );
}

function ParentViewSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary text-primary-foreground px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Skeleton className="h-12 w-12 rounded-xl bg-primary-foreground/20" />
            <div>
              <Skeleton className="h-5 w-32 bg-primary-foreground/20" />
              <Skeleton className="h-4 w-24 mt-1 bg-primary-foreground/20" />
            </div>
          </div>
          <Skeleton className="h-24 w-full rounded-xl bg-primary-foreground/10" />
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-4 -mt-4">
        <Card className="card-elevated">
          <CardContent className="p-6">
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="text-center">
                  <Skeleton className="h-4 w-16 mx-auto mb-2" />
                  <Skeleton className="h-6 w-20 mx-auto" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
