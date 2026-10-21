import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { FieldHelp, FieldHint, SystemGenerated } from "@/components/ui/field-help";

describe("FieldHelp", () => {
  it("opens the popover on click and shows guidance and the action", async () => {
    render(
      <FieldHelp label="Help about Email Address" action={<a href="/admin/teachers">Open Users</a>}>
        <p>Email is optional for HR-only records.</p>
      </FieldHelp>,
    );
    const trigger = screen.getByRole("button", { name: "Help about Email Address" });
    expect(screen.queryByText(/Email is optional/)).toBeNull();
    fireEvent.click(trigger);
    await waitFor(() => {
      expect(screen.getByText(/Email is optional/)).toBeTruthy();
      expect(screen.getByRole("link", { name: "Open Users" })).toBeTruthy();
    });
  });

  it("is keyboard-focusable and opens when activated while focused", async () => {
    render(
      <FieldHelp label="Help about Employee ID">
        <p>Generated automatically.</p>
      </FieldHelp>,
    );
    const trigger = screen.getByRole("button", { name: "Help about Employee ID" });
    trigger.focus();
    expect(document.activeElement).toBe(trigger);
    // Browsers dispatch click for Enter/Space on a focused button; jsdom does not synthesize it.
    fireEvent.click(trigger);
    await waitFor(() => expect(screen.getByText(/Generated automatically/)).toBeTruthy());
  });
});

describe("SystemGenerated", () => {
  it("marks a field as automatically generated", () => {
    render(<SystemGenerated>Assigned automatically — never changes</SystemGenerated>);
    expect(screen.getByText("Assigned automatically — never changes")).toBeTruthy();
  });
});

describe("FieldHint", () => {
  it("renders inline helper text", () => {
    render(<FieldHint>Optional — complete it later.</FieldHint>);
    expect(screen.getByText("Optional — complete it later.")).toBeTruthy();
  });
});
