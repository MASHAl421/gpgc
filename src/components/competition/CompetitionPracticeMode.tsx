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
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <BookOpen className="h-5 w-5 text-primary" />
          Practice Mode
        </CardTitle>
        <CardDescription className="text-sm">
          Practice without time pressure - no rankings, just learning
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
          {/* Quick Practice */}
          <Card className="bg-muted cursor-pointer hover:shadow-md transition-shadow active:bg-muted/80">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground text-sm sm:text-base">Quick Practice</h3>
                  <p className="text-xs text-muted-foreground">10 random questions</p>
                </div>
              </div>
              <Button className="w-full mt-2" variant="outline" onClick={onStartQuickPractice}>
                Start
              </Button>
            </CardContent>
          </Card>

          {/* Topic Practice */}
          <Card className="bg-muted cursor-pointer hover:shadow-md transition-shadow active:bg-muted/80">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-lg bg-secondary/50 flex items-center justify-center shrink-0">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground text-sm sm:text-base">Topic Practice</h3>
                  <p className="text-xs text-muted-foreground">Choose specific topics</p>
                </div>
              </div>
              <Button className="w-full mt-2" variant="outline" onClick={onSelectTopics}>
                Select Topics
              </Button>
            </CardContent>
          </Card>

          {/* Mock Test */}
          <Card className="bg-muted cursor-pointer hover:shadow-md transition-shadow active:bg-muted/80">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground text-sm sm:text-base">Mock Test</h3>
                  <p className="text-xs text-muted-foreground">Full exam with timer</p>
                </div>
              </div>
              <Button className="w-full mt-2" variant="outline" onClick={onStartMockTest}>
                Start Mock
              </Button>
            </CardContent>
          </Card>

          {/* Weak Areas */}
          <Card className="bg-muted cursor-pointer hover:shadow-md transition-shadow active:bg-muted/80">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-lg bg-secondary/50 flex items-center justify-center shrink-0">
                  <Brain className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground text-sm sm:text-base">Weak Areas</h3>
                  <p className="text-xs text-muted-foreground">Focus on struggles</p>
                </div>
              </div>
              <Button className="w-full mt-2" variant="outline" onClick={onPracticeWeakAreas}>
                Practice
              </Button>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};
