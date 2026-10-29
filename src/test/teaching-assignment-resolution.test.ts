import { describe, it, expect } from "vitest";
import {
  normalizeSection, resolveDesignatedTeachers, findRedundantAssignments,
  countSectionSpecific, defaultIncludedInTimetable, formatAssignmentChip, type AssignmentRow,
} from "@/lib/teaching-assignment-resolution";

const sections = { "Class 6": ["A", "B"] };
const row = (t: string, sec: string | null): AssignmentRow => ({ teacher_id: t, subject_id: "eng", class_name: "Class 6", section: sec });

describe("section normalization", () => {
  it("trims and uppercases; blank = all sections", () => {
    expect(normalizeSection(" a ")).toBe("A");
    expect(normalizeSection("   ")).toBeNull();
    expect(normalizeSection(null)).toBeNull();
  });
});

describe("assignment resolution", () => {
  it("legacy class-wide row covers every section", () => {
    const r = resolveDesignatedTeachers([row("alivi", null)], sections);
    expect(r.map((x) => [x.section, x.teacher_ids])).toEqual([["A", ["alivi"]], ["B", ["alivi"]]]);
  });
  it("section override replaces class-wide only for that section and flags the change", () => {
    const r = resolveDesignatedTeachers([row("alivi", null), row("amit", "b")], sections);
    const a = r.find((x) => x.section === "A")!, b = r.find((x) => x.section === "B")!;
    expect(a.teacher_ids).toEqual(["alivi"]);
    expect(b.teacher_ids).toEqual(["amit"]);
    expect(b.overrideChangedTeachers).toBe(true);
  });
  it("keeps multiple explicitly assigned teachers", () => {
    const r = resolveDesignatedTeachers([row("alivi", "A"), row("amit", "A")], sections);
    expect(r.find((x) => x.section === "A")!.teacher_ids).toEqual(["alivi", "amit"]);
  });
  it("reports redundant class-wide + section rows for the same teacher", () => {
    expect(findRedundantAssignments([row("alivi", null), row("alivi", "A"), row("amit", "B")])).toHaveLength(1);
  });
  it("counts section-specific rows for the generator guard", () => {
    expect(countSectionSpecific([row("a", null), row("b", "A")])).toBe(1);
  });
});

describe("included in timetable default", () => {
  it("excludes known non-teaching roles only", () => {
    expect(defaultIncludedInTimetable("Librarian")).toBe(false);
    expect(defaultIncludedInTimetable("Office Assistant")).toBe(false);
    expect(defaultIncludedInTimetable("TGT")).toBe(true);
    expect(defaultIncludedInTimetable("Unusual Title")).toBe(true);
    expect(defaultIncludedInTimetable("TGT", "accountant")).toBe(false);
  });
});

it("chip labels", () => {
  expect(formatAssignmentChip("Class 6", "a")).toBe("6-A");
  expect(formatAssignmentChip("Class 7", null)).toBe("7 (all sections)");
});
