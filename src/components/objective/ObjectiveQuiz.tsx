import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, ArrowLeft, CheckCircle2, XCircle, BookOpen, Coins, Flag, Eye, EyeOff, Send, Clock, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { QuizConfig } from './ObjectivePaperSelector';
import { toast } from 'sonner';
import { ExamTimer, QuestionNavigator, ExamSummary, ExamResult, QuestionStatus } from '@/components/exam';
import { cn } from '@/lib/utils';

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
  key: OptionKey;
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
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [quizSaved, setQuizSaved] = useState(false);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [startTime] = useState(Date.now());
  const [timeTaken, setTimeTaken] = useState(0);
  const [showAnswersInReview, setShowAnswersInReview] = useState(false);

  const { examSettings } = config;
  const isExamMode = examSettings.mode === 'exam';

  const normalizeOption = (value: string | null | undefined) =>
    (value || '').trim().toLowerCase();

  // Deterministic shuffle per question.id
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

  const buildShuffledOptions = useCallback((q: Question): ShuffledOption[] => {
    const options: Array<{ key: OptionKey; text: string }> = [
      { key: 'a', text: q.option_a },
      { key: 'b', text: q.option_b },
      { key: 'c', text: q.option_c },
      { key: 'd', text: q.option_d },
    ];

    if (examSettings.shuffleOptions) {
      const rng = mulberry32(hashString(q.id));
      for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
      }
    }

    const labels: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];
    return options.map((o, idx) => ({ label: labels[idx], key: o.key, text: o.text }));
  }, [examSettings.shuffleOptions]);

  // Shuffle questions array
  const shuffleArray = <T,>(arr: T[], seed: number): T[] => {
    const result = [...arr];
    const rng = mulberry32(seed);
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };

  useEffect(() => {
    fetchQuestions();
  }, [config]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      
      let quizQuery = supabase
        .from('quizzes')
        .select('id, difficulty, topic_id')
        .in('topic_id', config.selectedTopics);
      
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
      
      let questionsQuery = supabase
        .from('questions')
        .select('*')
        .in('quiz_id', quizIds);
      
      if (config.questionTypes.length === 1) {
        questionsQuery = questionsQuery.eq('question_type', config.questionTypes[0]);
      }

      const { data: questionsData, error: questionsError } = await questionsQuery.order('order_index');

      if (questionsError) throw questionsError;

      const quizDifficultyMap = Object.fromEntries(quizzes.map(q => [q.id, q.difficulty]));
      let enrichedQuestions: UIQuestion[] = (questionsData || []).map((q: Question) => ({
        ...q,
        difficulty: quizDifficultyMap[q.quiz_id] || 'medium',
        question_type: q.question_type || 'exercise',
        shuffledOptions: buildShuffledOptions(q),
      }));

      // Client-side filter by difficulty
      if (config.difficultyLevels.length > 0 && config.difficultyLevels.length < 3) {
        enrichedQuestions = enrichedQuestions.filter(q => 
          config.difficultyLevels.includes(q.difficulty || 'medium')
        );
      }

      // Client-side filter by question type
      if (config.questionTypes.length > 0 && config.questionTypes.length < 2) {
        enrichedQuestions = enrichedQuestions.filter(q =>
          config.questionTypes.includes(q.question_type || 'exercise')
        );
      }

      // Shuffle questions if enabled
      if (examSettings.shuffleQuestions && enrichedQuestions.length > 0) {
        enrichedQuestions = shuffleArray(enrichedQuestions, Date.now());
      }

      // Limit questions for entrance exam mode
      if (config.questionCount && config.questionCount > 0 && enrichedQuestions.length > config.questionCount) {
        enrichedQuestions = enrichedQuestions.slice(0, config.questionCount);
      }

      setQuestions(enrichedQuestions);
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnswer = (questionId: string, option: string) => {
    // In exam mode, allow changing answers; in practice mode after answer is locked, don't allow
    if (!isExamMode && selectedAnswers[questionId]) return;
    
    const isNewAnswer = !selectedAnswers[questionId];
    
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: option,
    }));
    
    // Auto-advance to next question after selection (with small delay for visual feedback)
    if (isNewAnswer && currentQuestionIndex < questions.length - 1) {
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev + 1);
      }, 300);
    }
  };

  const toggleFlag = (index: number) => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  // Question statuses for navigator
  const questionStatuses = useMemo((): Record<number, QuestionStatus> => {
    const statuses: Record<number, QuestionStatus> = {};
    questions.forEach((q, idx) => {
      const isAnswered = !!selectedAnswers[q.id];
      const isFlagged = flaggedQuestions.has(idx);
      
      if (isAnswered && isFlagged) {
        statuses[idx] = 'answered-flagged';
      } else if (isAnswered) {
        statuses[idx] = 'answered';
      } else if (isFlagged) {
        statuses[idx] = 'flagged';
      } else {
        statuses[idx] = 'unanswered';
      }
    });
    return statuses;
  }, [questions, selectedAnswers, flaggedQuestions]);

  // Save quiz attempt
  const saveQuizAttempt = useCallback(async () => {
    if (!user || quizSaved || questions.length === 0) return;
    
    try {
      setQuizSaved(true);
      const finalTimeTaken = Math.floor((Date.now() - startTime) / 1000);
      setTimeTaken(finalTimeTaken);
      
      // Calculate score
      let correctCount = 0;
      let wrongCount = 0;
      
      questions.forEach(q => {
        const answer = selectedAnswers[q.id];
        if (answer) {
          if (normalizeOption(answer) === normalizeOption(q.correct_option)) {
            correctCount++;
          } else {
            wrongCount++;
          }
        }
      });

      // Calculate score with negative marking
      let finalScore = correctCount;
      if (examSettings.negativeMarking) {
        finalScore = correctCount - (wrongCount * examSettings.negativeMarkingValue);
      }

      const percentage = (correctCount / questions.length) * 100;
      let coins = 0;
      if (percentage >= 90) coins = 15;
      else if (percentage >= 80) coins = 12;
      else if (percentage >= 70) coins = 10;
      else if (percentage >= 60) coins = 7;
      else if (percentage >= 50) coins = 5;
      else coins = 2;

      const quizId = questions[0].quiz_id;

      const { error: attemptError } = await supabase
        .from('quiz_attempts')
        .insert({
          user_id: user.id,
          quiz_id: quizId,
          score: correctCount,
          total_questions: questions.length,
          time_taken_seconds: finalTimeTaken,
          coins_earned: coins,
        });

      if (attemptError) throw attemptError;

      const { error: coinError } = await supabase.rpc('add_coins', {
        _user_id: user.id,
        _amount: coins,
        _transaction_type: 'quiz_reward',
        _description: `Quiz completed: ${correctCount}/${questions.length} (${Math.round(percentage)}%)`,
        _reference_id: quizId,
      });

      if (coinError) {
        console.error('Error adding coins:', coinError);
      }

      setCoinsEarned(coins);
    } catch (error) {
      console.error('Error saving quiz attempt:', error);
    }
  }, [user, quizSaved, questions, selectedAnswers, startTime, examSettings]);

  const handleSubmit = async () => {
    await saveQuizAttempt();
    setShowSummary(false);
    setShowResults(true);
  };

  const handleTimeUp = () => {
    toast.warning('Time is up! Submitting your exam...');
    handleSubmit();
  };

  const getOptionClass = (questionId: string, option: string, correctOption: string) => {
    const selected = selectedAnswers[questionId];
    const shouldReveal = !isExamMode || showResults || showAnswersInReview;
    
    if (!selected || (isExamMode && !shouldReveal)) {
      const isSelected = selected === option;
      return cn(
        'bg-card border-border cursor-pointer transition-all',
        isSelected ? 'ring-2 ring-primary border-primary' : 'hover:bg-muted hover:border-primary/50'
      );
    }
    
    const opt = normalizeOption(option);
    const correct = normalizeOption(correctOption);
    const chosen = normalizeOption(selected);

    const isCorrect = opt === correct;
    const isSelected = opt === chosen;
    
    if (isSelected && isCorrect) {
      return 'bg-success/10 border-success text-success cursor-default';
    }
    if (isSelected && !isCorrect) {
      return 'bg-destructive/10 border-destructive text-destructive cursor-default';
    }
    if (isCorrect) {
      return 'bg-success/10 border-success/50 text-success cursor-default';
    }
    return 'bg-card border-border opacity-60 cursor-default';
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

  // Show results screen
  if (showResults) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Selection
        </Button>
        <ExamResult
          questions={questions}
          answers={selectedAnswers}
          timeTaken={timeTaken}
          negativeMarking={examSettings.negativeMarking}
          negativeMarkingValue={examSettings.negativeMarkingValue}
          coinsEarned={coinsEarned}
          onRetry={() => {
            setSelectedAnswers({});
            setFlaggedQuestions(new Set());
            setCurrentQuestionIndex(0);
            setShowResults(false);
            setQuizSaved(false);
            setShowAnswersInReview(false);
          }}
          onGoHome={onBack}
          onViewDetails={() => {
            setShowResults(false);
            setShowAnswersInReview(true);
            setCurrentQuestionIndex(0);
          }}
        />
      </div>
    );
  }

  // Show summary before submission
  if (showSummary) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => setShowSummary(false)} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Continue Exam
        </Button>
        <ExamSummary
          questions={questions}
          answers={selectedAnswers}
          questionStatuses={questionStatuses}
          timeTaken={Math.floor((Date.now() - startTime) / 1000)}
          timeLimit={examSettings.timeLimit * 60}
          negativeMarking={examSettings.negativeMarking}
          negativeMarkingValue={examSettings.negativeMarkingValue}
          onSubmit={handleSubmit}
          onReview={(index) => {
            setCurrentQuestionIndex(index);
            setShowSummary(false);
          }}
          onCancel={() => setShowSummary(false)}
        />
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = Object.keys(selectedAnswers).length;
  const isCurrentAnswered = !!selectedAnswers[currentQuestion.id];
  const isCurrentFlagged = flaggedQuestions.has(currentQuestionIndex);
  const shouldShowExplanation = (!isExamMode && examSettings.showExplanations && isCurrentAnswered) || showAnswersInReview;

  return (
    <div className="min-h-[calc(100vh-200px)] flex flex-col animate-in fade-in-0 duration-500">
      {/* Sticky Header - Two rows on mobile */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border pb-3 mb-4">
        <div className="flex flex-col gap-3">
          {/* Top row: Exit, Subject, Mode badge */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 px-2 sm:px-3 shrink-0">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Exit</span>
              </Button>
              <div className="h-5 w-px bg-border hidden sm:block" />
              <span className="text-sm font-medium text-foreground truncate flex-1">
                {config.subjectName}
              </span>
              <Badge 
                variant={isExamMode ? 'destructive' : 'secondary'} 
                className="shrink-0 text-xs"
              >
                {isExamMode ? 'Exam' : 'Practice'}
              </Badge>
            </div>
            
            {/* Desktop: Timer and Progress inline */}
            <div className="hidden sm:flex items-center gap-3">
              {examSettings.timeLimit > 0 && !showAnswersInReview && (
                <div className="flex items-center gap-2 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl px-4 py-2 border border-primary/20 shadow-sm animate-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/20">
                    <Clock className="h-4 w-4 text-primary animate-pulse" />
                  </div>
                  <ExamTimer
                    totalSeconds={examSettings.timeLimit * 60}
                    onTimeUp={handleTimeUp}
                    isPaused={showResults}
                    className="!bg-transparent !p-0 text-lg font-bold text-primary"
                  />
                </div>
              )}
              
              <div className="flex items-center gap-3 bg-gradient-to-r from-muted to-muted/50 rounded-xl px-4 py-2 border border-border shadow-sm">
                <div className="text-base font-bold text-foreground">{answeredCount}<span className="text-muted-foreground">/{questions.length}</span></div>
                <Progress value={(answeredCount / questions.length) * 100} className="w-20 h-2" />
              </div>
            </div>
          </div>
          
          {/* Mobile: Timer and Progress on separate row */}
          <div className="flex sm:hidden items-center justify-between gap-2">
            {examSettings.timeLimit > 0 && !showAnswersInReview ? (
              <div className="flex items-center gap-2 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg px-3 py-1.5 border border-primary/20 shadow-sm flex-1">
                <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/20">
                  <Clock className="h-3 w-3 text-primary animate-pulse" />
                </div>
                <ExamTimer
                  totalSeconds={examSettings.timeLimit * 60}
                  onTimeUp={handleTimeUp}
                  isPaused={showResults}
                  className="!bg-transparent !p-0 text-sm font-bold text-primary"
                />
              </div>
            ) : <div />}
            
            <div className="flex items-center gap-2 bg-gradient-to-r from-muted to-muted/50 rounded-lg px-3 py-1.5 border border-border shadow-sm">
              <div className="text-sm font-bold text-foreground">{answeredCount}<span className="text-muted-foreground">/{questions.length}</span></div>
              <Progress value={(answeredCount / questions.length) * 100} className="w-12 h-1.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Responsive Layout */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4">
        {/* Question Card - Full Width (Navigator removed) */}
        <div className="flex-1 flex flex-col min-w-0 max-w-4xl mx-auto w-full">
          {/* Question Card with Animation */}
          <Card 
            key={currentQuestion.id}
            className="bg-card border-border flex-1 flex flex-col overflow-hidden shadow-xl rounded-2xl sm:rounded-3xl animate-in fade-in-0 slide-in-from-right-4 duration-300"
          >
            {/* Enhanced Question Header */}
            <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5 sm:p-7 border-b border-border relative overflow-hidden">
              {/* Decorative element */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              
              <div className="flex items-start justify-between gap-4 relative">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className="inline-flex items-center justify-center h-9 px-4 rounded-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-sm font-bold shadow-md">
                      <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                      {currentQuestionIndex + 1}/{questions.length}
                    </span>
                    <Badge 
                      variant="outline" 
                      className={cn("text-xs capitalize px-3 py-1", getDifficultyColor(currentQuestion.difficulty || 'medium'))}
                    >
                      {currentQuestion.difficulty || 'Medium'}
                    </Badge>
                    <Badge variant="outline" className="capitalize text-xs px-3 py-1 bg-background/50">
                      {currentQuestion.question_type || 'Exercise'}
                    </Badge>
                  </div>
                  <p className="text-foreground text-lg sm:text-xl leading-relaxed font-semibold">
                    {currentQuestion.question_text}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant={isCurrentFlagged ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => toggleFlag(currentQuestionIndex)}
                    className={cn(
                      "h-10 w-10 sm:h-11 sm:w-11 rounded-xl transition-all duration-200",
                      isCurrentFlagged && 'bg-yellow-500 hover:bg-yellow-600 border-yellow-500 shadow-lg shadow-yellow-500/30'
                    )}
                  >
                    <Flag className="h-4 w-4" />
                  </Button>
                  {showAnswersInReview && (
                    isCurrentAnswered && normalizeOption(selectedAnswers[currentQuestion.id]) === normalizeOption(currentQuestion.correct_option)
                      ? <CheckCircle2 className="h-7 w-7 sm:h-8 sm:w-8 text-success" />
                      : <XCircle className="h-7 w-7 sm:h-8 sm:w-8 text-destructive" />
                  )}
                </div>
              </div>
            </div>

            {/* Enhanced Options Grid */}
            <div className="flex-1 p-4 sm:p-6 lg:p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {currentQuestion.shuffledOptions.map((opt, idx) => (
                  <div
                    key={opt.label}
                    onClick={() => !showAnswersInReview && handleSelectAnswer(currentQuestion.id, opt.key)}
                    className={cn(
                      'p-4 sm:p-5 lg:p-6 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 relative group animate-in fade-in-0 slide-in-from-bottom-2',
                      getOptionClass(currentQuestion.id, opt.key, currentQuestion.correct_option),
                      showAnswersInReview ? 'cursor-default' : 'hover:shadow-xl hover:-translate-y-1 hover:border-primary/50 active:scale-[0.98] cursor-pointer'
                    )}
                    style={{ animationDelay: `${idx * 75}ms` }}
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      <span className="inline-flex items-center justify-center h-9 w-9 sm:h-11 sm:w-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold text-sm sm:text-base shrink-0 shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
                        {opt.label}
                      </span>
                      <span className="text-sm sm:text-base lg:text-lg font-medium leading-snug">{opt.text}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Enhanced Explanation */}
              {shouldShowExplanation && currentQuestion.explanation && (
                <div className="mt-5 sm:mt-6 lg:mt-8 p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-gradient-to-br from-success/10 via-success/5 to-transparent border border-success/20 shadow-sm animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
                  <p className="text-sm sm:text-base font-semibold text-success mb-2 sm:mb-3 flex items-center gap-2">
                    <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
                    Explanation
                  </p>
                  <p className="text-sm sm:text-base text-foreground leading-relaxed">{currentQuestion.explanation}</p>
                </div>
              )}
              
              {/* Submit Button - Below Options */}
              {isExamMode && !showAnswersInReview && (
                <div className="mt-6 sm:mt-8 flex justify-center animate-in fade-in-0 slide-in-from-bottom-4 duration-500" style={{ animationDelay: '200ms' }}>
                  <Button 
                    onClick={() => setShowSummary(true)} 
                    size="lg"
                    className="gap-2 sm:gap-3 px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg font-semibold rounded-xl sm:rounded-2xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl hover:shadow-primary/25 transition-all duration-300 hover:-translate-y-0.5"
                  >
                    <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                    Review & Submit
                  </Button>
                </div>
              )}
            </div>

            {/* Minimal Footer - Only for Review Mode */}
            {showAnswersInReview && (
              <div className="border-t border-border p-4 bg-muted/30">
                <div className="flex items-center justify-center">
                  <Button onClick={() => setShowResults(true)} className="gap-2">
                    <Eye className="h-4 w-4" />
                    Back to Results
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Practice Mode: Completion Card */}
          {!isExamMode && answeredCount === questions.length && !showAnswersInReview && (
            <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20 mt-4">
              <CardContent className="py-6 text-center">
                <h3 className="text-xl font-bold text-foreground mb-2">Practice Completed!</h3>
                <p className="text-muted-foreground mb-4">
                  You've answered all questions. Review your answers above.
                </p>
                {coinsEarned > 0 && (
                  <div className="flex items-center justify-center gap-2 text-primary">
                    <Coins className="h-5 w-5" />
                    <span className="font-bold">+{coinsEarned} Coins Earned!</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ObjectiveQuiz;
