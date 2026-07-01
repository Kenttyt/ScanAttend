import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/apiClient';
import { useAttendanceStore } from '@/store/attendanceStore';
import QRScanner from '@/components/qr/QRScanner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QrCode, Keyboard, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

function getPHTimestamp() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).formatToParts(now);
  return parts.map(p => p.value).join('');
}

export default function Scan() {
  const { user } = useAuth();
  const records = useAttendanceStore(s => s.records);
  const markPresent = useAttendanceStore(s => s.markPresent);
  const [scanning, setScanning] = useState(false);
  const [recentScans, setRecentScans] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [manualId, setManualId] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [students, setStudents] = useState([]);
  const [classId, setClassId] = useState(null);
  const feedbackTimeoutRef = useRef(null);

  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Manila' });
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

  const processStudent = useCallback((studentId) => {
    const student = students.find(s => s.id === studentId);
    const time = getPHTimestamp();

    if (!student) {
      setFeedback({ type: 'error', message: `QR not recognized`, detail: `"${studentId}" is not a valid student ID` });
      setRecentScans(prev => [
        { id: Date.now(), name: studentId, status: 'error', time },
        ...prev.slice(0, 4),
      ]);
      return;
    }

    if (student.classId !== classId) {
      setFeedback({ type: 'error', message: 'Wrong class', detail: `${student.name} is not in this section` });
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
      setFeedback({ type: 'duplicate', message: 'Already checked in', detail: `${student.name} was already marked present` });
      setRecentScans(prev => [
        { id: Date.now(), name: student.name, status: 'duplicate', time },
        ...prev.slice(0, 4),
      ]);
    } else {
      setFeedback({ type: 'success', message: 'Present', detail: student.name });
      setRecentScans(prev => [
        { id: Date.now(), name: student.name, status: 'present', time },
        ...prev.slice(0, 4),
      ]);
    }

    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    feedbackTimeoutRef.current = setTimeout(() => setFeedback(null), 3000);
  }, [classId, today, records, markPresent, user.teacherId, students]);

  const handleScan = useCallback((studentId) => {
    processStudent(studentId.trim());
  }, [processStudent]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualId.trim()) {
      processStudent(manualId.trim());
      setManualId('');
    }
  };

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
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
        <p className="text-muted-foreground">{classLabel} &mdash; {today}</p>
      </div>

      {/* Scan feedback banner */}
      {feedback && (
        <div
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-lg border transition-all animate-in fade-in slide-in-from-top-2 duration-300',
            feedback.type === 'success' && 'bg-green-50 border-green-200',
            feedback.type === 'duplicate' && 'bg-amber-50 border-amber-200',
            (feedback.type === 'error' || feedback.type === 'wrong_class') && 'bg-red-50 border-red-200',
          )}
        >
          {feedback.type === 'success' && <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />}
          {feedback.type === 'duplicate' && <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />}
          {(feedback.type === 'error' || feedback.type === 'wrong_class') && <XCircle className="h-5 w-5 text-red-600 shrink-0" />}
          <div className="flex-1 min-w-0">
            <div className={cn('font-semibold', statusConfig[feedback.type]?.color)}>
              {feedback.detail}
            </div>
            <div className="text-sm text-muted-foreground">{feedback.message}</div>
          </div>
          <span className="text-xs text-muted-foreground shrink-0">{getPHTimestamp()}</span>
        </div>
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
          <CardContent className="pt-6">
            <form onSubmit={handleManualSubmit} className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="e.g. S001"
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                className="flex-1"
                autoFocus
              />
              <div className="flex gap-2">
                <Button type="submit" size="sm" className="flex-1 sm:flex-none">
                  Mark Present
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => { setShowManual(false); setManualId(''); }}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

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
    </div>
  );
}
