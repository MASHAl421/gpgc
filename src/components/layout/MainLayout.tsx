import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Coins } from 'lucide-react';

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const { profile, isAdmin } = useAuth();
  const location = useLocation();

  const isAITutor = location.pathname === '/ai-tutor';

  return (
    <SidebarProvider>
      <div className="min-h-dvh flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header — sticky glass bar */}
          <header className="sticky top-0 z-30 h-14 sm:h-16 border-b border-border/60 bg-background/80 backdrop-blur-xl flex items-center justify-between px-3 sm:px-5 shrink-0">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <SidebarTrigger
                className="shrink-0 hover:bg-accent rounded-lg"
                aria-label="Toggle navigation sidebar"
              />
              <h2 className="font-display font-semibold text-foreground text-sm sm:text-base tracking-tight truncate">
                GPGC Portal
              </h2>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {profile && (
                <>
                  <div
                    className="flex items-center gap-1.5 bg-gradient-primary text-primary-foreground px-3 py-1.5 rounded-full shadow-elegant"
                    aria-label={`${profile.coins_earned || 0} coins earned`}
                  >
                    <Coins className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
                    <span className="text-xs sm:text-sm font-semibold tabular-nums">
                      {profile.coins_earned || 0}
                    </span>
                  </div>
                  {isAdmin && (
                    <Badge
                      variant="default"
                      className="hidden sm:inline-flex bg-accent text-accent-foreground border border-primary/30"
                    >
                      Admin
                    </Badge>
                  )}
                  <span className="text-sm font-medium text-foreground hidden lg:block">
                    {profile.username}
                  </span>
                  <Avatar className="h-9 w-9 ring-2 ring-primary/30 ring-offset-2 ring-offset-background">
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs sm:text-sm font-semibold">
                      {profile.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </>
              )}
            </div>
          </header>

          {/* Main Content */}
          <main
            className={
              isAITutor
                ? 'flex-1 overflow-hidden bg-background'
                : 'flex-1 p-3 sm:p-4 md:p-6 overflow-auto bg-background'
            }
          >
            {children}
          </main>

          {/* Footer */}
          <footer className="h-10 border-t border-border/60 bg-background/50 backdrop-blur-sm flex items-center justify-center shrink-0">
            <p className="text-xs text-muted-foreground">
              Developed By:{' '}
              <span className="font-semibold bg-gradient-primary bg-clip-text text-transparent">
                Mashal Khan
              </span>
            </p>
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
};
