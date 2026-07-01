import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/attendance/StatusBadge';
import { Users, CheckCircle, XCircle, Clock, Calendar, Filter, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

function getPHDate() {
  const now = new Date();
  const phDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
  return `${phDate.getFullYear()}-${String(phDate.getMonth() + 1).padStart(2, '0')}-${String(phDate.getDate()).padStart(2, '0')}`;
}

export default function Reports() {
  const [records, setRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const studentMap = Object.fromEntries(students.map(s => [s.id, s]));
  const grades = [...new Set(students.map(s => s.grade))].sort();
  const sections = [...new Set(students.map(s => s.section))].sort();

  const today = getPHDate();
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSection, setSelectedSection] = useState('');

  useEffect(() => {
    apiClient('/students').then(setStudents).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ date: selectedDate });
    if (selectedGrade) params.set('grade', selectedGrade);
    if (selectedSection) params.set('section', selectedSection);
    apiClient(`/attendance?${params.toString()}`)
      .then(setRecords)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedDate, selectedGrade, selectedSection]);

  const presentCount = records.filter(r => r.status === 'present').length;
  const absentCount = records.filter(r => r.status === 'absent').length;
  const lateCount = records.filter(r => r.status === 'late').length;

  const filteredStudentCount = students.filter(s => {
    if (selectedGrade && s.grade !== selectedGrade) return false;
    if (selectedSection && s.section !== selectedSection) return false;
    return true;
  }).length;

  const attendanceRate = filteredStudentCount > 0 ? Math.round(((presentCount + lateCount) / filteredStudentCount) * 100) : 0;

  const exportPDF = () => {
    const doc = new jsPDF();
    const title = `Attendance Report - ${selectedDate}`;
    const filters = [];
    if (selectedGrade) filters.push(`Grade: ${selectedGrade}`);
    if (selectedSection) filters.push(`Section: ${selectedSection}`);

    doc.setFontSize(16);
    doc.text(title, 14, 20);
    if (filters.length) {
      doc.setFontSize(10);
      doc.text(filters.join(' | '), 14, 28);
    }

    autoTable(doc, {
      startY: filters.length ? 35 : 28,
      head: [['Student ID', 'Name', 'Grade', 'Section', 'Status', 'Time']],
      body: records.map(r => {
        const student = studentMap[r.studentId];
        return [r.studentId, student?.name || 'Unknown', student?.grade || '-', student?.section || '-', r.status, r.timestamp || '-'];
      }),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [30, 41, 59] },
    });

    doc.save(`attendance-${selectedDate}.pdf`);
    toast.success('PDF exported successfully');
  };

  const exportExcel = () => {
    const data = records.map(r => {
      const student = studentMap[r.studentId];
      return {
        'Student ID': r.studentId,
        'Name': student?.name || 'Unknown',
        'Grade': student?.grade || '-',
        'Section': student?.section || '-',
        'Status': r.status,
        'Time': r.timestamp || '-',
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
    ws['!cols'] = [{ wch: 12 }, { wch: 20 }, { wch: 8 }, { wch: 10 }, { wch: 10 }, { wch: 10 }];
    XLSX.writeFile(wb, `attendance-${selectedDate}.xlsx`);
    toast.success('Excel exported successfully');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-2xl font-bold">Reports</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportPDF}>
              <FileDown className="h-4 w-4 mr-2" />PDF
            </Button>
            <Button variant="outline" size="sm" onClick={exportExcel}>
              <FileDown className="h-4 w-4 mr-2" />Excel
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-auto" />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select className="border rounded-md px-3 py-2 text-sm" value={selectedGrade} onChange={e => setSelectedGrade(e.target.value)}>
              <option value="">All Grades</option>
              {grades.map(g => <option key={g} value={g}>Grade {g}</option>)}
            </select>
            <select className="border rounded-md px-3 py-2 text-sm" value={selectedSection} onChange={e => setSelectedSection(e.target.value)}>
              <option value="">All Sections</option>
              {sections.map(s => <option key={s} value={s}>Section {s}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent><div className="text-xl sm:text-2xl font-bold">{filteredStudentCount}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Present</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
          </CardHeader>
          <CardContent><div className="text-xl sm:text-2xl font-bold text-green-600">{presentCount}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Late</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500 shrink-0" />
          </CardHeader>
          <CardContent><div className="text-xl sm:text-2xl font-bold text-yellow-600">{lateCount}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Absent</CardTitle>
            <XCircle className="h-4 w-4 text-red-500 shrink-0" />
          </CardHeader>
          <CardContent><div className="text-xl sm:text-2xl font-bold text-red-600">{absentCount}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Attendance Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent><div className="text-xl sm:text-2xl font-bold">{attendanceRate}%</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attendance - {selectedDate}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Loading records...</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map(r => (
                    <TableRow key={r.id}>
                      <TableCell>{studentMap[r.studentId]?.name || r.studentId}</TableCell>
                      <TableCell>{studentMap[r.studentId]?.grade || '-'}</TableCell>
                      <TableCell>{studentMap[r.studentId]?.section || '-'}</TableCell>
                      <TableCell><StatusBadge status={r.status} /></TableCell>
                      <TableCell>{r.timestamp || '-'}</TableCell>
                    </TableRow>
                  ))}
                  {records.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">No attendance records found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
