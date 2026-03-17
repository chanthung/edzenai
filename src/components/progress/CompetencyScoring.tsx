import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { useCompetencies } from "@/hooks/progress/useCompetencies";
import { useCompetencyScores, useSaveCompetencyScores, type MasteryLevel } from "@/hooks/progress/useCompetencyScores";
import { Save, Loader2, Target } from "lucide-react";

const MASTERY_LEVELS: { value: MasteryLevel; label: string; color: string }[] = [
  { value: "beginning", label: "Beginning", color: "destructive" },
  { value: "developing", label: "Developing", color: "secondary" },
  { value: "proficient", label: "Proficient", color: "default" },
  { value: "advanced", label: "Advanced", color: "outline" },
];

interface CompetencyScoringProps {
  subjectId: string;
  assessmentId: string;
  students: Array<{ id: string; name: string; roll_number: string | null }>;
}

export function CompetencyScoring({ subjectId, assessmentId, students }: CompetencyScoringProps) {
  const { data: competencies = [] } = useCompetencies(subjectId);
  const { data: existingScores = [] } = useCompetencyScores(assessmentId, subjectId);
  const saveScores = useSaveCompetencyScores();

  // studentId → competencyId → mastery_level
  const [scores, setScores] = useState<Record<string, Record<string, MasteryLevel>>>({});
  const [loaded, setLoaded] = useState("");

  // Populate from existing
  useEffect(() => {
    const key = `${assessmentId}_${subjectId}_${existingScores.length}`;
    if (key === loaded || existingScores.length === 0) return;
    const map: Record<string, Record<string, MasteryLevel>> = {};
    existingScores.forEach(s => {
      if (!map[s.student_id]) map[s.student_id] = {};
      map[s.student_id][s.competency_id] = s.mastery_level as MasteryLevel;
    });
    setScores(map);
    setLoaded(key);
  }, [existingScores, assessmentId, subjectId, loaded]);

  // Reset on subject/assessment change
  useEffect(() => {
    setScores({});
    setLoaded("");
  }, [assessmentId, subjectId]);

  const handleChange = (studentId: string, competencyId: string, level: MasteryLevel) => {
    setScores(prev => ({
      ...prev,
      [studentId]: { ...(prev[studentId] || {}), [competencyId]: level },
    }));
  };

  const handleSave = async () => {
    const toSave: Array<{ student_id: string; competency_id: string; assessment_id: string; mastery_level: MasteryLevel }> = [];
    Object.entries(scores).forEach(([studentId, compMap]) => {
      Object.entries(compMap).forEach(([competencyId, level]) => {
        toSave.push({ student_id: studentId, competency_id: competencyId, assessment_id: assessmentId, mastery_level: level });
      });
    });
    if (toSave.length > 0) await saveScores.mutateAsync(toSave);
  };

  const hasScores = Object.values(scores).some(c => Object.keys(c).length > 0);

  if (competencies.length === 0) return null;

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="h-4 w-4" />
          Competency Assessment
        </CardTitle>
        <Button size="sm" onClick={handleSave} disabled={!hasScores || saveScores.isPending}>
          {saveScores.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
          Save Competencies
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-background z-10">Student</TableHead>
                {competencies.map(c => (
                  <TableHead key={c.id} className="text-center min-w-[140px]">{c.name}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map(student => (
                <TableRow key={student.id}>
                  <TableCell className="sticky left-0 bg-background z-10 font-medium whitespace-nowrap">
                    {student.roll_number ? `${student.roll_number}. ` : ''}{student.name}
                  </TableCell>
                  {competencies.map(c => (
                    <TableCell key={c.id} className="text-center">
                      <Select
                        value={scores[student.id]?.[c.id] || ""}
                        onValueChange={(v) => handleChange(student.id, c.id, v as MasteryLevel)}
                      >
                        <SelectTrigger className="w-[130px] mx-auto h-8 text-xs">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {MASTERY_LEVELS.map(l => (
                            <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
