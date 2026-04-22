import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Sparkles, RefreshCw, X, Plus, Check, Info } from "lucide-react";
import { sortClassNames } from "@/lib/class-sort";
import { useSchool, useUpdateSchool } from "@/hooks/useSchool";
import { useToast } from "@/hooks/use-toast";
import {
  type Board,
  type Stream,
  type ClassGroup,
  type SubjectSuggestion,
  BOARD_LABELS,
  CLASS_GROUP_LABELS,
  classifyClass,
  generateSubjectCode,
  getSuggestions,
  detectBoardFromText,
} from "@/lib/subject-library";
import { useCreateSubject, type SubjectWithClasses } from "@/hooks/progress/useSubjects";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  uniqueClasses: string[];
  existingSubjects: SubjectWithClasses[];
}

interface SelectedRow {
  key: string;
  name: string;
  code: string;
  type: SubjectSuggestion["type"];
}

function useDefaultTemplateName() {
  return useQuery({
    queryKey: ["default-template-name-for-board"],
    queryFn: async () => {
      const { data } = await supabase
        .from("assessment_templates")
        .select("name")
        .eq("is_default", true)
        .limit(1)
        .maybeSingle();
      return data?.name ?? null;
    },
  });
}

export function QuickAddSubjectsDialog({ open, onOpenChange, uniqueClasses, existingSubjects }: Props) {
  const { data: school } = useSchool();
  const updateSchool = useUpdateSchool();
  const { data: defaultTemplateName } = useDefaultTemplateName();
  const createSubject = useCreateSubject();
  const { toast } = useToast();

  const persistedBoard = (school?.board as Board | null) ?? null;
  const detectedBoard = useMemo(() => detectBoardFromText(defaultTemplateName), [defaultTemplateName]);
  const [board, setBoard] = useState<Board | null>(persistedBoard ?? detectedBoard);
  useEffect(() => {
    if (open) setBoard(persistedBoard ?? detectedBoard);
  }, [open, persistedBoard, detectedBoard]);

  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [stream, setStream] = useState<Stream | null>(null);
  const [selectedRows, setSelectedRows] = useState<SelectedRow[]>([]);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setSelectedClasses([]);
      setStream(null);
      setSelectedRows([]);
      setAiPrompt("");
    }
  }, [open]);

  const sortedClasses = useMemo(() => sortClassNames(uniqueClasses), [uniqueClasses]);

  const groups = useMemo<ClassGroup[]>(() => {
    const set = new Set<ClassGroup>();
    for (const c of selectedClasses) {
      const g = classifyClass(c);
      if (g) set.add(g);
    }
    return Array.from(set);
  }, [selectedClasses]);

  const showStream = groups.includes("senior");

  const suggestions = useMemo(() => {
    if (!board || groups.length === 0) return [];
    return getSuggestions(board, groups, stream);
  }, [board, groups, stream]);

  const existingNames = useMemo(
    () => new Set(existingSubjects.map(s => s.name.toLowerCase())),
    [existingSubjects]
  );

  const isSelected = (name: string) =>
    selectedRows.some(r => r.name.toLowerCase() === name.toLowerCase());

  const toggleClass = (cls: string) => {
    setSelectedClasses(prev => prev.includes(cls) ? prev.filter(c => c !== cls) : [...prev, cls]);
  };

  const toggleSuggestion = (s: SubjectSuggestion) => {
    setSelectedRows(prev => {
      const idx = prev.findIndex(r => r.name.toLowerCase() === s.name.toLowerCase());
      if (idx >= 0) return prev.filter((_, i) => i !== idx);
      return [...prev, { key: `${s.name}-${Date.now()}`, name: s.name, code: s.code, type: s.type }];
    });
  };

  const updateRow = (key: string, patch: Partial<SelectedRow>) => {
    setSelectedRows(prev => prev.map(r => r.key === key ? { ...r, ...patch } : r));
  };

  const removeRow = (key: string) => setSelectedRows(prev => prev.filter(r => r.key !== key));

  const addCustom = () => {
    setSelectedRows(prev => [
      ...prev,
      { key: `custom-${Date.now()}`, name: "", code: "", type: "academic" },
    ]);
  };

  const handleAiSuggest = async () => {
    if (!aiPrompt.trim()) {
      toast({ title: "Describe the subject first", variant: "destructive" });
      return;
    }
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("suggest-subject", {
        body: {
          description: aiPrompt.trim(),
          board: board ?? undefined,
          classGroup: groups[0] ?? undefined,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const name = String(data?.name || "").trim();
      const code = String(data?.code || "").trim().toUpperCase().slice(0, 6);
      if (!name) throw new Error("No suggestion returned");
      setSelectedRows(prev => [
        ...prev,
        { key: `ai-${Date.now()}`, name, code: code || generateSubjectCode(name), type: "academic" },
      ]);
      setAiPrompt("");
      toast({ title: `Added "${name}"` });
    } catch (e) {
      toast({
        title: "AI suggestion failed",
        description: e instanceof Error ? e.message : "Try again",
        variant: "destructive",
      });
    } finally {
      setAiLoading(false);
    }
  };

  const handleBoardChoice = async (b: Board) => {
    setBoard(b);
    if (school && !persistedBoard) {
      try {
        await updateSchool.mutateAsync({ board: b } as any);
      } catch {/* non-fatal */}
    }
  };

  const validRows = selectedRows.filter(r => r.name.trim().length > 0);

  const handleCreate = async () => {
    if (validRows.length === 0) {
      toast({ title: "Pick at least one subject", variant: "destructive" });
      return;
    }
    if (selectedClasses.length === 0) {
      toast({ title: "Pick at least one class", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    let created = 0;
    let assigned = 0;
    let failed = 0;
    for (const row of validRows) {
      try {
        const res = await createSubject.mutateAsync({
          name: row.name.trim(),
          code: row.code.trim() || undefined,
          subject_type: row.type,
          class_names: selectedClasses,
        });
        if (res.existed) assigned++;
        else created++;
      } catch {
        failed++;
      }
    }
    setSubmitting(false);
    toast({
      title: `${created} created, ${assigned} reassigned${failed ? `, ${failed} failed` : ""}`,
      description: `Across ${selectedClasses.length} class${selectedClasses.length > 1 ? "es" : ""}`,
    });
    if (failed === 0) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Quick Add Subjects
            {board && (
              <Badge variant="secondary" className="ml-2">
                {BOARD_LABELS[board]} detected
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Pick classes, then tap suggested subjects. Everything stays editable.
          </DialogDescription>
        </DialogHeader>

        {!board && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="space-y-2">
              <div>Pick your board to see relevant subject suggestions.</div>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(BOARD_LABELS) as Board[]).map(b => (
                  <Button key={b} size="sm" variant="outline" onClick={() => handleBoardChoice(b)}>
                    {BOARD_LABELS[b]}
                  </Button>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Step 1: Classes */}
        <div className="space-y-2">
          <Label>1. Pick classes to assign these subjects to</Label>
          {sortedClasses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No classes available. Add students first.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {sortedClasses.map(cls => {
                const sel = selectedClasses.includes(cls);
                return (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => toggleClass(cls)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      sel
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border hover:bg-secondary"
                    }`}
                  >
                    {sel && <Check className="inline h-3 w-3 mr-1" />}
                    {cls}
                  </button>
                );
              })}
            </div>
          )}
          {groups.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Levels: {groups.map(g => CLASS_GROUP_LABELS[g]).join(" · ")}
            </p>
          )}
        </div>

        {/* Step 2: Stream (senior only) */}
        {showStream && (
          <div className="space-y-2">
            <Label>2. Stream (for Class 11 / 12)</Label>
            <RadioGroup
              value={stream ?? ""}
              onValueChange={(v) => setStream(v as Stream)}
              className="flex gap-4"
            >
              {(["science", "commerce", "arts"] as Stream[]).map(s => (
                <div key={s} className="flex items-center gap-2">
                  <RadioGroupItem value={s} id={`stream-${s}`} />
                  <Label htmlFor={`stream-${s}`} className="capitalize cursor-pointer">{s}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )}

        {/* Step 3: Suggestions */}
        {board && groups.length > 0 && (
          <div className="space-y-2">
            <Label>
              {showStream ? "3" : "2"}. Suggested for {BOARD_LABELS[board]} · {groups.map(g => CLASS_GROUP_LABELS[g]).join(", ")}
            </Label>
            {suggestions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No suggestions — add custom subjects below.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {suggestions.map(s => {
                  const sel = isSelected(s.name);
                  const exists = existingNames.has(s.name.toLowerCase());
                  return (
                    <button
                      key={s.name}
                      type="button"
                      onClick={() => toggleSuggestion(s)}
                      className={`px-3 py-1.5 rounded-lg text-sm border transition-colors flex items-center gap-1.5 ${
                        sel
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border hover:bg-secondary"
                      }`}
                      title={exists ? "Already exists — will be assigned to selected classes" : ""}
                    >
                      {sel && <Check className="h-3 w-3" />}
                      <span>{s.name}</span>
                      <span className={`text-xs ${sel ? "opacity-80" : "text-muted-foreground"}`}>
                        {s.code}
                      </span>
                      {exists && !sel && (
                        <span className="text-xs text-muted-foreground">•exists</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 4: AI Suggest */}
        {board && (
          <div className="space-y-2 rounded-lg border border-dashed p-3">
            <Label className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> AI Suggest (optional)
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="Describe an unusual subject (e.g. 'robotics for class 8')"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                disabled={aiLoading}
              />
              <Button type="button" variant="outline" onClick={handleAiSuggest} disabled={aiLoading}>
                {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                <span className="ml-2">Suggest</span>
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: Selected rows */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Selected ({validRows.length})</Label>
            <Button type="button" size="sm" variant="ghost" onClick={addCustom}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Custom
            </Button>
          </div>
          {selectedRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Tap a suggested subject above, or add a custom one.</p>
          ) : (
            <div className="space-y-2">
              {selectedRows.map(row => (
                <div key={row.key} className="flex items-center gap-2 p-2 rounded-lg border bg-card">
                  <Input
                    className="flex-1"
                    placeholder="Subject name"
                    value={row.name}
                    onChange={(e) => updateRow(row.key, { name: e.target.value })}
                  />
                  <Input
                    className="w-24"
                    placeholder="Code"
                    value={row.code}
                    maxLength={6}
                    onChange={(e) => updateRow(row.key, { code: e.target.value.toUpperCase().slice(0, 6) })}
                  />
                  <Select
                    value={row.type}
                    onValueChange={(v) => updateRow(row.key, { type: v as SubjectSuggestion["type"] })}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="academic">Academic</SelectItem>
                      <SelectItem value="co_curricular">Co-Curricular</SelectItem>
                      <SelectItem value="vocational">Vocational</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => updateRow(row.key, { code: generateSubjectCode(row.name) })}
                    title="Regenerate code"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button type="button" size="icon" variant="ghost" onClick={() => removeRow(row.key)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={submitting || validRows.length === 0 || selectedClasses.length === 0}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create {validRows.length > 0 ? `${validRows.length} Subject${validRows.length > 1 ? "s" : ""}` : "Subjects"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
