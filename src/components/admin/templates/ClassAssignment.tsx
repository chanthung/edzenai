import { useState, useEffect, useRef } from "react";
import { sortClassNames } from "@/lib/class-sort";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAssessmentTemplates,
  useClassTemplateAssignments,
  useAssignTemplateToClass,
  useRemoveClassAssignment,
} from "@/hooks/progress/useAssessmentTemplates";
import { useAcademicYears } from "@/hooks/useAcademicYears";
import { useStudents } from "@/hooks/useStudents";
import { useSchool } from "@/hooks/useSchool";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link2, Trash2, Loader2, RefreshCw } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface ClassAssignmentProps {
  isRestricted: boolean;
}

async function createAssessmentsFromTerms(
  templateId: string,
  className: string,
  academicYearId: string,
  schoolId: string
) {
  // Fetch template terms
  const { data: terms, error: termsError } = await supabase
    .from("template_terms")
    .select("*")
    .eq("template_id", templateId)
    .order("display_order");

  if (termsError || !terms || terms.length === 0) return;

  // Fetch existing assessments for this class+year to avoid duplicates
  const { data: existing } = await supabase
    .from("assessments")
    .select("name")
    .eq("school_id", schoolId)
    .eq("academic_year_id", academicYearId)
    .eq("class_name", className)
    .eq("assessment_type", "term_exam");

  const existingNames = new Set(existing?.map((a) => a.name) ?? []);

  const newAssessments = terms
    .filter((t) => !existingNames.has(t.name))
    .map((t) => ({
      name: t.name,
      assessment_type: "term_exam",
      class_name: className,
      academic_year_id: academicYearId,
      school_id: schoolId,
      assessment_domain: "cognitive" as const,
      assessment_category: "summative" as const,
    }));

  if (newAssessments.length > 0) {
    const { error } = await supabase.from("assessments").insert(newAssessments);
    if (error) console.error("Failed to auto-create assessments:", error);
  }
}

export function ClassAssignment({ isRestricted }: ClassAssignmentProps) {
  const { data: academicYears, isLoading: loadingYears } = useAcademicYears();
  const { data: templates } = useAssessmentTemplates();
  const { data: students } = useStudents();
  const { data: school } = useSchool();

  const activeYear = academicYears?.find(y => y.is_active);
  const { data: assignments, isLoading: loadingAssignments } = useClassTemplateAssignments(activeYear?.id ?? null);
  const assignTemplate = useAssignTemplateToClass();
  const removeAssignment = useRemoveClassAssignment();

  const [selectedClass, setSelectedClass] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [allClasses, setAllClasses] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const autoSyncRan = useRef(false);

  // Auto-sync: create missing assessments for all existing assignments on load
  useEffect(() => {
    if (autoSyncRan.current || !assignments?.length || !school || !activeYear) return;
    autoSyncRan.current = true;
    (async () => {
      for (const a of assignments) {
        await createAssessmentsFromTerms(a.template_id, a.class_name, a.academic_year_id, school.id);
      }
    })();
  }, [assignments, school, activeYear]);

  const handleSyncOne = async (a: { template_id: string; class_name: string; academic_year_id: string; id: string }) => {
    if (!school) return;
    setSyncingId(a.id);
    try {
      await createAssessmentsFromTerms(a.template_id, a.class_name, a.academic_year_id, school.id);
      toast.success(`Assessments synced for ${a.class_name}`);
    } catch (e: any) {
      toast.error("Sync failed", { description: e.message });
    } finally {
      setSyncingId(null);
    }
  };

  // Get unique class names from students
  const classNames = sortClassNames([...new Set(students?.map(s => s.class_name).filter(Boolean) as string[])]);

  const handleAssign = async () => {
    if ((!selectedClass && !allClasses) || !selectedTemplate || !activeYear || !school) return;
    const classesToAssign = allClasses ? classNames : [selectedClass];
    try {
      for (const cn of classesToAssign) {
        await assignTemplate.mutateAsync({
          templateId: selectedTemplate,
          className: cn,
          academicYearId: activeYear.id,
        });
        // Auto-create assessments from template terms
        await createAssessmentsFromTerms(selectedTemplate, cn, activeYear.id, school.id);
      }
      toast.success(allClasses ? `Template assigned to all ${classesToAssign.length} classes` : `Template assigned to ${selectedClass}`);
      setSelectedClass("");
      setSelectedTemplate("");
      setAllClasses(false);
    } catch (e: any) {
      toast.error("Failed to assign template", { description: e.message });
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await removeAssignment.mutateAsync(id);
      toast.success("Assignment removed");
    } catch (e: any) {
      toast.error("Failed to remove", { description: e.message });
    }
  };

  if (loadingYears || loadingAssignments) {
    return <Card className="card-elevated"><CardContent className="py-6"><Skeleton className="h-20 w-full" /></CardContent></Card>;
  }

  if (!activeYear) {
    return (
      <Card className="card-elevated">
        <CardContent className="py-6">
          <p className="text-sm text-muted-foreground text-center">No active academic year found. Please create one first.</p>
        </CardContent>
      </Card>
    );
  }

  const templateMap = new Map(templates?.map(t => [t.id, t]) ?? []);

  return (
    <Card className="card-elevated">
      <CardHeader>
        <CardTitle className="text-base">Assign Templates to Classes</CardTitle>
        <CardDescription>Link a template to each class for the active academic year ({activeYear.name})</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Assignment form */}
        <div className="flex items-center gap-2 mb-2">
          <Checkbox id="all-classes" checked={allClasses} onCheckedChange={(v) => { setAllClasses(!!v); if (v) setSelectedClass(""); }} disabled={isRestricted} />
          <Label htmlFor="all-classes" className="text-sm font-medium cursor-pointer">Assign to all classes</Label>
        </div>
        <div className="flex gap-2 flex-wrap">
          {!allClasses && (
            <Select value={selectedClass} onValueChange={setSelectedClass} disabled={isRestricted}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Class" /></SelectTrigger>
              <SelectContent>
                {classNames.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Select value={selectedTemplate} onValueChange={setSelectedTemplate} disabled={isRestricted}>
            <SelectTrigger className="w-52"><SelectValue placeholder="Template" /></SelectTrigger>
            <SelectContent>
              {templates?.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={handleAssign} disabled={(!selectedClass && !allClasses) || !selectedTemplate || assignTemplate.isPending || isRestricted} size="sm">
            {assignTemplate.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Link2 className="h-4 w-4 mr-1" />}
            Assign
          </Button>
        </div>

        {/* Current assignments */}
        {assignments && assignments.length > 0 ? (
          <div className="space-y-2">
            {assignments.map(a => (
              <div key={a.id} className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-md">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{a.class_name}</Badge>
                  <span className="text-sm">→</span>
                  <span className="text-sm font-medium">{templateMap.get(a.template_id)?.name ?? "Unknown"}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleSyncOne(a)} disabled={isRestricted || syncingId === a.id} className="h-7 w-7" title="Sync assessments">
                    <RefreshCw className={`h-3.5 w-3.5 ${syncingId === a.id ? 'animate-spin' : ''}`} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleRemove(a.id)} disabled={isRestricted} className="text-destructive h-7 w-7">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No classes assigned yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
