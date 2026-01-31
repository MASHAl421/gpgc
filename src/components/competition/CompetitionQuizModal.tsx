import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, CheckCircle, XCircle, Loader2, Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Question {
  id: string;
  question: string;
  options: { A: string; B: string; C: string; D: string };
  correct: string;
  explanation: string;
  difficulty: string;
}

interface CompetitionQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  competition: {
    id: string;
    title: string;
    description: string | null;
    competition_type: string;
  } | null;
  mode: 'competition' | 'practice' | 'mock';
  topic?: string;
  difficulty?: 'easy' | 'medium';
  onComplete?: (score: number, total: number) => void;
}

export const CompetitionQuizModal = ({
  isOpen,
  onClose,
  competition,
  mode,
  topic,
  difficulty = 'easy',
  onComplete,
}: CompetitionQuizModalProps) => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(mode === 'mock' ? 30 * 60 : 0);
  const [startTime] = useState(Date.now());

  const questionCount = mode === 'practice' ? 10 : mode === 'mock' ? 30 : 15;
  const topicToUse = topic || competition?.title || 'General Knowledge';

  useEffect(() => {
    if (isOpen) {
      generateQuestions();
    }
  }, [isOpen]);

  useEffect(() => {
    if (mode === 'mock' && timeLeft > 0 && !isCompleted) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [mode, timeLeft, isCompleted]);

  const generateQuestions = async () => {
    setIsLoading(true);
    setQuestions([]);
    setCurrentIndex(0);
    setScore(0);
    setIsCompleted(false);
    setSelectedAnswer(null);
    setIsAnswered(false);

    try {
      const { data, error } = await supabase.functions.invoke('generate-competition-questions', {
        body: {
          topic: topicToUse,
          count: questionCount,
          difficulty: mode === 'competition' ? 'medium' : difficulty,
          type: mode,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      setQuestions(data.questions);
    } catch (error) {
      console.error('Error generating questions:', error);
      toast.error('Failed to generate questions. Please try again.');
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = (answer: string) => {
    if (isAnswered) return;
    setSelectedAnswer(answer);
    setIsAnswered(true);

    if (answer === questions[currentIndex].correct) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    setIsCompleted(true);
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    const finalScore = score + (selectedAnswer === questions[currentIndex]?.correct ? 1 : 0);

    if (user && competition && mode === 'competition') {
      try {
        // Calculate coins based on performance
        const percentage = (finalScore / questions.length) * 100;
        let coinsEarned = 2; // Participation
        if (percentage >= 90) coinsEarned = 20;
        else if (percentage >= 80) coinsEarned = 15;
        else if (percentage >= 70) coinsEarned = 12;
        else if (percentage >= 60) coinsEarned = 8;
        else if (percentage >= 50) coinsEarned = 5;

        // Save attempt
        await supabase.from('competition_attempts').insert({
          user_id: user.id,
          competition_id: competition.id,
          score: finalScore,
          total_questions: questions.length,
          time_taken_seconds: timeTaken,
          coins_earned: coinsEarned,
        });

        // Add coins
        await supabase.from('coin_transactions').insert({
          user_id: user.id,
          amount: coinsEarned,
          transaction_type: 'competition_reward',
          description: `Competition: ${competition.title}`,
          reference_id: competition.id,
        });

        // Update profile coins
        const { data: profileData } = await supabase
          .from('profiles')
          .select('coins_earned')
          .eq('id', user.id)
          .single();
          
        if (profileData) {
          await supabase
            .from('profiles')
            .update({ coins_earned: (profileData.coins_earned || 0) + coinsEarned })
            .eq('id', user.id);
        }

        toast.success(`You earned ${coinsEarned} coins!`);
      } catch (error) {
        console.error('Error saving attempt:', error);
      }
    }

    onComplete?.(finalScore, questions.length);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestion = questions[currentIndex];
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{competition?.title || topic || 'Practice Quiz'}</span>
            {mode === 'mock' && timeLeft > 0 && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatTime(timeLeft)}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Generating {questionCount} questions...</p>
            <p className="text-sm text-muted-foreground mt-2">Topic: {topicToUse}</p>
          </div>
        ) : isCompleted ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Trophy className="h-16 w-16 text-primary mb-4" />
            <h3 className="text-2xl font-bold mb-2">Quiz Completed!</h3>
            <p className="text-lg text-muted-foreground mb-4">
              You scored {score} out of {questions.length}
            </p>
            <div className="flex items-center gap-2 mb-6">
              <Badge
                variant={
                  (score / questions.length) * 100 >= 70
                    ? 'default'
                    : (score / questions.length) * 100 >= 50
                    ? 'secondary'
                    : 'destructive'
                }
              >
                {Math.round((score / questions.length) * 100)}%
              </Badge>
              <span className="text-sm text-muted-foreground">
                {(score / questions.length) * 100 >= 70
                  ? 'Excellent!'
                  : (score / questions.length) * 100 >= 50
                  ? 'Good effort!'
                  : 'Keep practicing!'}
              </span>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button onClick={generateQuestions}>Try Again</Button>
            </div>
          </div>
        ) : currentQuestion ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Question {currentIndex + 1} of {questions.length}
              </span>
              <Badge variant="outline">{currentQuestion.difficulty}</Badge>
            </div>
            <Progress value={progress} className="h-2" />

            <Card className="border-border">
              <CardContent className="p-4">
                <p className="text-lg font-medium mb-4">{currentQuestion.question}</p>

                <div className="space-y-2">
                  {Object.entries(currentQuestion.options).map(([key, value]) => {
                    const isCorrect = key === currentQuestion.correct;
                    const isSelected = selectedAnswer === key;

                    return (
                      <button
                        key={key}
                        onClick={() => handleAnswerSelect(key)}
                        disabled={isAnswered}
                        className={`w-full text-left p-3 rounded-lg border transition-all flex items-center gap-3 ${
                          isAnswered
                            ? isCorrect
                              ? 'border-primary bg-primary/10'
                              : isSelected
                              ? 'border-destructive bg-destructive/10'
                              : 'border-border'
                            : isSelected
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <span
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                            isAnswered
                              ? isCorrect
                                ? 'bg-primary text-primary-foreground'
                                : isSelected
                                ? 'bg-destructive text-destructive-foreground'
                                : 'bg-muted'
                              : isSelected
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          {key}
                        </span>
                        <span className="flex-1">{value}</span>
                        {isAnswered && isCorrect && <CheckCircle className="h-5 w-5 text-primary" />}
                        {isAnswered && isSelected && !isCorrect && <XCircle className="h-5 w-5 text-destructive" />}
                      </button>
                    );
                  })}
                </div>

                {isAnswered && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-1">Explanation:</p>
                    <p className="text-sm text-muted-foreground">{currentQuestion.explanation}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">Score: {score}</p>
              <Button onClick={handleNext} disabled={!isAnswered}>
                {currentIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};
