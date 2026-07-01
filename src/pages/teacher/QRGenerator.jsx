import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/apiClient';
import { QRCodeCanvas } from 'qrcode.react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

export default function QRGenerator() {
  const { user } = useAuth();
  const [classStudents, setClassStudents] = useState([]);
  const [advisoryName, setAdvisoryName] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const canvasRefs = useRef({});

  useEffect(() => {
    const loadData = async () => {
      try {
        const [clsData, studentsData] = await Promise.all([
          apiClient('/advisories'),
          apiClient('/students'),
        ]);
        const cls = clsData.find(c => c.teacherId === user.teacherId);
        setAdvisoryName(cls?.name || 'No advisory assigned');
        const filtered = studentsData.filter(s => cls && s.classId === cls.id);
        setClassStudents(filtered);
      } catch {}
      setLoading(false);
    };
    loadData();
  }, [user.teacherId]);

  const toggleStudent = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedIds.length === classStudents.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(classStudents.map(s => s.id));
    }
  };

  const allSelected = classStudents.length > 0 && selectedIds.length === classStudents.length;

  const handleDownloadPDF = async () => {
    const students = selectedIds.length > 0
      ? classStudents.filter(s => selectedIds.includes(s.id))
      : classStudents;
    if (!students.length) {
      toast.error('No students selected');
      return;
    }
    setGenerating(true);
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const qrSize = 25;
      const cardWidth = 32;
      const cardHeight = 42;
      const gapX = 4;
      const gapY = 4;
      const cols = 5;
      const startY = 30;
      let currentPageRow = 0;

      const drawHeader = () => {
        doc.setFontSize(14);
        doc.text(advisoryName, margin, 15);
        doc.setFontSize(9);
        doc.setTextColor(120);
        doc.text('Student QR Codes', margin, 21);
        doc.setTextColor(0);
      };

      drawHeader();

      for (let i = 0; i < students.length; i++) {
        const col = i % cols;
        if (i > 0 && col === 0) currentPageRow++;
        const x = margin + col * (cardWidth + gapX);
        const y = startY + currentPageRow * (cardHeight + gapY);

        if (y + cardHeight > pageHeight - margin) {
          doc.addPage();
          currentPageRow = 0;
          drawHeader();
        }

        const currentY = startY + currentPageRow * (cardHeight + gapY);

        const canvas = canvasRefs.current[students[i].id];
        if (canvas) {
          const dataUrl = canvas.toDataURL('image/png');
          doc.addImage(dataUrl, 'PNG', x + (cardWidth - qrSize) / 2, currentY + 2, qrSize, qrSize);
        }

        doc.setFontSize(7);
        doc.setFont(undefined, 'bold');
        const name = students[i].name;
        const truncatedName = name.length > 16 ? name.slice(0, 14) + '…' : name;
        doc.text(truncatedName, x + cardWidth / 2, currentY + 31, { align: 'center' });
        doc.setFont(undefined, 'normal');
        doc.setFontSize(6);
        doc.setTextColor(120);
        doc.text(students[i].id, x + cardWidth / 2, currentY + 36, { align: 'center' });
        doc.setTextColor(0);
      }

      doc.save(`${advisoryName} - QR Codes.pdf`);
      toast.success('PDF downloaded');
    } catch (err) {
      toast.error('Failed to generate PDF');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">QR Code Generator</h2>
        <p className="text-muted-foreground">{advisoryName}</p>
      </div>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Student QR Codes
          </CardTitle>
          <Button onClick={handleDownloadPDF} disabled={!classStudents.length || generating} className="w-full sm:w-auto">
            <Download className="h-4 w-4 mr-2" />
            {generating ? 'Generating...' : selectedIds.length > 0 ? `Download Selected (${selectedIds.length})` : 'Download All'}
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-center py-8">Loading students...</p>
          ) : classStudents.length > 0 ? (
            <>
              <div className="hidden">
                {classStudents.map(s => (
                  <QRCodeCanvas
                    key={s.id}
                    ref={el => { if (el) canvasRefs.current[s.id] = el; }}
                    value={s.id}
                    size={120}
                    level="H"
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 mb-4 pb-3 border-b">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300"
                  checked={allSelected}
                  onChange={toggleAll}
                />
                <span className="text-sm font-medium">
                  Select All ({classStudents.length})
                  {selectedIds.length > 0 && !allSelected && ` — ${selectedIds.length} selected`}
                </span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {classStudents.map(s => (
                  <label
                    key={s.id}
                    className={`flex flex-col items-center cursor-pointer rounded-lg p-2 transition-colors ${
                      selectedIds.includes(s.id) ? 'bg-accent ring-2 ring-primary' : 'hover:bg-accent'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 mb-1"
                      checked={selectedIds.includes(s.id)}
                      onChange={() => toggleStudent(s.id)}
                    />
                    <QRCodeCanvas value={s.id} size={100} level="H" />
                    <p className="font-medium text-xs mt-1 text-center">{s.name}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{s.id}</p>
                  </label>
                ))}
              </div>
            </>
          ) : (
            <p className="text-muted-foreground text-center py-8">No students in this class.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
