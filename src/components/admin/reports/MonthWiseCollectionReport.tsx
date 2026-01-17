import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/format";
import { Calendar, TrendingUp } from "lucide-react";
import { useSchool } from "@/hooks/useSchool";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from "date-fns";

interface MonthData {
  month: string;
  monthLabel: string;
  totalCollected: number;
  transactionCount: number;
}

export function MonthWiseCollectionReport() {
  const { data: school } = useSchool();
  const [selectedYear, setSelectedYear] = useState<string>("current");
  
  const { data: payments, isLoading } = useQuery({
    queryKey: ['payments-monthwise', school?.id],
    queryFn: async () => {
      if (!school?.id) return [];
      
      // Get all students for this school first
      const { data: students } = await supabase
        .from('students')
        .select('id')
        .eq('school_id', school.id);
      
      if (!students?.length) return [];
      
      const studentIds = students.map(s => s.id);
      
      const { data, error } = await supabase
        .from('payments')
        .select('amount_paid, payment_date')
        .in('student_id', studentIds)
        .order('payment_date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!school?.id,
  });

  const monthWiseData = useMemo(() => {
    if (!payments?.length) return [];

    const now = new Date();
    let months: Date[];
    
    if (selectedYear === "current") {
      // Last 12 months
      months = eachMonthOfInterval({
        start: subMonths(startOfMonth(now), 11),
        end: startOfMonth(now),
      });
    } else {
      // Full year selected
      const year = parseInt(selectedYear);
      months = eachMonthOfInterval({
        start: new Date(year, 0, 1),
        end: new Date(year, 11, 31),
      });
    }

    const monthData: MonthData[] = months.map(monthDate => {
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      
      const monthPayments = payments.filter(p => {
        const paymentDate = parseISO(p.payment_date);
        return paymentDate >= monthStart && paymentDate <= monthEnd;
      });

      return {
        month: format(monthDate, 'yyyy-MM'),
        monthLabel: format(monthDate, 'MMM yyyy'),
        totalCollected: monthPayments.reduce((sum, p) => sum + Number(p.amount_paid), 0),
        transactionCount: monthPayments.length,
      };
    });

    return monthData.reverse(); // Most recent first
  }, [payments, selectedYear]);

  const totalForPeriod = useMemo(() => {
    return monthWiseData.reduce((sum, m) => sum + m.totalCollected, 0);
  }, [monthWiseData]);

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [currentYear, currentYear - 1, currentYear - 2];
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <div>
            <CardTitle>Month-wise Collection</CardTitle>
            <CardDescription>
              Fee collection breakdown by month
            </CardDescription>
          </div>
        </div>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current">Last 12 Months</SelectItem>
            {years.map(year => (
              <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {/* Total Summary */}
        <div className="mb-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="font-medium">Total for Period</span>
            </div>
            <span className="text-xl font-bold text-primary">{formatCurrency(totalForPeriod)}</span>
          </div>
        </div>

        {monthWiseData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No payment data available for this period.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Transactions</TableHead>
                  <TableHead className="text-right">Amount Collected</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthWiseData.map((row) => (
                  <TableRow key={row.month}>
                    <TableCell className="font-medium">{row.monthLabel}</TableCell>
                    <TableCell className="text-right">{row.transactionCount}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {row.totalCollected > 0 ? formatCurrency(row.totalCollected) : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
