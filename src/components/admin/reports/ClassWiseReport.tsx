import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatCurrency } from "@/lib/format";
import { ClassFeeReport } from "@/hooks/useFeeReports";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface ClassWiseReportProps {
  data: ClassFeeReport[];
  isLoading: boolean;
}

export function ClassWiseReport({ data, isLoading }: ClassWiseReportProps) {
  if (isLoading) {
    return (
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle>Class-wise Fee Collection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Loading...
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map(item => ({
    name: item.className,
    collected: item.collectedFees,
    pending: item.pendingFees,
  }));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Chart */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle>Collection Overview</CardTitle>
          <CardDescription>Class-wise collected vs pending fees</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  className="fill-muted-foreground"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                  className="fill-muted-foreground"
                />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar 
                  dataKey="collected" 
                  name="Collected" 
                  fill="hsl(var(--status-paid))" 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="pending" 
                  name="Pending" 
                  fill="hsl(var(--status-overdue))" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle>Class-wise Details</CardTitle>
          <CardDescription>Detailed breakdown by class</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-72">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class</TableHead>
                  <TableHead className="text-right">Students</TableHead>
                  <TableHead className="text-right">Pending</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row) => (
                  <TableRow key={row.className}>
                    <TableCell className="font-medium">{row.className}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end">
                        <span>{row.totalStudents}</span>
                        {row.studentsWithPending > 0 && (
                          <span className="text-xs text-status-overdue">
                            {row.studentsWithPending} with dues
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(row.pendingFees)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <Progress 
                          value={row.collectionRate} 
                          className="w-16 h-2"
                        />
                        <Badge 
                          variant={row.collectionRate >= 75 ? "default" : row.collectionRate >= 50 ? "secondary" : "destructive"}
                          className="w-14 justify-center"
                        >
                          {row.collectionRate.toFixed(0)}%
                        </Badge>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {data.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No class data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
