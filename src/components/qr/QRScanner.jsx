import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Camera, CameraOff, X, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function QRScanner({ onScan, onClose }) {
  const scannerRef = useRef(null);
  const [cameraState, setCameraState] = useState('idle'); // idle | starting | active | error
  const [errorMsg, setErrorMsg] = useState('');
  const [flash, setFlash] = useState(null); // 'success' | 'error' | null
  const lastScanRef = useRef(null);
  const cooldownRef = useRef(false);

  const triggerFlash = useCallback((type) => {
    setFlash(type);
    setTimeout(() => setFlash(null), 1200);
  }, []);

  const startScanner = useCallback(async () => {
    setCameraState('starting');
    setErrorMsg('');

    try {
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minDim = Math.min(viewfinderWidth, viewfinderHeight);
            const size = Math.floor(minDim * 0.7);
            return { width: size, height: size };
          },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          if (cooldownRef.current) return;
          if (decodedText === lastScanRef.current) return;

          cooldownRef.current = true;
          lastScanRef.current = decodedText;
          onScan(decodedText);

          setTimeout(() => {
            cooldownRef.current = false;
            lastScanRef.current = null;
          }, 2000);
        },
        () => {}
      );

      setCameraState('active');
    } catch (err) {
      setCameraState('error');
      if (err.toString().includes('NotAllowedError') || err.toString().includes('Permission')) {
        setErrorMsg('Camera access was denied. Please allow camera access in your browser settings and try again.');
      } else if (err.toString().includes('NotFoundError') || err.toString().includes('DevicesNotFound')) {
        setErrorMsg('No camera found. Please connect a camera and try again.');
      } else if (err.toString().includes('NotReadableError')) {
        setErrorMsg('Camera is in use by another application. Please close other apps using the camera.');
      } else {
        setErrorMsg('Could not start camera. Please check your device and try again.');
      }
    }
  }, [onScan]);

  const stopScanner = useCallback(() => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
      scannerRef.current.clear().catch(() => {});
      scannerRef.current = null;
    }
    setCameraState('idle');
  }, []);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current.clear().catch(() => {});
      }
    };
  }, []);

  // Error state
  if (cameraState === 'error') {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="rounded-full bg-red-50 p-4">
          <CameraOff className="h-10 w-10 text-red-500" />
        </div>
        <div className="text-center space-y-2">
          <p className="font-medium text-red-600">Camera Unavailable</p>
          <p className="text-sm text-muted-foreground max-w-sm">{errorMsg}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={startScanner}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    );
  }

  // Idle state — show start button
  if (cameraState === 'idle') {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="rounded-full bg-gray-100 p-6">
          <Camera className="h-12 w-12 text-gray-400" />
        </div>
        <p className="text-sm text-muted-foreground">Tap to start the camera</p>
        <Button size="lg" onClick={startScanner}>
          <Camera className="h-5 w-5 mr-2" />
          Start Camera
        </Button>
      </div>
    );
  }

  // Starting or active — show camera feed
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Camera viewfinder with overlay */}
      <div className="relative w-full max-w-lg rounded-xl overflow-hidden bg-black">
        {/* Loading state */}
        {cameraState === 'starting' && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
            <div className="flex flex-col items-center gap-3 text-white">
              <RefreshCw className="h-8 w-8 animate-spin" />
              <p className="text-sm">Starting camera...</p>
            </div>
          </div>
        )}

        {/* Scan flash overlay */}
        <div
          className={cn(
            'absolute inset-0 z-20 pointer-events-none transition-opacity duration-300',
            flash === 'success' && 'bg-green-500/30',
            flash === 'error' && 'bg-red-500/30',
            !flash && 'opacity-0'
          )}
        />

        {/* Camera feed */}
        <div id="qr-reader" className="w-full aspect-square" />

        {/* Scan target overlay */}
        {cameraState === 'active' && (
          <div className="absolute inset-0 pointer-events-none z-10">
            {/* Corner brackets */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56">
              {/* Top-left */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
              {/* Top-right */}
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
              {/* Bottom-left */}
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
              {/* Bottom-right */}
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />
              {/* Scan line animation */}
              <div className="absolute top-0 left-2 right-2 h-0.5 bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)] animate-[scanLine_2s_ease-in-out_infinite]" />
            </div>
            {/* Hint text */}
            <div className="absolute bottom-6 left-0 right-0 text-center">
              <span className="bg-black/60 text-white text-xs px-3 py-1.5 rounded-full">
                Align QR code within the frame
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Stop button */}
      <Button variant="outline" size="sm" onClick={() => { stopScanner(); onClose(); }}>
        <X className="h-4 w-4 mr-2" />
        Stop Scanner
      </Button>

      {/* Scan line animation keyframes */}
      <style>{`
        @keyframes scanLine {
          0%, 100% { top: 0; }
          50% { top: calc(100% - 2px); }
        }
      `}</style>
    </div>
  );
}
