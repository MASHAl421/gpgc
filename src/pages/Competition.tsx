import { useEffect, useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSemesterOnboarding } from '@/hooks/useSemesterOnboarding';
import { Trophy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { CompetitionStatsCards } from '@/components/competition/CompetitionStatsCards';
import { CompetitionTestsTable } from '@/components/competition/CompetitionTestsTable';
import { CompetitionLeaderboard } from '@/components/competition/CompetitionLeaderboard';
import { CompetitionPracticeMode } from '@/components/competition/CompetitionPracticeMode';

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

interface CompetitionAttempt {
  competition_id: string;
  completed_at: string | null;
  score: number | null;
  total_questions: number | null;
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
  const [userAttempts, setUserAttempts] = useState<CompetitionAttempt[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tests');

  useEffect(() => {
    fetchCompetitions();
    fetchLeaderboard();
    if (user) {
      fetchUserAttempts();
    }
  }, [profileData?.semester, user]);

  const fetchCompetitions = async () => {
    try {
      let query = supabase
        .from('competitions')
        .select('*')
        .eq('is_active', true)
        .order('start_time', { ascending: false });

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

  const fetchUserAttempts = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('competition_attempts')
        .select('competition_id, completed_at, score, total_questions')
        .eq('user_id', user.id);

      if (error) throw error;
      setUserAttempts(data || []);
    } catch (error) {
      console.error('Error fetching user attempts:', error);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const { data: attempts, error } = await supabase
        .from('competition_attempts')
        .select('user_id, score')
        .order('score', { ascending: false })
        .limit(50);

      if (error) throw error;

      const userScores: Record<string, number> = {};
      (attempts || []).forEach((attempt) => {
        userScores[attempt.user_id] = (userScores[attempt.user_id] || 0) + (attempt.score || 0);
      });

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

  // Calculate stats
  const stats = useMemo(() => {
    const now = new Date();
    const totalTests = competitions.length;
    const takenTestIds = new Set(userAttempts.map((a) => a.competition_id));
    const takenTests = competitions.filter((c) => takenTestIds.has(c.id)).length;
    
    // Pending = Live tests that user hasn't taken yet
    const pendingTests = competitions.filter((c) => {
      const start = new Date(c.start_time);
      const end = new Date(c.end_time);
      const isLive = now >= start && now <= end;
      const isTaken = takenTestIds.has(c.id);
      return isLive && !isTaken;
    }).length;

    return { totalTests, pendingTests, takenTests };
  }, [competitions, userAttempts]);

  const handleStartTest = (competitionId: string) => {
    toast.info('Competition test feature coming soon!');
    // TODO: Navigate to test taking page
  };

  const handleViewResult = (competitionId: string) => {
    toast.info('Results view coming soon!');
    // TODO: Show results modal/page
  };

  const handlePractice = (type: string) => {
    toast.info(`${type} mode coming soon!`);
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

        {/* Stats Cards */}
        <CompetitionStatsCards
          totalTests={stats.totalTests}
          pendingTests={stats.pendingTests}
          takenTests={stats.takenTests}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tests">Tests Details</TabsTrigger>
            <TabsTrigger value="practice">Practice Mode</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>

          <TabsContent value="tests" className="mt-6">
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <h2 className="text-lg font-semibold text-foreground mb-4">Tests Details</h2>
                <CompetitionTestsTable
                  competitions={competitions}
                  attempts={userAttempts}
                  onStartTest={handleStartTest}
                  onViewResult={handleViewResult}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="practice" className="mt-6">
            <CompetitionPracticeMode
              onStartQuickPractice={() => handlePractice('Quick Practice')}
              onSelectTopics={() => handlePractice('Topic Practice')}
              onStartMockTest={() => handlePractice('Mock Test')}
              onPracticeWeakAreas={() => handlePractice('Weak Areas')}
            />
          </TabsContent>

          <TabsContent value="leaderboard" className="mt-6">
            <CompetitionLeaderboard leaderboard={leaderboard} currentUserId={user?.id} />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Competition;
