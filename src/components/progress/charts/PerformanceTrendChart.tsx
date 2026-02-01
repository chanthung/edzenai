import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TrendDataPoint {
  name: string;
  percentage: number;
  date?: string;
}

interface PerformanceTrendChartProps {
  data: TrendDataPoint[];
  title?: string;
  showClassAverage?: boolean;
  classAverage?: number;
}

export function PerformanceTrendChart({ 
  data, 
  title = "Performance Trend",
  showClassAverage = false,
  classAverage = 0
}: PerformanceTrendChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            No assessment data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const minValue = Math.min(...data.map(d => d.percentage));
  const maxValue = Math.max(...data.map(d => d.percentage));
  const yDomain = [Math.max(0, minValue - 10), Math.min(100, maxValue + 10)];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                domain={yDomain}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip 
                formatter={(value: number) => [`${value}%`, 'Score']}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              {showClassAverage && classAverage > 0 && (
                <ReferenceLine 
                  y={classAverage} 
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="5 5"
                  label={{ 
                    value: `Class Avg: ${classAverage}%`, 
                    position: 'right',
                    fontSize: 10,
                    fill: 'hsl(var(--muted-foreground))'
                  }}
                />
              )}
              <Line 
                type="monotone" 
                dataKey="percentage" 
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
