import { describe, it, expect } from "vitest";
import { computeReadiness, type ReadinessInput } from "@/lib/timetable-readiness";

const slotsFor = (days: number[], n = 8) =>
  days.flatMap((d) =>
    Array.from({ length: n }, (_, i) => {
      const start = 8 * 60 + i * 50; // 40 min period + 10 min gap
      const f = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}:00`;
      return { id: `s${d}-${i + 1}`, weekday: d, period_number: i + 1, start_time: f(start), end_time: f(start + 40), is_active: true };
    }),
  );

function base(over: Partial<ReadinessInput> = {}): ReadinessInput {
  return {
    settings: { working_days: [1, 2, 3, 4, 5], periods_per_day: 8, default_period_minutes: 40 },
    slots: slotsFor([1, 2, 3, 4, 5]),
    breaks: [{ weekday: null, break_type: "short_break", after_period: 2, duration_minutes: 10, is_active: true }],
    rooms: [],
    roomRequirements: [],
    requirements: [
      { class_name: "Class 8", section: "A", subject_id: "math", periods_per_week: 6, status: "active" },
      { class_name: "Class 8", section: "A", subject_id: "eng", periods_per_week: 5, status: "active" },
    ],
    assignments: [
      { teacher_id: "t1", subject_id: "math", class_name: "Class 8" },
      { teacher_id: "hr", subject_id: "eng", class_name: "Class 8" },
    ],
    teacherIds: ["t1", "hr"],
    availability: [],
    classSections: [{ class_name: "Class 8", section: "A", label: "Class 8 - A" }],
    expectedSubjectsByClass: new Map([["Class 8", ["math", "eng"]]]),
    runs: [],
    ...over,
  };
}
const check = (r: ReturnType<typeof computeReadiness>, id: string) => r.checks.find((c) => c.id === id)!;

describe("timetable readiness", () => {
  it("shows configured period structure and is ready when everything fits", () => {
    const r = computeReadiness(base());
    expect(check(r, "periods").summary).toBe("Mon–Fri · 8 periods/day · 40 minutes/period");
    expect(r.overall).toBe("ready");
  });

  it("does not mutate inputs", () => {
    const input = base();
    const snap = JSON.stringify({ ...input, expectedSubjectsByClass: [...input.expectedSubjectsByClass!] });
    computeReadiness(input);
    expect(JSON.stringify({ ...input, expectedSubjectsByClass: [...input.expectedSubjectsByClass!] })).toBe(snap);
  });

  it("flags missing period configuration", () => {
    expect(check(computeReadiness(base({ settings: null })), "periods").status).toBe("warn");
    expect(check(computeReadiness(base({ slots: [] })), "periods").status).toBe("warn");
  });

  it("flags a break that overlaps the next period", () => {
    const r = computeReadiness(base({ breaks: [{ weekday: 1, break_type: "lunch", after_period: 4, duration_minutes: 30, is_active: true }] }));
    expect(check(r, "breaks").status).toBe("warn");
  });

  it("never counts draft requirements as confirmed, including 1-period placeholders", () => {
    const r = computeReadiness(base({
      requirements: [
        { class_name: "Class 8", section: "A", subject_id: "math", periods_per_week: 1, status: "draft" },
        { class_name: "Class 8", section: "A", subject_id: "eng", periods_per_week: 1, status: "draft" },
      ],
    }));
    expect(check(r, "subjects").status).toBe("warn");
    expect(r.capacity![0].required).toBe(0);
    expect(r.capacity![0].draft).toBe(2);
    expect(r.overall).toBe("attention");
  });

  it("flags a confirmed requirement with no eligible teacher", () => {
    const r = computeReadiness(base({ assignments: [{ teacher_id: "t1", subject_id: "math", class_name: "Class 8" }] }));
    expect(check(r, "teachers").summary).toBe("1 confirmed subject requirement has no eligible teacher.");
  });

  it("counts a teacher without a login when they have an assignment", () => {
    const r = computeReadiness(base({ teacherIds: ["hr"], assignments: [
      { teacher_id: "hr", subject_id: "math", class_name: "Class 8" },
      { teacher_id: "hr", subject_id: "eng", class_name: "Class 8" },
    ] }));
    expect(check(r, "teachers").status).toBe("ok");
  });

  it("flags requirements exceeding available periods per class-section", () => {
    const r = computeReadiness(base({ requirements: [
      { class_name: "Class 8", section: "A", subject_id: "math", periods_per_week: 30, status: "active" },
      { class_name: "Class 8", section: "A", subject_id: "eng", periods_per_week: 15, status: "active" },
    ] }));
    expect(r.capacity![0]).toMatchObject({ required: 45, available: 40, remaining: -5, status: "over" });
    expect(check(r, "capacity").status).toBe("warn");
  });

  it("calculates remaining capacity from actual working days", () => {
    const r = computeReadiness(base({ settings: { working_days: [1, 2, 3, 4, 5, 6], periods_per_day: 8, default_period_minutes: 40 }, slots: slotsFor([1, 2, 3, 4, 5, 6]) }));
    expect(r.capacity![0]).toMatchObject({ required: 11, available: 48, remaining: 37, status: "fits" });
  });

  it("shows Unable to verify when a query fails, never a green status", () => {
    const r = computeReadiness(base({ assignments: undefined }));
    expect(check(r, "teachers").status).toBe("unknown");
    expect(r.overall).toBe("unknown");
  });

  it("points fixes at existing sections", () => {
    const r = computeReadiness(base({ settings: null, assignments: [] }));
    expect(check(r, "periods").fix).toMatchObject({ kind: "tab", tab: "general" });
    expect(check(r, "teachers").fix).toMatchObject({ kind: "link", to: "/admin/teachers?tab=assignments" });
    expect(check(r, "subjects").fix).toMatchObject({ tab: "subjects" });
  });

  it("does not assume zero unplaced lessons when the run doesn't record them", () => {
    const r = computeReadiness(base({ runs: [{ status: "solved", created_at: "2026-10-01T00:00:00Z", solver_stats: {} }] }));
    expect(check(r, "runs").details[0]).toBe("Unplaced lessons: not recorded for this run.");
  });
});
