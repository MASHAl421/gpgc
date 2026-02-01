import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, FileText, Loader2, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { SubjectiveConfig } from './SubjectivePaperSelector';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SubjectivePaperDisplayProps {
  config: SubjectiveConfig;
  shortCount: number;
  longCount: number;
  onBack: () => void;
}

interface SubjectiveQuestion {
  id: string;
  question: string;
  answer: string;
  type: 'short' | 'long';
  category: 'exercise' | 'conceptual';
  difficulty: 'easy' | 'medium' | 'hard';
}

const SubjectivePaperDisplay = ({ config, shortCount, longCount, onBack }: SubjectivePaperDisplayProps) => {
  const [questions, setQuestions] = useState<SubjectiveQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedAnswers, setExpandedAnswers] = useState<Set<string>>(new Set());

  useEffect(() => {
    generateQuestions();
  }, []);

  const generateQuestions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-subjective-questions', {
        body: {
          subject: config.subjectName,
          topics: config.topicNames,
          shortCount,
          longCount,
          questionTypes: config.questionTypes,
          difficultyLevels: config.difficultyLevels,
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        if (error.message?.includes('429') || error.message?.includes('rate limit')) {
          toast.error('Rate limit exceeded. Please wait a moment and try again.');
        } else if (error.message?.includes('402')) {
          toast.error('Service temporarily unavailable. Please try again later.');
        } else if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
          toast.error('Please login to generate questions.');
        } else {
          toast.error('Failed to generate questions. Please try again.');
        }
        return;
      }
      
      if (data?.error) {
        console.error('API error:', data.error);
        toast.error(data.error);
        return;
      }
      
      if (data?.questions && Array.isArray(data.questions) && data.questions.length > 0) {
        setQuestions(data.questions);
      } else {
        console.error('No questions in response:', data);
        toast.error('No questions were generated. Please try different topics.');
      }
    } catch (error: any) {
      console.error('Error generating questions:', error);
      const errorMessage = error?.message || 'Unknown error occurred';
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('network')) {
        toast.error('Network error. Please check your connection.');
      } else {
        toast.error('Failed to generate questions. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAnswer = (questionId: string) => {
    setExpandedAnswers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const shortQuestions = questions.filter(q => q.type === 'short');
  const longQuestions = questions.filter(q => q.type === 'long');

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'medium': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'hard': return 'bg-red-500/10 text-red-600 border-red-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'exercise': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'conceptual': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="py-12 sm:py-16">
          <div className="flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-primary" />
            <div className="text-center">
              <p className="text-sm sm:text-base text-foreground font-medium">Generating Questions...</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                AI is creating {shortCount} short and {longCount} long questions
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Card */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onBack}
                className="h-8 w-8 sm:h-9 sm:w-9 shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <CardTitle className="text-base sm:text-lg text-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  Subjective Paper
                </CardTitle>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-10 sm:ml-0">
              <Badge variant="outline" className="text-xs">
                Subject: {config.subjectName}
              </Badge>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={generateQuestions}
                className="gap-1.5 h-8 text-xs sm:text-sm"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Regenerate
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Short Questions */}
      {shortQuestions.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6">
            <CardTitle className="text-sm sm:text-base text-foreground">
              Answer the following [Short] questions
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 space-y-3 sm:space-y-4">
            {shortQuestions.map((q, index) => (
              <div key={q.id} className="space-y-2">
                {/* Question */}
                <div className="flex gap-2">
                  <span className="text-primary font-medium text-xs sm:text-sm shrink-0">
                    {index + 1}.
                  </span>
                  <p className="text-xs sm:text-sm text-foreground flex-1">{q.question}</p>
                </div>
                
                {/* Answer Toggle */}
                <button
                  onClick={() => toggleAnswer(q.id)}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-md py-2 px-3 sm:px-4 flex items-center justify-center gap-2 transition-colors"
                >
                  <span className="text-xs sm:text-sm font-medium">
                    {expandedAnswers.has(q.id) ? 'Hide Answer' : 'Show Answer'}
                  </span>
                  {expandedAnswers.has(q.id) ? (
                    <ChevronUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  )}
                </button>

                {/* Answer Content */}
                {expandedAnswers.has(q.id) && (
                  <div className="bg-muted/50 rounded-md p-2.5 sm:p-3 ml-4 sm:ml-5">
                    <p className="text-xs sm:text-sm text-foreground">{q.answer}</p>
                  </div>
                )}

                {/* Metadata */}
                <div className="flex flex-wrap gap-1.5 sm:gap-2 ml-4 sm:ml-5">
                  <Badge variant="outline" className={`text-[10px] sm:text-xs px-1.5 capitalize ${getCategoryColor(q.category)}`}>
                    Type: {q.category}
                  </Badge>
                  <Badge variant="outline" className={`text-[10px] sm:text-xs px-1.5 capitalize ${getDifficultyColor(q.difficulty)}`}>
                    Difficulty: {q.difficulty}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Long Questions */}
      {longQuestions.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6">
            <CardTitle className="text-sm sm:text-base text-foreground">
              Answer the following [Long] questions
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 space-y-4 sm:space-y-5">
            {longQuestions.map((q, index) => (
              <div key={q.id} className="space-y-2 sm:space-y-3">
                {/* Question */}
                <div className="flex gap-2">
                  <span className="text-primary font-medium text-xs sm:text-sm shrink-0">
                    {index + 1}.
                  </span>
                  <p className="text-xs sm:text-sm text-foreground flex-1">{q.question}</p>
                </div>
                
                {/* Answer Toggle */}
                <button
                  onClick={() => toggleAnswer(q.id)}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-md py-2.5 px-3 sm:px-4 flex items-center justify-center gap-2 transition-colors"
                >
                  <span className="text-xs sm:text-sm font-medium">
                    {expandedAnswers.has(q.id) ? 'Hide Answer' : 'Show Answer'}
                  </span>
                  {expandedAnswers.has(q.id) ? (
                    <ChevronUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  )}
                </button>

                {/* Answer Content */}
                {expandedAnswers.has(q.id) && (
                  <div className="bg-muted/50 rounded-md p-3 sm:p-4 ml-4 sm:ml-5">
                    <p className="text-xs sm:text-sm text-foreground whitespace-pre-line">{q.answer}</p>
                  </div>
                )}

                {/* Metadata */}
                <div className="flex flex-wrap gap-1.5 sm:gap-2 ml-4 sm:ml-5">
                  <Badge variant="outline" className={`text-[10px] sm:text-xs px-1.5 capitalize ${getCategoryColor(q.category)}`}>
                    Type: {q.category}
                  </Badge>
                  <Badge variant="outline" className={`text-[10px] sm:text-xs px-1.5 capitalize ${getDifficultyColor(q.difficulty)}`}>
                    Difficulty: {q.difficulty}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* No Questions Message */}
      {questions.length === 0 && (
        <Card className="bg-card border-border">
          <CardContent className="py-8 sm:py-12 text-center">
            <FileText className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3 sm:mb-4" />
            <p className="text-sm sm:text-base text-muted-foreground">No questions generated.</p>
            <Button 
              variant="outline" 
              onClick={generateQuestions} 
              className="mt-4 gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SubjectivePaperDisplay;
