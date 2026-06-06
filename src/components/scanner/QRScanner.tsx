import React, { useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';
import {
  Image,
  Loader2,
  ShieldAlert,
  Camera,
  CheckCircle2
} from 'lucide-react';

interface QRScannerProps {
  onScanSuccess: (url: string, type: 'QR_IMAGE' | 'DIRECT_URL') => void;
  isLoading: boolean;
}

type Phase = 'idle' | 'decoding';

interface ErrorState {
  type: 'no-qr' | 'invalid-url' | 'file' | 'decode-fail';
  message: string;
}

// ─────────────────────────────
// OPTIMIZED UTILITIES
// ─────────────────────────────

/**
 * Uses requestAnimationFrame to yield to the UI thread, preventing lag.
 */
const yieldToUI = () => new Promise(resolve => requestAnimationFrame(resolve));

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve(img);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Fast Grayscale + Contrast + Brightness in one pass
 */
function processImageData(
  imageData: ImageData,
  contrast: number,
  brightness: number,
  threshold: number | null = null
): ImageData {
  const data = new Uint8ClampedArray(imageData.data);
  const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    let val = factor * (gray - 128) + 128 + brightness;
    if (threshold !== null) {
      val = val < threshold ? 0 : 255;
    }
    data[i] = data[i + 1] = data[i + 2] = val;
  }
  return new ImageData(data, imageData.width, imageData.height);
}

// ─────────────────────────────
// SMOOTH DECODER ENGINE
// ─────────────────────────────

async function decodeQR(file: File): Promise<string | null> {
  // 1. NATIVE HARDWARE ACCELERATION (Instant)
  try {
    const BarcodeDetectorClass = (window as any).BarcodeDetector;
    if (BarcodeDetectorClass) {
      const detector = new BarcodeDetectorClass({ formats: ['qr_code'] });
      const bitmap = await createImageBitmap(file);
      const results = await detector.detect(bitmap);
      if (results?.length > 0) return results[0].rawValue;
    }
  } catch (e) {}

  const img = await loadImage(file);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  
  // Define scanning parameters
  const rotations = [0, 90, 180, 270];
  const scales = [1, 0.7, 0.5];
  const maxDim = 800; // Optimized size for jsQR speed

  for (const scaleMult of scales) {
    const scale = Math.min(maxDim / img.width, maxDim / img.height, 1) * scaleMult;
    const w = Math.floor(img.width * scale);
    const h = Math.floor(img.height * scale);

    for (const angle of rotations) {
      // Yield to UI thread before each heavy rotation/scan pass
      await yieldToUI();

      // Setup canvas for rotation
      if (angle === 90 || angle === 270) {
        canvas.width = h;
        canvas.height = w;
      } else {
        canvas.width = w;
        canvas.height = h;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((angle * Math.PI) / 180);
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
      ctx.restore();

      const originalData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Try multiple filter passes for this rotation/scale
      const passes = [
        () => originalData,
        () => processImageData(originalData, 50, 0),
        () => processImageData(originalData, 100, 0, 128),
      ];

      for (const getPassData of passes) {
        const data = getPassData();
        const result = jsQR(data.data, data.width, data.height, {
          inversionAttempts: 'attemptBoth',
        });
        if (result?.data) return result.data;
      }
    }
  }

  return null;
}

// ─────────────────────────────
// COMPONENT
// ─────────────────────────────

export default function QRScanner({ onScanSuccess, isLoading }: QRScannerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<ErrorState | null>(null);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError({ type: 'file', message: 'Please upload an image file' });
      return;
    }

    setError(null);
    setLastResult(null);
    
    // Set phase immediately for smooth UI transition
    setPhase('decoding');

    // Use a small timeout to ensure the loading state renders before heavy work begins
    setTimeout(async () => {
      try {
        const text = await decodeQR(file);
        
        if (!text) {
          setError({
            type: 'no-qr',
            message: 'No QR code found. Try a clearer photo or better lighting.'
          });
        } else {
          setLastResult(text);
          onScanSuccess(text, 'QR_IMAGE');
        }
      } catch (err) {
        setError({ type: 'decode-fail', message: 'Failed to process image' });
      } finally {
        setPhase('idle');
      }
    }, 50);
  }, [onScanSuccess]);

  const disabled = isLoading || phase !== 'idle';

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <div
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`group relative border-2 border-dashed rounded-[2rem] p-10 text-center transition-all duration-300
          ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:border-indigo-500 hover:bg-indigo-50/30 cursor-pointer'}
          ${error ? 'border-red-200 bg-red-50/30' : 'border-gray-200'}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = '';
          }}
        />

        {phase === 'decoding' ? (
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="relative">
              <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Camera className="w-5 h-5 text-indigo-300" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-base font-bold text-gray-800">Scanning...</p>
              <p className="text-xs text-gray-500">Processing image layers</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="p-5 bg-indigo-50 rounded-2xl text-indigo-600 group-hover:scale-110 transition-transform duration-300">
              <Camera className="w-10 h-10" />
            </div>
            <div>
              <p className="text-base font-bold text-gray-800">Upload QR Image</p>
              <p className="text-xs text-gray-500 mt-1">Instant decoding for any photo</p>
            </div>
          </div>
        )}
      </div>

      {lastResult && (
        <div className="p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-3 animate-in fade-in zoom-in-95">
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
          <p className="text-sm font-bold text-green-800">QR Decoded Successfully</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-2">
          <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-800">{error.type === 'no-qr' ? 'Scan Failed' : 'Error'}</p>
            <p className="text-xs text-red-700 leading-relaxed mt-0.5">{error.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
