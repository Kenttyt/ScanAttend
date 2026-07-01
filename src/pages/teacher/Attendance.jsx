import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/apiClient';
import { useAttendanceStore } from '@/store/attendanceStore';
import AttendanceTable from '@/components/attendance/AttendanceTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, CalendarDays, BookOpen, ClipboardList } from 'lucide-react';

function getPHDate() {
  const now = new Date();
  const phDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
  return `${phDate.getFullYear()}-${String(phDate.getMonth() + 1).padStart(2, '0')}-${String(phDate.getDate()).padStart(2, '0')}`;
}

export default function Attendance() {
  const { user } = useAuth();
  const records = useAttendanceStore(s => s.records);
  const fetchRecords = useAttendanceStore(s => s.fetchRecords);
  const markPresent = useAttendanceStore(s => s.markPresent);
  const markAbsent = useAttendanceStore(s => s.markAbsent);
  const markLate = useAttendanceStore(s => s.markLate);
  const [students, setStudents] = useState([]);
  const [classId, setClassId] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState(getPHDate());
  const [loading, setLoading] = useState(true);

  const classLabel = `Grade ${user.grade} - Section ${user.section}`;

  useEffect(() => {
    const loadData = async () => {
      try {
        const [clsData, studentsData] = await Promise.all([
          apiClient('/advisories'),
          apiClient('/students'),
        ]);
        const cls = clsData.find(c => c.name === classLabel);
        setClassId(cls?.id || null);
        setStudents(studentsData);
      } catch {}
    };
    loadData();
  }, [classLabel]);

  useEffect(() => {
    if (classId && selectedDate) {
      setLoading(true);
      fetchRecords(classId, selectedDate).finally(() => setLoading(false));
    }
  }, [classId, selectedDate, fetchRecords]);

  const classStudents = students.filter(s => classId && s.classId === classId);
  const dayRecords = records.filter(r => r.date === selectedDate && r.classId === classId);

  const filteredStudents = classStudents.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.id.toLowerCase().includes(search.toLowerCase())
  );

  const filteredRecords = dayRecords.filter(r =>
    filteredStudents.some(s => s.id === r.studentId)
  );

  const presentCount = dayRecords.filter(r => r.status === 'present').length;
  const absentCount = dayRecords.filter(r => r.status === 'absent').length;
  const lateCount = dayRecords.filter(r => r.status === 'late').length;

  const handleToggle = (studentId, status) => {
    const teacherId = user.teacherId;
    if (status === 'present') markPresent(classId, studentId, teacherId);
    else if (status === 'absent') markAbsent(classId, studentId, teacherId);
    else if (status === 'late') markLate(classId, studentId, teacherId);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Attendance</h2>
        <p className="text-muted-foreground">{classLabel}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <input
            type="date"
            value={selectedDate}
            max={getPHDate()}
            onChange={e => setSelectedDate(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          <div className="border rounded-md px-3 py-2 text-sm bg-gray-50 text-gray-700">{classLabel}</div>
        </div>
      </div>

      {dayRecords.length > 0 && (
        <div className="flex gap-4 text-sm">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500" />Present: {presentCount}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />Late: {lateCount}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" />Absent: {absentCount}
          </span>
          <span className="text-muted-foreground">/ {classStudents.length} total</span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Mark Attendance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name or ID..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          {loading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Loading attendance...</p>
          ) : dayRecords.length > 0 ? (
            filteredRecords.length > 0 ? (
              <div className="overflow-x-auto">
                <AttendanceTable records={filteredRecords} students={filteredStudents} onToggle={handleToggle} />
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground text-sm">No students match "{search}"</div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-gray-100 p-4 mb-4">
                <ClipboardList className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-muted-foreground font-medium">No attendance records yet</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                Students will appear here after their first QR scan or manual mark for {selectedDate}.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
