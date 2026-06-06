import React, { useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';
import { BrowserQRCodeReader } from '@zxing/library';
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

// ───────────────────────────────
// Helpers
// ───────────────────────────────

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img');
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function resizeCanvas(img: HTMLImageElement, max = 1200): HTMLCanvasElement {
  const scale = Math.min(max / img.width, max / img.height, 1);

  const canvas = document.createElement('canvas');
  canvas.width = img.width * scale;
  canvas.height = img.height * scale;

  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  return canvas;
}

// ───────────────────────────────
// Decode engine (FAST + RELIABLE)
// ───────────────────────────────

async function decodeQR(dataUrl: string): Promise<string | null> {
  const img = await loadImage(dataUrl);

  const canvas = resizeCanvas(img, 1200);
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // ── 1. FAST PATH (jsQR)
  let result = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: "attemptBoth",
  });

  if (result?.data) return result.data;

  // ── 2. STRONG FALLBACK (ZXing)
  try {
    const reader = new BrowserQRCodeReader();

    const tempImg = document.createElement('img');
    tempImg.src = dataUrl;

    await new Promise((resolve, reject) => {
      tempImg.onload = resolve;
      tempImg.onerror = reject;
    });

    const zxingResult = await reader.decodeFromImageElement(tempImg);
    return zxingResult?.getText() ?? null;
  } catch {
    return null;
  }
}

// ───────────────────────────────
// URL validation
// ───────────────────────────────

function looksLikeUrl(text: string): boolean {
  try {
    const url = new URL(/^https?:\/\//i.test(text) ? text : `http://${text}`);
    return url.hostname.includes('.');
  } catch {
    return false;
  }
}

// ───────────────────────────────
// Component
// ───────────────────────────────

export default function QRScanner({
  onScanSuccess,
  isLoading
}: QRScannerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<Phase>('idle');
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<ErrorState | null>(null);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setLastResult(null);

    if (!file.type.startsWith('image/')) {
      setError({
        type: 'file',
        message: 'Please upload a valid image file.'
      });
      return;
    }

    setPhase('reading');

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    setPhase('decoding');

    let text: string | null = null;

    try {
      text = await decodeQR(dataUrl);
    } catch {
      setError({
        type: 'decode-fail',
        message: 'Failed to decode image.'
      });
      setPhase('idle');
      return;
    }

    if (!text) {
      setError({
        type: 'no-qr',
        message: 'No readable QR code found. Try a clearer image.'
      });
      setPhase('idle');
      return;
    }

    setLastResult(text);

    if (!looksLikeUrl(text)) {
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

  // ───────────────────────────────
  // Drag & drop
  // ───────────────────────────────

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const disabled = isLoading || phase !== 'idle';

  // ───────────────────────────────
  // UI
  // ───────────────────────────────

  return (
    <div className="w-full space-y-3">

      <div
        onClick={() => !disabled && fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-3xl p-10 text-center transition
          ${dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300'}
          ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleChange}
        />

        {phase === 'decoding' ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
            <p className="text-sm font-bold text-indigo-600">
              Decoding QR…
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="flex gap-2">
              <Image className="w-8 h-8 text-indigo-500" />
              <Camera className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-bold">Upload QR Image</p>
            <p className="text-xs text-slate-400">
              Fast + Reliable scan
            </p>
          </div>
        )}
      </div>

      {lastResult && !error && (
        <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 p-2 rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          QR decoded successfully
        </div>
      )}

      {error && (
        <div className="text-xs p-3 rounded-xl border bg-red-50 border-red-200 text-red-700 flex gap-2">
          <ShieldAlert className="w-4 h-4" />
          <div>
            <p className="font-bold mb-1">
              {error.type === 'no-qr' ? 'No QR Found' : 'Error'}
            </p>
            <p>{error.message}</p>
          </div>
        </div>
      )}

    </div>
  );
}