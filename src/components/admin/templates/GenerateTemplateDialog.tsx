import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface GeneratedTemplate {
  name: string;
  grading_type: "percentage" | "custom_grades";
  terms: { name: string }[];
  components: { name: string; max_marks: number }[];
  grade_mappings?: { grade_label: string; min_percentage: number; max_percentage: number }[];
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onGenerated: (t: GeneratedTemplate) => void;
}

const EXAMPLES = [
  "CBSE Class 6-10 with FA1, FA2, SA1, SA2",
  "ICSE primary, 3 terms, internal + external",
  "Cambridge IGCSE with coursework + final exam",
  "Maharashtra State Board Std 5-8",
  "Montessori — 3 terms, descriptive grades only",
];

export function GenerateTemplateDialog({ open, onOpenChange, onGenerated }: Props) {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (description.trim().length < 3) {
      toast.error("Please describe your assessment system");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-assessment-template", {
        body: { description: description.trim() },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.template) throw new Error("Empty response");
      onGenerated(data.template as GeneratedTemplate);
      toast.success("Template generated — review and edit before saving");
      setDescription("");
      onOpenChange(false);
    } catch (e: any) {
      toast.error("Generation failed", { description: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Generate Template with AI
          </DialogTitle>
          <DialogDescription>
            Describe your board / assessment system. AI will draft the terms, components and grade bands — you can edit anything before saving.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Textarea
            placeholder='e.g. "CBSE Class 6-10 with FA1, FA2, SA1, SA2"'
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            disabled={loading}
          />
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Try one of these:</p>
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  disabled={loading}
                  onClick={() => setDescription(ex)}
                  className="text-xs px-2 py-1 rounded-md border border-border bg-muted/40 hover:bg-muted transition-colors text-left disabled:opacity-50"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button onClick={handleGenerate} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Generate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
