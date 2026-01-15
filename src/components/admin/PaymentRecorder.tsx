import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useStudentFees, useStudentPayments, useRecordPayment, useDeletePayment, Payment } from "@/hooks/useStudentFees";
import { formatCurrency, formatDate, getInstallmentStatus, getStatusLabel } from "@/lib/format";
import { toast } from "sonner";
import { Loader2, IndianRupee, Check, Clock, AlertCircle, Trash2 } from "lucide-react";
import { Student } from "@/hooks/useStudents";

interface PaymentRecorderProps {
  student: Student;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface InstallmentWithPayment {
  id: string;
  name: string;
  amount: number;
  due_date: string;
  paid_amount: number;
  pending_amount: number;
  status: 'paid' | 'upcoming' | 'due' | 'overdue';
  categoryName: string;
  feeStructureId: string;
}

export function PaymentRecorder({ student, open, onOpenChange }: PaymentRecorderProps) {
  const { data: studentFees, isLoading: feesLoading } = useStudentFees(student.id);
  const { data: payments, isLoading: paymentsLoading } = useStudentPayments(student.id);
  const recordPayment = useRecordPayment();
  const deletePayment = useDeletePayment();
  
  const [selectedInstallment, setSelectedInstallment] = useState<string>("");
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentMode, setPaymentMode] = useState<string>("cash");
  const [referenceNumber, setReferenceNumber] = useState<string>("");
  const [isRecording, setIsRecording] = useState(false);

  // Process fee data to get installments with payment status
  const processedInstallments: InstallmentWithPayment[] = [];
  
  const paymentsByInstallment = payments?.reduce((acc, payment) => {
    acc[payment.installment_id] = (acc[payment.installment_id] || 0) + Number(payment.amount_paid);
    return acc;
  }, {} as Record<string, number>) ?? {};

  studentFees?.forEach((sf: any) => {
    const structure = sf.fee_structure;
    const category = structure?.fee_category;
    
    structure?.installments?.forEach((inst: any) => {
      const paidAmount = paymentsByInstallment[inst.id] || 0;
      const isPaid = paidAmount >= inst.amount;
      
      processedInstallments.push({
        id: inst.id,
        name: inst.name,
        amount: Number(inst.amount),
        due_date: inst.due_date,
        paid_amount: paidAmount,
        pending_amount: Math.max(0, Number(inst.amount) - paidAmount),
        status: getInstallmentStatus(inst.due_date, isPaid),
        categoryName: category?.name || "Unknown",
        feeStructureId: structure.id,
      });
    });
  });

  // Sort by due date
  processedInstallments.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

  const selectedInst = processedInstallments.find(i => i.id === selectedInstallment);

