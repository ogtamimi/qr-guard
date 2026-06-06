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

type Phase = 'idle' | 'reading' | 'decoding';

interface ErrorState {
  type: 'no-qr' | 'invalid-url' | 'file' | 'decode-fail';
  message: string;
}

// ──────────────────────────────────────────────────────────────
// Safe native BarcodeDetector (silences TypeScript errors)
// ──────────────────────────────────────────────────────────────
async function tryNativeBarcodeDetector(file: File): Promise<string | null> {
  const BarcodeDetectorCtor = (window as any).BarcodeDetector;
  if (!BarcodeDetectorCtor || typeof BarcodeDetectorCtor !== 'function') {
    return null;
  }

  try {
    // @ts-expect-error - BarcodeDetector types not yet in DOM lib
    const detector = new BarcodeDetectorCtor({ formats: ['qr_code'] });
    const bitmap = await createImageBitmap(file);
    const results = await detector.detect(bitmap);
    if (results?.length > 0) {
      return results[0].rawValue;
    }
  } catch (e) {
    console.warn('Native barcode detection failed', e);
  }
  return null;
}

// ──────────────────────────────────────────────────────────────
// Multi‑rotation + adaptive threshold decoder
// ──────────────────────────────────────────────────────────────
async function decodeQR(file: File): Promise<string | null> {
  // 1. Native API
  const nativeResult = await tryNativeBarcodeDetector(file);
  if (nativeResult) return nativeResult;

  // 2. Load image
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = URL.createObjectURL(file);
  });

  const tryDecodeOnCanvas = (canvas: HTMLCanvasElement): string | null => {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Pass 1: raw
    const rawResult = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'attemptBoth',
    });
    if (rawResult?.data) return rawResult.data;

    // Pass 2: adaptive threshold
    let sum = 0;
    const pixels = imageData.data;
    for (let i = 0; i < pixels.length; i += 4) {
      const gray = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
      sum += gray;
    }
    const threshold = sum / (pixels.length / 4);

    const binarized = new Uint8ClampedArray(pixels);
    for (let i = 0; i < binarized.length; i += 4) {
      const gray = 0.299 * binarized[i] + 0.587 * binarized[i + 1] + 0.114 * binarized[i + 2];
      const value = gray < threshold ? 0 : 255;
      binarized[i] = binarized[i + 1] = binarized[i + 2] = value;
    }
    const processed = new ImageData(binarized, imageData.width, imageData.height);
    const procResult = jsQR(processed.data, processed.width, processed.height, {
      inversionAttempts: 'attemptBoth',
    });
    return procResult?.data ?? null;
  };

  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  let ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);

  let result = tryDecodeOnCanvas(canvas);
  if (result) return result;

  for (const angle of [90, 180, 270]) {
    canvas.width = (angle % 180 === 90) ? img.height : img.width;
    canvas.height = (angle % 180 === 90) ? img.width : img.height;
    ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(angle * Math.PI / 180);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    result = tryDecodeOnCanvas(canvas);
    if (result) return result;
  }

  return null;
}

// ──────────────────────────────────────────────────────────────
// URL validation
// ──────────────────────────────────────────────────────────────
function isUrl(text: string): boolean {
  try {
    const url = new URL(/^https?:\/\//i.test(text) ? text : `http://${text}`);
    return url.hostname.includes('.');
  } catch {
    return false;
  }
}

// ──────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────
export default function QRScanner({ onScanSuccess, isLoading }: QRScannerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<ErrorState | null>(null);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setLastResult(null);

      if (!file.type.startsWith('image/')) {
        setError({ type: 'file', message: 'Please upload a valid image file' });
        return;
      }

      setPhase('reading');
      setPhase('decoding');

      let text: string | null = null;
      try {
        text = await decodeQR(file);
      } catch (err) {
        console.error(err);
        setError({ type: 'decode-fail', message: 'Failed to decode image' });
        setPhase('idle');
        return;
      }

      if (!text) {
        setError({ type: 'no-qr', message: 'No QR code found in this image' });
        setPhase('idle');
        return;
      }

      setLastResult(text);

      if (!isUrl(text)) {
        setError({ type: 'invalid-url', message: `QR found but not a URL: "${text.slice(0, 80)}"` });
        setPhase('idle');
        return;
      }

      setPhase('idle');
      onScanSuccess(text, 'QR_IMAGE');
    },
    [onScanSuccess]
  );

  const disabled = isLoading || phase !== 'idle';

  return (
    <div className="w-full space-y-3">
      <div
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-3xl p-10 text-center transition cursor-pointer
          ${disabled ? 'opacity-50' : 'hover:border-indigo-500'}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />

        {phase === 'decoding' ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
            <p className="text-sm font-bold">Scanning QR…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Image className="w-8 h-8 text-indigo-500" />
            <Camera className="w-6 h-6 text-gray-400" />
            <p className="text-sm font-bold">Upload QR Image</p>
            <p className="text-xs text-gray-400 mt-1">Best results with well‑lit, centered QR codes</p>
          </div>
        )}
      </div>

      {lastResult && !error && (
        <div className="text-xs text-green-700 bg-green-50 p-2 rounded-xl flex gap-2">
          <CheckCircle2 className="w-4 h-4" />
          QR decoded successfully
        </div>
      )}

      {error && (
        <div className="text-xs p-3 rounded-xl bg-red-50 text-red-700 border border-red-200 flex gap-2">
          <ShieldAlert className="w-4 h-4" />
          {error.message}
        </div>
      )}
    </div>
  );
}