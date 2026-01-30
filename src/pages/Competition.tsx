import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSemesterOnboarding } from '@/hooks/useSemesterOnboarding';
import { Trophy, Clock, Users, Star, Target, Medal, Play, BookOpen, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface Competition {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  competition_type: string;
  semester: number | null;
  is_active: boolean;
}

interface LeaderboardEntry {
  user_id: string;
  username: string;
  total_score: number;
  rank: number;
}

const Competition = () => {
  const { user } = useAuth();
  const { profileData } = useSemesterOnboarding();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('competitions');

  useEffect(() => {
    fetchCompetitions();
    fetchLeaderboard();
  }, [profileData?.semester]);

  const fetchCompetitions = async () => {
    try {
      let query = supabase
        .from('competitions')
        .select('*')
        .eq('is_active', true)
        .order('start_time', { ascending: true });

      if (profileData?.semester) {
        query = query.or(`semester.eq.${profileData.semester},semester.is.null`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setCompetitions(data || []);
    } catch (error) {
      console.error('Error fetching competitions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      // Get top scores from competition attempts
      const { data: attempts, error } = await supabase
        .from('competition_attempts')
        .select('user_id, score')
        .order('score', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Aggregate scores by user
      const userScores: Record<string, number> = {};
      (attempts || []).forEach((attempt) => {
        userScores[attempt.user_id] = (userScores[attempt.user_id] || 0) + attempt.score;
      });

      // Get usernames
      const userIds = Object.keys(userScores);
      if (userIds.length === 0) {
        setLeaderboard([]);
        return;
      }

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      const leaderboardData: LeaderboardEntry[] = userIds
        .map((userId) => {
          const profile = profiles?.find((p) => p.id === userId);
          return {
            user_id: userId,
            username: profile?.username || 'Unknown',
            total_score: userScores[userId],
            rank: 0,
          };
        })
        .sort((a, b) => b.total_score - a.total_score)
        .slice(0, 10)
        .map((entry, index) => ({ ...entry, rank: index + 1 }));

      setLeaderboard(leaderboardData);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  const getCompetitionStatus = (comp: Competition) => {
    const now = new Date();
    const start = new Date(comp.start_time);
    const end = new Date(comp.end_time);

    if (now < start) return 'upcoming';
    if (now > end) return 'completed';
    return 'live';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'live':
        return <Badge className="bg-green-500">Live</Badge>;
      case 'upcoming':
        return <Badge variant="secondary">Upcoming</Badge>;
      case 'completed':
        return <Badge variant="outline">Completed</Badge>;
      default:
        return null;
    }
  };

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

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <Trophy className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            Competition Tests
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Compete with other students and earn rewards
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="competitions">Competitions</TabsTrigger>
            <TabsTrigger value="practice">Practice Mode</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>

          <TabsContent value="competitions" className="mt-6">
            <div className="grid gap-4">
              {competitions.length === 0 ? (
                <Card className="bg-card border-border">
                  <CardContent className="p-8 text-center">
                    <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No competitions available at the moment.</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Check back later or try Practice Mode!
                    </p>
                  </CardContent>
                </Card>
              ) : (
                competitions.map((comp) => {
                  const status = getCompetitionStatus(comp);
                  return (
                    <Card key={comp.id} className="bg-card border-border">
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              {getStatusBadge(status)}
                              <Badge variant="outline">{comp.competition_type}</Badge>
                              {comp.semester && (
                                <Badge variant="secondary">Semester {comp.semester}</Badge>
                              )}
                            </div>
                            <h3 className="font-semibold text-lg text-foreground">{comp.title}</h3>
                            {comp.description && (
                              <p className="text-sm text-muted-foreground mt-1">{comp.description}</p>
                            )}
                            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground flex-wrap">
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {format(new Date(comp.start_time), 'MMM d, h:mm a')}
                              </span>
                              <span className="flex items-center gap-1">
                                <Target className="h-4 w-4" />
                                Until {format(new Date(comp.end_time), 'MMM d, h:mm a')}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant={status === 'live' ? 'default' : 'outline'}
                            disabled={status === 'completed'}
                            className="w-full md:w-auto"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            {status === 'live'
                              ? 'Join Now'
                              : status === 'upcoming'
                              ? 'Remind Me'
                              : 'View Results'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="practice" className="mt-6">
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
                      <h3 className="font-semibold text-foreground">Quick Practice</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        10 random questions from your subjects
                      </p>
                      <Button className="mt-3 w-full" variant="outline">
                        Start Quick Practice
                      </Button>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-foreground">Topic Practice</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Choose specific topics to practice
                      </p>
                      <Button className="mt-3 w-full" variant="outline">
                        Select Topics
                      </Button>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-foreground">Mock Test</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Full exam simulation with timer
                      </p>
                      <Button className="mt-3 w-full" variant="outline">
                        Start Mock Test
                      </Button>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-foreground">Weak Areas</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Focus on topics you struggle with
                      </p>
                      <Button className="mt-3 w-full" variant="outline">
                        Practice Weak Areas
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leaderboard" className="mt-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Medal className="h-5 w-5 text-primary" />
                  Top Performers
                </CardTitle>
                <CardDescription>Weekly competition rankings</CardDescription>
              </CardHeader>
              <CardContent>
                {leaderboard.length === 0 ? (
                  <div className="text-center py-8">
                    <Medal className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No rankings yet.</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Be the first to compete and top the leaderboard!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {leaderboard.map((player) => (
                      <div
                        key={player.user_id}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          player.rank <= 3 ? 'bg-primary/10' : 'bg-muted'
                        } ${player.user_id === user?.id ? 'ring-2 ring-primary' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold w-8">{getRankBadge(player.rank)}</span>
                          <span className="font-medium text-foreground">
                            {player.username}
                            {player.user_id === user?.id && (
                              <Badge variant="outline" className="ml-2">You</Badge>
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
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Competition;
