import { useEffect, useState } from 'react';
import { Download, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useUserRole } from '@/hooks/useUserRole';
import { useSchool } from '@/hooks/useSchool';
import type { Teacher } from '@/hooks/useTeachers';
import { deliverTeacherFile, teacherExportBlob } from '@/lib/teacher-downloads';

export function TeacherTemplateDownload() {
  const [blob, setBlob] = useState<Blob | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setError(false);
    void fetch('/downloads/EdZenAI_Teacher_Import_Template.xlsx', { signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error('Template unavailable');
      const bytes = await response.arrayBuffer();
      if (bytes.byteLength < 4 || new Uint8Array(bytes)[0] !== 0x50 || new Uint8Array(bytes)[1] !== 0x4b) throw new Error('Invalid template');
      setBlob(new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
    }).catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [attempt]);
  const download = async () => {
    if (!blob) { toast.error('Could not load the teacher template. Please try again.'); setAttempt(value => value + 1); return; }
    try {
      if (await deliverTeacherFile(blob, 'EdZenAI_Teacher_Import_Template.xlsx')) toast.success('Teacher template download started.');
    } catch { toast.error('Could not download the teacher template. Please try again.'); }
  };
  return <Button variant="outline" disabled={!blob && !error} onClick={() => void download()}><Download className="mr-2 h-4 w-4 shrink-0" />Download Teacher Template</Button>;
}

export function TeacherDownloadActions({ teachers, isLoading, error }: { teachers: Teacher[]; isLoading: boolean; error: unknown }) {
  const { isSchoolAdmin } = useUserRole();
  const { data: school } = useSchool();
  if (!isSchoolAdmin) return null;
  const download = async () => {
    if (!school || error) { toast.error('Could not load saved teacher records. Refresh Users and try again.'); return; }
    if (!teachers.some(teacher => teacher.role === 'teacher')) { toast.info('No teacher records to export.'); return; }
    try {
      const blob = teacherExportBlob(teachers, school.id);
      if (await deliverTeacherFile(blob, `EdZenAI_Teacher_Data_${new Date().toISOString().slice(0, 10)}.xlsx`)) toast.success('Teacher data download started.');
    } catch (cause) { toast.error(cause instanceof Error ? cause.message : 'Could not export teacher data. Please try again.'); }
  };
  return <><TeacherTemplateDownload /><Button variant="outline" disabled={isLoading || !school} onClick={() => void download()}><FileDown className="mr-2 h-4 w-4 shrink-0" />Export Teacher Data</Button></>;
}