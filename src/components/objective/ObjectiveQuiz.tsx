import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, CheckCircle2, XCircle, BookOpen, Coins } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { QuizConfig } from './ObjectivePaperSelector';
import { toast } from 'sonner';
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

type OptionKey = 'a' | 'b' | 'c' | 'd';

interface ShuffledOption {
  label: 'A' | 'B' | 'C' | 'D';
  key: OptionKey; // original key in DB
  text: string;
}

interface UIQuestion extends Question {
  shuffledOptions: ShuffledOption[];
}

interface ObjectiveQuizProps {
  config: QuizConfig;
  onBack: () => void;
}

const ObjectiveQuiz = ({ config, onBack }: ObjectiveQuizProps) => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<UIQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [showExplanation, setShowExplanation] = useState<Record<string, boolean>>({});
  const [quizSaved, setQuizSaved] = useState(false);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [startTime] = useState(Date.now());

  const normalizeOption = (value: string | null | undefined) =>
    (value || '').trim().toLowerCase();

  // Deterministic shuffle per question.id (so options don't reshuffle on every render)
  const hashString = (str: string) => {
    let hash = 2166136261;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  };

  const mulberry32 = (seed: number) => {
    return () => {
      let t = (seed += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  const buildShuffledOptions = (q: Question): ShuffledOption[] => {
    const options: Array<{ key: OptionKey; text: string }> = [
      { key: 'a', text: q.option_a },
      { key: 'b', text: q.option_b },
      { key: 'c', text: q.option_c },
      { key: 'd', text: q.option_d },
    ];

    const rng = mulberry32(hashString(q.id));
    // Fisher-Yates shuffle
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }

    const labels: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];
    return options.map((o, idx) => ({ label: labels[idx], key: o.key, text: o.text }));
  };

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
      let questionsQuery = supabase
        .from('questions')
        .select('*')
        .in('quiz_id', quizIds);
      
      // Filter by question_type if not all selected
      if (config.questionTypes.length === 1) {
        questionsQuery = questionsQuery.eq('question_type', config.questionTypes[0]);
      } else if (config.questionTypes.length > 0 && config.questionTypes.length < 2) {
        questionsQuery = questionsQuery.in('question_type', config.questionTypes);
      }

      const { data: questionsData, error: questionsError } = await questionsQuery.order('order_index');

      if (questionsError) throw questionsError;

      // Add quiz difficulty to questions for display
      const quizDifficultyMap = Object.fromEntries(quizzes.map(q => [q.id, q.difficulty]));
      let enrichedQuestions: UIQuestion[] = (questionsData || []).map((q: Question) => ({
        ...q,
        difficulty: quizDifficultyMap[q.quiz_id] || 'medium',
        question_type: q.question_type || 'exercise',
        shuffledOptions: buildShuffledOptions(q),
      }));

      // Client-side filter by difficulty (in case DB filter didn't apply via quiz)
      if (config.difficultyLevels.length > 0 && config.difficultyLevels.length < 3) {
        enrichedQuestions = enrichedQuestions.filter(q => 
          config.difficultyLevels.includes(q.difficulty || 'medium')
        );
      }

      // Client-side filter by question type as fallback
      if (config.questionTypes.length > 0 && config.questionTypes.length < 2) {
        enrichedQuestions = enrichedQuestions.filter(q =>
          config.questionTypes.includes(q.question_type || 'exercise')
        );
      }

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

  // Save quiz attempt and award coins when quiz is completed
  const saveQuizAttempt = useCallback(async (score: number, total: number) => {
    if (!user || quizSaved || questions.length === 0) return;
    
    try {
      setQuizSaved(true);
      const timeTaken = Math.floor((Date.now() - startTime) / 1000);
      
      // Calculate coins based on performance
      const percentage = (score / total) * 100;
      let coins = 0;
      if (percentage >= 90) coins = 15;
      else if (percentage >= 80) coins = 12;
      else if (percentage >= 70) coins = 10;
      else if (percentage >= 60) coins = 7;
      else if (percentage >= 50) coins = 5;
      else coins = 2; // Participation coins

      // Get quiz_id from first question
      const quizId = questions[0].quiz_id;

      // Save quiz attempt
      const { error: attemptError } = await supabase
        .from('quiz_attempts')
        .insert({
          user_id: user.id,
          quiz_id: quizId,
          score,
          total_questions: total,
          time_taken_seconds: timeTaken,
          coins_earned: coins,
        });

      if (attemptError) throw attemptError;

      // Use atomic RPC function to add coins (prevents race conditions)
      const { error: coinError } = await supabase.rpc('add_coins', {
        _user_id: user.id,
        _amount: coins,
        _transaction_type: 'quiz_reward',
        _description: `Quiz completed: ${score}/${total} (${Math.round(percentage)}%)`,
        _reference_id: quizId,
      });

      if (coinError) {
        console.error('Error adding coins:', coinError);
      }

      setCoinsEarned(coins);
      toast.success(`You earned ${coins} coins!`, {
        icon: '🪙',
        description: `Quiz score: ${score}/${total}`,
      });
    } catch (error) {
      console.error('Error saving quiz attempt:', error);
    }
  }, [user, quizSaved, questions, startTime]);

  // Effect to save when all questions are answered
  useEffect(() => {
    const answeredCount = Object.keys(selectedAnswers).length;
    if (answeredCount === questions.length && questions.length > 0 && !quizSaved) {
      const correctCount = Object.entries(selectedAnswers).filter(([qId, answer]) => {
        const q = questions.find(q2 => q2.id === qId);
        if (!q) return false;
        return normalizeOption(q.correct_option) === normalizeOption(answer);
      }).length;
      saveQuizAttempt(correctCount, questions.length);
    }
  }, [selectedAnswers, questions, quizSaved, saveQuizAttempt]);

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
                  {question.shuffledOptions.map((opt) => (
                    <div
                      key={opt.label}
                      onClick={() => handleSelectAnswer(question.id, opt.key)}
                      className={`
                        p-4 rounded-lg border-2 transition-all
                        ${getOptionClass(question.id, opt.key, question.correct_option)}
                        ${!isAnswered ? 'cursor-pointer' : 'cursor-default'}
                      `}
                    >
                      <div className="flex items-start gap-3">
                        <span className="font-bold text-lg shrink-0">{opt.label}.</span>
                        <span className="text-sm">{opt.text}</span>
                      </div>
                      {isAnswered && opt.key === question.correct_option && (
                        <CheckCircle2 className="h-4 w-4 text-primary absolute top-2 right-2" />
                      )}
                    </div>
                  ))}
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
            {coinsEarned > 0 && (
              <div className="flex items-center justify-center gap-2 mt-3 text-primary">
                <Coins className="h-5 w-5" />
                <span className="font-bold">+{coinsEarned} Coins Earned!</span>
              </div>
            )}
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
