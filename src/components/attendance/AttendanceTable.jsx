import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import StatusBadge from './StatusBadge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AttendanceTable({ records, students, onToggle }) {
  const studentMap = Object.fromEntries(students.map(s => [s.id, s]));

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Student ID</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Time</TableHead>
          <TableHead className="text-right w-24">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {records.map(record => {
          const student = studentMap[record.studentId];
          const isAbsent = record.status === 'absent';
          return (
            <TableRow
              key={record.id}
              className={cn(
                'group transition-colors',
                isAbsent && 'bg-gray-50/80 text-gray-400'
              )}
            >
              <TableCell className="font-mono">{record.studentId}</TableCell>
              <TableCell className={cn(isAbsent && 'text-gray-400')}>
                {student?.name || 'Unknown'}
              </TableCell>
              <TableCell><StatusBadge status={record.status} /></TableCell>
              <TableCell className={cn(isAbsent && 'text-gray-300')}>
                {record.timestamp || '—'}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onToggle(record.studentId, 'present')}>
                        <span className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                        Present
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onToggle(record.studentId, 'late')}>
                        <span className="w-2 h-2 rounded-full bg-yellow-500 mr-2" />
                        Late
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onToggle(record.studentId, 'absent')}>
                        <span className="w-2 h-2 rounded-full bg-red-500 mr-2" />
                        Absent
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
