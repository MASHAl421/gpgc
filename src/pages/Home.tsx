import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useSemesterOnboarding } from '@/hooks/useSemesterOnboarding';
import SemesterOnboarding from '@/components/SemesterOnboarding';
import {
  BookOpen,
  GraduationCap,
  Trophy,
  ClipboardList,
  FileText,
  Users,
  Coins as CoinsIcon,
  Brain,
  Mic,
  MessageSquare,
  ArrowRight,
  Sparkles,
  Flame,
} from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { needsOnboarding, profileData, completeOnboarding } = useSemesterOnboarding();

  const mainCards = [
    { title: 'Full Syllabus Preparation', desc: 'Unit-wise key notes, MCQs & past papers', icon: BookOpen,      path: '/preparation' },
    { title: 'Student Self Test',         desc: 'Objective + subjective practice tests', icon: ClipboardList,  path: '/preparation' },
    { title: 'Competition Tests',         desc: 'Compete with peers & earn coins',       icon: Trophy,         path: '/competition' },
    { title: 'Past & Model Papers',       desc: 'Real exam papers with solutions',       icon: FileText,       path: '/preparation' },
    { title: 'AI Workspace',              desc: 'Mesh Chat, VT Notes & Assignments',     icon: Brain,          path: '/ai-tutor' },
    { title: 'Discussion Forum',          desc: 'Ask, answer & level up',                icon: MessageSquare,  path: '/forum' },
  ];

  const stats = [
    { label: 'Coins Earned', value: profile?.coins_earned || 0, icon: CoinsIcon, color: 'text-yellow-500' },
    { label: 'Tests Passed', value: '0',                        icon: Trophy,    color: 'text-primary'    },
    { label: 'Streak Days',  value: '0',                        icon: Flame,     color: 'text-orange-500' },
  ];

  return (
    <MainLayout>
      <SemesterOnboarding open={needsOnboarding} onComplete={completeOnboarding} />

      <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
        {/* ============ HERO WELCOME ============ */}
        <Card className="border-border/70 rounded-2xl shadow-[var(--shadow-card)] overflow-hidden">
          <CardContent className="p-0">
            <div className="relative hero-bg p-6 md:p-10">
              <div className="blob w-72 h-72 bg-primary/20 -top-20 -right-20" />
              <div className="blob w-60 h-60 bg-[hsl(var(--emerald))]/20 -bottom-20 -left-10" />
              <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 backdrop-blur border border-border text-primary text-xs font-semibold mb-3 shadow-sm">
                    <Sparkles className="h-3.5 w-3.5" /> Welcome back
                  </span>
                  <h1 className="text-2xl md:text-4xl font-bold tracking-tight">
                    Hi, <span className="text-gradient">{profile?.username || 'Student'}</span> 👋
                  </h1>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <p className="text-sm md:text-base text-muted-foreground">
                      Ready to continue your learning journey?
                    </p>
                    {profileData?.semester && (
                      <Badge variant="secondary" className="rounded-full">Semester {profileData.semester}</Badge>
                    )}
                  </div>
                </div>
                <Button onClick={() => navigate('/preparation')} className="cta-pill btn-gradient h-11 px-6 self-start">
                  <GraduationCap className="mr-2 h-5 w-5" /> Start Learning
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ============ STATS ============ */}
        <div className="grid gap-4 grid-cols-3">
          {stats.map((s) => (
            <Card key={s.label} className="border-border/70 rounded-2xl shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)] hover:-translate-y-1 transition-all duration-300">
              <CardContent className="p-4 md:p-5 flex items-center gap-4">
                <div className="icon-pill h-12 w-12">
                  <s.icon className={`h-6 w-6 ${s.color}`} />
                </div>
                <div className="min-w-0">
                  <div className="text-xl md:text-2xl font-bold text-foreground">{s.value}</div>
                  <div className="text-xs md:text-sm text-muted-foreground truncate">{s.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ============ MAIN GRID ============ */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl md:text-2xl font-bold text-foreground">Your Workspace</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/how-it-works')} className="text-primary">
              How it works <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {mainCards.map((c) => (
              <button
                key={c.title}
                onClick={() => navigate(c.path)}
                className="feature-card text-left group"
              >
                <div className="flex items-start gap-4">
                  <div className="icon-pill group-hover:scale-110 transition-transform">
                    <c.icon className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-foreground mb-1">{c.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{c.desc}</p>
                  </div>
                </div>
                <div className="mt-4 text-primary text-sm font-medium inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Open <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ============ QUICK ACTIONS ============ */}
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Quick Actions
          </h2>
          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
            {[
              { i: ClipboardList, l: 'Daily Test',  p: '/preparation' },
              { i: Brain,         l: 'AI Tutor',    p: '/ai-tutor'    },
              { i: Mic,           l: 'VT Notes',    p: '/ai-tutor'    },
              { i: MessageSquare, l: 'Forum',       p: '/forum'       },
            ].map((q) => (
              <Button
                key={q.l}
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2 rounded-xl border-border hover:border-primary hover:bg-primary/5"
                onClick={() => navigate(q.p)}
              >
                <q.i className="h-5 w-5 text-primary" />
                <span className="text-xs md:text-sm font-medium">{q.l}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Home;
