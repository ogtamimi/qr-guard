import React, { useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';
import * as exifr from 'exifr';
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
// ORIENTATION CORRECTION (fixes camera rotation issues)
// ──────────────────────────────────────────────────────────────
async function getOrientationCorrectedImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = async () => {
      try {
        // Read EXIF orientation
        const exif = await exifr.parse(file, { pick: ['Orientation'] });
        const orientation = exif?.Orientation || 1;

        // If no rotation needed, return original image
        if (orientation === 1) {
          resolve(img);
          return;
        }

        // Create canvas to apply transformation
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;

        let width = img.width;
        let height = img.height;

        // Swap dimensions for rotated orientations
        if (orientation >= 5 && orientation <= 8) {
          [width, height] = [height, width];
        }

        canvas.width = width;
        canvas.height = height;

        // Apply transformation based on orientation
        switch (orientation) {
          case 2: // Flip horizontal
            ctx.transform(-1, 0, 0, 1, width, 0);
            break;
          case 3: // Rotate 180
            ctx.transform(-1, 0, 0, -1, width, height);
            break;
          case 4: // Flip vertical
            ctx.transform(1, 0, 0, -1, 0, height);
            break;
          case 5: // Rotate 90 + flip
            ctx.transform(0, 1, 1, 0, 0, 0);
            break;
          case 6: // Rotate 90
            ctx.transform(0, 1, -1, 0, height, 0);
            break;
          case 7: // Rotate -90 + flip
            ctx.transform(0, -1, -1, 0, height, width);
            break;
          case 8: // Rotate -90
            ctx.transform(0, -1, 1, 0, 0, width);
            break;
          default:
            break;
        }

        ctx.drawImage(img, 0, 0);
        const correctedImg = new Image();
        correctedImg.onload = () => resolve(correctedImg);
        correctedImg.onerror = reject;
        correctedImg.src = canvas.toDataURL();
      } catch {
        // If EXIF reading fails, fall back to original image
        resolve(img);
      }
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

// ──────────────────────────────────────────────────────────────
// MULTI‑SCALE, MULTI‑THRESHOLD DECODER
// ──────────────────────────────────────────────────────────────
async function decodeQR(file: File): Promise<string | null> {
  // ───── 1. NATIVE API (FAST, sometimes orientation‑aware) ─────
  try {
    const BarcodeDetectorClass = (window as any).BarcodeDetector;
    if (BarcodeDetectorClass) {
      const detector = new BarcodeDetectorClass({ formats: ['qr_code'] });
      const bitmap = await createImageBitmap(file);
      const results = await detector.detect(bitmap);
      if (results.length > 0) {
        return results[0].rawValue;
      }
    }
  } catch {
    // Ignore and fall back to jsQR
  }

  // ───── 2. ORIENTATION‑CORRECTED IMAGE ─────
  let img: HTMLImageElement;
  try {
    img = await getOrientationCorrectedImage(file);
  } catch {
    return null;
  }

  // Try multiple scales (higher chance to catch small or huge QR codes)
  const scales = [1, 0.8, 0.6, 0.4, 0.3];
  // Different luminance thresholds for varying lighting conditions
  const thresholds = [135, 110, 160, 180];

  for (const scale of scales) {
    const targetWidth = Math.floor(img.width * scale);
    const targetHeight = Math.floor(img.height * scale);
    if (targetWidth < 50 || targetHeight < 50) continue; // too small

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    let imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);

    // Try raw image first
    let result = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'attemptBoth',
    })?.data;
    if (result) return result;

    // Then try each threshold (binarization)
    for (const thresh of thresholds) {
      const data = new Uint8ClampedArray(imageData.data);
      for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        const value = gray < thresh ? 0 : 255;
        data[i] = data[i + 1] = data[i + 2] = value;
      }
      const processed = new ImageData(data, imageData.width, imageData.height);
      result = jsQR(processed.data, processed.width, processed.height, {
        inversionAttempts: 'attemptBoth',
      })?.data;
      if (result) return result;
    }
  }

  return null;
}

// ──────────────────────────────────────────────────────────────
// URL VALIDATION
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
// MAIN COMPONENT
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
        setError({
          type: 'file',
          message: 'Please upload a valid image file',
        });
        return;
      }

      setPhase('reading');
      setPhase('decoding');

      let text: string | null = null;
      try {
        text = await decodeQR(file);
      } catch (err) {
        console.error(err);
        setError({
          type: 'decode-fail',
          message: 'Failed to decode image',
        });
        setPhase('idle');
        return;
      }

      if (!text) {
        setError({
          type: 'no-qr',
          message: 'No QR code found in this image',
        });
        setPhase('idle');
        return;
      }

      setLastResult(text);

      if (!isUrl(text)) {
        setError({
          type: 'invalid-url',
          message: `QR found but not a URL: "${text.slice(0, 80)}"`,
        });
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
            <p className="text-xs text-gray-400 mt-1">
              Best results with well‑lit, centered QR codes
            </p>
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