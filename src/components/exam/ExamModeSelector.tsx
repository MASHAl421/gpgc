import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Clock, Trophy, BookOpen, AlertCircle, Minus } from 'lucide-react';

export interface ExamSettings {
  mode: 'practice' | 'exam';
  timeLimit: number; // in minutes, 0 = no limit
  negativeMarking: boolean;
  negativeMarkingValue: number; // e.g., 0.25 means -0.25 for wrong answer
  showExplanations: boolean; // only in practice mode
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
}

interface ExamModeSelectorProps {
  settings: ExamSettings;
  onSettingsChange: (settings: ExamSettings) => void;
  totalQuestions: number;
  hideTimeLimit?: boolean; // Hide when entrance exam controls time
}

export const ExamModeSelector = ({ settings, onSettingsChange, totalQuestions, hideTimeLimit = false }: ExamModeSelectorProps) => {
  const timeLimitOptions = [
    { value: 0, label: 'No Limit' },
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 45, label: '45 minutes' },
    { value: 60, label: '1 hour' },
    { value: 90, label: '1.5 hours' },
    { value: 120, label: '2 hours' },
    { value: 180, label: '3 hours' },
  ];

  // Calculate recommended time (1-2 min per question)
  const recommendedTime = Math.ceil(totalQuestions * 1.5);

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Exam Settings
        </CardTitle>
        <CardDescription>
          Configure your exam experience - Practice mode shows answers immediately, Exam mode reveals at the end
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mode Selection */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
          <div className="flex items-center gap-3">
            {settings.mode === 'practice' ? (
              <BookOpen className="h-5 w-5 text-blue-500" />
            ) : (
              <Trophy className="h-5 w-5 text-amber-500" />
            )}
            <div>
              <Label className="text-base font-medium">
                {settings.mode === 'practice' ? 'Practice Mode' : 'Exam Mode'}
              </Label>
              <p className="text-xs text-muted-foreground">
                {settings.mode === 'practice' 
                  ? 'Learn at your pace with instant feedback'
                  : 'Simulate real exam conditions'}
              </p>
            </div>
          </div>
          <Switch
            checked={settings.mode === 'exam'}
            onCheckedChange={(checked) => 
              onSettingsChange({ 
                ...settings, 
                mode: checked ? 'exam' : 'practice',
                showExplanations: !checked // Auto-enable explanations in practice mode
              })
            }
          />
        </div>

        {/* Time Limit - Hide when controlled by entrance exam */}
        {!hideTimeLimit && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Time Limit
              </Label>
              {totalQuestions > 0 && (
                <span className="text-xs text-muted-foreground">
                  Recommended: ~{recommendedTime} min for {totalQuestions} questions
                </span>
              )}
            </div>
            <Select
              value={settings.timeLimit.toString()}
              onValueChange={(value) => 
                onSettingsChange({ ...settings, timeLimit: parseInt(value) })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeLimitOptions.map(option => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Negative Marking - Only show in Exam mode */}
        {settings.mode === 'exam' && (
          <div className="space-y-4 p-4 rounded-lg border border-destructive/20 bg-destructive/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Minus className="h-4 w-4 text-destructive" />
                <Label>Negative Marking</Label>
              </div>
              <Switch
                checked={settings.negativeMarking}
                onCheckedChange={(checked) => 
                  onSettingsChange({ ...settings, negativeMarking: checked })
                }
              />
            </div>
            
            {settings.negativeMarking && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Penalty per wrong answer</span>
                  <span className="font-medium text-destructive">
                    -{settings.negativeMarkingValue} marks
                  </span>
                </div>
                <Slider
                  value={[settings.negativeMarkingValue]}
                  onValueChange={([value]) => 
                    onSettingsChange({ ...settings, negativeMarkingValue: value })
                  }
                  min={0.25}
                  max={1}
                  step={0.25}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>-0.25</span>
                  <span>-0.5</span>
                  <span>-0.75</span>
                  <span>-1.0</span>
                </div>
              </div>
            )}
            
            <p className="text-xs text-muted-foreground flex items-start gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              Negative marking penalizes wrong answers. Unanswered questions have no penalty.
            </p>
          </div>
        )}

        {/* Shuffle Options */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Shuffle Questions</Label>
            <Switch
              checked={settings.shuffleQuestions}
              onCheckedChange={(checked) => 
                onSettingsChange({ ...settings, shuffleQuestions: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Shuffle Answer Options</Label>
            <Switch
              checked={settings.shuffleOptions}
              onCheckedChange={(checked) => 
                onSettingsChange({ ...settings, shuffleOptions: checked })
              }
            />
          </div>
        </div>

        {/* Show Explanations - Only in practice mode */}
        {settings.mode === 'practice' && (
          <div className="flex items-center justify-between">
            <Label>Show Explanations After Each Answer</Label>
            <Switch
              checked={settings.showExplanations}
              onCheckedChange={(checked) => 
                onSettingsChange({ ...settings, showExplanations: checked })
              }
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExamModeSelector;
