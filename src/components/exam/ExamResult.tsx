import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, X, Trophy, Clock, Target, Award, TrendingUp, Home, RotateCcw, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExamResultProps {
  questions: Array<{
    id: string;
    question_text: string;
    correct_option: string;
    explanation?: string | null;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
  }>;
  answers: Record<string, string>;
  timeTaken: number;
  negativeMarking: boolean;
  negativeMarkingValue: number;
  coinsEarned: number;
  onRetry: () => void;
  onGoHome: () => void;
  onViewDetails: () => void;
}

export const ExamResult = ({
  questions,
  answers,
  timeTaken,
  negativeMarking,
  negativeMarkingValue,
  coinsEarned,
  onRetry,
  onGoHome,
  onViewDetails,
}: ExamResultProps) => {
  // Calculate results
  let correctCount = 0;
  let wrongCount = 0;
  let skippedCount = 0;

  questions.forEach(q => {
    const answer = answers[q.id];
    if (!answer) {
      skippedCount++;
    } else if (answer.toLowerCase() === q.correct_option.toLowerCase()) {
      correctCount++;
    } else {
      wrongCount++;
    }
  });

  const totalQuestions = questions.length;
  
  // Calculate score with negative marking
  let rawScore = correctCount;
  if (negativeMarking) {
    rawScore = correctCount - (wrongCount * negativeMarkingValue);
  }
  const maxScore = totalQuestions;
  const percentage = Math.round((correctCount / totalQuestions) * 100);
  
  // Determine grade and message
  const getGrade = () => {
    if (percentage >= 90) return { grade: 'A+', color: 'text-emerald-500', message: 'Outstanding!' };
    if (percentage >= 80) return { grade: 'A', color: 'text-emerald-500', message: 'Excellent!' };
    if (percentage >= 70) return { grade: 'B+', color: 'text-blue-500', message: 'Very Good!' };
    if (percentage >= 60) return { grade: 'B', color: 'text-blue-500', message: 'Good Job!' };
    if (percentage >= 50) return { grade: 'C', color: 'text-yellow-500', message: 'Keep Practicing!' };
    if (percentage >= 40) return { grade: 'D', color: 'text-orange-500', message: 'Needs Improvement' };
    return { grade: 'F', color: 'text-destructive', message: 'Try Again!' };
  };

  const { grade, color, message } = getGrade();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Main Result Card */}
      <Card className="overflow-hidden">
        <div className={cn(
          "p-8 text-center",
          percentage >= 60 ? "bg-gradient-to-br from-emerald-500/20 to-primary/10" : "bg-gradient-to-br from-muted to-muted/50"
        )}>
          <div className={cn("text-6xl font-bold mb-2", color)}>{grade}</div>
          <div className="text-2xl font-semibold text-foreground mb-1">{message}</div>
          <div className="text-muted-foreground">
            You scored <span className="font-bold text-foreground">{percentage}%</span>
          </div>
          {coinsEarned > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/20 text-yellow-600 dark:text-yellow-400">
              <Award className="h-5 w-5" />
              <span className="font-medium">+{coinsEarned} coins earned!</span>
            </div>
          )}
        </div>

        <CardContent className="p-6 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <Check className="h-6 w-6 text-emerald-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-emerald-600">{correctCount}</div>
              <div className="text-xs text-muted-foreground">Correct</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <X className="h-6 w-6 text-destructive mx-auto mb-2" />
              <div className="text-2xl font-bold text-destructive">{wrongCount}</div>
              <div className="text-xs text-muted-foreground">Wrong</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted border">
              <Target className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
              <div className="text-2xl font-bold">{skippedCount}</div>
              <div className="text-xs text-muted-foreground">Skipped</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-primary/10 border border-primary/20">
              <Clock className="h-6 w-6 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-primary">{formatTime(timeTaken)}</div>
              <div className="text-xs text-muted-foreground">Time Taken</div>
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Score Breakdown
            </h4>
            <div className="p-4 rounded-lg bg-muted/50 space-y-3">
              <div className="flex justify-between">
                <span>Correct Answers</span>
                <span className="font-medium text-emerald-600">+{correctCount}</span>
              </div>
              {negativeMarking && wrongCount > 0 && (
                <div className="flex justify-between">
                  <span>Wrong Answers ({wrongCount} × -{negativeMarkingValue})</span>
                  <span className="font-medium text-destructive">
                    -{(wrongCount * negativeMarkingValue).toFixed(2)}
                  </span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-medium">
                <span>Final Score</span>
                <span>{rawScore.toFixed(2)} / {maxScore}</span>
              </div>
            </div>
          </div>

          {/* Accuracy Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Accuracy</span>
              <span className="font-medium">{percentage}%</span>
            </div>
            <Progress value={percentage} className="h-3" />
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onGoHome} className="flex-1">
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
            <Button variant="outline" onClick={onViewDetails} className="flex-1">
              <BookOpen className="h-4 w-4 mr-2" />
              View Answers
            </Button>
            <Button onClick={onRetry} className="flex-1">
              <RotateCcw className="h-4 w-4 mr-2" />
              Retry Exam
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExamResult;
