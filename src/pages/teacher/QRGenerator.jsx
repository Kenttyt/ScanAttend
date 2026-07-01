import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/apiClient';
import QRDisplay from '@/components/qr/QRDisplay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer, QrCode } from 'lucide-react';

export default function QRGenerator() {
  const { user } = useAuth();
  const [classStudents, setClassStudents] = useState([]);
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
        const filtered = studentsData.filter(s => cls && s.classId === cls.id);
        setClassStudents(filtered);
      } catch {}
      setLoading(false);
    };
    loadData();
  }, [classLabel]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const qrCards = classStudents.map(s => `
      <div style="display:inline-block;width:150px;margin:8px;text-align:center;border:1px solid #e5e7eb;border-radius:8px;padding:12px;page-break-inside:avoid;">
        <div class="qr-placeholder" data-student-id="${s.id}" style="margin-bottom:6px;"></div>
        <p style="font-weight:600;font-size:12px;margin:2px 0;">${s.name}</p>
        <p style="font-size:10px;color:#6b7280;font-family:monospace;">${s.id}</p>
      </div>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>QR Codes - ${classLabel}</title>
        <script src="https://cdn.jsdelivr.net/npm/qrcode@1/build/qrcode.min.js"><\/script>
        <style>
          body { font-family: system-ui, sans-serif; padding: 20px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <h2 style="margin-bottom:16px;">${classLabel} - Student QR Codes</h2>
        <div style="display:flex;flex-wrap:wrap;gap:4px;">
          ${qrCards}
        </div>
        <script>
          document.querySelectorAll('.qr-placeholder').forEach(el => {
            const id = el.getAttribute('data-student-id');
            const canvas = document.createElement('canvas');
            el.appendChild(canvas);
            QRCode.toCanvas(canvas, id, { width: 100, margin: 1 });
          });
        <\/script>
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">QR Code Generator</h2>
        <p className="text-muted-foreground">{classLabel}</p>
      </div>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Student QR Codes
          </CardTitle>
          <Button onClick={handlePrint} disabled={!classStudents.length} className="w-full sm:w-auto">
            <Printer className="h-4 w-4 mr-2" />
            Print QR Codes
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-center py-8">Loading students...</p>
          ) : classStudents.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {classStudents.map(s => (
                <QRDisplay key={s.id} studentId={s.id} studentName={s.name} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No students in this class.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
