import { lazy, Suspense, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useParentView } from "@/hooks/useParentView";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { GraduationCap, AlertCircle, IndianRupee, BarChart3, CalendarCheck } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ParentFeesTab } from "@/components/parent/ParentFeesTab";
import { ParentI18nProvider, useT, type Lang } from "@/i18n/parent";
import { LanguageSwitcher } from "@/components/parent/LanguageSwitcher";
import { LanguageSuggestionBanner } from "@/components/parent/LanguageSuggestionBanner";
import { supabase } from "@/integrations/supabase/client";

// Lazy: keeps recharts and attendance UI out of the initial parent bundle
const ParentProgressTab = lazy(() =>
  import("@/components/parent/ParentProgressTab").then(m => ({ default: m.ParentProgressTab }))
);
const ParentAttendanceTab = lazy(() =>
  import("@/components/parent/ParentAttendanceTab").then(m => ({ default: m.ParentAttendanceTab }))
);

const TabFallback = () => (
  <div className="flex items-center justify-center py-12">
    <div className="h-6 w-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
  </div>
);

export default function ParentView() {
  const { token } = useParams<{ name: string; token: string }>();
  const { data, isLoading, error } = useParentView(token);

  // Persist the picked language to DB (best-effort, fire-and-forget).
  const persistLang = useCallback(
    (lang: Lang) => {
      if (!token) return;
      void supabase.functions
        .invoke("set-parent-language", { body: { access_token: token, language: lang } })
        .catch(() => {
          /* ignore — localStorage is the source of truth on this device */
        });
    },
    [token]
  );

  if (isLoading) {
    return (
      <ParentI18nProvider token={token ?? ""} initialLangFromDb={null}>
        <ParentViewSkeleton />
      </ParentI18nProvider>
    );
  }

  if (error || !data) {
    return (
      <ParentI18nProvider token={token ?? ""} initialLangFromDb={null}>
        <ErrorState />
      </ParentI18nProvider>
    );
  }

  return (
    <ParentI18nProvider
      token={token ?? ""}
      initialLangFromDb={data.student.preferred_language}
      onPersist={persistLang}
    >
      <ParentViewInner accessToken={token!} />
    </ParentI18nProvider>
  );
}

function ErrorState() {
  const { t } = useT();
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">{t("errors.linkNotFound")}</h2>
          <p className="text-muted-foreground">{t("errors.linkInvalid")}</p>
        </CardContent>
      </Card>
    </div>
  );
}

function ParentViewInner({ accessToken }: { accessToken: string }) {
  const { t } = useT();
  const { data } = useParentView(accessToken);
  const queryClient = useQueryClient();

  if (!data) return null;
  const { student, school } = data;

  const handleProofSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["parent-view", accessToken] });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-to-br from-primary to-primary/85 text-primary-foreground">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="flex items-start justify-between gap-3 mb-5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-primary-foreground/20 flex items-center justify-center backdrop-blur-sm shrink-0">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <h1 className="font-semibold text-lg truncate">{school.name}</h1>
                <p className="text-primary-foreground/80 text-sm">{t("header.studentPortal")}</p>
              </div>
            </div>
            <LanguageSwitcher />
          </div>

          <div className="bg-primary-foreground/10 rounded-2xl p-5 backdrop-blur-sm">
            <p className="text-primary-foreground/80 text-sm mb-1">{t("header.student")}</p>
            <p className="font-semibold text-xl">{student.name}</p>
            {student.class_name && (
              <p className="text-primary-foreground/80 text-sm mt-1">
                {student.class_name}
                {student.section && `-${student.section}`}
                {student.roll_number && ` • ${t("header.roll")}: ${student.roll_number}`}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* Geo language suggestion banner (shown only on first visit if relevant) */}
      <LanguageSuggestionBanner />

      {/* Tab Navigation */}
      <div className="max-w-2xl mx-auto px-4 mt-3">
        <Tabs defaultValue="fees" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="fees" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <IndianRupee className="h-3.5 w-3.5" />
              {t("tabs.fees")}
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <BarChart3 className="h-3.5 w-3.5" />
              {t("tabs.progress")}
            </TabsTrigger>
            <TabsTrigger value="attendance" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <CalendarCheck className="h-3.5 w-3.5" />
              {t("tabs.attendance")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="fees" className="mt-0">
            <ParentFeesTab data={data} onProofSuccess={handleProofSuccess} />
          </TabsContent>

          <TabsContent value="progress" className="mt-0">
            <Suspense fallback={<TabFallback />}>
              <ParentProgressTab accessToken={accessToken} studentName={student.name} />
            </Suspense>
          </TabsContent>

          <TabsContent value="attendance" className="mt-0">
            <Suspense fallback={<TabFallback />}>
              <ParentAttendanceTab accessToken={accessToken} studentName={student.name} />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <footer className="max-w-2xl mx-auto px-4 py-8 text-center">
        <p className="text-xs text-muted-foreground">{t("footer.note")}</p>
      </footer>
    </div>
  );
}

function ParentViewSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary text-primary-foreground px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Skeleton className="h-12 w-12 rounded-xl bg-primary-foreground/20" />
            <div>
              <Skeleton className="h-5 w-32 bg-primary-foreground/20" />
              <Skeleton className="h-4 w-24 mt-1 bg-primary-foreground/20" />
            </div>
          </div>
          <Skeleton className="h-24 w-full rounded-xl bg-primary-foreground/10" />
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-4 mt-4">
        <Skeleton className="h-10 w-full mb-4" />
        <Card className="card-elevated">
          <CardContent className="p-6">
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="text-center">
                  <Skeleton className="h-4 w-16 mx-auto mb-2" />
                  <Skeleton className="h-6 w-20 mx-auto" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
