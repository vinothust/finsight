import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Upload,
  Settings,
  LogOut,
  Users,
  Building2,
  FolderKanban,
  Briefcase,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_LABELS } from '@/types';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Upload, label: 'Upload Data', path: '/upload' },
    // { icon: BarChart3, label: 'Analytics', path: '/analytics' },
  ];

  const adminItems = [
    { icon: Users, label: 'Users', path: '/users' },
    { icon: Building2, label: 'Clusters', path: '/clusters' },
    { icon: Briefcase, label: 'Accounts', path: '/accounts' },
    { icon: FolderKanban, label: 'Projects', path: '/projects' },
  ];

  const NavItem = ({ icon: Icon, label, path }: { icon: any; label: string; path: string }) => (
    <NavLink
      to={path}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
          'hover:bg-sidebar-accent',
          isActive 
            ? 'bg-sidebar-accent text-sidebar-primary font-medium' 
            : 'text-sidebar-foreground/80'
        )
      }
    >
      <Icon size={20} />
      {!collapsed && <span>{label}</span>}
    </NavLink>
  );

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-sidebar flex flex-col transition-all duration-300 z-50',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-sidebar-border">
        {!collapsed && <Logo variant="light" size="md" />}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="text-sidebar-foreground hover:bg-sidebar-accent ml-auto"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="space-y-1">
          {navItems.map((item) => (
            <NavItem key={item.path} {...item} />
          ))}
        </div>

        {user?.role === 'admin' && (
          <>
            {!collapsed && (
              <div className="pt-4 pb-2">
                <span className="px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
                  Administration
                </span>
              </div>
            )}
            <div className="space-y-1">
              {adminItems.map((item) => (
                <NavItem key={item.path} {...item} />
              ))}
            </div>
          </>
        )}
      </nav>

      {/* User Section */}
      <div className="p-3 border-t border-sidebar-border">
        <div className={cn(
          'flex items-center gap-3 p-2 rounded-lg',
          collapsed ? 'justify-center' : ''
        )}>
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-sm font-medium">
              {user?.name 
                ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
                : (user?.email?.substring(0, 2).toUpperCase() || 'U')}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.name || user?.email}
              </p>
              <p className="text-xs text-sidebar-foreground/60 truncate">
                {user?.role ? ROLE_LABELS[user.role] : ''}
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-2">
          <NavLink
            to="/settings"
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg',
              'text-sidebar-foreground/80 hover:bg-sidebar-accent transition-colors text-sm'
            )}
          >
            <Settings size={18} />
            {!collapsed && <span>Settings</span>}
          </NavLink>
          <Button
            variant="ghost"
            size={collapsed ? 'icon' : 'default'}
            onClick={handleLogout}
            className="text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-destructive"
          >
            <LogOut size={18} />
            {!collapsed && <span className="ml-2">Logout</span>}
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
