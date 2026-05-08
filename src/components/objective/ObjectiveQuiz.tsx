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
        .in('quiz_id', quizIds)
        .range(0, 1999);
      
      if (config.questionTypes.length === 1) {
        questionsQuery = questionsQuery.eq('question_type', config.questionTypes[0]);
      }

      const { data: questionsData, error: questionsError } = await questionsQuery.order('order_index');

      if (questionsError) throw questionsError;

      const quizDifficultyMap = Object.fromEntries(quizzes.map(q => [q.id, q.difficulty]));
      let enrichedQuestions: UIQuestion[] = (questionsData || []).map((q: Question) => ({
        ...q,
        difficulty: q.difficulty || quizDifficultyMap[q.quiz_id] || 'medium',
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
    
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: option,
    }));
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

      // Check for newly unlocked achievements
      const { checkAchievements } = await import('@/lib/achievements');
      await checkAchievements(user.id);

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
      return 'bg-success/5 border-success text-foreground cursor-default shadow-sm shadow-success/20';
    }
    if (isSelected && !isCorrect) {
      return 'bg-destructive/5 border-destructive text-foreground cursor-default shadow-sm shadow-destructive/20';
    }
    if (isCorrect) {
      return 'bg-success/5 border-success text-foreground cursor-default';
    }
    return 'bg-card border-border opacity-60 cursor-default';
  };

  const getOptionStatus = (questionId: string, option: string, correctOption: string): 'correct' | 'wrong' | null => {
    const selected = selectedAnswers[questionId];
    const shouldReveal = !isExamMode || showResults || showAnswersInReview;
    if (!selected || (isExamMode && !shouldReveal)) return null;
    const opt = normalizeOption(option);
    const correct = normalizeOption(correctOption);
    const chosen = normalizeOption(selected);
    if (opt === correct) return 'correct';
    if (opt === chosen && opt !== correct) return 'wrong';
    return null;
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

  const answeredCount = Object.keys(selectedAnswers).length;
  const allAnswered = answeredCount === questions.length;

  return (
    <div className="min-h-[calc(100vh-200px)] flex flex-col animate-in fade-in-0 duration-500">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border pb-3 mb-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 px-2 sm:px-3 shrink-0">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Exit</span>
              </Button>
              <div className="h-5 w-px bg-border hidden sm:block" />
              <span className="text-sm font-medium text-foreground truncate flex-1">
                {config.subjectName}
              </span>
              <Badge variant={isExamMode ? 'destructive' : 'secondary'} className="shrink-0 text-xs">
                {isExamMode ? 'Exam' : 'Practice'}
              </Badge>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {examSettings.timeLimit > 0 && !showAnswersInReview && (
                <div className="flex items-center gap-2 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl px-3 py-1.5 sm:px-4 sm:py-2 border border-primary/20 shadow-sm">
                  <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary animate-pulse" />
                  <ExamTimer
                    totalSeconds={examSettings.timeLimit * 60}
                    onTimeUp={handleTimeUp}
                    isPaused={showResults}
                    className="!bg-transparent !p-0 text-sm sm:text-base font-bold text-primary"
                  />
                </div>
              )}
              <div className="flex items-center gap-2 bg-gradient-to-r from-muted to-muted/50 rounded-xl px-3 py-1.5 sm:px-4 sm:py-2 border border-border shadow-sm">
                <div className="text-sm sm:text-base font-bold text-foreground">{answeredCount}<span className="text-muted-foreground">/{questions.length}</span></div>
                <Progress value={(answeredCount / questions.length) * 100} className="w-16 sm:w-20 h-2" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Single page list of all questions */}
      <div className="flex-1 max-w-4xl mx-auto w-full">
        {/* Paper Header */}
        <div className="mb-4 sm:mb-6 flex items-center justify-between gap-3 px-1">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Objective Paper</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            <span className="font-semibold text-foreground">Subject:</span> {config.subjectName}
          </p>
        </div>

        <div className="space-y-4 sm:space-y-5">
          {questions.map((question, qIdx) => {
            const isAnswered = !!selectedAnswers[question.id];
            const isFlagged = flaggedQuestions.has(qIdx);
            const showExplanationForQ = (!isExamMode && examSettings.showExplanations && isAnswered) || showAnswersInReview;

            return (
              <Card
                key={question.id}
                className="bg-card border-border rounded-xl sm:rounded-2xl overflow-hidden shadow-sm"
              >
                <CardContent className="p-4 sm:p-5 lg:p-6">
                  {/* Question Header */}
                  <div className="flex items-start justify-between gap-3 mb-3 sm:mb-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base font-bold text-foreground mb-1.5">
                        Question {qIdx + 1}:
                      </p>
                      <p className="text-sm sm:text-base text-foreground leading-relaxed whitespace-pre-wrap">
                        {question.question_text}
                      </p>
                    </div>
                    <Button
                      variant={isFlagged ? 'default' : 'outline'}
                      size="icon"
                      onClick={() => toggleFlag(qIdx)}
                      className={cn(
                        'h-8 w-8 sm:h-9 sm:w-9 rounded-lg shrink-0',
                        isFlagged && 'bg-yellow-500 hover:bg-yellow-600 border-yellow-500'
                      )}
                    >
                      <Flag className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                  </div>

                  {/* Options - vertical list like PDF */}
                  <div className="space-y-2.5 sm:space-y-3 mt-3">
                    {question.shuffledOptions.map((opt) => {
                      const status = getOptionStatus(question.id, opt.key, question.correct_option);
                      return (
                        <div
                          key={opt.label}
                          onClick={() => !showAnswersInReview && handleSelectAnswer(question.id, opt.key)}
                          className={cn(
                            'p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 relative',
                            getOptionClass(question.id, opt.key, question.correct_option),
                            !showAnswersInReview && !selectedAnswers[question.id] && 'cursor-pointer hover:border-primary/50',
                            isExamMode && !showAnswersInReview && 'cursor-pointer hover:border-primary/50'
                          )}
                        >
                          <div className="flex items-start gap-3 sm:gap-4">
                            <span className={cn(
                              'font-bold text-sm sm:text-base shrink-0 min-w-[20px]',
                              status === 'correct' && 'text-success',
                              status === 'wrong' && 'text-destructive',
                              !status && 'text-foreground'
                            )}>
                              {opt.label}.
                            </span>
                            <span className="text-sm sm:text-base text-foreground leading-snug flex-1">
                              {opt.text}
                            </span>
                            {status === 'correct' && (
                              <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-success shrink-0 animate-in zoom-in-50 duration-300" />
                            )}
                            {status === 'wrong' && (
                              <XCircle className="h-5 w-5 sm:h-6 sm:w-6 text-destructive shrink-0 animate-in zoom-in-50 duration-300" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Meta info */}
                  <div className="mt-3 sm:mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-muted-foreground">
                    <span><span className="font-semibold text-foreground">Type:</span> {(question.question_type || 'Exercise').replace(/^./, c => c.toUpperCase())}</span>
                    <span><span className="font-semibold text-foreground">Difficulty:</span> {(question.difficulty || 'Medium').replace(/^./, c => c.toUpperCase())}</span>
                  </div>

                  {/* Explanation / Reason */}
                  {showExplanationForQ && question.explanation && (
                    <div className="mt-3 sm:mt-4 rounded-xl bg-sky-500 text-white p-3 sm:p-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                      <p className="text-sm sm:text-base font-bold mb-1">Reason:</p>
                      <p className="text-sm sm:text-base leading-relaxed">{question.explanation}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Submit / Action Bar */}
        {!showAnswersInReview && (
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Button
              onClick={() => isExamMode ? setShowSummary(true) : handleSubmit()}
              size="lg"
              disabled={!isExamMode && !allAnswered}
              className="gap-2 px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg font-semibold rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all"
            >
              <Send className="h-4 w-4 sm:h-5 sm:w-5" />
              {isExamMode ? 'Review & Submit' : 'Finish & See Results'}
            </Button>
          </div>
        )}

        {showAnswersInReview && (
          <div className="mt-6 sm:mt-8 flex justify-center">
            <Button onClick={() => setShowResults(true)} className="gap-2" size="lg">
              <Eye className="h-4 w-4" />
              Back to Results
            </Button>
          </div>
        )}

        {/* Practice Mode: Completion Card */}
        {!isExamMode && allAnswered && !showAnswersInReview && coinsEarned > 0 && (
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20 mt-4">
            <CardContent className="py-6 text-center">
              <h3 className="text-xl font-bold text-foreground mb-2">Practice Completed!</h3>
              <div className="flex items-center justify-center gap-2 text-primary">
                <Coins className="h-5 w-5" />
                <span className="font-bold">+{coinsEarned} Coins Earned!</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ObjectiveQuiz;
