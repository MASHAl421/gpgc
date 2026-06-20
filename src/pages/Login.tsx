import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import {
  GraduationCap,
  BookOpen,
  Users,
  Trophy,
  Eye,
  EyeOff,
  Sparkles,
  FileText,
  Target,
  Brain,
  ClipboardList,
  MessageSquare,
  Mic,
  BookMarked,
  ShieldCheck,
  Zap,
  Smartphone,
  ArrowRight,
} from 'lucide-react';

const KEY_FEATURES = [
  { icon: Target,        text: 'SLOs Level Mapping' },
  { icon: BookMarked,    text: 'Unit & Topic-wise MCQs' },
  { icon: ClipboardList, text: 'Self-Test (Objective & Subjective)' },
  { icon: BookOpen,      text: 'Key Notes & E-Books' },
  { icon: FileText,      text: 'Past Papers & Model Papers' },
  { icon: Brain,         text: 'AI Tutor — Mesh Chat' },
  { icon: Mic,           text: 'Voice Taker Notes' },
  { icon: Trophy,        text: 'Competition Tests' },
  { icon: MessageSquare, text: 'Discussion Forum' },
];

const WHY_US = [
  { icon: ShieldCheck, title: 'Curriculum-Aligned',  desc: 'Built around the official BS-level syllabus, unit by unit, topic by topic.' },
  { icon: Zap,         title: 'Smart & Fast',         desc: 'Quick-response interface, instant feedback on quizzes, AI-generated notes in seconds.' },
  { icon: Sparkles,    title: 'Gamified Learning',    desc: 'Earn coins, unlock achievements, climb the forum leaderboard while you study.' },
];

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login, signup } = useAuth();
  const authRef = useRef<HTMLDivElement>(null);

  const scrollToAuth = () => {
    authRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    const { error } = await login(email, password);
    if (error) setError(error);
    else navigate('/home');
    setIsLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    if (!username.trim()) {
      setError('Please enter a username');
      setIsLoading(false);
      return;
    }
    const { error } = await signup(email, password, username);
    if (error) setError(error);
    else navigate('/home');
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader onLoginClick={scrollToAuth} />

      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden">
        {/* tinted background blob */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-background to-background" />
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-primary/10 blur-3xl -z-10" />

        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24 grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: copy + CTA */}
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-6">
              <Sparkles className="h-3.5 w-3.5" /> Smart Learning Companion
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight tracking-tight">
              Knowledge at your
              <span className="block text-primary">Fingertips.</span>
            </h1>
            <p className="mt-5 text-base md:text-lg text-muted-foreground max-w-xl leading-relaxed">
              GPGC Portal is a modern learning companion built for BS-level students — quizzes, expert key notes, past papers, an AI tutor and progress tracking, all in one calm, focused workspace.
            </p>

            <div className="flex flex-wrap gap-3 mt-8">
              <Button onClick={scrollToAuth} className="cta-pill h-12 px-7 text-base">
                Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                variant="outline"
                className="rounded-full h-12 px-7 text-base"
              >
                Explore Features
              </Button>
            </div>

            {/* mini stats */}
            <div className="grid grid-cols-3 gap-4 mt-10 max-w-md">
              {[
                { v: '2000+', l: 'Quizzes' },
                { v: '50+',   l: 'Subjects & Topics' },
                { v: 'AI',    l: 'Powered Tutor' },
              ].map((s) => (
                <div key={s.l}>
                  <div className="text-2xl md:text-3xl font-bold text-foreground">{s.v}</div>
                  <div className="text-xs md:text-sm text-muted-foreground">{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: phone mockup */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-[280px] md:w-[320px]">
              {/* phone frame */}
              <div className="relative rounded-[2.5rem] bg-secondary p-3 shadow-2xl">
                <div className="rounded-[2rem] bg-card overflow-hidden">
                  {/* notch */}
                  <div className="h-6 bg-secondary flex items-center justify-center">
                    <div className="h-1.5 w-16 rounded-full bg-secondary-foreground/30" />
                  </div>
                  {/* screen */}
                  <div className="p-5 bg-gradient-to-b from-primary/10 to-card">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                        <GraduationCap className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Good day,</div>
                        <div className="text-sm font-bold text-foreground">Student</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        { i: BookOpen,      l: 'Syllabus' },
                        { i: ClipboardList, l: 'Self Test' },
                        { i: Trophy,        l: 'Compete' },
                        { i: Brain,         l: 'AI Tutor' },
                        { i: FileText,      l: 'Papers' },
                        { i: MessageSquare, l: 'Forum' },
                      ].map((t, idx) => (
                        <div key={idx} className="bg-card border border-border rounded-xl p-3 flex flex-col items-center gap-1.5 shadow-sm">
                          <t.i className="h-5 w-5 text-primary" />
                          <span className="text-[10px] font-medium text-foreground">{t.l}</span>
                        </div>
                      ))}
                    </div>

                    <button className="w-full mt-4 bg-primary text-primary-foreground text-xs font-semibold py-2.5 rounded-full shadow">
                      Start Learning
                    </button>
                  </div>
                </div>
              </div>

              {/* floating chips */}
              <div className="absolute -left-4 top-10 bg-card border border-border rounded-xl shadow-lg p-3 flex items-center gap-2 hidden md:flex">
                <Smartphone className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium">Works on mobile</span>
              </div>
              <div className="absolute -right-4 bottom-16 bg-card border border-border rounded-xl shadow-lg p-3 flex items-center gap-2 hidden md:flex">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium">AI-powered</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ KEY FEATURES ============ */}
      <section id="features" className="section-tinted">
        <div className="section-inner">
          <h2 className="section-title">Key Features</h2>
          <p className="section-subtitle">
            Comprehensive tools and resources to make learning smarter, faster, and stress-free.
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {KEY_FEATURES.map((f) => (
              <div key={f.text} className="feature-card flex items-center gap-4">
                <div className="icon-pill"><f.icon className="h-6 w-6" /></div>
                <span className="font-medium text-foreground">{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ WHY CHOOSE US ============ */}
      <section id="why" className="section">
        <div className="section-inner">
          <h2 className="section-title">Why Choose GPGC Portal?</h2>
          <p className="section-subtitle">
            Smart learning tools. Reliable resources. Everything you need for success — all in one platform.
          </p>

          <div className="grid gap-6 md:grid-cols-3">
            {WHY_US.map((w) => (
              <div key={w.title} className="feature-card text-center">
                <div className="icon-pill mx-auto mb-5 h-14 w-14">
                  <w.icon className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{w.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ ABOUT / CTA + AUTH ============ */}
      <section id="about" className="section-tinted">
        <div className="section-inner grid lg:grid-cols-2 gap-12 items-start">
          {/* About copy */}
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
              About <span className="text-primary">GPGC Portal</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              GPGC Portal is a modern learning companion built to simplify education for BS-level students. Whether preparing for semester exams, entry tests, or self-study, our platform offers smart tools, interactive resources, and progress tracking to keep learners on the right path.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-6">
              With expert-designed notes, past papers, quizzes, and mock tests, students gain the confidence they need to excel. Our goal: a stress-free, engaging, and result-driven learning journey for every student.
            </p>
            <div className="flex flex-wrap gap-2">
              {['BSCS', 'BSIT', 'Semester 1', 'Semester 2', 'AI Tutor', 'Forum'].map((t) => (
                <span key={t} className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Auth card */}
          <div ref={authRef} className="scroll-mt-24">
            <Card className="w-full shadow-xl border-border rounded-2xl">
              <CardHeader className="space-y-1 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
                    <GraduationCap className="h-5 w-5 text-primary-foreground" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold">Welcome!</CardTitle>
                <CardDescription>Start your learning journey with GPGC Portal</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-5 rounded-full p-1">
                    <TabsTrigger value="login" className="rounded-full">Login</TabsTrigger>
                    <TabsTrigger value="signup" className="rounded-full">Sign Up</TabsTrigger>
                  </TabsList>

                  <TabsContent value="login">
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" placeholder="you@example.com"
                          value={email} onChange={(e) => setEmail(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                          <Input id="password" type={showPassword ? 'text' : 'password'}
                            placeholder="Enter your password" value={password}
                            onChange={(e) => setPassword(e.target.value)} required className="pr-10" />
                          <button type="button" onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      {error && <p className="text-destructive text-sm text-center">{error}</p>}
                      <Button type="submit" className="w-full cta-pill h-11" disabled={isLoading}>
                        {isLoading ? 'Logging in...' : 'Login'}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="signup">
                    <form onSubmit={handleSignup} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-username">Username</Label>
                        <Input id="signup-username" type="text" placeholder="Choose a username"
                          value={username} onChange={(e) => setUsername(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <Input id="signup-email" type="email" placeholder="you@example.com"
                          value={email} onChange={(e) => setEmail(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Password</Label>
                        <div className="relative">
                          <Input id="signup-password" type={showPassword ? 'text' : 'password'}
                            placeholder="Create a password (min 6 characters)" value={password}
                            onChange={(e) => setPassword(e.target.value)} required minLength={6} className="pr-10" />
                          <button type="button" onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      {error && <p className="text-destructive text-sm text-center">{error}</p>}
                      <Button type="submit" className="w-full cta-pill h-11" disabled={isLoading}>
                        {isLoading ? 'Creating Account...' : 'Create Account'}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default Login;
