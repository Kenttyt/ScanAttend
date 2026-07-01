import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/apiClient';
import { useAttendanceStore } from '@/store/attendanceStore';
import QRScanner from '@/components/qr/QRScanner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QrCode, Keyboard, CheckCircle2, AlertTriangle, XCircle, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

function getPHTimestamp() {
  return new Date().toLocaleString('en-US', {
    timeZone: 'Asia/Manila',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).replace(' ', '');
}

export default function Scan() {
  const { user } = useAuth();
  const records = useAttendanceStore(s => s.records);
  const markPresent = useAttendanceStore(s => s.markPresent);
  const [scanning, setScanning] = useState(false);
  const [recentScans, setRecentScans] = useState([]);
  const [showManual, setShowManual] = useState(false);
  const [advisoryName, setAdvisoryName] = useState('');
  const [students, setStudents] = useState([]);
  const [advisoryStudents, setAdvisoryStudents] = useState([]);
  const [classId, setClassId] = useState(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const recentScansTimeoutRef = useRef(null);

  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Manila' });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [clsData, studentsData] = await Promise.all([
          apiClient('/advisories'),
          apiClient('/students'),
        ]);
        const cls = clsData.find(c => c.teacherId === user.teacherId);
        setClassId(cls?.id || null);
        setAdvisoryName(cls?.name || 'No advisory assigned');
        setStudents(studentsData);
        if (cls?.id) {
          setAdvisoryStudents(studentsData.filter(s => s.classId === cls.id));
        }
      } catch {}
    };
    loadData();
  }, [user.teacherId]);

  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return advisoryStudents;
    const q = studentSearch.toLowerCase();
    return advisoryStudents.filter(s =>
      s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)
    );
  }, [advisoryStudents, studentSearch]);

  const toggleStudent = (id) => {
    setSelectedStudentIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedStudentIds.length === filteredStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map(s => s.id));
    }
  };

  const handleMarkSelected = () => {
    selectedStudentIds.forEach(id => processStudent(id));
    setSelectedStudentIds([]);
    setStudentSearch('');
    setShowManual(false);
  };

  const processStudent = useCallback((studentId) => {
    const student = students.find(s => s.id === studentId);
    const time = getPHTimestamp();

    if (!student) {
      setRecentScans(prev => [
        { id: Date.now(), name: studentId, status: 'error', time },
        ...prev.slice(0, 4),
      ]);
      return;
    }

    if (student.classId !== classId) {
      setRecentScans(prev => [
        { id: Date.now(), name: student.name, status: 'wrong_class', time },
        ...prev.slice(0, 4),
      ]);
      return;
    }

    const alreadyToday = records.some(
      r => r.date === today && r.classId === classId && r.studentId === studentId && r.status === 'present'
    );

    markPresent(classId, studentId, user.teacherId);

    if (alreadyToday) {
      setRecentScans(prev => [
        { id: Date.now(), name: student.name, status: 'duplicate', time },
        ...prev.slice(0, 4),
      ]);
    } else {
      setRecentScans(prev => [
        { id: Date.now(), name: student.name, status: 'present', time },
        ...prev.slice(0, 4),
      ]);
    }

    if (recentScansTimeoutRef.current) clearTimeout(recentScansTimeoutRef.current);
    recentScansTimeoutRef.current = setTimeout(() => setRecentScans([]), 5000);
  }, [classId, today, records, markPresent, user.teacherId, students]);

  const handleScan = useCallback((studentId) => {
    processStudent(studentId.trim());
  }, [processStudent]);

  useEffect(() => {
    return () => {
      if (recentScansTimeoutRef.current) clearTimeout(recentScansTimeoutRef.current);
    };
  }, []);

  const statusConfig = {
    present: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
    duplicate: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
    error: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
    wrong_class: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  };

  return (
    <div className="space-y-6">
      {/* Header with class context */}
      <div>
        <h2 className="text-2xl font-bold">Scan Attendance QR</h2>
        <p className="text-muted-foreground">{advisoryName} &mdash; {today}</p>
      </div>

      {/* Recent scans */}
      {recentScans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Recent Scans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentScans.map((scan) => {
                const cfg = statusConfig[scan.status] || statusConfig.error;
                const Icon = cfg.icon;
                return (
                  <div
                    key={scan.id}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all animate-in fade-in slide-in-from-left-2 duration-200',
                      cfg.bg, cfg.border
                    )}
                  >
                    <Icon className={cn('h-4 w-4 shrink-0', cfg.color)} />
                    <span className="flex-1 font-medium text-sm truncate">{scan.name}</span>
                    <span className={cn('text-xs', cfg.color)}>
                      {scan.status === 'present' && 'Present'}
                      {scan.status === 'duplicate' && 'Already checked in'}
                      {scan.status === 'error' && 'Not recognized'}
                      {scan.status === 'wrong_class' && 'Wrong class'}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">{scan.time}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scanner card */}
      <Card>
        <CardContent className="pt-6">
          {scanning ? (
            <QRScanner onScan={handleScan} onClose={() => setScanning(false)} />
          ) : (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="rounded-full bg-gray-100 p-6">
                <QrCode className="h-12 w-12 text-gray-400" />
              </div>
              <div className="text-center">
                <p className="font-medium">Ready to scan</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Point the camera at a student's QR code
                </p>
              </div>
              <Button size="lg" className="w-full sm:w-auto" onClick={() => setScanning(true)}>
                <QrCode className="h-5 w-5 mr-2" />
                Start Scanning
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual entry */}
      {!showManual ? (
        <button
          onClick={() => setShowManual(true)}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-lg border border-dashed text-sm text-muted-foreground hover:text-foreground hover:border-gray-300 transition-colors"
        >
          <Keyboard className="h-4 w-4" />
          Enter Student ID manually
        </button>
      ) : (
        <Card>
          <CardContent className="pt-6 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search student by name or ID..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>
            <div className="max-h-64 overflow-y-auto border rounded-md">
              {filteredStudents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  {advisoryStudents.length === 0
                    ? 'No students in this advisory'
                    : 'No students match your search'}
                </p>
              ) : (
                <>
                  <label className="flex items-center gap-2 px-3 py-2 text-sm font-medium cursor-pointer hover:bg-accent border-b">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300"
                      checked={selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0}
                      onChange={toggleAll}
                    />
                    Select All ({filteredStudents.length})
                  </label>
                  {filteredStudents.map(s => (
                    <label
                      key={s.id}
                      className={`flex items-center gap-3 w-full px-3 py-2 text-left hover:bg-accent text-sm cursor-pointer ${
                        selectedStudentIds.includes(s.id) ? 'bg-accent' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300"
                        checked={selectedStudentIds.includes(s.id)}
                        onChange={() => toggleStudent(s.id)}
                      />
                      <span className="font-mono text-xs text-muted-foreground">{s.id}</span>
                      <span className="flex-1">{s.name}</span>
                      <span className="text-xs text-muted-foreground">{s.parentPhone}</span>
                    </label>
                  ))}
                </>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1"
                disabled={selectedStudentIds.length === 0}
                onClick={handleMarkSelected}
              >
                Mark Present {selectedStudentIds.length > 0 && `(${selectedStudentIds.length})`}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setShowManual(false); setStudentSearch(''); setSelectedStudentIds([]); }}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
