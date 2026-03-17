import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface StudentAnalysisData {
  studentName: string;
  className?: string | null;
  nepStage?: string | null;
  averagePercentage: number;
  trend: number;
  status: 'improving' | 'stable' | 'declining' | 'new';
  isAtRisk: boolean;
  assessmentCount: number;
  subjectBreakdown: Array<{
    subjectName: string;
    subjectType?: string;
    averagePercentage: number;
    trend: number;
  }>;
  domainBreakdown?: {
    cognitive?: number;
    affective?: number;
    psychomotor?: number;
  };
}

export interface StudentInsights {
  summary: string;
  strengths: string[];
  improvements: string[];
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high';
  focusSubject: string;
  prioritySubject: string;
  suggestedTeacherActions: string[];
  parentCommunicationTips?: string[];
}

export interface ClassInsights {
  summary: string;
  topPerformers: string[];
  needsAttention: string[];
  hardestSubject: string;
  easiestSubject: string;
  classRecommendations: string[];
  focusAreas: string[];
}

export interface PTMSummary {
  greeting: string;
  overallProgress: string;
  strengths: string[];
  areasToImprove: string[];
  homeSupport: string[];
  teacherNote: string;
}

export function useAIAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [studentInsights, setStudentInsights] = useState<StudentInsights | null>(null);
  const [classInsights, setClassInsights] = useState<ClassInsights | null>(null);
  const [ptmSummary, setPtmSummary] = useState<PTMSummary | null>(null);

  const analyzeStudent = async (studentData: StudentAnalysisData): Promise<StudentInsights | null> => {
    setIsAnalyzing(true);
    setStudentInsights(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('analyze-progress', {
        body: {
          type: 'student',
          studentData,
        },
      });

      if (error) {
        console.error('Analysis error:', error);
        toast({
          title: 'Analysis failed',
          description: error.message || 'Could not generate insights',
          variant: 'destructive',
        });
        return null;
      }

      if (data?.analysis) {
        setStudentInsights(data.analysis as StudentInsights);
        return data.analysis as StudentInsights;
      }
      
      return null;
    } catch (err) {
      console.error('Analysis error:', err);
      toast({
        title: 'Analysis failed',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeClass = async (classData: StudentAnalysisData[]): Promise<ClassInsights | null> => {
    setIsAnalyzing(true);
    setClassInsights(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('analyze-progress', {
        body: {
          type: 'class',
          classData,
        },
      });

      if (error) {
        console.error('Analysis error:', error);
        toast({
          title: 'Analysis failed',
          description: error.message || 'Could not generate class insights',
          variant: 'destructive',
        });
        return null;
      }

      if (data?.analysis) {
        setClassInsights(data.analysis as ClassInsights);
        return data.analysis as ClassInsights;
      }
      
      return null;
    } catch (err) {
      console.error('Analysis error:', err);
      toast({
        title: 'Analysis failed',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generatePTMSummary = async (studentData: StudentAnalysisData): Promise<PTMSummary | null> => {
    setIsAnalyzing(true);
    setPtmSummary(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('analyze-progress', {
        body: {
          type: 'ptm',
          studentData,
        },
      });

      if (error) {
        console.error('PTM generation error:', error);
        toast({
          title: 'Generation failed',
          description: error.message || 'Could not generate PTM summary',
          variant: 'destructive',
        });
        return null;
      }

      if (data?.analysis) {
        setPtmSummary(data.analysis as PTMSummary);
        return data.analysis as PTMSummary;
      }
      
      return null;
    } catch (err) {
      console.error('PTM generation error:', err);
      toast({
        title: 'Generation failed',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearInsights = () => {
    setStudentInsights(null);
    setClassInsights(null);
    setPtmSummary(null);
  };

  return {
    isAnalyzing,
    studentInsights,
    classInsights,
    ptmSummary,
    analyzeStudent,
    analyzeClass,
    generatePTMSummary,
    clearInsights,
  };
}
