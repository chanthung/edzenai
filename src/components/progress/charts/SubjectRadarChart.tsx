import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SubjectRadarData {
  subject: string;
  student: number;
  classAverage?: number;
}

interface SubjectRadarChartProps {
  data: SubjectRadarData[];
  title?: string;
  showClassComparison?: boolean;
  studentName?: string;
}

export function SubjectRadarChart({ 
  data, 
  title = "Subject Strength Analysis",
  showClassComparison = false,
  studentName = "Student"
}: SubjectRadarChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
            No subject data available
          </div>
        </CardContent>
      </Card>
    );
  }

  // Need at least 3 subjects for radar chart
  if (data.length < 3) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
            Need at least 3 subjects for radar view
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
              <PolarGrid className="stroke-muted" />
              <PolarAngleAxis 
                dataKey="subject" 
                tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }}
              />
              <PolarRadiusAxis 
                angle={30} 
                domain={[0, 100]} 
                tick={{ fontSize: 10 }}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip 
                formatter={(value: number, name: string) => [`${value}%`, name === 'student' ? studentName : 'Class Average']}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              {showClassComparison && (
                <Radar
                  name="Class Average"
                  dataKey="classAverage"
                  stroke="hsl(var(--muted-foreground))"
                  fill="hsl(var(--muted-foreground))"
                  fillOpacity={0.1}
                  strokeDasharray="3 3"
                />
              )}
              <Radar
                name={studentName}
                dataKey="student"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.3}
                strokeWidth={2}
              />
              {showClassComparison && <Legend />}
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
