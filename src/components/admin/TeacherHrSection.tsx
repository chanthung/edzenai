import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Briefcase } from "lucide-react";
import type { TeacherHrFields } from "@/hooks/useTeachers";
import { FieldHelp } from "@/components/ui/field-help";

export const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];
export const EMPLOYMENT_TYPES = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "contractual", label: "Contractual" },
  { value: "substitute", label: "Substitute" },
];
export const EMPLOYMENT_STATUSES = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "on_leave", label: "On leave" },
  { value: "resigned", label: "Resigned" },
];

export const EMPTY_HR: TeacherHrFields = {
  date_of_joining: null, date_of_birth: null, gender: null, designation: null, department: null,
  qualification: null, experience_years: null, employment_type: null, employment_status: null,
};

const NONE = "__none__";
const today = () => new Date().toISOString().slice(0, 10);

/** Returns an error message, or null when the HR fields are valid. */
export function validateHr(hr: TeacherHrFields): string | null {
  const t = today();
  if (hr.date_of_birth && hr.date_of_birth > t) return "Date of birth cannot be in the future.";
  if (hr.date_of_birth && hr.date_of_birth < "1930-01-01") return "Date of birth looks invalid.";
  if (hr.date_of_joining && hr.date_of_joining < "1950-01-01") return "Date of joining looks invalid.";
  if (hr.date_of_birth && hr.date_of_joining && hr.date_of_joining <= hr.date_of_birth) return "Date of joining must be after date of birth.";
  if (hr.experience_years !== null && (!Number.isInteger(hr.experience_years) || hr.experience_years < 0 || hr.experience_years > 70))
    return "Experience must be a whole number between 0 and 70.";
  return null;
}

function OptSelect({ value, onChange, options, placeholder }: {
  value: string | null; onChange: (v: string | null) => void; options: { value: string; label: string }[]; placeholder: string;
}) {
  return (
    <Select value={value ?? NONE} onValueChange={(v) => onChange(v === NONE ? null : v)}>
      <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>Not set</SelectItem>
        {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

export function TeacherHrSection({ value, onChange }: { value: TeacherHrFields; onChange: (v: TeacherHrFields) => void }) {
  const set = <K extends keyof TeacherHrFields>(k: K, v: TeacherHrFields[K]) => onChange({ ...value, [k]: v });
  const text = (v: string) => (v.trim() === "" ? null : v);

  return (
    <div className="space-y-3 rounded-xl border p-3">
      <div>
        <Label><Briefcase className="h-4 w-4 inline mr-1" />Identity &amp; Employment</Label>
        <p className="text-xs text-muted-foreground mt-1">All optional. Employment status is for HR records only and doesn't affect login access.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Date of birth{" "}
            <FieldHelp label="Help about Date of birth">
              <p>Optional. Use the date picker or your device's date format.</p>
              <p>If unsure, check verified HR records or the school's staff register. You can leave this blank and complete it later.</p>
            </FieldHelp>
          </Label>
          <Input type="date" max={today()} value={value.date_of_birth ?? ""} onChange={(e) => set("date_of_birth", e.target.value || null)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Gender{" "}
            <FieldHelp label="Help about Gender">
              <p>Optional. Choose Male, Female, Other or Prefer not to say — or leave it as Not set.</p>
              <p>There is no need to select a value just to complete the form.</p>
            </FieldHelp>
          </Label>
          <OptSelect value={value.gender} onChange={(v) => set("gender", v)} options={GENDERS} placeholder="Not set" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Date of joining{" "}
            <FieldHelp label="Help about Date of joining">
              <p>Optional. The date the teacher joined this school.</p>
              <p>If unsure, check the appointment letter or the school's HR register.</p>
            </FieldHelp>
          </Label>
          <Input type="date" value={value.date_of_joining ?? ""} onChange={(e) => set("date_of_joining", e.target.value || null)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Experience (years){" "}
            <FieldHelp label="Help about Experience">
              <p>Optional. Total professional teaching experience in whole years, as recorded by the school.</p>
              <p>Check employment history or verified HR records. EdZenAI does not calculate this from the joining date or qualification.</p>
            </FieldHelp>
          </Label>
          <Input type="number" min={0} max={70} step={1} value={value.experience_years ?? ""}
            onChange={(e) => set("experience_years", e.target.value === "" ? null : Number(e.target.value))} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Designation{" "}
            <FieldHelp label="Help about Designation">
              <p>Optional free text. Examples: PRT, TGT, PGT, Senior Teacher, Head of Department, Principal.</p>
              <p>Any designation your school uses is fine, even if it is not in the examples.</p>
            </FieldHelp>
          </Label>
          <Input maxLength={100} placeholder="e.g. TGT, PGT, Head Teacher" value={value.designation ?? ""} onChange={(e) => set("designation", text(e.target.value))} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Department{" "}
            <FieldHelp label="Help about Department">
              <p>Optional free text. Examples: Primary, Science, Mathematics, Languages, Commerce, Humanities.</p>
              <p>Use the department names your school already uses.</p>
            </FieldHelp>
          </Label>
          <Input maxLength={100} placeholder="e.g. Science" value={value.department ?? ""} onChange={(e) => set("department", text(e.target.value))} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-xs">Highest qualification{" "}
            <FieldHelp label="Help about Highest qualification">
              <p>Optional free text. Examples: B.Ed., M.A. English, M.Sc. Physics, Ph.D.</p>
              <p>Use verified certificates or HR records. A qualification recorded here does not by itself make a teacher eligible to teach a class or subject — actual teaching is set under Assigned Subjects &amp; Classes.</p>
            </FieldHelp>
          </Label>
          <Input maxLength={200} placeholder="e.g. M.Sc. Physics, B.Ed." value={value.qualification ?? ""} onChange={(e) => set("qualification", text(e.target.value))} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Employment type{" "}
            <FieldHelp label="Help about Employment type">
              <p>Optional. Full-time: regular full-time staff. Part-time: works reduced hours. Contractual: hired on a fixed-term contract. Substitute: covers for absent teachers.</p>
              <p>This is an HR record only and does not affect anything else in EdZenAI.</p>
            </FieldHelp>
          </Label>
          <OptSelect value={value.employment_type} onChange={(v) => set("employment_type", v)} options={EMPLOYMENT_TYPES} placeholder="Not set" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Employment status{" "}
            <FieldHelp label="Help about Employment status">
              <p>Optional HR record. Active: currently working. Inactive: not currently working. On leave: temporarily away. Resigned: no longer employed.</p>
              <p>This is separate from the sign-in switch — changing it never blocks or grants login access.</p>
            </FieldHelp>
          </Label>
          <OptSelect value={value.employment_status} onChange={(v) => set("employment_status", v)} options={EMPLOYMENT_STATUSES} placeholder="Not set" />
        </div>
      </div>
    </div>
  );
}
