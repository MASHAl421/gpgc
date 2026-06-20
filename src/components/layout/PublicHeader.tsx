import { GraduationCap, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

interface PublicHeaderProps {
  onLoginClick?: () => void;
}

const NAV = [
  { label: 'Home', target: 'top' },
  { label: 'Features', target: 'features' },
  { label: 'Stats', target: 'stats' },
  { label: 'Notices', target: 'notices' },
  { label: 'Why Us', target: 'why' },
  { label: 'About', target: 'about' },
];

export const PublicHeader = ({ onLoginClick }: PublicHeaderProps) => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id: string) => {
    setOpen(false);
    if (id === 'top') return window.scrollTo({ top: 0, behavior: 'smooth' });
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-card/85 backdrop-blur-xl border-b border-border shadow-sm'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <button onClick={() => scrollTo('top')} className="flex items-center gap-2.5 shrink-0 group">
          <div className="h-10 w-10 rounded-xl bg-[image:var(--gradient-primary)] flex items-center justify-center shadow-[var(--shadow-glow)] group-hover:scale-105 transition-transform">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground tracking-tight">
            GPGC <span className="text-gradient">Portal</span>
          </span>
        </button>

        <nav className="hidden md:flex items-center gap-7">
          {NAV.map((n) => (
            <button key={n.target} onClick={() => scrollTo(n.target)} className="nav-link">
              {n.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button onClick={onLoginClick} className="cta-pill btn-gradient hidden sm:inline-flex" size="sm">
            Login / Sign Up
          </Button>
          <button
            className="md:hidden p-2 rounded-md hover:bg-muted transition-colors"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-card/95 backdrop-blur-xl animate-fade-in">
          <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-1">
            {NAV.map((n) => (
              <button
                key={n.target}
                onClick={() => scrollTo(n.target)}
                className="text-left py-2.5 px-2 rounded-lg text-sm font-medium text-foreground/80 hover:text-primary hover:bg-primary/5 transition-colors"
              >
                {n.label}
              </button>
            ))}
            <Button onClick={onLoginClick} className="cta-pill btn-gradient mt-2" size="sm">
              Login / Sign Up
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};
