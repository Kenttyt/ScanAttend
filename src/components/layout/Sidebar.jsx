import { NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Users, GraduationCap, BookOpen, BarChart3, QrCode, ClipboardList, List, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = {
  admin: [
    { to: '/admin/students', label: 'Students', icon: GraduationCap },
    { to: '/admin/teachers', label: 'Teachers', icon: Users },
    { to: '/admin/advisories', label: 'Advisory', icon: BookOpen },
    { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
  ],
  teacher: [
    { to: '/teacher/scan', label: 'Scan QR', icon: QrCode },
    { to: '/teacher/attendance', label: 'Attendance', icon: ClipboardList },
    { to: '/teacher/advisory-list', label: 'Advisory List', icon: List },
    { to: '/teacher/qr-generator', label: 'QR Generator', icon: QrCode },
  ],
};

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const items = navItems[user?.role] || [];

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          'fixed md:static inset-y-0 left-0 z-50 w-56 border-r bg-gray-50 p-4 flex flex-col transition-transform duration-200 md:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="mb-4 mt-2 md:mt-0 px-3 py-2 bg-primary/10 rounded-md border-b-2 border-primary">
          <h1 className="text-base font-bold text-primary whitespace-nowrap">ScanAttend</h1>
        </div>
        <nav className="space-y-1">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-3 md:py-2 rounded-md text-sm font-medium min-h-[44px] transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto pt-4 border-t">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 w-full transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
