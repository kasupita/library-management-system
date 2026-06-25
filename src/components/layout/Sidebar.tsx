import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useLibrary } from '@/contexts/LibraryContext';
import {
  LayoutDashboard,
  BookOpen,
  FolderTree,
  Gift,
  Users,
  Settings,
  BookCopy,
  FileText,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Books', href: '/books', icon: BookOpen },
  { name: 'Categories', href: '/categories', icon: FolderTree },
  { name: 'Donations', href: '/donations', icon: Gift },
  { name: 'Borrowing', href: '/borrowing', icon: BookCopy, staffOnly: true },
  { name: 'My Library', href: '/my-library', icon: BookCopy, studentOnly: true },
  { name: 'Past Papers', href: '/past-papers', icon: FileText },
  { name: 'Users', href: '/users', icon: Users, adminOnly: true },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const roleColors = {
  admin: 'bg-red-500',
  librarian: 'bg-blue-500',
  hod: 'bg-purple-500',
  student: 'bg-green-500',
};

const roleLabels = {
  admin: 'Administrator',
  librarian: 'Librarian',
  hod: 'Head of Dept',
  student: 'Student',
};

export function Sidebar() {
  const location = useLocation();
  const { currentUser, switchRole, stats, canSwitchRole } = useLibrary();

  const role = currentUser?.role;
  const isStaff = role === 'admin' || role === 'librarian';

  const filteredNavigation = navigation.filter((item) => {
    if (item.adminOnly && role !== 'admin') return false;
    if (item.staffOnly && !isStaff) return false;
    if (item.studentOnly && isStaff) return false;
    return true;
  });

  return (
    <div className="flex h-full w-64 flex-col bg-background border-r border-border">
      {/* Logo */}
      <Link
        to="/dashboard"
        className="flex h-20 items-center px-6 border-b border-border hover:bg-accent/40 transition-colors"
        aria-label="Go to dashboard"
      >
        <img
          src="https://siba.edu.lk/publication/iris.journal/images/SIBALOGO.png"
          alt="LMS"
          className="h-14 w-auto object-contain"
          loading="eager"
          decoding="async"
        />
      </Link>

      {/* Role — admin can switch demo view; others see fixed role */}
      <div className="px-4 py-4 border-b border-border">
        <p className="text-xs text-muted-foreground mb-2">Role</p>
        {canSwitchRole ? (
          <Select value={currentUser?.role || 'admin'} onValueChange={(value) => switchRole(value as any)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">
                <div className="flex items-center gap-2">
                  <div className={cn('w-2 h-2 rounded-full', roleColors.admin)} />
                  Administrator
                </div>
              </SelectItem>
              <SelectItem value="librarian">
                <div className="flex items-center gap-2">
                  <div className={cn('w-2 h-2 rounded-full', roleColors.librarian)} />
                  Librarian
                </div>
              </SelectItem>
              <SelectItem value="hod">
                <div className="flex items-center gap-2">
                  <div className={cn('w-2 h-2 rounded-full', roleColors.hod)} />
                  Head of Dept
                </div>
              </SelectItem>
              <SelectItem value="student">
                <div className="flex items-center gap-2">
                  <div className={cn('w-2 h-2 rounded-full', roleColors.student)} />
                  Student
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
            <div className={cn('w-2 h-2 rounded-full', roleColors[currentUser?.role || 'student'])} />
            <span className="font-medium">{roleLabels[currentUser?.role || 'student']}</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {filteredNavigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
              {item.name === 'Donations' && stats.pendingDonations > 0 && (
                <Badge variant="destructive" className="ml-auto text-xs">
                  {stats.pendingDonations}
                </Badge>
              )}
              {item.name === 'Borrowing' && (stats.pendingBookRequests ?? 0) > 0 && (
                <Badge variant="destructive" className="ml-auto text-xs">
                  {stats.pendingBookRequests}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Info */}
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3">
          <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-white font-medium', roleColors[currentUser?.role || 'admin'])}>
            {currentUser?.name?.charAt(0) || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {currentUser?.name || 'Admin User'}
            </p>
            <p className="text-xs text-muted-foreground">
              {roleLabels[currentUser?.role || 'admin']}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
