import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
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
  Bot,
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
  { title: 'AI Tutor', url: '/ai-tutor', icon: Bot },
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

  const allMenuItems = isAdmin ? [...menuItems, ...adminItems] : menuItems;

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="h-6 w-6" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-bold text-lg text-sidebar-foreground">EduLearn</h1>
              <p className="text-xs text-muted-foreground">BS Preparation</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {allMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                    tooltip={item.title}
                  >
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3 px-3 py-2"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
                    >
                      <item.icon className="h-5 w-5" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        {!collapsed && profile && (
          <div className="mb-4 p-3 rounded-lg bg-card border border-sidebar-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-sidebar-foreground">{profile.username}</p>
                <p className="text-xs text-muted-foreground">{profile.email}</p>
              </div>
              <NotificationDropdown />
            </div>
            {isAdmin && (
              <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full mt-1 inline-block">
                Admin
              </span>
            )}
          </div>
        )}
        {collapsed && profile && (
          <div className="mb-4 flex justify-center">
            <NotificationDropdown />
          </div>
        )}
        <Button
          variant="outline"
          className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span>Sign Out</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
