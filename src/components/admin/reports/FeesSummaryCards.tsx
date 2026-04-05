import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import { TrendingUp, TrendingDown, Users, IndianRupee, AlertTriangle, CheckCircle2 } from "lucide-react";

interface FeesSummaryCardsProps {
  isLoading: boolean;
  totalStudents: number;
  studentsWithPending: number;
  totalCollected: number;
  totalPending: number;
  collectionRate: number;
  totalCollectedThisMonth?: number;
}

export function FeesSummaryCards({
  isLoading,
  totalStudents,
  studentsWithPending,
  totalCollected,
  totalPending,
  collectionRate,
  totalCollectedThisMonth = 0,
}: FeesSummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="card-elevated">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cappedRate = Math.min(collectionRate, 100);

  const cards = [
    {
      title: "Collected This Month",
      value: formatCurrency(totalCollectedThisMonth),
      icon: CheckCircle2,
      description: "Current month collection",
      iconColor: "text-status-paid",
      bgColor: "bg-status-paid/10",
    },
    {
      title: "Total Collected",
      value: formatCurrency(totalCollected),
      icon: IndianRupee,
      description: `${cappedRate.toFixed(1)}% collection rate`,
      iconColor: "text-status-paid",
      bgColor: "bg-status-paid/10",
    },
    {
      title: "Total Pending",
      value: formatCurrency(totalPending),
      icon: AlertTriangle,
      description: "Outstanding fees",
      iconColor: "text-status-overdue",
      bgColor: "bg-status-overdue/10",
    },
    {
      title: "Students with Dues",
      value: studentsWithPending.toString(),
      icon: Users,
      description: `of ${totalStudents} total students`,
      iconColor: "text-status-partial",
      bgColor: "bg-status-partial/10",
    },
    {
      title: "Collection Rate",
      value: `${cappedRate.toFixed(1)}%`,
      icon: cappedRate >= 75 ? TrendingUp : TrendingDown,
      description: cappedRate >= 75 ? "On track" : "Needs attention",
      iconColor: cappedRate >= 75 ? "text-status-paid" : "text-status-overdue",
      bgColor: cappedRate >= 75 ? "bg-status-paid/10" : "bg-status-overdue/10",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => (
        <Card key={card.title} className="card-elevated">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <div className={`p-2 rounded-full ${card.bgColor}`}>
              <card.icon className={`h-4 w-4 ${card.iconColor}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
