import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, ArrowLeft, ArrowRight, CheckCircle2, XCircle, BookOpen, Coins, Flag, Eye, EyeOff, Send } from 'lucide-react';
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Left: Back button and info */}
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Exit
          </Button>
          <div className="text-sm">
            <span className="text-muted-foreground">Subject: </span>
            <strong className="text-foreground">{config.subjectName}</strong>
          </div>
          <Badge variant={isExamMode ? 'destructive' : 'secondary'}>
            {isExamMode ? 'Exam Mode' : 'Practice Mode'}
          </Badge>
        </div>

        {/* Right: Timer and Progress */}
        <div className="flex items-center gap-4 lg:ml-auto">
          {examSettings.timeLimit > 0 && !showAnswersInReview && (
            <ExamTimer
              totalSeconds={examSettings.timeLimit * 60}
              onTimeUp={handleTimeUp}
              isPaused={showResults}
            />
          )}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{answeredCount}/{questions.length}</span>
            <Progress value={(answeredCount / questions.length) * 100} className="w-24 h-2" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Question Navigator (Desktop) */}
        <div className="hidden lg:block">
          <QuestionNavigator
            totalQuestions={questions.length}
            currentQuestion={currentQuestionIndex}
            questionStatuses={questionStatuses}
            onNavigate={setCurrentQuestionIndex}
          />
        </div>

        {/* Question Card */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="bg-card border-border">
            <CardContent className="p-0">
              {/* Question Header */}
              <div className="bg-muted/50 p-4 border-b border-border">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-muted-foreground">
                        Question {currentQuestionIndex + 1} of {questions.length}
                      </span>
                      <Badge variant="outline" className={getDifficultyColor(currentQuestion.difficulty || 'medium')}>
                        {currentQuestion.difficulty || 'Medium'}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {currentQuestion.question_type || 'Exercise'}
                      </Badge>
                    </div>
                    <p className="text-foreground text-base leading-relaxed">
                      {currentQuestion.question_text}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={isCurrentFlagged ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleFlag(currentQuestionIndex)}
                      className={isCurrentFlagged ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
                    >
                      <Flag className="h-4 w-4" />
                    </Button>
                    {showAnswersInReview && (
                      isCurrentAnswered && normalizeOption(selectedAnswers[currentQuestion.id]) === normalizeOption(currentQuestion.correct_option)
                        ? <CheckCircle2 className="h-6 w-6 text-success" />
                        : <XCircle className="h-6 w-6 text-destructive" />
                    )}
                  </div>
                </div>
              </div>

              {/* Options */}
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentQuestion.shuffledOptions.map((opt) => (
                  <div
                    key={opt.label}
                    onClick={() => !showAnswersInReview && handleSelectAnswer(currentQuestion.id, opt.key)}
                    className={cn(
                      'p-4 rounded-lg border-2 transition-all relative',
                      getOptionClass(currentQuestion.id, opt.key, currentQuestion.correct_option),
                      showAnswersInReview ? 'cursor-default' : ''
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span className="font-bold text-lg shrink-0">{opt.label}.</span>
                      <span className="text-sm">{opt.text}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Explanation */}
              {shouldShowExplanation && currentQuestion.explanation && (
                <div className="mx-4 mb-4 p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-sm font-semibold text-primary mb-1">Explanation:</p>
                  <p className="text-sm text-foreground">{currentQuestion.explanation}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex items-center gap-2">
              {/* Mobile Navigator */}
              <div className="lg:hidden">
                <span className="text-sm text-muted-foreground">
                  {currentQuestionIndex + 1} / {questions.length}
                </span>
              </div>

              {showAnswersInReview ? (
                <Button onClick={() => setShowResults(true)} className="gap-2">
                  <Eye className="h-4 w-4" />
                  Back to Results
                </Button>
              ) : isExamMode && currentQuestionIndex === questions.length - 1 ? (
                <Button onClick={() => setShowSummary(true)} className="gap-2">
                  <Send className="h-4 w-4" />
                  Review & Submit
                </Button>
              ) : null}
            </div>

            <Button
              variant="outline"
              onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
              disabled={currentQuestionIndex === questions.length - 1}
              className="gap-2"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Mobile Question Navigator */}
          <div className="lg:hidden">
            <QuestionNavigator
              totalQuestions={questions.length}
              currentQuestion={currentQuestionIndex}
              questionStatuses={questionStatuses}
              onNavigate={setCurrentQuestionIndex}
            />
          </div>

          {/* Practice Mode: Auto-complete message */}
          {!isExamMode && answeredCount === questions.length && !showAnswersInReview && (
            <Card className="bg-primary/5 border-primary/20">
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
