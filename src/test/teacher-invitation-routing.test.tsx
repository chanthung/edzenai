import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Teachers from '@/pages/admin/Teachers';

const mocks = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock('@/components/admin/AdminLayout', () => ({ AdminLayout: ({ children }: any) => <>{children}</> }));
vi.mock('@/components/admin/RestrictedOverlay', () => ({ RestrictedButton: ({ children }: any) => <>{children}</> }));
vi.mock('@/components/admin/TeacherImportDialog', () => ({ TeacherImportDialog: () => null }));
vi.mock('@/components/admin/TeacherDownloadActions', () => ({ TeacherDownloadActions: () => null }));
vi.mock('@/components/admin/EditTeacherDialog', () => ({ EditTeacherDialog: () => null }));
vi.mock('@/components/admin/teaching/TeachingAssignmentsMatrix', () => ({ TeachingAssignmentsMatrix: () => null }));
vi.mock('@/hooks/useSubscriptionStatus', () => ({ useSubscriptionStatus: () => ({ isRestricted: false }) }));
vi.mock('@/hooks/progress/useSubjects', () => ({ useSubjectsWithClasses: () => ({ data: [], isLoading: false }) }));
vi.mock('@/hooks/progress/useResolvedStudents', () => ({ useResolvedStudents: () => ({ data: [] }) }));
vi.mock('@/hooks/useAcademicYears', () => ({ useCurrentAcademicYearContext: () => ({ academic_year_id: 'year' }) }));
vi.mock('@/hooks/useTeachingAssignments', () => ({ useSchoolTeachingAssignments: () => ({ data: [], isLoading: false }) }));
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
vi.mock('@/hooks/useTeachers', () => ({ useTeachers: () => ({
  teachers: [{ id: 'selected-teacher', school_id: 'school', name: 'Existing Teacher', email: null,
    user_id: null, role: 'teacher', employee_id: 'EMP-0004', is_active: false, created_at: '2026-10-21' }],
  invites: [], isLoading: false, error: null,
  inviteUser: { mutateAsync: mocks.send, isPending: false },
  updateTeacher: { isPending: false }, resendInvite: {}, cancelInvite: {},
}) }));

afterEach(cleanup);
beforeEach(() => { vi.clearAllMocks(); mocks.send.mockResolvedValue({ success: true }); });

describe('Add User invitation workflow boundaries', () => {
  it('sends an unused new-teacher email without a target, including after selecting an existing teacher', async () => {
    render(<Teachers />);
    fireEvent.click(screen.getByRole('button', { name: 'Add User' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Link an existing teacher' }));
    fireEvent.click(screen.getByRole('button', { name: /Existing Teacher Not invited/ }));
    fireEvent.change(screen.getByLabelText('Invitation email'), { target: { value: 'old-choice@example.test' } });
    fireEvent.click(screen.getByRole('radio', { name: 'Invite a new teacher' }));
    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'New Teacher' } });
    fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'unused@example.test' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send Invite' }));
    await waitFor(() => expect(mocks.send).toHaveBeenCalledTimes(1));
    expect(mocks.send).toHaveBeenCalledWith({ name: 'New Teacher', email: 'unused@example.test',
      employee_id: null, role: 'teacher', delivery_method: 'email', phone: null, assignments: [] });
    expect(mocks.send.mock.calls[0][0]).not.toHaveProperty('target_teacher_id');
  });

  it('links only the selected HR record and does not also submit the legacy form', async () => {
    render(<Teachers />);
    fireEvent.click(screen.getByRole('button', { name: 'Add User' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Link an existing teacher' }));
    fireEvent.click(screen.getByRole('button', { name: /Existing Teacher Not invited/ }));
    fireEvent.change(screen.getByLabelText('Invitation email'), { target: { value: 'link@example.test' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send Invite' }));
    await waitFor(() => expect(mocks.send).toHaveBeenCalledTimes(1));
    expect(mocks.send).toHaveBeenCalledWith({ name: 'Existing Teacher', email: 'link@example.test',
      role: 'teacher', delivery_method: 'email', phone: null, target_teacher_id: 'selected-teacher' });
  });
});