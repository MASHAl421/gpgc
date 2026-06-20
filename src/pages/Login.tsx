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
  Award,
  Bell,
  CalendarDays,
  Building2,
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

const COUNTERS = [
  { icon: Users,     value: '5,000+',  label: 'Active Students' },
  { icon: Building2, value: '12+',     label: 'Departments' },
  { icon: Award,     value: '250+',    label: 'Faculty Members' },
  { icon: BookOpen,  value: '50+',     label: 'Programs' },
];

const NOTICES = [
  { tag: 'Admissions', date: 'Jun 18, 2026', title: 'BS Admissions Fall 2026 — applications now open',
    desc: 'Apply online for BSCS, BSIT and other BS programs. Last date and merit list schedule published.' },
  { tag: 'Examination', date: 'Jun 12, 2026', title: 'Semester 2 mid-term datesheet released',
    desc: 'Check the official datesheet for upcoming mid-term examinations across all departments.' },
  { tag: 'Event', date: 'Jun 05, 2026', title: 'Annual Science & Tech Expo — register your project',
    desc: 'Showcase your project at the campus expo. Registration window open for two weeks.' },
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
      <section className="relative overflow-hidden hero-bg">
        <div className="blob w-[420px] h-[420px] bg-primary/25 -top-32 -left-24 animate-float" />
        <div className="blob w-[360px] h-[360px] bg-[hsl(var(--emerald))]/25 top-40 -right-20 animate-float" style={{ animationDelay: '1.5s' }} />

        <div className="max-w-6xl mx-auto px-4 py-20 md:py-28 grid lg:grid-cols-2 gap-12 items-center relative">
          <div className="reveal">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/70 backdrop-blur-md border border-border text-primary text-xs font-semibold mb-6 shadow-sm">
              <Sparkles className="h-3.5 w-3.5" /> Smart Learning Companion
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-[1.05] tracking-tight">
              Knowledge at your
              <span className="block text-gradient">Fingertips.</span>
            </h1>
            <p className="mt-6 text-base md:text-lg text-muted-foreground max-w-xl leading-relaxed">
              GPGC Portal is a modern learning companion built for BS-level students — quizzes, expert key notes, past papers, an AI tutor and progress tracking, all in one calm, focused workspace.
            </p>

            <div className="flex flex-wrap gap-3 mt-8">
              <Button onClick={scrollToAuth} className="cta-pill btn-gradient h-12 px-7 text-base">
                Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                variant="outline"
                className="rounded-full h-12 px-7 text-base border-border hover:border-primary hover:text-primary transition-colors"
              >
                Explore Features
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-10 max-w-md">
              {[
                { v: '2000+', l: 'Quizzes' },
                { v: '50+',   l: 'Subjects & Topics' },
                { v: 'AI',    l: 'Powered Tutor' },
              ].map((s) => (
                <div key={s.l}>
                  <div className="text-2xl md:text-3xl font-bold text-gradient">{s.v}</div>
                  <div className="text-xs md:text-sm text-muted-foreground">{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex justify-center lg:justify-end reveal" style={{ animationDelay: '0.15s' }}>
            <div className="relative w-[280px] md:w-[320px]">
              <div className="absolute -inset-8 bg-[image:var(--gradient-primary)] opacity-20 blur-3xl rounded-full" />
              <div className="relative rounded-[2.5rem] bg-secondary p-3 shadow-2xl animate-float">
                <div className="rounded-[2rem] bg-card overflow-hidden">
                  <div className="h-6 bg-secondary flex items-center justify-center">
                    <div className="h-1.5 w-16 rounded-full bg-secondary-foreground/30" />
                  </div>
                  <div className="p-5 bg-gradient-to-b from-primary/10 to-card">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="h-10 w-10 rounded-full bg-[image:var(--gradient-primary)] flex items-center justify-center">
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
                        <div key={idx} className="bg-card border border-border rounded-xl p-3 flex flex-col items-center gap-1.5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                          <t.i className="h-5 w-5 text-primary" />
                          <span className="text-[10px] font-medium text-foreground">{t.l}</span>
                        </div>
                      ))}
                    </div>
                    <button className="w-full mt-4 bg-[image:var(--gradient-primary)] text-primary-foreground text-xs font-semibold py-2.5 rounded-full shadow">
                      Start Learning
                    </button>
                  </div>
                </div>
              </div>

              <div className="absolute -left-4 top-10 glass-card p-3 hidden md:flex items-center gap-2 animate-float" style={{ animationDelay: '0.8s' }}>
                <Smartphone className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium">Works on mobile</span>
              </div>
              <div className="absolute -right-4 bottom-16 glass-card p-3 hidden md:flex items-center gap-2 animate-float" style={{ animationDelay: '1.6s' }}>
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
          <h2 className="section-title">Key <span className="text-gradient">Features</span></h2>
          <p className="section-subtitle">
            Comprehensive tools and resources to make learning smarter, faster, and stress-free.
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {KEY_FEATURES.map((f, i) => (
              <div key={f.text} className="feature-card flex items-center gap-4 group reveal" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="icon-pill group-hover:scale-110 group-hover:rotate-3 transition-transform"><f.icon className="h-6 w-6" /></div>
                <span className="font-medium text-foreground">{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ STATS COUNTERS ============ */}
      <section id="stats" className="section relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[image:var(--gradient-primary)] opacity-[0.06]" />
        <div className="section-inner">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {COUNTERS.map((c, i) => (
              <div key={c.label} className="glass-card p-6 text-center reveal hover:-translate-y-1 transition-transform" style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="icon-pill-gradient mx-auto mb-4"><c.icon className="h-6 w-6" /></div>
                <div className="text-3xl md:text-4xl font-bold text-gradient">{c.value}</div>
                <div className="text-xs md:text-sm text-muted-foreground mt-1 font-medium">{c.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ LATEST NOTICES ============ */}
      <section id="notices" className="section-tinted">
        <div className="section-inner">
          <h2 className="section-title">Latest <span className="text-gradient">Notices & News</span></h2>
          <p className="section-subtitle">Stay updated with announcements, datesheets, events and admissions from the college.</p>
          <div className="grid gap-5 md:grid-cols-3">
            {NOTICES.map((n, i) => (
              <article key={n.title} className="feature-card group reveal" style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                    <Bell className="h-3 w-3" /> {n.tag}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" /> {n.date}
                  </span>
                </div>
                <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors leading-snug">{n.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{n.desc}</p>
                <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Read more <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ============ WHY CHOOSE US ============ */}
      <section id="why" className="section">
        <div className="section-inner">
          <h2 className="section-title">Why Choose <span className="text-gradient">GPGC Portal?</span></h2>
          <p className="section-subtitle">
            Smart learning tools. Reliable resources. Everything you need for success — all in one platform.
          </p>

          <div className="grid gap-6 md:grid-cols-3">
            {WHY_US.map((w, i) => (
              <div key={w.title} className="feature-card text-center group reveal" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="icon-pill-gradient mx-auto mb-5 h-14 w-14 group-hover:scale-110 transition-transform">
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
