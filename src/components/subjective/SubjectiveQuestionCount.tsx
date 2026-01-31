import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Play, FileText } from 'lucide-react';
import { SubjectiveConfig } from './SubjectivePaperSelector';

interface SubjectiveQuestionCountProps {
  config: SubjectiveConfig;
  onBack: () => void;
  onStart: (shortCount: number, longCount: number) => void;
}

const SubjectiveQuestionCount = ({ config, onBack, onStart }: SubjectiveQuestionCountProps) => {
  const [shortCount, setShortCount] = useState<number>(5);
  const [longCount, setLongCount] = useState<number>(3);

  const handleStart = () => {
    onStart(shortCount, longCount);
  };

  const canStart = shortCount > 0 || longCount > 0;
  const totalQuestions = shortCount + longCount;

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="bg-card border-border">
        <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onBack}
              className="h-8 w-8 sm:h-9 sm:w-9 shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-base sm:text-lg text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Questions Selection
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-3 sm:px-6 space-y-4 sm:space-y-6">
          {/* Info */}
          <div className="bg-muted/50 rounded-lg p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Select number of questions you want to add in paper.
            </p>
            <p className="text-xs sm:text-sm text-foreground mt-1 sm:mt-2">
              <span className="font-medium">Subject:</span> {config.subjectName}
            </p>
            <p className="text-xs sm:text-sm text-foreground mt-1">
              <span className="font-medium">Topics:</span> {config.topicNames.length} selected
            </p>
          </div>

          {/* Question Count Table */}
          <div className="border border-border rounded-lg overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-3 bg-primary text-primary-foreground">
              <div className="p-2 sm:p-3 text-xs sm:text-sm font-medium">Sr</div>
              <div className="p-2 sm:p-3 text-xs sm:text-sm font-medium">Question Category</div>
              <div className="p-2 sm:p-3 text-xs sm:text-sm font-medium">Quantity</div>
            </div>

            {/* Short Questions Row */}
            <div className="grid grid-cols-3 border-b border-border items-center">
              <div className="p-2 sm:p-3 text-xs sm:text-sm text-muted-foreground">1</div>
              <div className="p-2 sm:p-3 text-xs sm:text-sm text-foreground">Short</div>
              <div className="p-2 sm:p-3">
                <Input
                  type="number"
                  min={0}
                  max={20}
                  value={shortCount}
                  onChange={(e) => setShortCount(Math.max(0, parseInt(e.target.value) || 0))}
                  className="h-8 sm:h-9 w-16 sm:w-20 text-xs sm:text-sm text-primary"
                />
              </div>
            </div>

            {/* Long Questions Row */}
            <div className="grid grid-cols-3 items-center">
              <div className="p-2 sm:p-3 text-xs sm:text-sm text-muted-foreground">2</div>
              <div className="p-2 sm:p-3 text-xs sm:text-sm text-foreground">Long</div>
              <div className="p-2 sm:p-3">
                <Input
                  type="number"
                  min={0}
                  max={10}
                  value={longCount}
                  onChange={(e) => setLongCount(Math.max(0, parseInt(e.target.value) || 0))}
                  className="h-8 sm:h-9 w-16 sm:w-20 text-xs sm:text-sm text-primary"
                />
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
            <span>Total Questions: <span className="text-foreground font-medium">{totalQuestions}</span></span>
          </div>

          {/* Start Button */}
          <div className="pt-2">
            <Button 
              onClick={handleStart} 
              disabled={!canStart}
              className="gap-2 h-10 sm:h-11 text-sm sm:text-base"
              size="lg"
            >
              <Play className="h-4 w-4" />
              Start Preparation
            </Button>
            {!canStart && (
              <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                Please add at least 1 question.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubjectiveQuestionCount;
