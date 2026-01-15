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
      payment_date: string | null;
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
      // SECURE: Use RPC function to get student by access token
      // This prevents enumeration of all student access tokens
      const { data: studentData, error: studentError } = await supabase
        .rpc('get_student_by_access_token', { _access_token: accessToken });
      
      if (studentError || !studentData || studentData.length === 0) {
        throw new Error('Student not found');
      }

      const student = studentData[0];

      // Get school info (public access is allowed)
      const { data: school, error: schoolError } = await supabase
        .from('schools')
        .select('id, name, upi_id, qr_code_url, phone, email')
        .eq('id', student.school_id)
        .single();

      if (schoolError || !school) {
        throw new Error('School not found');
      }

      // Get student's fee assignments (public access allowed via RLS)
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

      // Get all payments for this student with payment_date (public access allowed via RLS)
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('installment_id, amount_paid, payment_date')
        .eq('student_id', student.id)
        .order('payment_date', { ascending: false });

      if (paymentsError) throw paymentsError;

      // Create payment lookup by installment (amount and latest payment date)
      const paymentsByInstallment = payments?.reduce((acc, payment) => {
        if (!acc[payment.installment_id]) {
          acc[payment.installment_id] = {
            amount: 0,
            payment_date: payment.payment_date // Latest date due to ordering
          };
        }
        acc[payment.installment_id].amount += Number(payment.amount_paid);
        return acc;
      }, {} as Record<string, { amount: number; payment_date: string }>) ?? {};

      // Process fee data
      const fees = (studentFees ?? []).map((sf: any) => {
        const structure = sf.fee_structure;
        const category = structure.fee_category;
        
        const installments = (structure.installments ?? [])
          .sort((a: any, b: any) => a.display_order - b.display_order)
          .map((inst: any) => {
            const paymentInfo = paymentsByInstallment[inst.id];
            const paidAmount = paymentInfo?.amount || 0;
            const isPaid = paidAmount >= inst.amount;
            
            return {
              id: inst.id,
              name: inst.name,
              amount: Number(inst.amount),
              due_date: inst.due_date,
              paid_amount: paidAmount,
              payment_date: isPaid ? paymentInfo?.payment_date : null,
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

      return {
        student: {
          id: student.id,
          name: student.name,
          class_name: student.class_name,
          section: student.section,
          roll_number: student.roll_number,
        },
        school,
        fees,
        summary,
      };
    },
    enabled: !!accessToken,
  });
}
