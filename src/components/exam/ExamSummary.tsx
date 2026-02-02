import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, X, Flag, AlertTriangle, Trophy, Clock, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { QuestionStatus } from './QuestionNavigator';

interface ExamSummaryProps {
  questions: Array<{
    id: string;
    question_text: string;
    correct_option: string;
  }>;
  answers: Record<string, string>;
  questionStatuses: Record<number, QuestionStatus>;
  timeTaken: number;
  timeLimit: number;
  negativeMarking: boolean;
  negativeMarkingValue: number;
  onSubmit: () => void;
  onReview: (index: number) => void;
  onCancel: () => void;
}

export const ExamSummary = ({
  questions,
  answers,
  questionStatuses,
  timeTaken,
  timeLimit,
  negativeMarking,
  negativeMarkingValue,
  onSubmit,
  onReview,
  onCancel,
}: ExamSummaryProps) => {
  const totalQuestions = questions.length;
  const answeredQuestions = Object.keys(answers).length;
  const unansweredQuestions = totalQuestions - answeredQuestions;
  const flaggedQuestions = Object.values(questionStatuses).filter(
    s => s === 'flagged' || s === 'answered-flagged'
  ).length;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center border-b">
        <CardTitle className="flex items-center justify-center gap-2 text-xl">
          <Target className="h-6 w-6 text-primary" />
          Exam Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold text-foreground">{totalQuestions}</div>
            <div className="text-xs text-muted-foreground">Total Questions</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-emerald-500/10">
            <div className="text-2xl font-bold text-emerald-600">{answeredQuestions}</div>
            <div className="text-xs text-muted-foreground">Answered</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-destructive/10">
            <div className="text-2xl font-bold text-destructive">{unansweredQuestions}</div>
            <div className="text-xs text-muted-foreground">Unanswered</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-yellow-500/10">
            <div className="text-2xl font-bold text-yellow-600">{flaggedQuestions}</div>
            <div className="text-xs text-muted-foreground">Flagged</div>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Completion</span>
            <span className="font-medium">{Math.round((answeredQuestions / totalQuestions) * 100)}%</span>
          </div>
          <Progress value={(answeredQuestions / totalQuestions) * 100} className="h-3" />
        </div>

        {/* Time Info */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <span>Time Taken</span>
          </div>
          <span className="font-mono font-medium">{formatTime(timeTaken)}</span>
        </div>

        {/* Warnings */}
        {unansweredQuestions > 0 && (
          <div className="p-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-700 dark:text-yellow-400">
                You have {unansweredQuestions} unanswered question{unansweredQuestions > 1 ? 's' : ''}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {negativeMarking 
                  ? 'Unanswered questions will not be penalized.'
                  : 'Consider answering all questions to maximize your score.'}
              </p>
            </div>
          </div>
        )}

        {flaggedQuestions > 0 && (
          <div className="p-4 rounded-lg border border-primary/30 bg-primary/5 flex items-start gap-3">
            <Flag className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">
                You have {flaggedQuestions} flagged question{flaggedQuestions > 1 ? 's' : ''} to review
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Click on a question below to review it before submitting.
              </p>
            </div>
          </div>
        )}

        {/* Question List */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Question Overview</h4>
          <ScrollArea className="h-[200px] border rounded-lg p-2">
            <div className="space-y-1">
              {questions.map((q, index) => {
                const status = questionStatuses[index];
                const isAnswered = status === 'answered' || status === 'answered-flagged';
                const isFlagged = status === 'flagged' || status === 'answered-flagged';

                return (
                  <button
                    key={q.id}
                    onClick={() => onReview(index)}
                    className={cn(
                      "w-full flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-colors text-left",
                      isFlagged && "bg-yellow-500/10"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium w-8">Q{index + 1}</span>
                      <span className="text-sm text-muted-foreground truncate max-w-[300px]">
                        {q.question_text.substring(0, 50)}...
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isFlagged && <Flag className="h-4 w-4 text-yellow-500" />}
                      {isAnswered ? (
                        <Badge variant="default" className="bg-emerald-500">
                          <Check className="h-3 w-3 mr-1" />
                          Answered
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <X className="h-3 w-3 mr-1" />
                          Skipped
                        </Badge>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Negative Marking Info */}
        {negativeMarking && (
          <div className="p-3 rounded-lg bg-destructive/10 text-sm">
            <span className="font-medium text-destructive">Negative Marking:</span>
            <span className="text-muted-foreground ml-2">
              -{negativeMarkingValue} marks for each wrong answer
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Continue Exam
          </Button>
          <Button onClick={onSubmit} className="flex-1">
            <Trophy className="h-4 w-4 mr-2" />
            Submit Exam
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExamSummary;
