import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent } from '@/components/ui/card';

export default function QRDisplay({ studentId, studentName }) {
  return (
    <Card className="w-fit mx-auto">
      <CardContent className="flex flex-col items-center gap-2 p-4">
        <QRCodeSVG value={studentId} size={120} level="H" />
        <div className="text-center">
          <p className="font-medium text-sm">{studentName}</p>
          <p className="text-xs text-muted-foreground font-mono">{studentId}</p>
        </div>
      </CardContent>
    </Card>
  );
}
