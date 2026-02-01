import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DistributionData {
  range: string;
  count: number;
  percentage: number;
}

interface ClassDistributionChartProps {
  data: DistributionData[];
  title?: string;
  totalStudents?: number;
}

export function ClassDistributionChart({ 
  data, 
  title = "Class Distribution",
  totalStudents = 0
}: ClassDistributionChartProps) {
  if (data.length === 0 || totalStudents === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            No distribution data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          <span className="text-sm text-muted-foreground">{totalStudents} students</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="distributionGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
              <XAxis 
                dataKey="range" 
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip 
                formatter={(value: number, name: string) => {
                  if (name === 'count') return [`${value} students`, 'Count'];
                  return [value, name];
                }}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="count" 
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#distributionGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className="flex justify-between mt-4 text-xs text-muted-foreground">
          {data.map((item, idx) => (
            <div key={idx} className="text-center">
              <div className="font-medium text-foreground">{item.count}</div>
              <div>{item.range}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to calculate distribution from student data
export function calculateDistribution(students: Array<{ averagePercentage: number }>): DistributionData[] {
  const ranges = [
    { range: '0-40%', min: 0, max: 40 },
    { range: '40-60%', min: 40, max: 60 },
    { range: '60-80%', min: 60, max: 80 },
    { range: '80-100%', min: 80, max: 100 },
  ];

  const total = students.length;
  
  return ranges.map(({ range, min, max }) => {
    const count = students.filter(s => 
      s.averagePercentage >= min && s.averagePercentage < (max === 100 ? 101 : max)
    ).length;
    return {
      range,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0
    };
  });
}
