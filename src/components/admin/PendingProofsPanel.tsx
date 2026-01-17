import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileCheck, 
  User, 
  Calendar, 
  ChevronRight,
  Clock,
  FileImage,
  FileText
} from 'lucide-react';
import { usePendingPaymentProofs } from '@/hooks/usePaymentProofs';
import { PaymentProofVerifier } from './PaymentProofVerifier';
import { formatCurrency, formatDate } from '@/lib/format';

interface PendingProofsPanelProps {
  schoolId: string | undefined;
}

export function PendingProofsPanel({ schoolId }: PendingProofsPanelProps) {
  const { data: proofs, isLoading } = usePendingPaymentProofs(schoolId);
  const [selectedProof, setSelectedProof] = useState<any>(null);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-1" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const pendingCount = proofs?.length || 0;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Pending Payment Proofs</CardTitle>
            </div>
            {pendingCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {pendingCount} pending
              </Badge>
            )}
          </div>
          <CardDescription>
            Review and verify payment proofs submitted by parents
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingCount === 0 ? (
            <div className="py-8 text-center">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No pending proofs to review</p>
              <p className="text-sm text-muted-foreground mt-1">
                Payment proofs submitted by parents will appear here
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {proofs?.map((proof: any) => {
                  const student = proof.students;
                  const installment = proof.installments;
                  const category = installment.fee_structures.fee_categories;
                  const isPdf = proof.file_url.toLowerCase().endsWith('.pdf');

                  return (
                    <div
                      key={proof.id}
                      className="group p-4 border rounded-lg hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => setSelectedProof(proof)}
                    >
                      <div className="flex items-start gap-3">
                        {/* Thumbnail */}
                        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-muted/50 flex items-center justify-center overflow-hidden border">
                          {isPdf ? (
                            <FileText className="h-6 w-6 text-red-500" />
                          ) : (
                            <img
                              src={proof.file_url}
                              alt="Proof"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement!.innerHTML = '<svg class="h-6 w-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>';
                              }}
                            />
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="font-medium text-sm truncate">
                              {student.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {student.class_name}{student.section && `-${student.section}`}
                            </span>
                          </div>
                          
                          <p className="text-sm text-muted-foreground truncate">
                            {category.name} - {installment.name}
                          </p>
                          
                          <div className="flex items-center gap-3 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {formatCurrency(installment.amount)}
                            </Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(proof.created_at)}
                            </span>
                          </div>
                        </div>

                        {/* Action */}
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <PaymentProofVerifier
        proof={selectedProof}
        open={!!selectedProof}
        onOpenChange={(open) => !open && setSelectedProof(null)}
      />
    </>
  );
}
