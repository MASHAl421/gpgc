import { useState, useEffect } from 'react';
import { getUserForumStats, ForumBadge as ForumBadgeType } from '@/hooks/useForumPoints';
import { ForumBadge } from './ForumBadge';
import { Skeleton } from '@/components/ui/skeleton';

interface ForumUserBadgeProps {
  userId: string;
  showPoints?: boolean;
}

export const ForumUserBadge = ({ userId, showPoints = false }: ForumUserBadgeProps) => {
  const [badge, setBadge] = useState<ForumBadgeType | null>(null);
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const stats = await getUserForumStats(userId);
      if (stats) {
        setBadge(stats.currentBadge);
        setPoints(stats.forumPoints);
      }
      setLoading(false);
    };

    fetchStats();
  }, [userId]);

  if (loading) {
    return <Skeleton className="h-5 w-16" />;
  }

  if (!badge) {
    return null;
  }

  return (
    <div className="inline-flex items-center gap-1.5">
      <ForumBadge 
        name={badge.name} 
        icon={badge.icon}
        description={badge.description}
        showTooltip={true}
      />
      {showPoints && (
        <span className="text-xs text-muted-foreground">
          ({points} pts)
        </span>
      )}
    </div>
  );
};
