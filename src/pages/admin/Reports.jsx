import { useState, useEffect, useRef, useCallback } from 'react';
import { apiClient } from '@/lib/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/attendance/StatusBadge';
import { Users, CheckCircle, XCircle, Clock, Calendar, Filter, FileDown, ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const PAGE_SIZE = 10;

function getPHDate() {
  const now = new Date();
  const phDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
  return `${phDate.getFullYear()}-${String(phDate.getMonth() + 1).padStart(2, '0')}-${String(phDate.getDate()).padStart(2, '0')}`;
}

export default function Reports() {
  const [records, setRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [advisories, setAdvisories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [selectedDate, setSelectedDate] = useState(getPHDate());
  const [selectedAdvisory, setSelectedAdvisory] = useState('');
  const mountedRef = useRef(true);

  const studentMap = Object.fromEntries(students.map(s => [s.id, s]));

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    Promise.all([
      apiClient('/students'),
      apiClient('/advisories'),
    ]).then(([s, a]) => {
      if (mountedRef.current) {
        setStudents(s);
        setAdvisories(a);
      }
    }).catch(() => {});
  }, []);

  const fetchAttendance = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ date: selectedDate });
      if (selectedAdvisory) params.set('classId', selectedAdvisory);
      const data = await apiClient(`/attendance?${params.toString()}`);
      if (mountedRef.current) setRecords(data);
    } catch {
      if (mountedRef.current) setError('Failed to load attendance data. Retrying...');
    } finally {
      if (showLoader && mountedRef.current) setLoading(false);
    }
  }, [selectedDate, selectedAdvisory]);

  // Auto-fetch on filter change — reset to page 1, show loader
  useEffect(() => {
    setPage(1);
    fetchAttendance(true);
  }, [fetchAttendance]);

  // Background refresh every 30 seconds — silent, keep current page
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAttendance(false);
    }, 20000);
    return () => clearInterval(interval);
  }, [fetchAttendance]);

  const totalPages = Math.max(1, Math.ceil(records.length / PAGE_SIZE));
  const paginatedRecords = records.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const start = records.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, records.length);

  const presentCount = records.filter(r => r.status === 'present').length;
  const absentCount = records.filter(r => r.status === 'absent').length;
  const lateCount = records.filter(r => r.status === 'late').length;

  const filteredStudentCount = selectedAdvisory
    ? students.filter(s => s.classId === selectedAdvisory).length
    : students.length;

  const attendanceRate = filteredStudentCount > 0 ? Math.round(((presentCount + lateCount) / filteredStudentCount) * 100) : 0;

  const exportPDF = () => {
    const doc = new jsPDF();
    const title = `Attendance Report - ${selectedDate}`;
    const advisory = advisories.find(a => a.id === selectedAdvisory);
    const filterLabel = advisory ? advisory.name : 'All Advisories';

    doc.setFontSize(16);
    doc.text(title, 14, 20);
    doc.setFontSize(10);
    doc.text(`Advisory: ${filterLabel}`, 14, 28);

    autoTable(doc, {
      startY: 35,
      head: [['Student ID', 'Name', 'Grade', 'Section', 'Status', 'Time']],
      body: records.map(r => {
        const student = studentMap[r.studentId];
        return [r.studentId, student?.name || 'Unknown', student?.advisory?.grade || '-', student?.advisory?.section || '-', r.status, r.timestamp || '-'];
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
        'Grade': student?.advisory?.grade || '-',
        'Section': student?.advisory?.section || '-',
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
            <select className="border rounded-md px-3 py-2 text-sm" value={selectedAdvisory} onChange={e => setSelectedAdvisory(e.target.value)}>
              <option value="">All Advisories</option>
              {advisories.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
        </div>
        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : paginatedRecords.length > 0 ? (
                  paginatedRecords.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono">{r.studentId}</TableCell>
                      <TableCell>{studentMap[r.studentId]?.name || 'Unknown'}</TableCell>
                      <TableCell>{studentMap[r.studentId]?.advisory?.grade || '-'}</TableCell>
                      <TableCell>{studentMap[r.studentId]?.advisory?.section || '-'}</TableCell>
                      <TableCell><StatusBadge status={r.status} /></TableCell>
                      <TableCell>{r.timestamp || '-'}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No attendance records found for this date and advisory.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {records.length > 0 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Showing {start}-{end} of {records.length} record{records.length !== 1 ? 's' : ''}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
