import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "./useSchool";

export interface ClassFeeReport {
  className: string;
  totalStudents: number;
  studentsWithPending: number;
  totalFees: number;
  collectedFees: number;
  pendingFees: number;
  collectionRate: number;
}

export interface StudentFeeReport {
  studentId: string;
  studentName: string;
  className: string | null;
  section: string | null;
  rollNumber: string | null;
  parentPhone: string | null;
  accessToken: string | null;
  totalFees: number;
  paidAmount: number;
  pendingAmount: number;
  status: 'paid' | 'partial' | 'unpaid';
}

export interface FeeReportSummary {
  totalStudents: number;
  studentsWithFees: number;
  studentsWithPending: number;
  totalFeesExpected: number;
  totalCollected: number;
  totalPending: number;
  collectionRate: number;
  totalCollectedThisMonth: number;
  classWiseReports: ClassFeeReport[];
  studentReports: StudentFeeReport[];
}

export function useFeeReports() {
  const { data: school } = useSchool();

  return useQuery({
    queryKey: ['fee-reports', school?.id],
    queryFn: async (): Promise<FeeReportSummary> => {
      if (!school?.id) throw new Error('No school');

      // Fetch all students
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id, name, class_name, section, roll_number, parent_phone, access_token')
        .eq('school_id', school.id);

      if (studentsError) throw studentsError;

      // Fetch all student fees with fee structure details
      const { data: studentFees, error: feesError } = await supabase
        .from('student_fees')
        .select(`
          student_id,
          fee_structure:fee_structures(
            id,
            total_amount,
            installments(id, amount)
          )
        `);

      if (feesError) throw feesError;

      // Fetch all payments
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('student_id, installment_id, amount_paid, payment_date');

      if (paymentsError) throw paymentsError;

      // Create a map of student payments
      const studentPaymentsMap = new Map<string, number>();
      payments?.forEach(payment => {
        const current = studentPaymentsMap.get(payment.student_id) || 0;
        studentPaymentsMap.set(payment.student_id, current + Number(payment.amount_paid));
      });

      // Create a map of student total fees
      const studentFeesMap = new Map<string, number>();
      studentFees?.forEach(sf => {
        if (sf.fee_structure) {
          const current = studentFeesMap.get(sf.student_id) || 0;
          const feeAmount = Number(sf.fee_structure.total_amount);
          studentFeesMap.set(sf.student_id, current + feeAmount);
        }
      });

      // Build student reports
      const studentReports: StudentFeeReport[] = (students || []).map(student => {
        const totalFees = studentFeesMap.get(student.id) || 0;
        const paidAmount = studentPaymentsMap.get(student.id) || 0;
        const pendingAmount = Math.max(0, totalFees - paidAmount);
        
        let status: 'paid' | 'partial' | 'unpaid' = 'unpaid';
        if (totalFees > 0) {
          if (paidAmount >= totalFees) {
            status = 'paid';
          } else if (paidAmount > 0) {
            status = 'partial';
          }
        }

        return {
          studentId: student.id,
          studentName: student.name,
          className: student.class_name,
          section: student.section,
          rollNumber: student.roll_number,
          parentPhone: student.parent_phone,
          accessToken: student.access_token,
          totalFees,
          paidAmount,
          pendingAmount,
          status,
        };
      });

      // Build class-wise reports
      const classMap = new Map<string, {
        students: StudentFeeReport[];
      }>();

      studentReports.forEach(report => {
        const className = report.className || 'Unassigned';
        if (!classMap.has(className)) {
          classMap.set(className, { students: [] });
        }
        classMap.get(className)!.students.push(report);
      });

      const classWiseReports: ClassFeeReport[] = Array.from(classMap.entries())
        .map(([className, data]) => {
          const totalStudents = data.students.length;
          const studentsWithPending = data.students.filter(s => s.pendingAmount > 0).length;
          const totalFees = data.students.reduce((sum, s) => sum + s.totalFees, 0);
          const collectedFees = data.students.reduce((sum, s) => sum + s.paidAmount, 0);
          const pendingFees = data.students.reduce((sum, s) => sum + s.pendingAmount, 0);
          const collectionRate = totalFees > 0 ? (collectedFees / totalFees) * 100 : 0;

          return {
            className,
            totalStudents,
            studentsWithPending,
            totalFees,
            collectedFees,
            pendingFees,
            collectionRate: Math.min(collectionRate, 100),
          };
        })
        .sort((a, b) => a.className.localeCompare(b.className));

      // Calculate summary
      const totalStudents = students?.length || 0;
      const studentsWithFees = studentReports.filter(s => s.totalFees > 0).length;
      const studentsWithPending = studentReports.filter(s => s.pendingAmount > 0).length;
      const totalFeesExpected = studentReports.reduce((sum, s) => sum + s.totalFees, 0);
      const totalCollected = studentReports.reduce((sum, s) => sum + s.paidAmount, 0);
      const totalPending = studentReports.reduce((sum, s) => sum + s.pendingAmount, 0);
      const collectionRate = totalFeesExpected > 0 ? Math.min((totalCollected / totalFeesExpected) * 100, 100) : 0;

      // Calculate this month's collection
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const totalCollectedThisMonth = (payments || [])
        .filter(p => {
          const d = new Date(p.payment_date);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        })
        .reduce((sum, p) => sum + Number(p.amount_paid), 0);

      return {
        totalStudents,
        studentsWithFees,
        studentsWithPending,
        totalFeesExpected,
        totalCollected,
        totalPending,
        collectionRate,
        totalCollectedThisMonth,
        classWiseReports,
        studentReports,
      };
    },
    enabled: !!school?.id,
  });
}
