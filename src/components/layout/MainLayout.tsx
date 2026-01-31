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
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h2 className="font-semibold text-foreground">EduLearn Portal</h2>
            </div>
            <div className="flex items-center gap-3">
              {profile && (
                <>
                  <div className="flex items-center gap-1 bg-muted px-3 py-1 rounded-full">
                    <Coins className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">
                      {profile.coins_earned || 0}
                    </span>
                  </div>
                  {isAdmin && (
                    <Badge variant="default">Admin</Badge>
                  )}
                  <span className="text-sm text-muted-foreground hidden md:block">
                    {profile.username}
                  </span>
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary text-primary-foreground">
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
                : 'flex-1 p-6 overflow-auto bg-background'
            }
          >
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
