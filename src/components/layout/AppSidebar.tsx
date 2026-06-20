import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { NavLink } from '@/components/NavLink';
import {
  Home,
  Sparkles,
  BookOpen,
  Trophy,
  Coins,
  HelpCircle,
  MessageSquare,
  LogOut,
  GraduationCap,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationDropdown } from '@/components/NotificationDropdown';

const menuItems = [
  { title: 'Home', url: '/home', icon: Home },
  { title: 'AI Workspace', url: '/ai-tutor', icon: Sparkles },
  { title: 'Preparation', url: '/preparation', icon: BookOpen },
  { title: 'Competition Tests', url: '/competition', icon: Trophy },
  { title: 'Coins Earned', url: '/coins', icon: Coins },
  { title: 'How It Works', url: '/how-it-works', icon: HelpCircle },
  { title: 'Discussion Forum', url: '/forum', icon: MessageSquare },
];

const adminItems = [
  { title: 'Admin Panel', url: '/admin', icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, profile, isAdmin } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const renderItem = (item: typeof menuItems[number]) => {
    const active = location.pathname === item.url;
    return (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton
          asChild
          isActive={active}
          tooltip={item.title}
          className="h-10 rounded-lg transition-all data-[active=true]:bg-gradient-primary data-[active=true]:text-primary-foreground data-[active=true]:shadow-elegant hover:bg-accent/60"
        >
          <NavLink
            to={item.url}
            aria-current={active ? 'page' : undefined}
            className="flex items-center gap-3 px-3"
          >
            <item.icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
            {!collapsed && <span className="font-medium text-sm">{item.title}</span>}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="p-4 border-b border-sidebar-border/60">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-primary text-primary-foreground shadow-elegant shrink-0">
            <GraduationCap className="h-5 w-5" aria-hidden="true" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="font-display font-bold text-lg text-sidebar-foreground leading-tight tracking-tight">
                GPGC Portal
              </h1>
              <p className="text-[11px] text-muted-foreground font-medium tracking-wide uppercase">
                BS Preparation
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-3">
              Workspace
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {menuItems.map(renderItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup className="mt-2">
            {!collapsed && (
              <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-3">
                Administration
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {adminItems.map(renderItem)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border/60">
        {!collapsed && profile && (
          <div className="mb-3 p-3 rounded-xl bg-accent/40 border border-sidebar-border">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-sidebar-foreground truncate">
                  {profile.username}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">{profile.email}</p>
              </div>
              <NotificationDropdown />
            </div>
            {isAdmin && (
              <span className="text-[10px] font-semibold bg-gradient-primary text-primary-foreground px-2 py-0.5 rounded-full mt-2 inline-block uppercase tracking-wide">
                Admin
              </span>
            )}
          </div>
        )}
        {collapsed && profile && (
          <div className="mb-2 flex justify-center">
            <NotificationDropdown />
          </div>
        )}
        <Button
          variant="ghost"
          className={`w-full ${collapsed ? 'justify-center px-0' : 'justify-start gap-3'} text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg h-10`}
          onClick={handleLogout}
          aria-label="Sign out"
        >
          <LogOut className="h-[18px] w-[18px]" aria-hidden="true" />
          {!collapsed && <span className="font-medium text-sm">Sign Out</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
