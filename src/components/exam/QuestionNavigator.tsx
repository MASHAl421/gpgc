import { cn } from '@/lib/utils';
import { Flag, Check } from 'lucide-react';
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
      return "ring-2 ring-primary ring-offset-2 ring-offset-background bg-primary text-primary-foreground";
    }
    switch (status) {
      case 'answered':
        return "bg-emerald-500 text-white hover:bg-emerald-600 border-emerald-500";
      case 'flagged':
        return "bg-yellow-500 text-white hover:bg-yellow-600 border-yellow-500";
      case 'answered-flagged':
        return "bg-emerald-500 text-white ring-2 ring-yellow-500 ring-offset-1 hover:bg-emerald-600";
      default:
        return "bg-background hover:bg-muted border-border";
    }
  };

  // Calculate stats
  const answered = Object.values(questionStatuses).filter(s => s === 'answered' || s === 'answered-flagged').length;
  const flagged = Object.values(questionStatuses).filter(s => s === 'flagged' || s === 'answered-flagged').length;
  const unanswered = totalQuestions - answered;

  return (
    <div className={cn("border rounded-xl p-4 bg-card shadow-sm", className)}>
      <h3 className="font-semibold mb-3 text-sm text-foreground">Question Navigator</h3>
      
      {/* Stats - Compact pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>{answered}</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-xs font-medium">
          <Flag className="w-3 h-3" />
          <span>{flagged}</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
          <div className="w-2 h-2 rounded-full bg-muted-foreground/50" />
          <span>{unanswered}</span>
        </div>
      </div>

      {/* Question Grid */}
      <ScrollArea className="h-[180px] lg:h-[240px]">
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
          {Array.from({ length: totalQuestions }, (_, i) => {
            const status = questionStatuses[i];
            const isCurrent = i === currentQuestion;
            
            return (
              <Button
                key={i}
                variant="outline"
                size="sm"
                className={cn(
                  "h-9 w-9 sm:h-10 sm:w-10 p-0 font-medium text-xs sm:text-sm relative transition-all",
                  getStatusColor(status, isCurrent)
                )}
                onClick={() => onNavigate(i)}
              >
                {i + 1}
                {(status === 'flagged' || status === 'answered-flagged') && (
                  <Flag className="h-2 w-2 sm:h-2.5 sm:w-2.5 absolute -top-0.5 -right-0.5 text-yellow-500 fill-yellow-500" />
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
