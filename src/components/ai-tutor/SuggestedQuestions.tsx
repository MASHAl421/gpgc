import { Button } from '@/components/ui/button';
import { Lightbulb } from 'lucide-react';

interface SuggestedQuestionsProps {
  questions: string[];
  onSelect: (question: string) => void;
  disabled?: boolean;
}

export const SuggestedQuestions = ({ questions, onSelect, disabled }: SuggestedQuestionsProps) => {
  return (
    <div className="p-4 border-t border-border bg-muted/30">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Lightbulb className="h-4 w-4" />
          <span>Try asking:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {questions.map((q, i) => (
            <Button
              key={i}
              variant="outline"
              size="sm"
              onClick={() => onSelect(q)}
              disabled={disabled}
              className="rounded-full text-xs hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              {q}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};
