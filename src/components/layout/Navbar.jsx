import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Menu } from 'lucide-react';

export default function Navbar({ onToggleSidebar }) {
  const { user } = useAuth();

  const initials = user?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || '?';

  const roleColors = {
    admin: 'bg-red-100 text-red-800',
    teacher: 'bg-blue-100 text-blue-800',
  };

  return (
    <header className="h-14 md:h-16 border-b bg-white flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onToggleSidebar}>
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8 md:h-9 md:w-9">
            <AvatarFallback className="text-xs md:text-sm">{initials}</AvatarFallback>
          </Avatar>
          <div className="text-sm">
            <div className="font-medium">{user?.name}</div>
            <Badge variant="secondary" className={roleColors[user?.role]}>
              {user?.role}
            </Badge>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 md:gap-4">
      </div>
    </header>
  );
}
