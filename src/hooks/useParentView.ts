import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getInstallmentStatus } from '@/lib/format';

export interface ParentViewData {
  student: {
    id: string;
    name: string;
    class_name: string | null;
    section: string | null;
    roll_number: string | null;
  };
  school: {
    id: string;
    name: string;
    upi_id: string | null;
    qr_code_url: string | null;
    phone: string | null;
    email: string | null;
  };
  fees: {
    category: string;
    is_mandatory: boolean;
    total_amount: number;
    paid_amount: number;
    pending_amount: number;
    installments: {
      id: string;
      name: string;
      amount: number;
      due_date: string;
      paid_amount: number;
      status: 'paid' | 'upcoming' | 'due' | 'overdue';
    }[];
  }[];
  summary: {
    total_fee: number;
    total_paid: number;
    total_pending: number;
  };
}

export function useParentView(accessToken: string | undefined) {
  return useQuery({
    queryKey: ['parent-view', accessToken],
    queryFn: async (): Promise<ParentViewData> => {
      // Get student by access token
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select(`
          id,
          name,
          class_name,
          section,
          roll_number,
          school:schools(id, name, upi_id, qr_code_url, phone, email)
        `)
        .eq('access_token', accessToken!)
        .single();
      
      if (studentError || !student) {
        throw new Error('Student not found');
      }

      // Get student's fee assignments
      const { data: studentFees, error: feesError } = await supabase
        .from('student_fees')
        .select(`
          fee_structure:fee_structures(
            id,
            total_amount,
            fee_category:fee_categories(id, name, is_mandatory),
            installments(id, name, amount, due_date, display_order)
          )
        `)
        .eq('student_id', student.id);

      if (feesError) throw feesError;

      // Get all payments for this student
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('installment_id, amount_paid')
        .eq('student_id', student.id);

      if (paymentsError) throw paymentsError;

      // Create payment lookup by installment
      const paymentsByInstallment = payments?.reduce((acc, payment) => {
        acc[payment.installment_id] = (acc[payment.installment_id] || 0) + Number(payment.amount_paid);
        return acc;
      }, {} as Record<string, number>) ?? {};

      // Process fee data
      const fees = (studentFees ?? []).map((sf: any) => {
        const structure = sf.fee_structure;
        const category = structure.fee_category;
        
        const installments = (structure.installments ?? [])
          .sort((a: any, b: any) => a.display_order - b.display_order)
          .map((inst: any) => {
            const paidAmount = paymentsByInstallment[inst.id] || 0;
            const isPaid = paidAmount >= inst.amount;
            
            return {
              id: inst.id,
              name: inst.name,
              amount: Number(inst.amount),
              due_date: inst.due_date,
              paid_amount: paidAmount,
              status: getInstallmentStatus(inst.due_date, isPaid),
            };
          });

        const totalPaid = installments.reduce((sum: number, inst: any) => sum + inst.paid_amount, 0);
        
        return {
          category: category.name,
          is_mandatory: category.is_mandatory,
          total_amount: Number(structure.total_amount),
          paid_amount: totalPaid,
          pending_amount: Number(structure.total_amount) - totalPaid,
          installments,
        };
      });

      // Calculate summary
      const summary = fees.reduce(
        (acc, fee) => ({
          total_fee: acc.total_fee + fee.total_amount,
          total_paid: acc.total_paid + fee.paid_amount,
          total_pending: acc.total_pending + fee.pending_amount,
        }),
        { total_fee: 0, total_paid: 0, total_pending: 0 }
      );

      const schoolData = Array.isArray(student.school) ? student.school[0] : student.school;

      return {
        student: {
          id: student.id,
          name: student.name,
          class_name: student.class_name,
          section: student.section,
          roll_number: student.roll_number,
        },
        school: schoolData,
        fees,
        summary,
      };
    },
    enabled: !!accessToken,
  });
}
