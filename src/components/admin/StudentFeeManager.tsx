import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useFeeStructures } from "@/hooks/useFeeStructures";
import { useFeeCategories } from "@/hooks/useFeeCategories";
import { useStudentFees, useAssignFeeStructure, useRemoveFeeStructure } from "@/hooks/useStudentFees";
import { useAcademicYears } from "@/hooks/useAcademicYears";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { formatCurrency, formatDate } from "@/lib/format";
import { toast } from "sonner";
import { Loader2, IndianRupee, Calendar, CheckCircle2, XCircle, Lock } from "lucide-react";
import { Student } from "@/hooks/useStudents";

interface StudentFeeManagerProps {
  student: Student;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StudentFeeManager({ student, open, onOpenChange }: StudentFeeManagerProps) {
  const { data: academicYears, isLoading: yearsLoading } = useAcademicYears();
  const activeYear = academicYears?.find((y) => y.is_active);
  
  const { data: feeStructures, isLoading: structuresLoading } = useFeeStructures(activeYear?.id);
  const { data: feeCategories, isLoading: categoriesLoading } = useFeeCategories();
  const { data: studentFees, isLoading: feesLoading } = useStudentFees(student.id);
  const { isRestricted } = useSubscriptionStatus();
  
  const assignFee = useAssignFeeStructure();
  const removeFee = useRemoveFeeStructure();
  
  const [processingId, setProcessingId] = useState<string | null>(null);

  const assignedStructureIds = new Set(studentFees?.map((sf: any) => sf.fee_structure_id) ?? []);

  const handleToggleFee = async (structureId: string, isAssigned: boolean) => {
    if (isRestricted) {
      toast.error("Operation restricted", { description: "School is in view-only mode" });
      return;
    }
    setProcessingId(structureId);
    try {
      if (isAssigned) {
        await removeFee.mutateAsync({ studentId: student.id, feeStructureId: structureId });
        toast.success("Fee removed from student");
      } else {
        await assignFee.mutateAsync({ studentId: student.id, feeStructureId: structureId });
        toast.success("Fee assigned to student");
      }
    } catch (error: any) {
      toast.error("Operation failed", { description: error.message });
    } finally {
      setProcessingId(null);
    }
  };

  const isLoading = yearsLoading || structuresLoading || categoriesLoading || feesLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Manage Fees - {student.name}</DialogTitle>
          <DialogDescription>
            {activeYear ? (
              <>Assign fee structures for {activeYear.name}</>
            ) : (
              <>No active academic year found</>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 min-h-0 overflow-y-auto max-h-[calc(85vh-180px)] pr-2">
          {isRestricted && (
            <Alert className="mb-4 border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20">
              <Lock className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-700 dark:text-amber-300">
                School is inactive. Fee assignments are view-only.
              </AlertDescription>
            </Alert>
          )}
          {isLoading ? (
            <div className="space-y-4 py-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                  <Skeleton className="h-5 w-5" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : !activeYear ? (
            <div className="py-8 text-center text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Please create an active academic year first</p>
            </div>
          ) : feeCategories?.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <IndianRupee className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No fee categories defined</p>
              <p className="text-sm mt-1">Go to Fee Setup to create fee categories</p>
            </div>
          ) : (
            <div className="space-y-3 py-4">
              {feeCategories?.map((category: any) => {
                const structure = feeStructures?.find((s: any) => s.fee_category_id === category.id);
                const structureId = structure?.id as string | undefined;
                const isAssigned = structureId ? assignedStructureIds.has(structureId) : false;
                const isProcessing = structureId ? processingId === structureId : false;
                const hasStructure = !!structure;
                
                return (
                  <div
                    key={category.id}
                    className={`flex items-start gap-4 p-4 border rounded-lg transition-colors ${
                      isAssigned ? "bg-primary/5 border-primary/20" : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="pt-0.5">
                      {isProcessing ? (
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      ) : (
                        <Checkbox
                          checked={isAssigned}
                          onCheckedChange={() => {
                            if (!structureId) return;
                            handleToggleFee(structureId, isAssigned);
                          }}
                          disabled={isProcessing || isRestricted || !hasStructure}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{category?.name}</span>
                        {category?.is_mandatory && (
                          <Badge variant="secondary" className="text-xs">Mandatory</Badge>
                        )}
                        {isAssigned && (
                          <Badge className="text-xs bg-green-500/10 text-green-600 border-green-200">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Assigned
                          </Badge>
                        )}
                      </div>
                      {hasStructure ? (
                        <>
                          <p className="text-lg font-semibold text-primary mt-1">
                            {formatCurrency(structure.total_amount)}
                          </p>
                          {structure.installments?.length > 0 && (
                            <div className="mt-2 text-sm text-muted-foreground">
                              <p>{structure.installments.length} installment(s)</p>
                              <div className="mt-1 space-y-1">
                                {structure.installments
                                  .sort((a: any, b: any) => a.display_order - b.display_order)
                                  .slice(0, 3)
                                  .map((inst: any) => (
                                    <div key={inst.id} className="flex justify-between text-xs">
                                      <span>{inst.name}</span>
                                      <span>{formatCurrency(inst.amount)} - Due {formatDate(inst.due_date)}</span>
                                    </div>
                                  ))}
                                {structure.installments.length > 3 && (
                                  <p className="text-xs text-muted-foreground">
                                    +{structure.installments.length - 3} more...
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground mt-2">
                          Not configured for {activeYear?.name}. Create a fee structure in Fee Setup to assign this.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        <div className="pt-4 border-t flex-shrink-0">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {assignedStructureIds.size} fee(s) assigned
            </span>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
