import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useAcademicYears, useActiveAcademicYear } from "@/hooks/useAcademicYears";
import { useFeeCategories, useCreateFeeCategory, useUpdateFeeCategory, useDeleteFeeCategory } from "@/hooks/useFeeCategories";
import { useFeeStructures, useCreateFeeStructure, useUpdateFeeStructure, useCreateInstallment, useUpdateInstallment, useDeleteFeeStructure, useDeleteInstallment, FeeStructure, Installment } from "@/hooks/useFeeStructures";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { useFeeStructureClasses, useUpdateFeeStructureClasses, useDistinctClasses } from "@/hooks/useFeeStructureClasses";
import { RestrictedButton } from "@/components/admin/RestrictedOverlay";
import { formatCurrency, formatDate } from "@/lib/format";
import { toast } from "sonner";
import { Plus, Receipt, Trash2, Loader2, Calendar, ChevronDown, ChevronUp, Pencil, GraduationCap } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function FeeSetup() {
  const { data: academicYears } = useAcademicYears();
  const activeYear = useActiveAcademicYear();
  const [selectedYearId, setSelectedYearId] = useState<string | undefined>(undefined);
  const { isRestricted } = useSubscriptionStatus();
  
  const currentYearId = selectedYearId || activeYear?.id;
  
  const { data: feeCategories, isLoading: categoriesLoading } = useFeeCategories();
  const { data: feeStructures, isLoading: structuresLoading } = useFeeStructures(currentYearId);
  
  const createCategory = useCreateFeeCategory();
  const updateCategory = useUpdateFeeCategory();
  const deleteCategory = useDeleteFeeCategory();
  const createStructure = useCreateFeeStructure();
  const updateStructure = useUpdateFeeStructure();
  const createInstallment = useCreateInstallment();
  const updateInstallment = useUpdateInstallment();
  const deleteStructure = useDeleteFeeStructure();
  const deleteInstallment = useDeleteInstallment();

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [structureDialogOpen, setStructureDialogOpen] = useState(false);
  const [installmentDialogOpen, setInstallmentDialogOpen] = useState(false);
  const [selectedStructureId, setSelectedStructureId] = useState<string | null>(null);
  const [editingInstallment, setEditingInstallment] = useState<Installment | null>(null);
  
  const [newCategory, setNewCategory] = useState({ name: "", description: "", is_mandatory: true, category_group: "" });
  const [newStructure, setNewStructure] = useState({ fee_category_id: "", total_amount: "" });
  const [newInstallment, setNewInstallment] = useState({ name: "", amount: "", due_date: "" });

  const handleCreateCategory = async () => {
    if (!newCategory.name.trim()) {
      toast.error("Category name is required");
      return;
    }
    try {
      const payload: any = { name: newCategory.name, description: newCategory.description, is_mandatory: newCategory.is_mandatory };
      if (newCategory.category_group.trim()) {
        payload.category_group = newCategory.category_group.trim();
      }
      await createCategory.mutateAsync(payload);
      toast.success("Category created");
      setCategoryDialogOpen(false);
      setNewCategory({ name: "", description: "", is_mandatory: true, category_group: "" });
    } catch (error: any) {
      toast.error("Failed to create category", { description: error.message });
    }
  };

  const handleCreateStructure = async () => {
    if (!newStructure.fee_category_id || !newStructure.total_amount || !currentYearId) {
      toast.error("Please fill in all fields");
      return;
    }
    try {
      await createStructure.mutateAsync({
        academic_year_id: currentYearId,
        fee_category_id: newStructure.fee_category_id,
        total_amount: parseFloat(newStructure.total_amount),
      });
      toast.success("Fee structure created");
      setStructureDialogOpen(false);
      setNewStructure({ fee_category_id: "", total_amount: "" });
    } catch (error: any) {
      toast.error("Failed to create structure", { description: error.message });
    }
  };

  const handleCreateInstallment = async () => {
    if (!selectedStructureId || !newInstallment.name || !newInstallment.amount || !newInstallment.due_date) {
      toast.error("Please fill in all fields");
      return;
    }
    try {
      await createInstallment.mutateAsync({
        fee_structure_id: selectedStructureId,
        name: newInstallment.name,
        amount: parseFloat(newInstallment.amount),
        due_date: newInstallment.due_date,
      });
      toast.success("Installment added");
      setInstallmentDialogOpen(false);
      setNewInstallment({ name: "", amount: "", due_date: "" });
    } catch (error: any) {
      toast.error("Failed to add installment", { description: error.message });
    }
  };

  const handleUpdateInstallment = async () => {
    if (!editingInstallment || !newInstallment.name || !newInstallment.amount || !newInstallment.due_date) {
      toast.error("Please fill in all fields");
      return;
    }
    try {
      await updateInstallment.mutateAsync({
        id: editingInstallment.id,
        name: newInstallment.name,
        amount: parseFloat(newInstallment.amount),
        due_date: newInstallment.due_date,
      });
      toast.success("Installment updated");
      setInstallmentDialogOpen(false);
      setEditingInstallment(null);
      setNewInstallment({ name: "", amount: "", due_date: "" });
    } catch (error: any) {
      toast.error("Failed to update installment", { description: error.message });
    }
  };

  const openEditInstallment = (installment: Installment, structureId: string) => {
    setEditingInstallment(installment);
    setSelectedStructureId(structureId);
    setNewInstallment({
      name: installment.name,
      amount: String(installment.amount),
      due_date: installment.due_date,
    });
    setInstallmentDialogOpen(true);
  };

  const openAddInstallment = (structureId: string) => {
    setEditingInstallment(null);
    setSelectedStructureId(structureId);
    setNewInstallment({ name: "", amount: "", due_date: "" });
    setInstallmentDialogOpen(true);
  };

  const usedCategoryIds = feeStructures?.map(s => s.fee_category_id) || [];
  const availableCategories = feeCategories?.filter(c => !usedCategoryIds.includes(c.id)) || [];

  return (
    <AdminLayout>
      <PageHeader title="Fee Setup" description="Configure fee categories and installment schedules">
        <Select value={currentYearId} onValueChange={setSelectedYearId}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent>
            {academicYears?.map((year) => (
              <SelectItem key={year.id} value={year.id}>
                {year.name} {year.is_active && "(Active)"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PageHeader>

      <Tabs defaultValue="structures" className="mt-6">
        <TabsList>
          <TabsTrigger value="structures">Fee Structures</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="structures" className="mt-4">
          {!currentYearId ? (
            <Card className="card-elevated">
              <EmptyState
                icon={Calendar}
                title="No academic year selected"
                description="Create an academic year first to set up fee structures"
              />
            </Card>
          ) : (
            <>
              <div className="flex justify-end mb-4">
                <RestrictedButton isRestricted={isRestricted}>
                  <Dialog open={structureDialogOpen} onOpenChange={setStructureDialogOpen}>
                    <DialogTrigger asChild>
                      <Button disabled={availableCategories.length === 0 || isRestricted}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Fee
                      </Button>
                    </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Fee Structure</DialogTitle>
                      <DialogDescription>
                        Set the total amount for a fee category
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label>Fee Category</Label>
                        <Select 
                          value={newStructure.fee_category_id}
                          onValueChange={(value) => setNewStructure({ ...newStructure, fee_category_id: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableCategories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name} {cat.is_mandatory ? "(Mandatory)" : "(Optional)"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Total Amount (₹)</Label>
                        <Input
                          type="number"
                          placeholder="50000"
                          value={newStructure.total_amount}
                          onChange={(e) => setNewStructure({ ...newStructure, total_amount: e.target.value })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setStructureDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleCreateStructure} disabled={createStructure.isPending}>
                        {createStructure.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Add Fee
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </RestrictedButton>
              </div>

              {structuresLoading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <Card key={i} className="card-elevated">
                      <CardContent className="p-6">
                        <Skeleton className="h-6 w-40 mb-2" />
                        <Skeleton className="h-4 w-24" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : feeStructures?.length === 0 ? (
                <Card className="card-elevated">
                  <EmptyState
                    icon={Receipt}
                    title="No fee structures"
                    description="Add fee structures to define amounts and installments"
                  />
                </Card>
              ) : (
                <div className="space-y-4">
                  {feeStructures?.map((structure) => (
                    <FeeStructureCard
                      key={structure.id}
                      structure={structure}
                      isRestricted={isRestricted}
                      onAddInstallment={() => openAddInstallment(structure.id)}
                      onEditInstallment={(inst) => openEditInstallment(inst, structure.id)}
                      onDelete={() => deleteStructure.mutate({ id: structure.id, academicYearId: currentYearId! })}
                      onDeleteInstallment={(id) => deleteInstallment.mutate(id)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="categories" className="mt-4">
          <div className="flex justify-end mb-4">
            <RestrictedButton isRestricted={isRestricted}>
              <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                <DialogTrigger asChild>
                  <Button disabled={isRestricted}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Category
                  </Button>
                </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Fee Category</DialogTitle>
                  <DialogDescription>Create a new fee category like Transport or Activities</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Category Name</Label>
                    <Input
                      placeholder="Library Fee"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      placeholder="Annual library subscription"
                      value={newCategory.description}
                      onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Group <span className="text-muted-foreground font-normal">(optional)</span></Label>
                    <Input
                      placeholder="e.g. Uniforms, Books, Activities"
                      value={newCategory.category_group}
                      onChange={(e) => setNewCategory({ ...newCategory, category_group: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">Group related items together for easier management</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Mandatory Fee</Label>
                      <p className="text-sm text-muted-foreground">Required for all students</p>
                    </div>
                    <Switch
                      checked={newCategory.is_mandatory}
                      onCheckedChange={(checked) => setNewCategory({ ...newCategory, is_mandatory: checked })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateCategory} disabled={createCategory.isPending}>
                    {createCategory.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </RestrictedButton>
          </div>

          {categoriesLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="card-elevated">
                  <CardContent className="p-4">
                    <Skeleton className="h-5 w-32" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : feeCategories?.length === 0 ? (
            <Card className="card-elevated">
              <EmptyState
                icon={Receipt}
                title="No fee categories"
                description="Create categories like Tuition, Transport, Activities"
              />
            </Card>
          ) : (
            <div className="space-y-2">
              {(() => {
                // Group categories by category_group
                const grouped = new Map<string, typeof feeCategories>();
                const ungrouped: typeof feeCategories = [];
                feeCategories?.forEach((cat) => {
                  if (cat.category_group) {
                    if (!grouped.has(cat.category_group)) grouped.set(cat.category_group, []);
                    grouped.get(cat.category_group)!.push(cat);
                  } else {
                    ungrouped.push(cat);
                  }
                });

                const renderCategoryCard = (category: any) => (
                  <Card key={category.id} className="card-elevated">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{category.name}</p>
                          <Badge variant={category.is_mandatory ? "default" : "secondary"}>
                            {category.is_mandatory ? "Mandatory" : "Optional"}
                          </Badge>
                          {category.category_group && (
                            <Badge variant="outline" className="text-xs">
                              {category.category_group}
                            </Badge>
                          )}
                        </div>
                        {category.description && (
                          <p className="text-sm text-muted-foreground">{category.description}</p>
                        )}
                      </div>
                      <RestrictedButton isRestricted={isRestricted}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => deleteCategory.mutate(category.id)}
                          disabled={isRestricted}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </RestrictedButton>
                    </CardContent>
                  </Card>
                );

                return (
                  <>
                    {Array.from(grouped.entries()).map(([group, cats]) => (
                      <div key={group} className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1 pt-2">{group}</p>
                        {cats.map(renderCategoryCard)}
                      </div>
                    ))}
                    {ungrouped.length > 0 && (
                      <div className="space-y-2">
                        {grouped.size > 0 && (
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1 pt-2">Other</p>
                        )}
                        {ungrouped.map(renderCategoryCard)}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Installment Dialog */}
      <Dialog open={installmentDialogOpen} onOpenChange={(open) => {
        setInstallmentDialogOpen(open);
        if (!open) {
          setEditingInstallment(null);
          setNewInstallment({ name: "", amount: "", due_date: "" });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingInstallment ? "Edit Installment" : "Add Installment"}</DialogTitle>
            <DialogDescription>
              {editingInstallment ? "Update the installment amount or due date" : "Define a payment installment with due date"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Installment Name</Label>
              <Input
                placeholder="Q1 Payment / April / 1st Installment"
                value={newInstallment.name}
                onChange={(e) => setNewInstallment({ ...newInstallment, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount (₹)</Label>
                <Input
                  type="number"
                  placeholder="12500"
                  value={newInstallment.amount}
                  onChange={(e) => setNewInstallment({ ...newInstallment, amount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={newInstallment.due_date}
                  onChange={(e) => setNewInstallment({ ...newInstallment, due_date: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInstallmentDialogOpen(false)}>Cancel</Button>
            {editingInstallment ? (
              <Button onClick={handleUpdateInstallment} disabled={updateInstallment.isPending}>
                {updateInstallment.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Update Installment
              </Button>
            ) : (
              <Button onClick={handleCreateInstallment} disabled={createInstallment.isPending}>
                {createInstallment.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add Installment
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

function FeeStructureCard({ 
  structure, 
  isRestricted = false,
  onAddInstallment, 
  onEditInstallment,
  onDelete,
  onDeleteInstallment 
}: { 
  structure: FeeStructure; 
  isRestricted?: boolean;
  onAddInstallment: () => void;
  onEditInstallment: (installment: Installment) => void;
  onDelete: () => void;
  onDeleteInstallment: (id: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const installments = structure.installments?.sort((a, b) => a.display_order - b.display_order) || [];
  const installmentTotal = installments.reduce((sum, i) => sum + Number(i.amount), 0);
  const remaining = Number(structure.total_amount) - installmentTotal;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="card-elevated">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">{structure.fee_category?.name}</CardTitle>
                  <Badge variant={structure.fee_category?.is_mandatory ? "default" : "secondary"}>
                    {structure.fee_category?.is_mandatory ? "Mandatory" : "Optional"}
                  </Badge>
                </div>
                <CardDescription>
                  Total: {formatCurrency(Number(structure.total_amount))}
                  {installments.length > 0 && (
                    <span className="ml-2">
                      • {installments.length} installment{installments.length > 1 ? 's' : ''}
                    </span>
                  )}
                </CardDescription>
              </div>
            </div>
            <RestrictedButton isRestricted={isRestricted}>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive"
                onClick={onDelete}
                disabled={isRestricted}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </RestrictedButton>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="pt-0">
            {installments.length > 0 && (
              <div className="space-y-2 mb-4">
                {installments.map((inst) => (
                  <div key={inst.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">{inst.name}</p>
                      <p className="text-sm text-muted-foreground">Due: {formatDate(inst.due_date)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{formatCurrency(Number(inst.amount))}</p>
                      <RestrictedButton isRestricted={isRestricted}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => onEditInstallment(inst)}
                          disabled={isRestricted}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </RestrictedButton>
                      <RestrictedButton isRestricted={isRestricted}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => onDeleteInstallment(inst.id)}
                          disabled={isRestricted}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </RestrictedButton>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {remaining > 0 && (
              <p className="text-sm text-amber-600 mb-3">
                ₹{remaining.toLocaleString()} remaining to be assigned to installments
              </p>
            )}

            <div className="flex items-center gap-2 mb-4">
              <RestrictedButton isRestricted={isRestricted}>
                <Button variant="outline" size="sm" onClick={onAddInstallment} disabled={isRestricted}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Installment
                </Button>
              </RestrictedButton>
            </div>

            {/* Class Assignment Section */}
            <ClassAssignmentSection structureId={structure.id} academicYearId={structure.academic_year_id} isRestricted={isRestricted} />
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

function ClassAssignmentSection({ structureId, academicYearId, isRestricted }: { structureId: string; academicYearId: string; isRestricted: boolean }) {
  const { data: assignedClasses, isLoading } = useFeeStructureClasses(structureId);
  const { data: allClasses } = useDistinctClasses();
  const updateClasses = useUpdateFeeStructureClasses();

  const assignedSet = new Set(assignedClasses?.map((c) => c.class_name) ?? []);
  const autoAssign = assignedClasses?.[0]?.auto_assign ?? true;
  const newAdmissionOnly = assignedClasses?.[0]?.new_admission_only ?? false;

  const handleToggleClass = async (className: string) => {
    const newSet = new Set(assignedSet);
    if (newSet.has(className)) {
      newSet.delete(className);
    } else {
      newSet.add(className);
    }
    try {
      await updateClasses.mutateAsync({
        feeStructureId: structureId,
        classes: Array.from(newSet),
        autoAssign,
        newAdmissionOnly,
        academicYearId,
      });
    } catch (error: any) {
      toast.error("Failed to update classes", { description: error.message });
    }
  };

  const handleToggleAutoAssign = async (checked: boolean) => {
    try {
      await updateClasses.mutateAsync({
        feeStructureId: structureId,
        classes: Array.from(assignedSet),
        autoAssign: checked,
        newAdmissionOnly: checked ? newAdmissionOnly : false,
        academicYearId,
      });
      toast.success(checked ? "Auto-assign enabled" : "Auto-assign disabled");
    } catch (error: any) {
      toast.error("Failed to update", { description: error.message });
    }
  };

  const handleToggleNewAdmissionOnly = async (checked: boolean) => {
    try {
      await updateClasses.mutateAsync({
        feeStructureId: structureId,
        classes: Array.from(assignedSet),
        autoAssign,
        newAdmissionOnly: checked,
        academicYearId,
      });
      toast.success(checked ? "New admissions only enabled" : "New admissions only disabled");
    } catch (error: any) {
      toast.error("Failed to update", { description: error.message });
    }
  };

  if (isLoading) return <Skeleton className="h-16 w-full" />;

  return (
    <div className="border-t pt-4 mt-2">
      <div className="flex items-center gap-2 mb-3">
        <GraduationCap className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Apply to Classes</span>
        {assignedSet.size > 0 && (
          <Badge variant="secondary" className="text-xs">{assignedSet.size} selected</Badge>
        )}
      </div>

      {!allClasses || allClasses.length === 0 ? (
        <p className="text-sm text-muted-foreground">No classes found. Add students first to see classes here.</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-3">
            <label
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-sm cursor-pointer transition-colors font-medium ${
                allClasses.length > 0 && assignedSet.size === allClasses.length
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "bg-muted/30 border-border hover:bg-muted/60"
              } ${isRestricted ? "opacity-50 pointer-events-none" : ""}`}
            >
              <Checkbox
                checked={allClasses.length > 0 && assignedSet.size === allClasses.length}
                onCheckedChange={async (checked) => {
                  const newClasses = checked ? [...allClasses] : [];
                  try {
                    await updateClasses.mutateAsync({
                      feeStructureId: structureId,
                      classes: newClasses,
                      autoAssign,
                      newAdmissionOnly,
                      academicYearId,
                    });
                  } catch (error: any) {
                    toast.error("Failed to update classes", { description: error.message });
                  }
                }}
                disabled={isRestricted || updateClasses.isPending}
                className="h-3.5 w-3.5"
              />
              Select All
            </label>
            {allClasses.map((cls) => (
              <label
                key={cls}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-sm cursor-pointer transition-colors ${
                  assignedSet.has(cls)
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "bg-muted/30 border-border hover:bg-muted/60"
                } ${isRestricted ? "opacity-50 pointer-events-none" : ""}`}
              >
                <Checkbox
                  checked={assignedSet.has(cls)}
                  onCheckedChange={() => handleToggleClass(cls)}
                  disabled={isRestricted || updateClasses.isPending}
                  className="h-3.5 w-3.5"
                />
                {cls}
              </label>
            ))}
          </div>

          {assignedSet.size > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-muted/30 rounded-md p-2">
                <div>
                  <p className="text-sm font-medium">Auto-assign to new students</p>
                  <p className="text-xs text-muted-foreground">Automatically apply this fee when a student is added to a selected class</p>
                </div>
                <Switch
                  checked={autoAssign}
                  onCheckedChange={handleToggleAutoAssign}
                  disabled={isRestricted || updateClasses.isPending}
                />
              </div>

              {autoAssign && (
                <div className="flex items-center justify-between bg-muted/30 rounded-md p-2 ml-4 border-l-2 border-primary/20">
                  <div>
                    <p className="text-sm font-medium">New admissions only</p>
                    <p className="text-xs text-muted-foreground">Skip for students continuing from a previous year (e.g. uniform items optional for existing students)</p>
                  </div>
                  <Switch
                    checked={newAdmissionOnly}
                    onCheckedChange={handleToggleNewAdmissionOnly}
                    disabled={isRestricted || updateClasses.isPending}
                  />
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
