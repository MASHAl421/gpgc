import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Zap, Target, Brain } from 'lucide-react';

interface CompetitionPracticeModeProps {
  onStartQuickPractice: () => void;
  onSelectTopics: () => void;
  onStartMockTest: () => void;
  onPracticeWeakAreas: () => void;
}

export const CompetitionPracticeMode = ({
  onStartQuickPractice,
  onSelectTopics,
  onStartMockTest,
  onPracticeWeakAreas,
}: CompetitionPracticeModeProps) => {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          Practice Mode
        </CardTitle>
        <CardDescription>
          Practice without time pressure - no rankings, just learning
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="bg-muted cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <Zap className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Quick Practice</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                10 random questions from your subjects
              </p>
              <Button className="w-full" variant="outline" onClick={onStartQuickPractice}>
                Start Quick Practice
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-muted cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <Target className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Topic Practice</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Choose specific topics to practice
              </p>
              <Button className="w-full" variant="outline" onClick={onSelectTopics}>
                Select Topics
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-muted cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Mock Test</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Full exam simulation with timer
              </p>
              <Button className="w-full" variant="outline" onClick={onStartMockTest}>
                Start Mock Test
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-muted cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <Brain className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Weak Areas</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Focus on topics you struggle with
              </p>
              <Button className="w-full" variant="outline" onClick={onPracticeWeakAreas}>
                Practice Weak Areas
              </Button>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};
