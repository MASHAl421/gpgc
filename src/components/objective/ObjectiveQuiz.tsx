import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, CheckCircle2, XCircle, BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { QuizConfig } from './ObjectivePaperSelector';

interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  explanation: string | null;
  quiz_id: string;
  difficulty?: string;
  question_type?: string;
}

interface ObjectiveQuizProps {
  config: QuizConfig;
  onBack: () => void;
}

const ObjectiveQuiz = ({ config, onBack }: ObjectiveQuizProps) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [showExplanation, setShowExplanation] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchQuestions();
  }, [config]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      
      // Get quizzes for selected topics
      let quizQuery = supabase
        .from('quizzes')
        .select('id, difficulty, topic_id')
        .in('topic_id', config.selectedTopics);
      
      // Filter by difficulty if not all selected
      if (config.difficultyLevels.length < 3) {
        quizQuery = quizQuery.in('difficulty', config.difficultyLevels);
      }

      const { data: quizzes, error: quizError } = await quizQuery;
      
      if (quizError) throw quizError;
      
      if (!quizzes || quizzes.length === 0) {
        setQuestions([]);
        setLoading(false);
        return;
      }

      const quizIds = quizzes.map(q => q.id);
      
      // Get questions for these quizzes
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .in('quiz_id', quizIds)
        .order('order_index');

      if (questionsError) throw questionsError;

      // Add quiz difficulty to questions for display
      const quizDifficultyMap = Object.fromEntries(quizzes.map(q => [q.id, q.difficulty]));
      const enrichedQuestions = (questionsData || []).map(q => ({
        ...q,
        difficulty: quizDifficultyMap[q.quiz_id] || 'medium',
        question_type: 'exercise', // Default, can be enhanced later
      }));

      setQuestions(enrichedQuestions);
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnswer = (questionId: string, option: string) => {
    // Only allow selection if not already answered
    if (selectedAnswers[questionId]) return;
    
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: option,
    }));
    // Auto-show explanation when answer is selected
    setShowExplanation(prev => ({
      ...prev,
      [questionId]: true,
    }));
  };

  const normalizeOption = (value: string | null | undefined) =>
    (value || '').trim().toLowerCase();

  const getOptionClass = (questionId: string, option: string, correctOption: string) => {
    const selected = selectedAnswers[questionId];
    
    if (!selected) {
      return 'bg-card hover:bg-muted border-border hover:border-primary/50 cursor-pointer';
    }
    
    const opt = normalizeOption(option);
    const correct = normalizeOption(correctOption);
    const chosen = normalizeOption(selected);

    const isCorrect = opt === correct;
    const isSelected = opt === chosen;
    
    if (isSelected && isCorrect) {
      // User selected the correct answer - show green (theme token)
      return 'bg-success/10 border-success text-success';
    }
    if (isSelected && !isCorrect) {
      // User selected wrong answer - show red
      return 'bg-destructive/10 border-destructive text-destructive';
    }
    if (isCorrect) {
      // This is the correct answer (show it after user selects wrong) - show green
      return 'bg-success/10 border-success/50 text-success';
    }
    // Other wrong options - dim them
    return 'bg-card border-border opacity-60';
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-primary/10 text-primary border-primary/30';
      case 'medium': return 'bg-secondary text-secondary-foreground border-secondary';
      case 'hard': return 'bg-destructive/10 text-destructive border-destructive/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading questions...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Selection
        </Button>
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Questions Available</h3>
            <p className="text-muted-foreground">
              No questions found for your selected criteria. Try selecting different topics or difficulty levels.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const answeredCount = Object.keys(selectedAnswers).length;
  const correctCount = Object.entries(selectedAnswers).filter(([qId, answer]) => {
    const q = questions.find(q2 => q2.id === qId);
    if (!q) return false;
    return normalizeOption(q.correct_option) === normalizeOption(answer);
  }).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Button variant="outline" onClick={onBack} className="gap-2 w-fit">
          <ArrowLeft className="h-4 w-4" />
          Back to Selection
        </Button>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            Subject: <strong className="text-foreground">{config.subjectName}</strong>
          </span>
          {answeredCount > 0 && (
            <Badge variant="secondary">
              {correctCount}/{answeredCount} Correct
            </Badge>
          )}
        </div>
      </div>

      {/* Title */}
      <Card className="bg-card border-border">
        <CardContent className="py-4">
          <h2 className="text-xl font-bold text-foreground">Objective Paper</h2>
          <p className="text-sm text-muted-foreground">
            {questions.length} Questions • {config.selectedTopics.length} Topics Selected
          </p>
        </CardContent>
      </Card>

      {/* Questions */}
      <div className="space-y-6">
        {questions.map((question, index) => {
          const isAnswered = !!selectedAnswers[question.id];
           const isCorrect =
             normalizeOption(selectedAnswers[question.id]) ===
             normalizeOption(question.correct_option);
          
          return (
            <Card key={question.id} className="bg-card border-border overflow-hidden">
              <CardContent className="p-0">
                {/* Question Header */}
                <div className="bg-muted/50 p-4 border-b border-border">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <span className="text-sm font-semibold text-muted-foreground">
                        Question {index + 1}:
                      </span>
                      <p className="text-foreground mt-1 text-base leading-relaxed">
                        {question.question_text}
                      </p>
                    </div>
                    {isAnswered && (
                      isCorrect 
                        ? <CheckCircle2 className="h-6 w-6 text-primary shrink-0" />
                        : <XCircle className="h-6 w-6 text-destructive shrink-0" />
                    )}
                  </div>
                </div>

                {/* Options */}
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(['a', 'b', 'c', 'd'] as const).map((opt) => {
                    const optionKey = `option_${opt}` as keyof Question;
                    const optionText = question[optionKey] as string;
                    const optionLabel = opt.toUpperCase();
                    
                    return (
                      <div
                        key={opt}
                        onClick={() => handleSelectAnswer(question.id, opt)}
                        className={`
                          p-4 rounded-lg border-2 transition-all
                          ${getOptionClass(question.id, opt, question.correct_option)}
                          ${!isAnswered ? 'cursor-pointer' : 'cursor-default'}
                        `}
                      >
                        <div className="flex items-start gap-3">
                          <span className="font-bold text-lg shrink-0">{optionLabel}.</span>
                          <span className="text-sm">{optionText}</span>
                        </div>
                        {isAnswered && opt === question.correct_option && (
                          <CheckCircle2 className="h-4 w-4 text-primary absolute top-2 right-2" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Meta Info */}
                <div className="px-4 pb-2 flex flex-wrap gap-2 text-xs">
                  <span className="text-muted-foreground">Type: <strong className="text-foreground capitalize">{question.question_type}</strong></span>
                  <span className="text-muted-foreground">Difficulty: <Badge variant="outline" className={`text-xs ${getDifficultyColor(question.difficulty || 'medium')}`}>{question.difficulty || 'Medium'}</Badge></span>
                </div>

                {/* Explanation */}
                {isAnswered && showExplanation[question.id] && question.explanation && (
                  <div className="mx-4 mb-4 p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="text-sm font-semibold text-primary mb-1">Reason:</p>
                    <p className="text-sm text-foreground">{question.explanation}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary */}
      {answeredCount === questions.length && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-6 text-center">
            <h3 className="text-xl font-bold text-foreground mb-2">Quiz Completed!</h3>
            <p className="text-lg text-muted-foreground">
              You scored <strong className="text-primary">{correctCount}</strong> out of <strong>{questions.length}</strong>
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              ({Math.round((correctCount / questions.length) * 100)}% accuracy)
            </p>
            <Button onClick={onBack} className="mt-4">
              Try Another Quiz
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ObjectiveQuiz;
