import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuickTopicButtonsProps {
  onSelectQuestion: (question: string) => void;
  subjectName?: string;
  topicName?: string;
  disabled?: boolean;
}

const getQuickQuestions = (subjectName?: string, topicName?: string): string[] => {
  if (topicName) {
    return [
      `Explain ${topicName} in simple words`,
      `Give me examples of ${topicName}`,
      `What are key points of ${topicName}?`,
      `Write practice questions on ${topicName}`,
    ];
  }

  if (subjectName?.toLowerCase().includes('programming') || subjectName?.toLowerCase().includes('c++')) {
    return [
      "Explain variables and data types",
      "How do loops work in C++?",
      "Write a simple array program",
      "Explain functions with example",
    ];
  }

  if (subjectName?.toLowerCase().includes('english')) {
    return [
      "Explain parts of speech",
      "What are tenses in English?",
      "How to write a paragraph?",
      "Explain punctuation rules",
    ];
  }

  return [
    "Explain Coulomb's Law",
    "What is Ohm's Law?",
    "Describe cell division",
    "Solve integration problems",
  ];
};

export const QuickTopicButtons = ({ 
  onSelectQuestion, 
  subjectName, 
  topicName,
  disabled 
}: QuickTopicButtonsProps) => {
  const questions = getQuickQuestions(subjectName, topicName);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Sparkles className="h-4 w-4" />
        <span>Quick questions:</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {questions.map((question, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => onSelectQuestion(question)}
            disabled={disabled}
          >
            {question}
          </Button>
        ))}
      </div>
    </div>
  );
};
