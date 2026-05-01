import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getInstallmentStatus } from '@/lib/format';
import { PaymentProof } from './usePaymentProofs';

export interface ParentViewData {
  student: {
    id: string;
    name: string;
    class_name: string | null;
    section: string | null;
    roll_number: string | null;
    preferred_language: 'en' | 'hi' | 'as' | 'bn' | null;
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
      proof: PaymentProof | null;
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

      // Parallelize all student-scoped queries — saves ~3 RTTs on slow networks
      const [schoolRes, feesRes, paymentsRes, proofsRes, prefRes] = await Promise.all([
        supabase
          .from('schools')
          .select('id, name, upi_id, qr_code_url, phone, email')
          .eq('id', student.school_id)
          .single(),
        supabase
          .from('student_fees')
          .select(`
            fee_structure:fee_structures(
              id,
              total_amount,
              fee_category:fee_categories(id, name, is_mandatory),
              installments(id, name, amount, due_date, display_order)
            )
          `)
          .eq('student_id', student.id),
        supabase
          .from('payments')
          .select('installment_id, amount_paid, payment_date')
          .eq('student_id', student.id)
          .order('payment_date', { ascending: false }),
        supabase
          .from('payment_proofs')
          .select('*')
          .eq('student_id', student.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('students')
          .select('preferred_language')
          .eq('id', student.id)
          .maybeSingle(),
      ]);

      if (schoolRes.error || !schoolRes.data) {
        throw new Error('School not found');
      }
      if (feesRes.error) throw feesRes.error;
      if (paymentsRes.error) throw paymentsRes.error;
      if (proofsRes.error) throw proofsRes.error;

      const school = schoolRes.data;
      const studentFees = feesRes.data;
      const payments = paymentsRes.data;
      const proofs = proofsRes.data;

      // Create proof lookup by installment (latest proof per installment)
      const proofsByInstallment = (proofs ?? []).reduce((acc, proof) => {
        // Keep only the latest proof for each installment
        if (!acc[proof.installment_id]) {
          acc[proof.installment_id] = proof as PaymentProof;
        }
        return acc;
      }, {} as Record<string, PaymentProof>);

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
              proof: proofsByInstallment[inst.id] || null,
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

      const prefLang = (prefRes?.data?.preferred_language ?? null) as
        | 'en' | 'hi' | 'as' | 'bn' | null;

      return {
        student: {
          id: student.id,
          name: student.name,
          class_name: student.class_name,
          section: student.section,
          roll_number: student.roll_number,
          preferred_language: prefLang,
        },
        school,
        fees,
        summary,
      };
    },
    enabled: !!accessToken,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });
}
