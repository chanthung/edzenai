import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CalendarDays } from "lucide-react";
import { useSchool } from "@/hooks/useSchool";
import { useAcademicYears } from "@/hooks/useAcademicYears";
import { TimetableConfigProvider } from "./TimetableConfigContext";
import { GeneralSection } from "./GeneralSection";
import { TimeSlotsSection } from "./TimeSlotsSection";
import { BreaksSection } from "./BreaksSection";
import { RoomsSection } from "./RoomsSection";
import { TeacherAvailabilitySection } from "./TeacherAvailabilitySection";
import { SubjectRequirementsSection } from "./SubjectRequirementsSection";
import { RoomRequirementsSection } from "./RoomRequirementsSection";

export function TimetableSettingsTab({ canEdit }: { canEdit: boolean }) {
  const { data: school, isLoading: loadingSchool } = useSchool();
  const { data: years = [], isLoading: loadingYears } = useAcademicYears();
  const [yearId, setYearId] = useState<string | null>(null);

  if (loadingSchool || loadingYears) return <Skeleton className="h-96 w-full rounded-xl" />;

  if (years.length === 0) {
    return (
      <Card className="rounded-xl">
        <CardContent className="p-8 text-center">
          <CalendarDays className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            Create an academic year first — timetable settings are saved per academic year.
          </p>
        </CardContent>
      </Card>
    );
  }

  const selectedYear = yearId ?? years.find((y) => y.is_active)?.id ?? years[0].id;

  return (
    <div className="space-y-5">
      <Card className="rounded-xl">
        <CardContent className="p-4 flex flex-wrap items-end gap-4">
          <div className="space-y-2 w-full sm:w-64">
            <Label>Academic year</Label>
            <Select value={selectedYear} onValueChange={setYearId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y.id} value={y.id}>
                    {y.name}
                    {y.is_active ? " (active)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="pb-2 text-sm text-muted-foreground">
            School: <span className="font-medium text-foreground">{school?.name}</span>
            <Badge variant="secondary" className="ml-2 font-normal">Configuration only</Badge>
          </div>
        </CardContent>
      </Card>

      <TimetableConfigProvider
        key={selectedYear}
        schoolId={school?.id ?? null}
        initialYearId={selectedYear}
        canEdit={canEdit}
      >
        <Tabs defaultValue="general">
          <TabsList className="mb-4 flex-wrap h-auto">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="slots">Periods</TabsTrigger>
            <TabsTrigger value="breaks">Breaks</TabsTrigger>
            <TabsTrigger value="rooms">Rooms</TabsTrigger>
            <TabsTrigger value="availability">Teacher Availability</TabsTrigger>
            <TabsTrigger value="subjects">Subject Requirements</TabsTrigger>
            <TabsTrigger value="room-req">Room Requirements</TabsTrigger>
          </TabsList>
          <TabsContent value="general"><GeneralSection /></TabsContent>
          <TabsContent value="slots"><TimeSlotsSection /></TabsContent>
          <TabsContent value="breaks"><BreaksSection /></TabsContent>
          <TabsContent value="rooms"><RoomsSection /></TabsContent>
          <TabsContent value="availability"><TeacherAvailabilitySection /></TabsContent>
          <TabsContent value="subjects"><SubjectRequirementsSection /></TabsContent>
          <TabsContent value="room-req"><RoomRequirementsSection /></TabsContent>
        </Tabs>
      </TimetableConfigProvider>
    </div>
  );
}
