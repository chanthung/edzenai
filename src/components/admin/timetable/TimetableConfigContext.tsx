import { createContext, useContext, useState, useMemo, ReactNode } from "react";

interface TimetableConfigValue {
  schoolId: string | null;
  academicYearId: string | null;
  setAcademicYearId: (id: string) => void;
  canEdit: boolean;
}

const Ctx = createContext<TimetableConfigValue | null>(null);

export function TimetableConfigProvider({
  schoolId,
  canEdit,
  initialYearId,
  children,
}: {
  schoolId: string | null;
  canEdit: boolean;
  initialYearId: string | null;
  children: ReactNode;
}) {
  const [yearId, setYearId] = useState<string | null>(initialYearId);
  const effectiveYear = yearId ?? initialYearId;

  const value = useMemo(
    () => ({
      schoolId,
      academicYearId: effectiveYear,
      setAcademicYearId: setYearId,
      canEdit,
    }),
    [schoolId, effectiveYear, canEdit]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTimetableConfig() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTimetableConfig must be used inside TimetableConfigProvider");
  return ctx;
}
