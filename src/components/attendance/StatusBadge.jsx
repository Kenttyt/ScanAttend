import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusConfig = {
  present: { label: 'Present', className: 'bg-green-100 text-green-900 hover:bg-green-100' },
  absent: { label: 'Absent', className: 'bg-red-100 text-red-900 hover:bg-red-100' },
  late: { label: 'Late', className: 'bg-amber-100 text-amber-900 hover:bg-amber-100' },
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.absent;
  return (
    <Badge variant="outline" className={cn(config.className, 'border-0')}>
      {config.label}
    </Badge>
  );
}
