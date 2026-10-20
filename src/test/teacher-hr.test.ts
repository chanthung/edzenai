import { describe, it, expect } from "vitest";
import { validateHr, EMPTY_HR } from "@/components/admin/TeacherHrSection";

describe("teacher HR validation", () => {
  it("allows all fields empty", () => expect(validateHr(EMPTY_HR)).toBeNull());
  it("rejects negative experience", () => expect(validateHr({ ...EMPTY_HR, experience_years: -1 })).not.toBeNull());
  it("rejects fractional experience", () => expect(validateHr({ ...EMPTY_HR, experience_years: 2.5 })).not.toBeNull());
  it("rejects experience above 70", () => expect(validateHr({ ...EMPTY_HR, experience_years: 71 })).not.toBeNull());
  it("allows the experience bounds 0 and 70", () => {
    expect(validateHr({ ...EMPTY_HR, experience_years: 0 })).toBeNull();
    expect(validateHr({ ...EMPTY_HR, experience_years: 70 })).toBeNull();
  });
  it("rejects future date of birth", () => expect(validateHr({ ...EMPTY_HR, date_of_birth: "2999-01-01" })).not.toBeNull());
  it("rejects joining before birth", () =>
    expect(validateHr({ ...EMPTY_HR, date_of_birth: "1990-05-01", date_of_joining: "1985-01-01" })).not.toBeNull());
});
