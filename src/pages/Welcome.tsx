import { useNavigate } from 'react-router-dom';
import { useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { CustomCursor } from '@/components/effects/CustomCursor';
import {
  Home, Brain, ClipboardList, Trophy, FileText, MessageSquare, BookOpen,
  Mic, GraduationCap, Target, Calculator, BookMarked, Sparkles, Compass,
  Code2, FlaskConical, Globe, Calendar, PenLine, Lightbulb, Library,
  HeartHandshake, LineChart, ArrowRight, Bot, Notebook, Microscope,
  Languages, Gamepad2,
} from 'lucide-react';

type Pill = {
  icon: typeof Home;
  title: string;
  sub: string;
  // position in % of container
  x: number; y: number;
  // tilt deg, size scale
  rot?: number; scale?: number;
  // animation delay in ms
  delay: number;
  hue?: string; // glow color (tailwind)
};

const PILLS: Pill[] = [
  { icon: Home,           title: 'Dashboard',        sub: 'Your overview',     x: 4,  y: 4,  rot: -6, delay: 0,    hue: 'from-rose-500/30' },
  { icon: Brain,          title: 'Full Prep',        sub: 'Complete coverage', x: 18, y: 6,  rot: -3, delay: 80,   hue: 'from-fuchsia-500/30' },
  { icon: ClipboardList,  title: 'Objective',        sub: 'MCQ tests',         x: 33, y: 2,  rot: 2,  delay: 160,  hue: 'from-violet-500/30' },
  { icon: Target,         title: 'SLOs Mapping',     sub: 'Board outcomes',    x: 48, y: 4,  rot: -2, delay: 240,  hue: 'from-emerald-500/30' },
  { icon: PenLine,        title: 'Typing Master',    sub: 'Speed practice',    x: 64, y: 6,  rot: 3,  delay: 320,  hue: 'from-sky-500/30' },
  { icon: MessageSquare,  title: 'Messages',         sub: 'Stay in touch',     x: 79, y: 2,  rot: -3, delay: 400,  hue: 'from-cyan-500/30' },
  { icon: Bot,            title: 'AI Assistant',     sub: 'Mesh Chat',         x: 87, y: 5,  rot: 4,  delay: 480,  hue: 'from-indigo-500/30' },

  { icon: BookOpen,       title: 'Dictionary',       sub: 'Smart lookup',      x: 6,  y: 18, rot: 4,  delay: 100,  hue: 'from-amber-500/30' },
  { icon: Microscope,     title: 'Periodic Table',   sub: 'Quick ref',         x: 28, y: 14, rot: -4, delay: 200,  hue: 'from-teal-500/30' },
  { icon: Target,         title: 'MCQs Bank',        sub: 'Targeted practice', x: 50, y: 18, rot: 2,  delay: 280,  hue: 'from-orange-500/30' },
  { icon: Globe,          title: 'General Knowledge',sub: 'World facts',       x: 70, y: 16, rot: -2, delay: 360,  hue: 'from-blue-500/30' },
  { icon: Calendar,       title: 'Time Table',       sub: 'Plan your week',    x: 82, y: 18, rot: 3,  delay: 440,  hue: 'from-pink-500/30' },
  { icon: Notebook,       title: 'Smart Notes',      sub: 'Revise faster',     x: 92, y: 14, rot: -3, delay: 520,  hue: 'from-lime-500/30' },

  { icon: Target,         title: 'MDCAT Prep',       sub: 'Medical entry',     x: 5,  y: 32, rot: -5, delay: 140,  hue: 'from-red-500/30' },
  { icon: FlaskConical,   title: 'Chapter Tests',    sub: 'Unit-wise quiz',    x: 22, y: 28, rot: 5,  delay: 220,  hue: 'from-green-500/30' },
  { icon: FlaskConical,   title: 'Experiments',      sub: 'Virtual labs',      x: 36, y: 30, rot: -2, delay: 300,  hue: 'from-emerald-500/30' },
  { icon: Library,        title: 'Global Library',   sub: 'Simulation hub',    x: 56, y: 30, rot: 3,  delay: 380,  hue: 'from-blue-500/30' },
  { icon: Compass,        title: 'Career Counsel',   sub: 'Future guidance',   x: 74, y: 30, rot: -3, delay: 460,  hue: 'from-purple-500/30' },
  { icon: PenLine,        title: 'Subjective',       sub: 'Written practice',  x: 88, y: 30, rot: 4,  delay: 540,  hue: 'from-fuchsia-500/30' },
  { icon: BookMarked,     title: 'E-Books',          sub: 'Preparation library', x: 96, y: 28, rot: -4, delay: 620, hue: 'from-amber-500/30' },

  { icon: GraduationCap,  title: 'Self Assessments', sub: 'Test yourself',     x: 10, y: 46, rot: 4,  delay: 180,  hue: 'from-cyan-500/30' },
  { icon: Calculator,     title: 'Log Table',        sub: 'Math reference',    x: 28, y: 44, rot: -3, delay: 260,  hue: 'from-blue-500/30' },
  { icon: GraduationCap,  title: 'Online Classes',   sub: 'Live sessions',     x: 46, y: 46, rot: 2,  delay: 340,  hue: 'from-violet-500/30' },
  { icon: Code2,          title: 'Learn Coding',     sub: 'Logic mastery',     x: 64, y: 44, rot: -3, delay: 420,  hue: 'from-indigo-500/30' },
  { icon: LineChart,      title: 'Progress Tracking',sub: 'See growth clearly',x: 80, y: 46, rot: 3,  delay: 500,  hue: 'from-emerald-500/30' },
  { icon: Calculator,     title: 'Calculator',       sub: 'Scientific tool',   x: 94, y: 44, rot: -4, delay: 580,  hue: 'from-pink-500/30' },

  { icon: FileText,       title: 'Past Papers',      sub: 'Practice real exams', x: 14, y: 60, rot: -5, delay: 200, hue: 'from-orange-500/30' },
  { icon: Gamepad2,       title: 'Puzzle Games',     sub: 'Train your brain',  x: 32, y: 62, rot: 6,  delay: 280,  hue: 'from-lime-500/30' },
  { icon: HeartHandshake, title: 'Join Forces',      sub: 'Study together',    x: 48, y: 60, rot: -2, delay: 360,  hue: 'from-rose-500/30' },
  { icon: Microscope,     title: 'Simulations',      sub: 'Interactive labs',  x: 64, y: 60, rot: 3,  delay: 440,  hue: 'from-teal-500/30' },
  { icon: Target,         title: 'ETEA Prep',        sub: 'Engineering entry', x: 82, y: 60, rot: -3, delay: 520,  hue: 'from-violet-500/30' },

  { icon: PenLine,        title: 'Video Lectures',   sub: 'Concept mastery',   x: 4,  y: 74, rot: -10, delay: 240, hue: 'from-fuchsia-500/30' },
  { icon: Bot,            title: 'AI Assistant',     sub: 'Always available',  x: 6,  y: 90, rot: 6,   delay: 320, hue: 'from-sky-500/30' },
  { icon: Lightbulb,      title: 'Conceptual',       sub: 'Deep learning',     x: 84, y: 90, rot: -5,  delay: 400, hue: 'from-amber-500/30' },
  { icon: Sparkles,       title: 'ChatGPT',          sub: 'Quick answers',     x: 94, y: 90, rot: 4,   delay: 480, hue: 'from-emerald-500/30' },
];

const Welcome = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  // Mark this session as "intro shown" so refreshes inside app don't loop back here.
  useEffect(() => {
    try { sessionStorage.setItem('gpgc_intro_shown', '1'); } catch {}
  }, []);

  const proceed = () => {
    navigate(isAuthenticated ? '/home' : '/login');
  };

  const pills = useMemo(() => PILLS, []);

  return (
    <div className="welcome-root relative min-h-screen w-full overflow-hidden bg-[#05060a] text-white">
      <CustomCursor />

      {/* Background gradient blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/4 h-[520px] w-[520px] rounded-full bg-fuchsia-600/20 blur-[120px] animate-blob" />
        <div className="absolute top-1/3 -right-32 h-[600px] w-[600px] rounded-full bg-sky-500/20 blur-[140px] animate-blob [animation-delay:2s]" />
        <div className="absolute -bottom-40 left-1/3 h-[600px] w-[600px] rounded-full bg-emerald-500/15 blur-[140px] animate-blob [animation-delay:4s]" />
        {/* subtle dot grid */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
      </div>

      {/* Brand strip */}
      <div className="relative z-20 flex items-center justify-between px-5 sm:px-10 pt-6">
        <div className="flex items-center gap-2 animate-fade-down" style={{ animationDelay: '50ms' }}>
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-fuchsia-500 flex items-center justify-center shadow-lg shadow-primary/30">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="text-base font-bold tracking-tight">
            GPGC <span className="bg-gradient-to-r from-primary to-fuchsia-400 bg-clip-text text-transparent">Portal</span>
          </span>
        </div>
        <button
          onClick={proceed}
          disabled={isLoading}
          className="text-xs sm:text-sm font-medium text-white/70 hover:text-white transition-colors animate-fade-down"
          style={{ animationDelay: '120ms' }}
        >
          Skip intro →
        </button>
      </div>

      {/* ============ DESKTOP/TABLET: scattered floating pills ============ */}
      <div className="hidden md:block relative z-10 mt-2 h-[calc(100vh-180px)] min-h-[640px]">
        {pills.map((p, i) => (
          <FloatingPill key={i} pill={p} />
        ))}
      </div>

      {/* ============ MOBILE: grid of pills ============ */}
      <div className="md:hidden relative z-10 px-4 mt-6 pb-40">
        <div className="grid grid-cols-2 gap-3">
          {pills.slice(0, 14).map((p, i) => (
            <div
              key={i}
              className="animate-fade-up rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-3 shadow-lg"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-center gap-2.5">
                <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${p.hue} to-transparent flex items-center justify-center border border-white/10`}>
                  <p.icon className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-white truncate">{p.title}</div>
                  <div className="text-[10px] text-white/60 truncate">{p.sub}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ============ CENTER CTA ============ */}
      <div className="fixed bottom-8 sm:bottom-10 left-1/2 -translate-x-1/2 z-30 w-[92%] max-w-2xl animate-fade-up" style={{ animationDelay: '900ms' }}>
        <button
          onClick={proceed}
          data-cursor="hover"
          className="group relative w-full overflow-hidden rounded-full border border-white/15
                     bg-white/[0.04] backdrop-blur-xl
                     shadow-[0_8px_60px_-15px_rgba(125,90,255,0.55)]
                     hover:shadow-[0_8px_80px_-10px_rgba(125,90,255,0.8)]
                     transition-all duration-300"
        >
          {/* glow halo */}
          <span className="pointer-events-none absolute inset-0 rounded-full opacity-70 group-hover:opacity-100 transition-opacity"
            style={{
              background:
                'radial-gradient(60% 100% at 50% 100%, rgba(64,224,208,0.35), transparent 70%), radial-gradient(60% 100% at 50% 0%, rgba(168,85,247,0.25), transparent 70%)',
            }}
          />
          <span className="relative flex items-center justify-between px-5 sm:px-7 py-4 sm:py-5">
            <span className="font-serif text-xl sm:text-3xl tracking-tight text-white">
              Start Your Learning Journey
            </span>
            <span className="flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-full
                             bg-gradient-to-br from-cyan-300 via-teal-300 to-emerald-300
                             text-slate-900 shadow-lg
                             group-hover:translate-x-1 transition-transform">
              <ArrowRight className="h-5 w-5" />
            </span>
          </span>
        </button>
        <p className="mt-3 text-center text-xs text-white/50">
          Powered by GPGC Portal · Developed By <span className="text-white/80 font-medium">MYNT</span>
        </p>
      </div>
    </div>
  );
};

const FloatingPill = ({ pill }: { pill: Pill }) => {
  const Icon = pill.icon;
  const style: React.CSSProperties = {
    left: `${pill.x}%`,
    top: `${pill.y}%`,
    ['--rot' as any]: `${pill.rot ?? 0}deg`,
    transform: `translate(-50%, -50%) rotate(${pill.rot ?? 0}deg) scale(${pill.scale ?? 1})`,
    animationDelay: `${pill.delay}ms`,
  };
  // float duration variations
  const floatDur = 6 + ((pill.delay % 5) * 0.6);
  return (
    <div
      className="absolute animate-fade-up"
      style={style}
      data-cursor="hover"
    >
      <div
        className="group relative inline-flex items-center gap-2.5 rounded-full
                   border border-white/10 bg-white/[0.04] backdrop-blur-md
                   px-3.5 py-2 pr-4 shadow-lg cursor-pointer
                   hover:border-white/30 hover:bg-white/[0.08] hover:scale-[1.06]
                   transition-all duration-300 will-change-transform"
        style={{ animation: `float ${floatDur}s ease-in-out ${pill.delay}ms infinite` }}
      >
        {/* glow */}
        <span
          className={`pointer-events-none absolute -inset-px rounded-full opacity-0 group-hover:opacity-100 transition-opacity
                      bg-gradient-to-br ${pill.hue ?? 'from-primary/30'} to-transparent blur-md -z-10`}
        />
        <span className={`h-8 w-8 rounded-full flex items-center justify-center
                          bg-gradient-to-br ${pill.hue ?? 'from-primary/30'} to-transparent
                          border border-white/10`}>
          <Icon className="h-4 w-4 text-white" />
        </span>
        <span className="flex flex-col leading-tight">
          <span className="text-[13px] font-semibold text-white whitespace-nowrap">{pill.title}</span>
          <span className="text-[10px] text-white/60 whitespace-nowrap">{pill.sub}</span>
        </span>
      </div>
    </div>
  );
};

export default Welcome;
