import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Medal, Star } from 'lucide-react';

interface LeaderboardEntry {
  user_id: string;
  username: string;
  total_score: number;
  rank: number;
}

interface CompetitionLeaderboardProps {
  leaderboard: LeaderboardEntry[];
  currentUserId?: string;
}

export const CompetitionLeaderboard = ({
  leaderboard,
  currentUserId,
}: CompetitionLeaderboardProps) => {
  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  };

  if (leaderboard.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-foreground text-base sm:text-lg">
            <Medal className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            Top Performers
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Weekly competition rankings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 sm:py-8">
            <Medal className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3 sm:mb-4" />
            <p className="text-muted-foreground text-sm sm:text-base">No rankings yet.</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
              Be the first to compete!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle className="flex items-center gap-2 text-foreground text-base sm:text-lg">
          <Medal className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          Top Performers
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">Weekly competition rankings</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 sm:space-y-3">
          {leaderboard.map((player) => (
            <div
              key={player.user_id}
              className={`flex items-center justify-between p-2.5 sm:p-3 rounded-lg ${
                player.rank <= 3 ? 'bg-primary/10' : 'bg-muted'
              } ${player.user_id === currentUserId ? 'ring-2 ring-primary' : ''}`}
            >
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <span className="text-base sm:text-lg font-bold w-6 sm:w-8 shrink-0">{getRankBadge(player.rank)}</span>
                <span className="font-medium text-foreground text-sm sm:text-base truncate">
                  {player.username}
                </span>
                {player.user_id === currentUserId && (
                  <Badge variant="outline" className="text-[10px] sm:text-xs shrink-0">
                    You
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Star className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                <span className="font-semibold text-foreground text-sm sm:text-base">{player.total_score}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
