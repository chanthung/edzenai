import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Briefcase } from "lucide-react";
import type { TeacherHrFields } from "@/hooks/useTeachers";

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
          <Label className="text-xs">Date of birth</Label>
          <Input type="date" max={today()} value={value.date_of_birth ?? ""} onChange={(e) => set("date_of_birth", e.target.value || null)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Gender</Label>
          <OptSelect value={value.gender} onChange={(v) => set("gender", v)} options={GENDERS} placeholder="Not set" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Date of joining</Label>
          <Input type="date" value={value.date_of_joining ?? ""} onChange={(e) => set("date_of_joining", e.target.value || null)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Experience (years)</Label>
          <Input type="number" min={0} max={70} step={1} value={value.experience_years ?? ""}
            onChange={(e) => set("experience_years", e.target.value === "" ? null : Number(e.target.value))} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Designation</Label>
          <Input maxLength={100} placeholder="e.g. TGT, PGT, Head Teacher" value={value.designation ?? ""} onChange={(e) => set("designation", text(e.target.value))} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Department</Label>
          <Input maxLength={100} placeholder="e.g. Science" value={value.department ?? ""} onChange={(e) => set("department", text(e.target.value))} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-xs">Highest qualification</Label>
          <Input maxLength={200} placeholder="e.g. M.Sc. Physics, B.Ed." value={value.qualification ?? ""} onChange={(e) => set("qualification", text(e.target.value))} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Employment type</Label>
          <OptSelect value={value.employment_type} onChange={(v) => set("employment_type", v)} options={EMPLOYMENT_TYPES} placeholder="Not set" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Employment status</Label>
          <OptSelect value={value.employment_status} onChange={(v) => set("employment_status", v)} options={EMPLOYMENT_STATUSES} placeholder="Not set" />
        </div>
      </div>
    </div>
  );
}
