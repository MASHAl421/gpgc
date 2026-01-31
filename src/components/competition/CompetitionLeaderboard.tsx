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
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Medal className="h-5 w-5 text-primary" />
            Top Performers
          </CardTitle>
          <CardDescription>Weekly competition rankings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Medal className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No rankings yet.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Be the first to compete and top the leaderboard!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Medal className="h-5 w-5 text-primary" />
          Top Performers
        </CardTitle>
        <CardDescription>Weekly competition rankings</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {leaderboard.map((player) => (
            <div
              key={player.user_id}
              className={`flex items-center justify-between p-3 rounded-lg ${
                player.rank <= 3 ? 'bg-primary/10' : 'bg-muted'
              } ${player.user_id === currentUserId ? 'ring-2 ring-primary' : ''}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold w-8">{getRankBadge(player.rank)}</span>
                <span className="font-medium text-foreground">
                  {player.username}
                  {player.user_id === currentUserId && (
                    <Badge variant="outline" className="ml-2">
                      You
                    </Badge>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-primary" />
                <span className="font-semibold text-foreground">{player.total_score}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
