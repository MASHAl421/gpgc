import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useDailyLogin } from '@/hooks/useDailyLogin';
import { useSemesterOnboarding } from '@/hooks/useSemesterOnboarding';
import DailyLoginReward from '@/components/DailyLoginReward';
import SemesterOnboarding from '@/components/SemesterOnboarding';
import {
  BookOpen,
  GraduationCap,
  Trophy,
  ClipboardList,
  FileText,
  Users,
  Coins,
  TrendingUp,
  Flame,
  Sparkles,
} from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { todayLogin, showReward, dismissReward } = useDailyLogin();
  const { needsOnboarding, profileData, completeOnboarding } = useSemesterOnboarding();

  const preparationCards = [
    {
      title: 'Full Syllabus Preparation',
      description: 'Complete course material with quizzes & notes',
      icon: BookOpen,
      color: 'bg-primary',
      path: '/preparation',
    },
    {
      title: 'Student Self Test',
      description: 'Practice with MCQs and track progress',
      icon: ClipboardList,
      color: 'bg-secondary',
      path: '/preparation',
    },
    {
      title: 'Competition Tests',
      description: 'Compete with other students',
      icon: Trophy,
      color: 'bg-primary',
      path: '/competition',
    },
    {
      title: 'Past & Model Papers',
      description: 'Practice with real exam papers',
      icon: FileText,
      color: 'bg-secondary',
      path: '/preparation',
    },
  ];

  const statsCards = [
    { title: 'Tests Passed', value: '0/0', icon: Trophy, progress: 0 },
    { title: 'Coins Earned', value: profile?.coins_earned || 0, icon: Coins, progress: 0 },
    { title: 'Login Streak', value: todayLogin?.streak_count || 0, icon: Flame, progress: 0 },
  ];

  return (
    <MainLayout>
      {/* Onboarding Modal */}
      <SemesterOnboarding open={needsOnboarding} onComplete={completeOnboarding} />
      
      {/* Daily Login Reward Modal */}
      {todayLogin && (
        <DailyLoginReward
          open={showReward}
          onClose={dismissReward}
          streak={todayLogin.streak_count}
          coins={todayLogin.coins_earned}
        />
      )}

      <div className="space-y-6 md:space-y-8">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Welcome back, {profile?.username || 'Student'}! 👋
            </h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <p className="text-sm md:text-base text-muted-foreground">
                Continue your learning journey
              </p>
              {profileData?.semester && (
                <Badge variant="secondary">Semester {profileData.semester}</Badge>
              )}
            </div>
          </div>
          <Button onClick={() => navigate('/preparation')} className="md:self-start">
            <GraduationCap className="mr-2 h-5 w-5" />
            Start Learning
          </Button>
        </div>

        {/* Daily Streak Banner */}
        {todayLogin && todayLogin.streak_count >= 3 && (
          <Card className="bg-gradient-to-r from-orange-500/20 to-primary/20 border-orange-500/30">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <Flame className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {todayLogin.streak_count} Day Streak! 🔥
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Keep it up for bonus coins!
                  </p>
                </div>
              </div>
              <Sparkles className="h-6 w-6 text-primary hidden sm:block" />
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
          {statsCards.map((stat, index) => (
            <Card key={index} className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs md:text-sm font-medium text-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold text-foreground">{stat.value}</div>
                {stat.progress > 0 && (
                  <Progress value={stat.progress} className="mt-2" />
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Preparation Section */}
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            Full Preparation
          </h2>
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {preparationCards.map((card, index) => (
              <Card
                key={index}
                className="bg-card border-border hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => navigate(card.path)}
              >
                <CardHeader className="p-4 md:p-6">
                  <div className={`h-10 w-10 md:h-12 md:w-12 rounded-lg ${card.color} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                    <card.icon className="h-5 w-5 md:h-6 md:w-6 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-sm md:text-lg text-foreground">{card.title}</CardTitle>
                  <CardDescription className="text-xs md:text-sm text-muted-foreground hidden sm:block">
                    {card.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            Quick Actions
          </h2>
          <div className="grid gap-4 grid-cols-3">
            <Button
              variant="outline"
              className="h-auto py-3 md:py-4 flex flex-col items-center gap-1 md:gap-2"
              onClick={() => navigate('/preparation')}
            >
              <ClipboardList className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              <span className="text-xs md:text-sm">Daily Test</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-3 md:py-4 flex flex-col items-center gap-1 md:gap-2"
              onClick={() => navigate('/ai-tutor')}
            >
              <BookOpen className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              <span className="text-xs md:text-sm">AI Tutor</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-3 md:py-4 flex flex-col items-center gap-1 md:gap-2"
              onClick={() => navigate('/forum')}
            >
              <Users className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              <span className="text-xs md:text-sm">Forum</span>
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Home;
