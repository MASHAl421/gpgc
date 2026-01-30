import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ForumBadge } from './ForumBadge';
import { useForumPoints, ForumBadge as ForumBadgeType } from '@/hooks/useForumPoints';
import { Coins, MessageSquare, MessageCircle, CheckCircle, Loader2 } from 'lucide-react';

interface ForumPointsDisplayProps {
  compact?: boolean;
}

export const ForumPointsDisplay = ({ compact = false }: ForumPointsDisplayProps) => {
  const { stats, loading } = useForumPoints();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Coins className="h-4 w-4 text-primary" />
          <span className="font-medium text-foreground">{stats.forumPoints}</span>
          <span>pts</span>
        </div>
        {stats.currentBadge && (
          <ForumBadge 
            name={stats.currentBadge.name} 
            icon={stats.currentBadge.icon}
            description={stats.currentBadge.description}
          />
        )}
      </div>
    );
  }

  const progressToNextBadge = stats.nextBadge
    ? Math.min(100, (stats.forumPoints / stats.nextBadge.required_points) * 100)
    : 100;

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Forum Points</span>
          <div className="flex items-center gap-1 text-primary">
            <Coins className="h-5 w-5" />
            <span className="text-xl font-bold">{stats.forumPoints}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Badge */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Current Level</span>
          {stats.currentBadge ? (
            <ForumBadge 
              name={stats.currentBadge.name}
              icon={stats.currentBadge.icon}
              description={stats.currentBadge.description}
              size="md"
            />
          ) : (
            <span className="text-sm text-muted-foreground">No badge yet</span>
          )}
        </div>

        {/* Progress to next badge */}
        {stats.nextBadge && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Next: {stats.nextBadge.name}</span>
              <span className="text-muted-foreground">
                {stats.forumPoints}/{stats.nextBadge.required_points} pts
              </span>
            </div>
            <Progress value={progressToNextBadge} className="h-2" />
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <MessageSquare className="h-4 w-4 mx-auto mb-1 text-primary" />
            <div className="text-lg font-semibold text-foreground">{stats.totalPosts}</div>
            <div className="text-xs text-muted-foreground">Posts</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <MessageCircle className="h-4 w-4 mx-auto mb-1 text-primary" />
            <div className="text-lg font-semibold text-foreground">{stats.totalReplies}</div>
            <div className="text-xs text-muted-foreground">Answers</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <CheckCircle className="h-4 w-4 mx-auto mb-1 text-emerald-500" />
            <div className="text-lg font-semibold text-foreground">{stats.bestAnswers}</div>
            <div className="text-xs text-muted-foreground">Best</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
