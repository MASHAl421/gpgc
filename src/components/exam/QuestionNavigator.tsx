import { cn } from '@/lib/utils';
import { Flag, Check, Circle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

export type QuestionStatus = 'unanswered' | 'answered' | 'flagged' | 'answered-flagged';

interface QuestionNavigatorProps {
  totalQuestions: number;
  currentQuestion: number;
  questionStatuses: Record<number, QuestionStatus>;
  onNavigate: (index: number) => void;
  className?: string;
}

export const QuestionNavigator = ({
  totalQuestions,
  currentQuestion,
  questionStatuses,
  onNavigate,
  className
}: QuestionNavigatorProps) => {
  const getStatusColor = (status: QuestionStatus | undefined, isCurrent: boolean) => {
    if (isCurrent) {
      return "ring-2 ring-primary ring-offset-2";
    }
    switch (status) {
      case 'answered':
        return "bg-emerald-500 text-white hover:bg-emerald-600";
      case 'flagged':
        return "bg-yellow-500 text-white hover:bg-yellow-600";
      case 'answered-flagged':
        return "bg-emerald-500 text-white ring-2 ring-yellow-500 hover:bg-emerald-600";
      default:
        return "bg-muted hover:bg-muted/80";
    }
  };

  const getStatusIcon = (status: QuestionStatus | undefined) => {
    switch (status) {
      case 'answered':
      case 'answered-flagged':
        return <Check className="h-3 w-3" />;
      case 'flagged':
        return <Flag className="h-3 w-3" />;
      default:
        return null;
    }
  };

  // Calculate stats
  const answered = Object.values(questionStatuses).filter(s => s === 'answered' || s === 'answered-flagged').length;
  const flagged = Object.values(questionStatuses).filter(s => s === 'flagged' || s === 'answered-flagged').length;
  const unanswered = totalQuestions - answered;

  return (
    <div className={cn("border rounded-lg p-4 bg-card", className)}>
      <h3 className="font-semibold mb-3 text-sm">Question Navigator</h3>
      
      {/* Stats */}
      <div className="flex gap-3 mb-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-emerald-500" />
          <span>Answered: {answered}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-yellow-500" />
          <span>Flagged: {flagged}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-muted border" />
          <span>Unanswered: {unanswered}</span>
        </div>
      </div>

      {/* Question Grid */}
      <ScrollArea className="h-[200px]">
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: totalQuestions }, (_, i) => {
            const status = questionStatuses[i];
            const isCurrent = i === currentQuestion;
            
            return (
              <Button
                key={i}
                variant="outline"
                size="sm"
                className={cn(
                  "w-10 h-10 p-0 font-medium relative",
                  getStatusColor(status, isCurrent)
                )}
                onClick={() => onNavigate(i)}
              >
                {i + 1}
                {(status === 'flagged' || status === 'answered-flagged') && (
                  <Flag className="h-2.5 w-2.5 absolute -top-1 -right-1 text-yellow-500" />
                )}
              </Button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

export default QuestionNavigator;
