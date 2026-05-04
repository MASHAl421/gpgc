import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BookOpen, 
  ClipboardList, 
  Trophy, 
  Coins, 
  GraduationCap,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      step: 1,
      title: 'Choose Your Subject',
      description: 'Browse through our comprehensive collection of BS-level subjects and select the one you want to study.',
      icon: BookOpen,
    },
    {
      step: 2,
      title: 'Study Key Notes',
      description: 'Read concise, expert-prepared key notes for each topic to understand concepts quickly.',
      icon: GraduationCap,
    },
    {
      step: 3,
      title: 'Take Quizzes',
      description: 'Test your understanding with MCQs. Each topic has 20-50 carefully crafted questions.',
      icon: ClipboardList,
    },
    {
      step: 4,
      title: 'Compete & Win',
      description: 'Join competition tests, compete with peers, and climb the leaderboard.',
      icon: Trophy,
    },
    {
      step: 5,
      title: 'Earn Coins',
      description: 'Every correct answer and completed quiz earns you coins that can be redeemed for rewards.',
      icon: Coins,
    },
  ];

  const features = [
    '2000+ MCQs per subject',
    'Expert-written Key Notes',
    'Past Papers with Solutions',
    'AI Tutor for Doubts',
    'Discussion Forum',
    'Progress Tracking',
  ];

  return (
    <MainLayout>
      <div className="space-y-8 max-w-4xl mx-auto">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">How It Works</h1>
          <p className="text-muted-foreground mt-2">
            Your complete guide to using GPGC Portal
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {steps.map((item, index) => (
            <Card key={item.step} className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 h-12 w-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                    {item.step}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <item.icon className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-lg text-foreground">{item.title}</h3>
                    </div>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                  {index < steps.length - 1 && (
                    <ArrowRight className="h-6 w-6 text-muted-foreground hidden md:block" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Key Features</CardTitle>
            <CardDescription>Everything you need for successful BSCS preparation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-3">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span className="text-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default HowItWorks;
