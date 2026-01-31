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

  // AI Tutor needs an app-like layout with a single internal scrollbar.
  // Other pages can keep the default page-level scrolling.
  const isAITutor = location.pathname === '/ai-tutor';

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header - responsive */}
          <header className="h-14 sm:h-16 border-b border-border bg-card flex items-center justify-between px-2 sm:px-4 shrink-0">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <SidebarTrigger className="shrink-0" />
              <h2 className="font-semibold text-foreground text-sm sm:text-base truncate">GPGC Portal</h2>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {profile && (
                <>
                  <div className="flex items-center gap-1 bg-muted px-2 sm:px-3 py-1 rounded-full">
                    <Coins className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                    <span className="text-xs sm:text-sm font-medium text-foreground">
                      {profile.coins_earned || 0}
                    </span>
                  </div>
                  {isAdmin && (
                    <Badge variant="default" className="hidden sm:inline-flex">Admin</Badge>
                  )}
                  <span className="text-sm text-muted-foreground hidden lg:block">
                    {profile.username}
                  </span>
                  <Avatar className="h-8 w-8 sm:h-9 sm:w-9">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs sm:text-sm">
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
          
          {/* Footer - Developed By */}
          <footer className="h-10 border-t border-border bg-card flex items-center justify-center shrink-0">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Developed By: <span className="font-medium text-foreground">Mashal Khan</span>
            </p>
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
};
