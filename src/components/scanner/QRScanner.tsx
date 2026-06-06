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

// ─────────────────────────────
// IMAGE LOADER
// ─────────────────────────────

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img');
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

// ─────────────────────────────
// RESIZE (important for speed + stability)
// ─────────────────────────────

function resizeCanvas(img: HTMLImageElement, max = 1300): HTMLCanvasElement {
  const scale = Math.min(max / img.width, max / img.height, 1);

  const canvas = document.createElement('canvas');
  canvas.width = img.width * scale;
  canvas.height = img.height * scale;

  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  return canvas;
}

// ─────────────────────────────
// JSQR DECODER
// ─────────────────────────────

function decodeWithJsQR(imageData: ImageData) {
  return jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: "attemptBoth",
  })?.data ?? null;
}

// ─────────────────────────────
// MAIN DECODER (REAL-WORLD BALANCED)
// ─────────────────────────────

async function decodeQR(file: File): Promise<string | null> {

  // ───── 1. NATIVE API (FASTEST) ─────
  try {
    const BarcodeDetectorClass = (window as any).BarcodeDetector;

    if (BarcodeDetectorClass) {
      const detector = new BarcodeDetectorClass({
        formats: ['qr_code'],
      });

      const bitmap = await createImageBitmap(file);
      const result = await detector.detect(bitmap);

      if (result?.length > 0) {
        return result[0].rawValue;
      }
    }
  } catch {
    // ignore fallback
  }

  // ───── 2. JSQR FALLBACK ─────
  const img = await loadImage(file);
  const canvas = resizeCanvas(img, 1300);

  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // PASS 1 — normal
  let result = decodeWithJsQR(imageData);
  if (result) return result;

  // PASS 2 — improved contrast (ONLY ONE extra pass)
  const data = new Uint8ClampedArray(imageData.data);

  for (let i = 0; i < data.length; i += 4) {
    const gray =
      0.299 * data[i] +
      0.587 * data[i + 1] +
      0.114 * data[i + 2];

    const value = gray < 135 ? 0 : 255;

    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
  }

  const processed = new ImageData(data, imageData.width, imageData.height);

  result = decodeWithJsQR(processed);

  return result;
}

// ─────────────────────────────
// URL CHECK
// ─────────────────────────────

function isUrl(text: string): boolean {
  try {
    const url = new URL(/^https?:\/\//i.test(text) ? text : `http://${text}`);
    return url.hostname.includes('.');
  } catch {
    return false;
  }
}

// ─────────────────────────────
// COMPONENT
// ─────────────────────────────

export default function QRScanner({
  onScanSuccess,
  isLoading
}: QRScannerProps) {

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<ErrorState | null>(null);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setLastResult(null);

    if (!file.type.startsWith('image/')) {
      setError({
        type: 'file',
        message: 'Please upload a valid image file'
      });
      return;
    }

    setPhase('reading');
    setPhase('decoding');

    let text: string | null = null;

    try {
      text = await decodeQR(file);
    } catch {
      setError({
        type: 'decode-fail',
        message: 'Failed to decode image'
      });
      setPhase('idle');
      return;
    }

    if (!text) {
      setError({
        type: 'no-qr',
        message: 'No QR code found in this image'
      });
      setPhase('idle');
      return;
    }

    setLastResult(text);

    if (!isUrl(text)) {
      setError({
        type: 'invalid-url',
        message: `QR found but not a URL: "${text.slice(0, 80)}"`
      });
      setPhase('idle');
      return;
    }

    setPhase('idle');
    onScanSuccess(text, 'QR_IMAGE');

  }, [onScanSuccess]);

  const disabled = isLoading || phase !== 'idle';

  return (
    <div className="w-full space-y-3">

      <div
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-3xl p-10 text-center transition cursor-pointer
          ${disabled ? 'opacity-50' : 'hover:border-indigo-500'}
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