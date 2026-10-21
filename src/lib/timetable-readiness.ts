/**
 * Pure, read-only timetable readiness calculations (Phase B).
 * Takes already-fetched, school + year scoped records and never writes anything.
 * `undefined` for any input means "not loaded / failed" → that check is "unknown".
 */

export type CheckStatus = "ok" | "warn" | "unknown";
export type FixTarget =
  | { kind: "tab"; tab: string; label: string }
  | { kind: "link"; to: string; label: string };

export interface ReadinessCheck {
  id: "periods" | "breaks" | "subjects" | "teachers" | "availability" | "rooms" | "capacity" | "runs";
  title: string;
  status: CheckStatus;
  summary: string;
  details: string[];
  fix?: FixTarget;
}

export interface RSettings { working_days: number[]; periods_per_day: number; default_period_minutes: number }
export interface RSlot { id: string; weekday: number; period_number: number; start_time: string; end_time: string; is_active: boolean }
export interface RBreak { weekday: number | null; break_type: string; after_period: number; duration_minutes: number; is_active: boolean }
export interface RRoom { id: string; room_type: string; is_active: boolean }
export interface RRequirement { class_name: string; section: string | null; subject_id: string; periods_per_week: number; status: string }
export interface RRoomRequirement { subject_id: string; class_name: string | null; required_room_type: string | null; preferred_room_id: string | null; is_mandatory: boolean }
export interface RAssignment { teacher_id: string; subject_id: string; class_name: string }
export interface RAvailability { teacher_id: string; time_slot_id: string; is_available: boolean }
export interface RClassSection { class_name: string; section: string | null; label: string }
export interface RRun { status: string; created_at: string; solver_stats: unknown }

export interface ReadinessInput {
  settings: RSettings | null | undefined;
  slots: RSlot[] | undefined;
  breaks: RBreak[] | undefined;
  rooms: RRoom[] | undefined;
  requirements: RRequirement[] | undefined;
  roomRequirements: RRoomRequirement[] | undefined;
  assignments: RAssignment[] | undefined;
  teacherIds: string[] | undefined;
  availability: RAvailability[] | undefined;
  classSections: RClassSection[] | undefined;
  expectedSubjectsByClass: Map<string, string[]> | undefined;
  runs: RRun[] | undefined;
}

export interface CapacityRow {
  label: string;
  required: number;
  draft: number;
  available: number;
  remaining: number;
  status: "fits" | "over" | "none";
}

export interface ReadinessResult {
  overall: "ready" | "attention" | "unknown";
  checks: ReadinessCheck[];
  capacity: CapacityRow[] | null;
  availablePerWeek: number | null;
}

const DAY_SHORT = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
};
const BREAK_LABEL: Record<string, string> = {
  short_break: "Short break", lunch: "Lunch", assembly: "Assembly", prayer: "Prayer", other: "Break",
};

export function describeDays(days: number[]): string {
  const d = [...new Set(days)].sort((a, b) => a - b);
  if (d.length === 0) return "No working days";
  const contiguous = d.every((v, i) => i === 0 || v === d[i - 1] + 1);
  if (contiguous && d.length > 2) return `${DAY_SHORT[d[0]]}–${DAY_SHORT[d[d.length - 1]]}`;
  return d.map((x) => DAY_SHORT[x]).join(", ");
}

const keyOf = (cls: string, section: string | null) => `${cls}|${section ?? ""}`;
const labelOf = (cls: string, section: string | null) => (section ? `${cls} - ${section}` : cls);

/** Active teaching slots on working days, grouped by weekday. */
function teachingSlots(settings: RSettings, slots: RSlot[]) {
  const days = new Set(settings.working_days);
  const byDay = new Map<number, RSlot[]>();
  for (const s of slots) {
    if (!s.is_active || !days.has(s.weekday)) continue;
    const list = byDay.get(s.weekday) ?? [];
    list.push(s);
    byDay.set(s.weekday, list);
  }
  for (const list of byDay.values()) list.sort((a, b) => a.period_number - b.period_number);
  return byDay;
}

