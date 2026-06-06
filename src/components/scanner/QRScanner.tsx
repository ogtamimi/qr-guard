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
// IMAGE HELPERS
// ──────────────────────────────────────────────────────────────

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img');
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve(img);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

// ──────────────────────────────────────────────────────────────
// PRE‑PROCESSING FILTERS (lightweight)
// ──────────────────────────────────────────────────────────────

function applyContrastBrightness(
  imageData: ImageData,
  contrast: number,
  brightness: number,
  threshold?: number
): ImageData {
  const data = new Uint8ClampedArray(imageData.data);
  const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    let val = factor * (gray - 128) + 128 + brightness;
    if (threshold !== undefined) val = val < threshold ? 0 : 255;
    data[i] = data[i + 1] = data[i + 2] = val;
  }
  return new ImageData(data, imageData.width, imageData.height);
}

// ──────────────────────────────────────────────────────────────
// CORE SCANNER (single canvas, no extra image creation)
// ──────────────────────────────────────────────────────────────

async function scanImageWithRotation(img: HTMLImageElement): Promise<string | null> {
  const scales = [1, 0.7]; // two scales – original and a bit smaller
  const maxDim = 1200;
  const angles = [0, 90, 180, 270]; // try all four orientations

  // Pre‑compute target dimensions for each scale
  const scaledDims = scales.map(scaleMult => {
    const scale = Math.min(maxDim / img.width, maxDim / img.height, 1) * scaleMult;
    return {
      width: Math.floor(img.width * scale),
      height: Math.floor(img.height * scale),
      scale,
    };
  });

  // Reusable canvas – we'll reuse it for every attempt
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

  for (const angle of angles) {
    for (const { width, height, scale } of scaledDims) {
      // Set canvas size (swap dimensions for 90/270°)
      const isRotated = angle === 90 || angle === 270;
      canvas.width = isRotated ? height : width;
      canvas.height = isRotated ? width : height;

      // Clear and apply rotation
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(angle * Math.PI / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2, img.width, img.height);
      ctx.restore();

      // Get image data (this is the expensive part, but unavoidable)
      let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Try raw image
      let result = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'attemptBoth',
      });
      if (result?.data) return result.data;

      // Try a few useful filters (only the most effective)
      const filters = [
        (data: ImageData) => applyContrastBrightness(data, 50, 0),           // High contrast
        (data: ImageData) => applyContrastBrightness(data, 100, 0, 128),     // Hard threshold
        (data: ImageData) => applyContrastBrightness(data, 30, 20),          // Brighter
      ];

      for (const applyFilter of filters) {
        const processed = applyFilter(imageData);
        result = jsQR(processed.data, processed.width, processed.height, {
          inversionAttempts: 'attemptBoth',
        });
        if (result?.data) return result.data;
      }
    }
  }
  return null;
}

// ──────────────────────────────────────────────────────────────
// MAIN DECODER (with native API + UI‑friendly yield)
// ──────────────────────────────────────────────────────────────

async function decodeQR(file: File): Promise<string | null> {
  // 1. Native API (fast, may handle rotation)
  try {
    const BarcodeDetectorClass = (window as any).BarcodeDetector;
    if (BarcodeDetectorClass && typeof BarcodeDetectorClass === 'function') {
      const detector = new BarcodeDetectorClass({ formats: ['qr_code'] });
      const bitmap = await createImageBitmap(file);
      const results = await detector.detect(bitmap);
      if (results?.length > 0) return results[0].rawValue;
    }
  } catch (e) {
    console.warn('Native barcode detection failed', e);
  }

  // 2. Load image for jsQR
  const img = await loadImage(file);

  // Give UI a chance to update the loading spinner before heavy work
  await new Promise(resolve => setTimeout(resolve, 0));

  // 3. Run the optimised scanner (one canvas, rotation + scales + filters)
  return await scanImageWithRotation(img);
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
// REACT COMPONENT
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

      setPhase('decoding');

      try {
        const text = await decodeQR(file);

        if (!text) {
          setError({
            type: 'no-qr',
            message: 'No QR code found. Try a clearer photo or better lighting.',
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
      } catch (err) {
        console.error(err);
        setError({ type: 'decode-fail', message: 'Failed to process image' });
        setPhase('idle');
      }
    },
    [onScanSuccess]
  );

  const disabled = isLoading || phase !== 'idle';

  return (
    <div className="w-full space-y-3">
      <div
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-3xl p-10 text-center transition cursor-pointer
          ${disabled ? 'opacity-50' : 'hover:border-indigo-500 bg-gray-50/50'}
          ${error ? 'border-red-200' : 'border-gray-200'}
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
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Camera className="w-5 h-5 text-indigo-300" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-gray-700">Analyzing Image...</p>
              <p className="text-xs text-gray-500">Attempting multiple scanning passes</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="p-4 bg-indigo-50 rounded-2xl group-hover:bg-indigo-100 transition">
              <Camera className="w-8 h-8 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-700">Upload QR Image</p>
              <p className="text-xs text-gray-500 mt-1">Supports blurry or low-light photos</p>
            </div>
          </div>
        )}
      </div>

      {lastResult && !error && (
        <div className="text-xs text-green-700 bg-green-50 p-3 rounded-xl flex items-center gap-2 border border-green-100">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>QR decoded successfully</span>
        </div>
      )}

      {error && (
        <div className="text-xs p-3 rounded-xl bg-red-50 text-red-700 border border-red-100 flex gap-2 animate-in fade-in slide-in-from-top-1">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <div>
            <p className="font-semibold">{error.type === 'no-qr' ? 'Scanning Failed' : 'Error'}</p>
            <p className="opacity-90">{error.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}