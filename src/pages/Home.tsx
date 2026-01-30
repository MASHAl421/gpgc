import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import {
  BookOpen,
  GraduationCap,
  Trophy,
  ClipboardList,
  FileText,
  Users,
  Coins,
  TrendingUp,
} from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

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
    { title: 'Tests Passed', value: '49/129', icon: Trophy, progress: 38 },
    { title: 'Coins Earned', value: user?.coinsEarned || 0, icon: Coins, progress: 0 },
    { title: 'Topics Completed', value: '12/50', icon: BookOpen, progress: 24 },
  ];

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Welcome back, {user?.username || 'Student'}! 👋
            </h1>
            <p className="text-muted-foreground mt-1">
              Continue your learning journey and achieve your goals
            </p>
          </div>
          <Button onClick={() => navigate('/preparation')} className="md:self-start">
            <GraduationCap className="mr-2 h-5 w-5" />
            Start Learning
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {statsCards.map((stat, index) => (
            <Card key={index} className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                {stat.progress > 0 && (
                  <Progress value={stat.progress} className="mt-2" />
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Preparation Section */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Full Preparation
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {preparationCards.map((card, index) => (
              <Card
                key={index}
                className="bg-card border-border hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => navigate(card.path)}
              >
                <CardHeader>
                  <div className={`h-12 w-12 rounded-lg ${card.color} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                    <card.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-lg text-foreground">{card.title}</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {card.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Quick Actions
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => navigate('/preparation')}
            >
              <ClipboardList className="h-6 w-6 text-primary" />
              <span>Attempt Daily Test</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => navigate('/ai-tutor')}
            >
              <BookOpen className="h-6 w-6 text-primary" />
              <span>Ask AI Tutor</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => navigate('/forum')}
            >
              <Users className="h-6 w-6 text-primary" />
              <span>Join Discussion</span>
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Home;
