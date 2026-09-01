import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, CheckCircle2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { FeeCategory } from "@/hooks/useFeeCategories";
import { FeeStructure } from "@/hooks/useFeeStructures";
import { useAllFeeStructureClasses } from "@/hooks/useFeeStructureClasses";

interface FeeListGroupedProps {
  feeCategories: FeeCategory[];
  feeStructures: FeeStructure[];
  assignedStructureIds: Set<string>;
  processingId: string | null;
  isRestricted: boolean;
  activeYear: any;
  academicYearId: string | undefined;
  studentId: string;
  studentClassName?: string | null;
  onToggleFee: (structureId: string, isAssigned: boolean) => void;
}

export function FeeListGrouped({
  feeCategories,
  feeStructures,
  assignedStructureIds,
  processingId,
  isRestricted,
  activeYear,
  academicYearId,
  studentId,
  studentClassName,
  onToggleFee,
}: FeeListGroupedProps) {
  const { data: allFscData } = useAllFeeStructureClasses(academicYearId);

  // Group categories by category_group
  const grouped = new Map<string, FeeCategory[]>();
  const ungrouped: FeeCategory[] = [];
  feeCategories.forEach((cat) => {
    if (cat.category_group) {
      if (!grouped.has(cat.category_group)) grouped.set(cat.category_group, []);
      grouped.get(cat.category_group)!.push(cat);
    } else {
      ungrouped.push(cat);
    }
  });

  const renderCategoryItem = (category: FeeCategory) => {
    const structure = feeStructures.find((s: any) => s.fee_category_id === category.id);
    const structureId = structure?.id as string | undefined;
    const isAssigned = structureId ? assignedStructureIds.has(structureId) : false;
    const isProcessing = structureId ? processingId === structureId : false;
    const hasStructure = !!structure;

    // Check if this fee has new_admission_only enabled
    const fscEntries = structureId ? allFscData?.filter((f) => f.fee_structure_id === structureId) : [];
    const isNewAdmissionOnly = fscEntries?.some((f) => f.new_admission_only) ?? false;

    // Fee is scoped to classes that don't include this student's class
    const notForThisClass =
      !!structureId &&
      !!studentClassName &&
      (fscEntries?.length ?? 0) > 0 &&
      !fscEntries!.some((f) => f.class_name === studentClassName);


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
                onToggleFee(structureId, isAssigned);
              }}
              disabled={isProcessing || isRestricted || !hasStructure}
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium">{category.name}</span>
            {category.is_mandatory && (
              <Badge variant="secondary" className="text-xs">Mandatory</Badge>
            )}
            {isNewAdmissionOnly && !isAssigned && (
              <Badge variant="outline" className="text-xs text-muted-foreground">Optional for continuing</Badge>
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
  };

  return (
    <div className="space-y-4 py-4">
      {Array.from(grouped.entries()).map(([group, cats]) => (
        <div key={group} className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">{group}</p>
          <div className="space-y-3">
            {cats.map(renderCategoryItem)}
          </div>
        </div>
      ))}
      {ungrouped.length > 0 && (
        <div className="space-y-2">
          {grouped.size > 0 && (
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">Other</p>
          )}
          <div className="space-y-3">
            {ungrouped.map(renderCategoryItem)}
          </div>
        </div>
      )}
    </div>
  );
}
