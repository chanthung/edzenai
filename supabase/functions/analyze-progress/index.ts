import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface StudentData {
  studentName: string;
  className?: string;
  averagePercentage: number;
  trend: number;
  status: 'improving' | 'stable' | 'declining' | 'new';
  isAtRisk: boolean;
  assessmentCount: number;
  subjectBreakdown: Array<{
    subjectName: string;
    averagePercentage: number;
    trend: number;
  }>;
}

interface AnalysisRequest {
  type: 'student' | 'class' | 'ptm';
  studentData?: StudentData;
  classData?: StudentData[];
  language?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { type, studentData, classData, language = 'English' }: AnalysisRequest = await req.json();
    console.log('Analysis request:', { type, language, hasStudentData: !!studentData, classSize: classData?.length });

    let systemPrompt = '';
    let userPrompt = '';

    if (type === 'student' && studentData) {
      systemPrompt = `You are an expert educational analyst helping teachers understand student performance. 
Analyze the student data and provide actionable insights in ${language}.
Be specific, practical, and focus on improvement strategies.
Keep responses concise but helpful.`;

      userPrompt = `Analyze this student's performance:

Student: ${studentData.studentName}
Class: ${studentData.className || 'N/A'}
Overall Average: ${studentData.averagePercentage}%
Trend: ${studentData.trend > 0 ? '+' : ''}${studentData.trend}% (${studentData.status})
At Risk: ${studentData.isAtRisk ? 'Yes' : 'No'}
Assessments Completed: ${studentData.assessmentCount}

Subject Performance:
${studentData.subjectBreakdown.map(s => 
  `- ${s.subjectName}: ${s.averagePercentage}% (trend: ${s.trend > 0 ? '+' : ''}${s.trend}%)`
).join('\n')}

Provide analysis using this EXACT JSON structure:
{
  "summary": "2-3 sentence overall assessment",
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["area needing work 1", "area needing work 2"],
  "recommendations": ["specific action 1", "specific action 2", "specific action 3"],
  "riskLevel": "low" | "medium" | "high",
  "focusSubject": "the one subject to prioritize"
}`;
    } else if (type === 'class' && classData && classData.length > 0) {
      systemPrompt = `You are an expert educational analyst helping teachers understand class-wide performance patterns.
Analyze the class data and provide actionable insights in ${language}.
Focus on identifying patterns, at-risk students, and teaching strategies.`;

      const atRiskStudents = classData.filter(s => s.isAtRisk);
      const avgPercentage = Math.round(classData.reduce((sum, s) => sum + s.averagePercentage, 0) / classData.length);
      const improvingCount = classData.filter(s => s.status === 'improving').length;
      const decliningCount = classData.filter(s => s.status === 'declining').length;

      // Aggregate subject data
      const subjectStats: Record<string, { total: number; count: number }> = {};
      classData.forEach(student => {
        student.subjectBreakdown.forEach(subject => {
          if (!subjectStats[subject.subjectName]) {
            subjectStats[subject.subjectName] = { total: 0, count: 0 };
          }
          subjectStats[subject.subjectName].total += subject.averagePercentage;
          subjectStats[subject.subjectName].count++;
        });
      });

      const subjectAverages = Object.entries(subjectStats)
        .map(([name, stats]) => ({ name, average: Math.round(stats.total / stats.count) }))
        .sort((a, b) => a.average - b.average);

      userPrompt = `Analyze this class performance data:

Total Students: ${classData.length}
Class Average: ${avgPercentage}%
Improving: ${improvingCount} students
Declining: ${decliningCount} students
At Risk: ${atRiskStudents.length} students

Subject Averages (weakest first):
${subjectAverages.map(s => `- ${s.name}: ${s.average}%`).join('\n')}

At-Risk Students:
${atRiskStudents.slice(0, 5).map(s => `- ${s.studentName}: ${s.averagePercentage}% (${s.status})`).join('\n') || 'None'}

Provide analysis using this EXACT JSON structure:
{
  "summary": "2-3 sentence class overview",
  "topPerformers": ["student name 1", "student name 2", "student name 3"],
  "needsAttention": ["student name 1", "student name 2"],
  "hardestSubject": "subject name",
  "easiestSubject": "subject name",
  "classRecommendations": ["teaching strategy 1", "teaching strategy 2"],
  "focusAreas": ["area 1", "area 2"]
}`;
    } else if (type === 'ptm' && studentData) {
      systemPrompt = `You are helping a teacher prepare for a Parent-Teacher Meeting.
Create a parent-friendly summary in ${language} that is:
- Positive and encouraging in tone
- Clear and jargon-free
- Focused on actionable home support strategies
Keep it concise for easy reading.`;

      userPrompt = `Create a PTM summary for this student:

Student: ${studentData.studentName}
Class: ${studentData.className || 'N/A'}
Overall Average: ${studentData.averagePercentage}%
Progress: ${studentData.status} (${studentData.trend > 0 ? '+' : ''}${studentData.trend}%)

Subject Performance:
${studentData.subjectBreakdown.map(s => 
  `- ${s.subjectName}: ${s.averagePercentage}%`
).join('\n')}

Provide a parent-friendly summary using this EXACT JSON structure:
{
  "greeting": "Opening line addressing parents",
  "overallProgress": "1-2 sentences on overall performance",
  "strengths": ["positive point 1", "positive point 2"],
  "areasToImprove": ["gentle suggestion 1", "gentle suggestion 2"],
  "homeSupport": ["what parents can do at home 1", "what parents can do at home 2"],
  "teacherNote": "Encouraging closing message"
}`;
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid request type or missing data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Calling Lovable AI gateway...');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'AI analysis failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error('Empty AI response');
      return new Response(
        JSON.stringify({ error: 'Empty response from AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse JSON from the response
    let analysis;
    try {
      // Try to extract JSON from the response (it might be wrapped in markdown code blocks)
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      analysis = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.log('Raw content:', content);
      // Return the raw content if parsing fails
      analysis = { rawContent: content };
    }

    console.log('Analysis complete for type:', type);
    
    return new Response(
      JSON.stringify({ analysis, type }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-progress:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