  const handleRecordPayment = async () => {
    if (!selectedInstallment || !paymentAmount) {
      toast.error("Please select an installment and enter amount");
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setIsRecording(true);
    try {
      await recordPayment.mutateAsync({
        student_id: student.id,
        installment_id: selectedInstallment,
        amount_paid: amount,
        payment_date: new Date().toISOString().split('T')[0],
        payment_mode: paymentMode,
        reference_number: referenceNumber || undefined,
      });
      toast.success("Payment recorded successfully");
      setSelectedInstallment("");
      setPaymentAmount("");
      setReferenceNumber("");
    } catch (error: any) {
      toast.error("Failed to record payment", { description: error.message });
    } finally {
      setIsRecording(false);
    }
  };

  const handleDeletePayment = async (payment: Payment) => {
    if (!confirm("Are you sure you want to delete this payment?")) return;
    
    try {
      await deletePayment.mutateAsync({ id: payment.id, studentId: student.id });
      toast.success("Payment deleted");
    } catch (error: any) {
      toast.error("Failed to delete payment", { description: error.message });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <Check className="h-4 w-4 text-green-600" />;
      case 'overdue': return <AlertCircle className="h-4 w-4 text-destructive" />;
      default: return <Clock className="h-4 w-4 text-amber-500" />;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'paid': return "bg-green-500/10 text-green-600 border-green-200";
      case 'overdue': return "bg-destructive/10 text-destructive border-destructive/20";
      case 'due': return "bg-amber-500/10 text-amber-600 border-amber-200";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const isLoading = feesLoading || paymentsLoading;

  // Calculate totals
  const totalFee = processedInstallments.reduce((sum, i) => sum + i.amount, 0);
  const totalPaid = processedInstallments.reduce((sum, i) => sum + i.paid_amount, 0);
  const totalPending = totalFee - totalPaid;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Record Payment - {student.name}</DialogTitle>
          <DialogDescription>
            View fee status and record payments for this student
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : processedInstallments.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <IndianRupee className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No fees assigned to this student</p>
            <p className="text-sm mt-1">Use "Manage Fees" to assign fee structures first</p>
          </div>
        ) : (
          <ScrollArea className="flex-1 max-h-[65vh] pr-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <p className="text-sm text-muted-foreground">Total Fee</p>
                <p className="text-lg font-bold">{formatCurrency(totalFee)}</p>
              </div>
              <div className="p-4 rounded-lg bg-green-500/10 text-center">
                <p className="text-sm text-green-600">Paid</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(totalPaid)}</p>
              </div>
              <div className="p-4 rounded-lg bg-amber-500/10 text-center">
                <p className="text-sm text-amber-600">Pending</p>
                <p className="text-lg font-bold text-amber-600">{formatCurrency(totalPending)}</p>
              </div>
            </div>

            {/* Record Payment Form */}
            <div className="p-4 border rounded-lg mb-6 bg-muted/30">
              <h3 className="font-medium mb-4">Record New Payment</h3>
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Select Installment</Label>
                    <Select value={selectedInstallment} onValueChange={setSelectedInstallment}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose installment" />
                      </SelectTrigger>
                      <SelectContent>
                        {processedInstallments
                          .filter(i => i.status !== 'paid')
                          .map((inst) => (
                            <SelectItem key={inst.id} value={inst.id}>
                              {inst.categoryName} - {inst.name} ({formatCurrency(inst.pending_amount)} pending)
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      placeholder={selectedInst ? `Max: ${selectedInst.pending_amount}` : "Enter amount"}
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Payment Mode</Label>
                    <Select value={paymentMode} onValueChange={setPaymentMode}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Reference Number (Optional)</Label>
                    <Input
                      placeholder="Transaction ID / Cheque No."
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleRecordPayment} 
                  disabled={isRecording || !selectedInstallment || !paymentAmount}
                  className="w-full"
                >
                  {isRecording && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Record Payment
                </Button>
              </div>
            </div>

            {/* Installments List */}
            <div className="space-y-3">
              <h3 className="font-medium">Fee Breakdown</h3>
              <Accordion type="multiple" className="space-y-2">
                {processedInstallments.map((inst) => (
                  <AccordionItem 
                    key={inst.id} 
                    value={inst.id}
                    className="border rounded-lg px-4"
                  >
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center gap-3 flex-1 text-left">
                        {getStatusIcon(inst.status)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{inst.categoryName}</span>
                            <span className="text-muted-foreground">-</span>
                            <span>{inst.name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                            <span>Due: {formatDate(inst.due_date)}</span>
                          </div>
                        </div>
                        <div className="text-right mr-2">
                          <p className="font-semibold">{formatCurrency(inst.amount)}</p>
                          <Badge className={`text-xs ${getStatusBadgeClass(inst.status)}`}>
                            {getStatusLabel(inst.status)}
                          </Badge>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <div className="pt-2 border-t">
                        <div className="flex justify-between text-sm mb-2">
                          <span>Amount:</span>
                          <span>{formatCurrency(inst.amount)}</span>
                        </div>
                        <div className="flex justify-between text-sm mb-2 text-green-600">
                          <span>Paid:</span>
                          <span>{formatCurrency(inst.paid_amount)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-medium">
                          <span>Pending:</span>
                          <span className={inst.pending_amount > 0 ? "text-amber-600" : "text-green-600"}>
                            {formatCurrency(inst.pending_amount)}
                          </span>
                        </div>
                        
                        {/* Payment History for this installment */}
                        {payments?.filter(p => p.installment_id === inst.id).length > 0 && (
                          <div className="mt-4">
                            <p className="text-sm font-medium mb-2">Payment History</p>
                            <div className="space-y-2">
                              {payments
                                ?.filter(p => p.installment_id === inst.id)
                                .map((payment) => (
                                  <div 
                                    key={payment.id} 
                                    className="flex items-center justify-between text-sm bg-muted/50 p-2 rounded"
                                  >
                                    <div>
                                      <p>{formatCurrency(payment.amount_paid)}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {formatDate(payment.payment_date)} • {payment.payment_mode || "Cash"}
                                        {payment.reference_number && ` • Ref: ${payment.reference_number}`}
                                      </p>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                      onClick={() => handleDeletePayment(payment)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </ScrollArea>
        )}
        
        <div className="pt-4 border-t flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
