import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Clock, Users, Star, Target, Medal } from 'lucide-react';

const Competition = () => {
  const competitions = [
    {
      id: 1,
      title: 'Daily Physics Challenge',
      subject: 'Physics',
      duration: '30 mins',
      participants: 128,
      difficulty: 'Medium',
      status: 'Live',
    },
    {
      id: 2,
      title: 'Chemistry Weekly Test',
      subject: 'Chemistry',
      duration: '45 mins',
      participants: 89,
      difficulty: 'Hard',
      status: 'Upcoming',
    },
    {
      id: 3,
      title: 'Biology Monthly Exam',
      subject: 'Biology',
      duration: '60 mins',
      participants: 156,
      difficulty: 'Medium',
      status: 'Upcoming',
    },
    {
      id: 4,
      title: 'Math Speed Test',
      subject: 'Mathematics',
      duration: '20 mins',
      participants: 234,
      difficulty: 'Easy',
      status: 'Completed',
    },
  ];

  const leaderboard = [
    { rank: 1, name: 'Ahmed Khan', score: 980, badge: '🥇' },
    { rank: 2, name: 'Fatima Ali', score: 945, badge: '🥈' },
    { rank: 3, name: 'Hassan Raza', score: 920, badge: '🥉' },
    { rank: 4, name: 'Ayesha Malik', score: 890, badge: '' },
    { rank: 5, name: 'Bilal Ahmad', score: 875, badge: '' },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Trophy className="h-8 w-8 text-primary" />
            Competition Tests
          </h1>
          <p className="text-muted-foreground mt-1">
            Compete with other students and earn rewards
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Active Competitions */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Available Competitions</h2>
            {competitions.map((comp) => (
              <Card key={comp.id} className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          variant={
                            comp.status === 'Live'
                              ? 'default'
                              : comp.status === 'Upcoming'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {comp.status}
                        </Badge>
                        <Badge variant="outline">{comp.subject}</Badge>
                      </div>
                      <h3 className="font-semibold text-lg text-foreground">{comp.title}</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {comp.duration}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {comp.participants} participants
                        </span>
                        <span className="flex items-center gap-1">
                          <Target className="h-4 w-4" />
                          {comp.difficulty}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant={comp.status === 'Live' ? 'default' : 'outline'}
                      disabled={comp.status === 'Completed'}
                    >
                      {comp.status === 'Live'
                        ? 'Join Now'
                        : comp.status === 'Upcoming'
                        ? 'Remind Me'
                        : 'View Results'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Leaderboard */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Medal className="h-5 w-5 text-primary" />
                Leaderboard
              </CardTitle>
              <CardDescription>Top performers this week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaderboard.map((player) => (
                  <div
                    key={player.rank}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      player.rank <= 3 ? 'bg-primary/10' : 'bg-muted'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold w-8">
                        {player.badge || `#${player.rank}`}
                      </span>
                      <span className="font-medium text-foreground">{player.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-foreground">{player.score}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Competition;
