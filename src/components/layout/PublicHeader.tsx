import { GraduationCap, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface PublicHeaderProps {
  onLoginClick?: () => void;
}

const NAV = [
  { label: 'Home', target: 'top' },
  { label: 'Features', target: 'features' },
  { label: 'Why Us', target: 'why' },
  { label: 'About', target: 'about' },
];

export const PublicHeader = ({ onLoginClick }: PublicHeaderProps) => {
  const [open, setOpen] = useState(false);

  const scrollTo = (id: string) => {
    setOpen(false);
    if (id === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <header className="sticky top-0 z-50 bg-card/90 backdrop-blur border-b border-border">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => scrollTo('top')}
          className="flex items-center gap-2 shrink-0"
        >
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground tracking-tight">
            GPGC <span className="text-primary">Portal</span>
          </span>
        </button>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV.map((n) => (
            <button
              key={n.target}
              onClick={() => scrollTo(n.target)}
              className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
            >
              {n.label}
            </button>
          ))}
        </nav>

        {/* Right action */}
        <div className="flex items-center gap-2">
          <Button
            onClick={onLoginClick}
            className="cta-pill hidden sm:inline-flex"
            size="sm"
          >
            Login / Sign Up
          </Button>
          <button
            className="md:hidden p-2 rounded-md hover:bg-muted"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-border bg-card">
          <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-2">
            {NAV.map((n) => (
              <button
                key={n.target}
                onClick={() => scrollTo(n.target)}
                className="text-left py-2 text-sm font-medium text-foreground/80 hover:text-primary"
              >
                {n.label}
              </button>
            ))}
            <Button onClick={onLoginClick} className="cta-pill mt-2" size="sm">
              Login / Sign Up
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};
