import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EditTeacherDialog } from "@/components/admin/EditTeacherDialog";
import type { Teacher } from "@/hooks/useTeachers";

const mocks = vi.hoisted(() => ({
  save: vi.fn(), assignments: vi.fn(), close: vi.fn(), loading: false,
}));
vi.mock("@/hooks/useTeachers", () => ({ useTeachers: () => ({ updateTeacher: { mutateAsync: mocks.save, isPending: false } }) }));
vi.mock("@/hooks/useTeacherSubjects", () => ({ useTeacherSubjects: () => ({
  assignments: [{ subject_id: "english", class_name: "Class 2" }], yearlessCount: 0,
  isLoading: mocks.loading, updateAssignments: { mutateAsync: mocks.assignments, isPending: false },
}) }));
vi.mock("@/hooks/progress/useSubjects", () => ({ useSubjectsWithClasses: () => ({
  data: [{ id: "english", name: "English", assigned_classes: ["Class 2"] }], isLoading: false,
}) }));
vi.mock("@/hooks/useAcademicYears", () => ({ useCurrentAcademicYearContext: () => ({ academic_year_id: "year", name: "2026-2027" }) }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));

const teacher: Teacher = {
  id: "teacher", user_id: "user", school_id: "school", name: "Teacher", email: "teacher@example.com",
  employee_id: "EMP-0001", role: "teacher", is_active: true, created_at: "", updated_at: "",
  employment_status: "on_leave",
};

describe("Stage 1 HR save boundaries", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.loading = false; mocks.save.mockResolvedValue(undefined); });
  it("preserves login access, employee ID and unchanged assignments on HR save", async () => {
    render(<EditTeacherDialog teacher={teacher} open onOpenChange={mocks.close} />);
    fireEvent.change(screen.getByPlaceholderText("e.g. Science"), { target: { value: "English" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));
    await waitFor(() => expect(mocks.close).toHaveBeenCalledWith(false));
    expect(mocks.save).toHaveBeenCalledWith(expect.objectContaining({
      id: "teacher", is_active: true, hr: expect.objectContaining({ department: "English", employment_status: "on_leave" }),
    }));
    expect(mocks.save.mock.calls[0][0]).not.toHaveProperty("employee_id");
    expect(mocks.assignments).not.toHaveBeenCalled();
  });
  it("blocks HR save while assignments are loading", () => {
    mocks.loading = true;
    render(<EditTeacherDialog teacher={teacher} open onOpenChange={mocks.close} />);
    expect(screen.getByRole("button", { name: "Save Changes" })).toBeDisabled();
    expect(mocks.save).not.toHaveBeenCalled();
  });
});