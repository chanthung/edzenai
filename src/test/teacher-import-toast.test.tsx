import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TeacherImportDialog } from "@/components/admin/TeacherImportDialog";

const mocks = vi.hoisted(() => ({ invoke: vi.fn(), toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn() } }));

vi.mock("sonner", () => ({ toast: mocks.toast }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { functions: { invoke: mocks.invoke } } }));
vi.mock("@/hooks/useUserRole", () => ({ useUserRole: () => ({ isSchoolAdmin: true }) }));
vi.mock("@/hooks/useSubscriptionStatus", () => ({ useSubscriptionStatus: () => ({ isRestricted: false }) }));
vi.mock("@/hooks/useSchool", () => ({ useSchool: () => ({ data: { id: "school" } }) }));
vi.mock("@/hooks/useTeachers", () => ({ useTeachers: () => ({ teachers: [], isLoading: false }) }));
vi.mock("@/assets/teacher-import-template.asset.json", () => ({ default: { url: "template.xlsx" } }));
vi.mock("@/lib/teacher-import", async original => {
  const actual = await original<object>();
  return {
    ...actual,
    parseTeacherWorkbook: () => ({
      headers: ["Full Name"], mapping: ["full_name"],
      rows: Array.from({ length: 16 }, (_, i) => ({ rowNumber: i + 2, values: { full_name: `Teacher ${i + 1}` } })),
      issues: [],
    }),
    validateRows: (rows: Array<{ rowNumber: number; values: Record<string, string> }>) =>
      rows.map(r => ({ ...r, action: "create", issues: [], teacher: undefined })),
    previewOutcomes: (checked: Array<{ rowNumber: number; action: string }>) =>
      checked.map(r => ({ rowNumber: r.rowNumber, status: r.action ? "ready" : "blocked", reasons: [] })),
  };
});

const outcome = (rowNumber: number, status: string) => ({ rowNumber, status, reasons: [] });
const body = (created: number, updated: number, blocked: number, failed: number) => ({
  created, updated, blocked, failed, ready: created + updated, imported: created + updated, invitationRequired: 0,
  results: [...Array.from({ length: created }, (_, i) => outcome(i + 2, "created")), ...Array.from({ length: updated }, (_, i) => outcome(created + i + 2, "updated")), ...Array.from({ length: blocked + failed }, (_, i) => outcome(created + updated + i + 2, "blocked"))],
});

async function importFile() {
  render(<TeacherImportDialog />, { wrapper: ({ children }) => <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider> });
  fireEvent.click(screen.getByRole("button", { name: /import teachers/i }));
  const fakeFile = { name: "teachers.xlsx", size: 10, arrayBuffer: async () => new ArrayBuffer(8) } as unknown as File;
  fireEvent.change(screen.getByLabelText("Teacher workbook"), { target: { files: [fakeFile] } });
  await screen.findByText(/16 detected records/i);
  fireEvent.click(screen.getByRole("checkbox"));
  const confirmBtn = screen.getByRole("button", { name: /confirm import/i });
  console.log('CONFIRM_DISABLED=', (confirmBtn as HTMLButtonElement).disabled, 'CHECKED=', (screen.getByRole("checkbox") as HTMLInputElement).getAttribute('data-state'));
  fireEvent.click(confirmBtn);
  await new Promise(r => setTimeout(r, 50));
  console.log('INVOKE_CALLS=', JSON.stringify(mocks.invoke.mock.calls), 'TOASTS=', mocks.toast.success.mock.calls.length, mocks.toast.warning.mock.calls.length, mocks.toast.error.mock.calls.length);
}

describe("Teacher import result notifications", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("shows a success toast with the actual created count and refreshes nothing stale", async () => {
    mocks.invoke.mockResolvedValue({ data: body(16, 0, 0, 0) });
    await importFile();
    await waitFor(() => expect(mocks.toast.success).toHaveBeenCalledWith("Successfully imported 16 teacher records."));
    expect(mocks.toast.warning).not.toHaveBeenCalled();
    expect(mocks.toast.error).not.toHaveBeenCalled();
  });

  it("shows a warning toast when records are skipped", async () => {
    mocks.invoke.mockResolvedValue({ data: body(12, 2, 2, 0) });
    await importFile();
    await waitFor(() => expect(mocks.toast.warning).toHaveBeenCalledWith(
      "Import completed with warnings: 12 created, 2 updated, 2 skipped.",
      { description: "Review the results for details." },
    ));
    expect(mocks.toast.success).not.toHaveBeenCalled();
  });

  it("never shows a success toast when the import fails", async () => {
    mocks.invoke.mockRejectedValue(new Error("Import could not be processed."));
    await importFile();
    await waitFor(() => expect(mocks.toast.error).toHaveBeenCalledWith("Import failed", { description: "Import could not be processed." }));
    expect(mocks.toast.success).not.toHaveBeenCalled();
    expect(mocks.toast.warning).not.toHaveBeenCalled();
  });
});