export function computeReadiness(input: ReadinessInput): ReadinessResult {
  const checks: ReadinessCheck[] = [];
  const { settings, slots } = input;
  let byDay: Map<number, RSlot[]> | null = null;

  /* A. Period structure */
  {
    const fix: FixTarget = { kind: "tab", tab: "slots", label: "Fix periods" };
    if (settings === undefined || slots === undefined) {
      checks.push({ id: "periods", title: "Period structure", status: "unknown", summary: "Unable to verify", details: [], fix });
    } else if (!settings || settings.working_days.length === 0) {
      checks.push({ id: "periods", title: "Period structure", status: "warn", summary: "Period structure needs attention",
        details: ["General settings (working days) have not been saved for this year."], fix: { kind: "tab", tab: "general", label: "Fix general settings" } });
    } else {
      byDay = teachingSlots(settings, slots);
      const issues: string[] = [];
      for (const d of settings.working_days) {
        if (!byDay.get(d)?.length) issues.push(`${DAY_SHORT[d]}: no periods set up.`);
      }
      for (const [d, list] of byDay) {
        for (let i = 0; i < list.length; i++) {
          const s = list[i];
          if (toMin(s.end_time) <= toMin(s.start_time)) issues.push(`${DAY_SHORT[d]} Period ${s.period_number}: end time is not after start time.`);
          if (i > 0 && toMin(s.start_time) < toMin(list[i - 1].end_time))
            issues.push(`${DAY_SHORT[d]} Period ${s.period_number} overlaps Period ${list[i - 1].period_number}.`);
        }
      }
      const counts = [...byDay.values()].map((l) => l.length);
      const durations = [...byDay.values()].flat().map((s) => toMin(s.end_time) - toMin(s.start_time)).filter((m) => m > 0);
      const pd = counts.length ? (Math.min(...counts) === Math.max(...counts) ? `${counts[0]}` : `${Math.min(...counts)}–${Math.max(...counts)}`) : "0";
      const dur = durations.length
        ? Math.min(...durations) === Math.max(...durations) ? `${durations[0]} minutes/period` : `${Math.min(...durations)}–${Math.max(...durations)} minutes/period`
        : `${settings.default_period_minutes} minutes/period`;
      const summary = `${describeDays(settings.working_days)} · ${pd} periods/day · ${dur}`;
      checks.push({ id: "periods", title: "Period structure", status: issues.length || counts.length === 0 ? "warn" : "ok",
        summary: issues.length || counts.length === 0 ? `Period structure needs attention · ${summary}` : summary, details: issues, fix });
    }
  }

  /* B. Breaks */
  {
    const fix: FixTarget = { kind: "tab", tab: "breaks", label: "Fix breaks" };
    if (input.breaks === undefined || !byDay || !settings) {
      checks.push({ id: "breaks", title: "Breaks", status: "unknown", summary: "Unable to verify", details: [], fix });
    } else {
      const active = input.breaks.filter((b) => b.is_active !== false);
      const issues: string[] = [];
      const seen = new Set<string>();
      for (const b of active) {
        const days = b.weekday == null ? settings.working_days : [b.weekday];
        const name = BREAK_LABEL[b.break_type] ?? "Break";
        if (b.duration_minutes <= 0) issues.push(`${name} after Period ${b.after_period}: duration must be more than 0.`);
        for (const d of days) {
          const list = byDay.get(d);
          if (!list) continue;
          const k = `${d}|${b.after_period}`;
          if (seen.has(k)) issues.push(`${DAY_SHORT[d]}: more than one break after Period ${b.after_period}.`);
          seen.add(k);
          const idx = list.findIndex((s) => s.period_number === b.after_period);
          if (idx === -1 || idx === list.length - 1) {
            issues.push(`${DAY_SHORT[d]}: ${name} is set after Period ${b.after_period}, which is not followed by another period.`);
            continue;
          }
          const gap = toMin(list[idx + 1].start_time) - toMin(list[idx].end_time);
          if (gap < b.duration_minutes)
            issues.push(`${DAY_SHORT[d]}: ${name} (${b.duration_minutes} min) overlaps Period ${list[idx + 1].period_number}.`);
        }
      }
      const summary = active.length
        ? [...new Map(active.map((b) => [`${b.break_type}|${b.after_period}`, `${BREAK_LABEL[b.break_type] ?? "Break"} after Period ${b.after_period}`])).values()].join(" · ")
        : "No breaks configured";
      checks.push({ id: "breaks", title: "Breaks", status: issues.length ? "warn" : "ok", summary, details: [...new Set(issues)], fix });
    }
  }

  /* C. Subject requirements */
  const reqs = input.requirements?.filter((r) => r.status !== "archived");
  const confirmed = reqs?.filter((r) => r.status === "active") ?? [];
  {
    const fix: FixTarget = { kind: "tab", tab: "subjects", label: "Fix subject periods" };
    if (!reqs || !input.classSections || !input.expectedSubjectsByClass) {
      checks.push({ id: "subjects", title: "Subject requirements", status: "unknown", summary: "Unable to verify", details: [], fix });
    } else {
      const groups = new Map<string, RRequirement[]>();
      for (const r of reqs) {
        const k = keyOf(r.class_name, r.section);
        groups.set(k, [...(groups.get(k) ?? []), r]);
      }
      const drafts = reqs.filter((r) => r.status !== "active");
      const withConfirmed = [...groups.values()].filter((g) => g.some((r) => r.status === "active")).length;
      const withDraft = [...groups.values()].filter((g) => g.some((r) => r.status !== "active")).length;
      let missing = 0;
      const unverifiable: string[] = [];
      const missingLabels: string[] = [];
      for (const cs of input.classSections) {
        const expected = input.expectedSubjectsByClass.get(cs.class_name);
        if (!expected?.length) { unverifiable.push(cs.label); continue; }
        const have = new Set((groups.get(keyOf(cs.class_name, cs.section)) ?? []).map((r) => r.subject_id));
        const m = expected.filter((s) => !have.has(s)).length;
        if (m) { missing += m; missingLabels.push(`${cs.label}: ${m} subject${m > 1 ? "s" : ""} without a requirement`); }
      }
      const details = [
        `${groups.size} class-section${groups.size === 1 ? "" : "s"} have requirements.`,
        `${withConfirmed} with confirmed (active) requirements; ${withDraft} with draft requirements (${drafts.length} draft rows).`,
        ...(missing ? [`${missing} expected subject requirement${missing > 1 ? "s are" : " is"} missing.`, ...missingLabels] : []),
        ...(unverifiable.length ? [`Completeness cannot yet be verified for: ${unverifiable.join(", ")} (no subjects assigned to the class).`] : []),
        "Draft rows, including placeholder 1-period values, are not counted as confirmed curriculum.",
      ];
      const attention = drafts.length > 0 || missing > 0 || confirmed.length === 0 || unverifiable.length > 0;
      checks.push({ id: "subjects", title: "Subject requirements", status: attention ? "warn" : "ok",
        summary: drafts.length > 0 || confirmed.length === 0
          ? "Some subject periods need confirmation before generating a realistic timetable."
          : attention ? "Some subject requirements are missing or cannot be verified." : `${confirmed.length} confirmed requirements`,
        details, fix });
    }
  }

  /* D. Teacher assignments (class-level: assignments carry no section) */
  {
    const fix: FixTarget = { kind: "link", to: "/admin/teachers?tab=assignments", label: "Fix teaching assignments" };
    if (!reqs || !input.assignments || !input.teacherIds) {
      checks.push({ id: "teachers", title: "Teacher assignments", status: "unknown", summary: "Unable to verify", details: [], fix });
    } else {
      const teachers = new Set(input.teacherIds);
      const covered = new Set(input.assignments.filter((a) => teachers.has(a.teacher_id)).map((a) => `${a.class_name}|${a.subject_id}`));
      const has = (r: RRequirement) => covered.has(`${r.class_name}|${r.subject_id}`);
      const cOk = confirmed.filter(has).length;
      const cMissing = confirmed.filter((r) => !has(r));
      const drafts = reqs.filter((r) => r.status !== "active");
      const dMissing = drafts.filter((r) => !has(r)).length;
      const affected = new Set(cMissing.map((r) => labelOf(r.class_name, r.section)));
      const details = [
        `Confirmed requirements with an eligible teacher: ${cOk}.`,
        `Confirmed requirements without an eligible teacher: ${cMissing.length}${affected.size ? ` (${[...affected].join(", ")})` : ""}.`,
        `Draft requirements without an eligible teacher (reported separately): ${dMissing} of ${drafts.length}.`,
        "Teachers without a login count when they have teaching assignments. Assignments are per class, so they cover all its sections.",
      ];
      const status: CheckStatus = confirmed.length === 0 ? "warn" : cMissing.length ? "warn" : "ok";
      checks.push({ id: "teachers", title: "Teacher assignments", status,
        summary: confirmed.length === 0 ? "No confirmed requirements to check yet"
          : cMissing.length ? `${cMissing.length} confirmed subject requirement${cMissing.length > 1 ? "s have" : " has"} no eligible teacher.`
          : `All ${cOk} confirmed requirements have an eligible teacher`,
        details, fix });
    }
  }

  /* E. Teacher availability (exception-only) */
  {
    const fix: FixTarget = { kind: "tab", tab: "availability", label: "Fix availability" };
    if (!input.availability || !input.teacherIds || !slots) {
      checks.push({ id: "availability", title: "Teacher availability", status: "unknown", summary: "Unable to verify", details: [], fix });
    } else {
      const t = new Set(input.teacherIds);
      const s = new Set(slots.map((x) => x.id));
      const bad = input.availability.filter((a) => !t.has(a.teacher_id) || !s.has(a.time_slot_id)).length;
      const unavailable = input.availability.filter((a) => !a.is_available);
      const teachersWith = new Set(unavailable.map((a) => a.teacher_id)).size;
      checks.push({ id: "availability", title: "Teacher availability", status: bad ? "warn" : "ok",
        summary: unavailable.length ? `${unavailable.length} unavailable period${unavailable.length > 1 ? "s" : ""} across ${teachersWith} teacher${teachersWith > 1 ? "s" : ""}` : "All teachers available at all periods",
        details: [
          ...(bad ? [`${bad} availability entr${bad > 1 ? "ies refer" : "y refers"} to a teacher or period that no longer exists.`] : []),
          "Teachers with no entries are treated as available.",
        ], fix });
    }
  }

  /* F. Rooms */
  {
    if (!input.rooms || !input.roomRequirements) {
      checks.push({ id: "rooms", title: "Rooms", status: "unknown", summary: "Unable to verify", details: [], fix: { kind: "tab", tab: "rooms", label: "Fix rooms" } });
    } else {
      const active = input.rooms.filter((r) => r.is_active);
      const ids = new Set(active.map((r) => r.id));
      const types = new Set(active.map((r) => r.room_type));
      const issues: string[] = [];
      for (const rr of input.roomRequirements) {
        if (rr.preferred_room_id && !ids.has(rr.preferred_room_id)) issues.push("A room requirement prefers a room that is inactive or missing.");
        if (rr.is_mandatory && rr.required_room_type && !types.has(rr.required_room_type))
          issues.push(`A mandatory requirement needs a "${rr.required_room_type.replace(/_/g, " ")}" room, but none is active.`);
      }
      checks.push({ id: "rooms", title: "Rooms", status: issues.length ? "warn" : "ok",
        summary: `${active.length} active room${active.length === 1 ? "" : "s"} · ${input.roomRequirements.length} special room rule${input.roomRequirements.length === 1 ? "" : "s"}`,
        details: [...new Set(issues)], fix: { kind: "tab", tab: issues.length ? "room-req" : "rooms", label: issues.length ? "Fix room requirements" : "Open rooms" } });
    }
  }

  /* G. Weekly capacity */
  let capacity: CapacityRow[] | null = null;
  let availablePerWeek: number | null = null;
  {
    const fix: FixTarget = { kind: "tab", tab: "subjects", label: "Fix subject periods" };
    if (!byDay || !reqs || !input.classSections) {
      checks.push({ id: "capacity", title: "Weekly capacity", status: "unknown", summary: "Unable to verify", details: [], fix });
    } else {
      availablePerWeek = [...byDay.values()].reduce((n, l) => n + l.length, 0);
      const rows = new Map<string, CapacityRow>();
      const ensure = (cls: string, section: string | null) => {
        const k = keyOf(cls, section);
        if (!rows.has(k)) rows.set(k, { label: labelOf(cls, section), required: 0, draft: 0, available: availablePerWeek!, remaining: 0, status: "none" });
        return rows.get(k)!;
      };
      for (const cs of input.classSections) ensure(cs.class_name, cs.section);
      for (const r of reqs) {
        const row = ensure(r.class_name, r.section);
        if (r.status === "active") row.required += r.periods_per_week;
        else row.draft += r.periods_per_week;
      }
      capacity = [...rows.values()].map((r) => ({
        ...r,
        remaining: r.available - r.required,
        status: (r.required === 0 ? "none" : r.required > r.available ? "over" : "fits") as CapacityRow["status"],
      })).sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));
      const over = capacity.filter((r) => r.status === "over");
      const none = capacity.filter((r) => r.status === "none").length;
      checks.push({ id: "capacity", title: "Weekly capacity", status: over.length || none ? "warn" : "ok",
        summary: over.length ? `${over.length} class-section${over.length > 1 ? "s need" : " needs"} more periods than available`
          : none ? `${none} class-section${none > 1 ? "s have" : " has"} no confirmed weekly periods yet` : `All class-sections fit within ${availablePerWeek} periods/week`,
        details: over.map((r) => `${r.label}: ${r.required} required / ${r.available} available · ${r.required - r.available} over`),
        fix: over.length ? fix : fix });
    }
  }

  /* H. Existing timetable status (informational, never blocks) */
  {
    if (!input.runs) {
      checks.push({ id: "runs", title: "Saved timetables", status: "unknown", summary: "Unable to verify", details: [], fix: { kind: "tab", tab: "view", label: "Open view" } });
    } else if (input.runs.length === 0) {
      checks.push({ id: "runs", title: "Saved timetables", status: "ok", summary: "No timetable has been generated for this year yet", details: [] });
    } else {
      const latest = input.runs[0];
      const published = input.runs.find((r) => r.status === "published");
      const stats = (latest.solver_stats ?? {}) as Record<string, unknown>;
      const unplaced = typeof stats.unplaced === "number" ? stats.unplaced : typeof stats.unplaced_count === "number" ? stats.unplaced_count : null;
      checks.push({ id: "runs", title: "Saved timetables", status: "ok",
        summary: `Latest run: ${latest.status} on ${new Date(latest.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}${published ? " · a published timetable exists" : " · none published"}`,
        details: [
          unplaced == null ? "Unplaced lessons: not recorded for this run." : `Unplaced lessons: ${unplaced}.`,
          "A saved run reflects the settings at the time it was generated, not necessarily the current ones.",
        ], fix: { kind: "tab", tab: "view", label: "Open view" } });
    }
  }

  const blocking = checks.filter((c) => c.id !== "runs");
  const overall = blocking.some((c) => c.status === "unknown") ? "unknown" : blocking.some((c) => c.status === "warn") ? "attention" : "ready";
  return { overall, checks, capacity, availablePerWeek };
}
