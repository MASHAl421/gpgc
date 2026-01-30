import { Card, CardContent } from '@/components/ui/card';

interface ForumStatsCardProps {
  totalQuestions: number;
  totalAnswers: number;
  bestAnswers: number;
  totalUsers: number;
}

export const ForumStatsCard = ({
  totalQuestions,
  totalAnswers,
  bestAnswers,
  totalUsers,
}: ForumStatsCardProps) => {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-0">
        <div className="grid grid-cols-2 divide-x divide-y divide-border">
          {/* Questions */}
          <div className="p-4 text-center">
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              Questions
            </div>
            <div className="text-2xl font-bold text-foreground">
              {totalQuestions}
            </div>
          </div>
          
          {/* Answers */}
          <div className="p-4 text-center">
            <div className="text-xs text-primary uppercase tracking-wide mb-1">
              Answers
            </div>
            <div className="text-2xl font-bold text-primary">
              {totalAnswers}
            </div>
          </div>
          
          {/* Best Answers */}
          <div className="p-4 text-center">
            <div className="text-xs text-primary uppercase tracking-wide mb-1">
              Best Answers
            </div>
            <div className="text-2xl font-bold text-foreground">
              {bestAnswers}
            </div>
          </div>
          
          {/* Users */}
          <div className="p-4 text-center">
            <div className="text-xs text-primary uppercase tracking-wide mb-1">
              Users
            </div>
            <div className="text-2xl font-bold text-foreground">
              {totalUsers}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
