import React, { useRef, useState, useCallback } from 'react';
import { BrowserQRCodeReader } from '@zxing/library';
import jsQR from 'jsqr';
import { Image, Loader2, ShieldAlert, Camera, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface QRScannerProps {
  onScanSuccess: (url: string, type: 'QR_IMAGE' | 'DIRECT_URL') => void;
  isLoading: boolean;
}

interface DecodeResult {
  success: boolean;
  text?: string;
  decoderUsed?: 'ZXing' | 'jsQR';
  processingPass?: string;
  qrDetected?: boolean;
}

// Mobile photos can be 4000×3000 — we downscale aggressively for speed
const MAX_DIM = 1200;

// ─── Canvas helpers ───────────────────────────────────────────────────────────

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img');
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

function createCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('No 2D context');
  return [c, ctx];
}

function computeScaled(w: number, h: number): [number, number] {
  if (w <= MAX_DIM && h <= MAX_DIM) return [w, h];
  const r = Math.min(MAX_DIM / w, MAX_DIM / h);
  return [Math.round(w * r), Math.round(h * r)];
}

function drawFiltered(img: HTMLImageElement, w: number, h: number, filter = 'none'): HTMLCanvasElement {
  const [c, ctx] = createCanvas(w, h);
  ctx.filter = filter;
  ctx.drawImage(img, 0, 0, w, h);
  return c;
}

function getImageData(c: HTMLCanvasElement): ImageData {
  return c.getContext('2d', { willReadFrequently: true })!.getImageData(0, 0, c.width, c.height);
}

function toGray(imageData: ImageData): ImageData {
  const d = new Uint8ClampedArray(imageData.data);
  for (let i = 0; i < d.length; i += 4) {
    const g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    d[i] = d[i + 1] = d[i + 2] = g;
  }
  return new ImageData(d, imageData.width, imageData.height);
}

function binarize(imageData: ImageData, threshold: number): ImageData {
  const d = new Uint8ClampedArray(imageData.data);
  for (let i = 0; i < d.length; i += 4) {
    const g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    const v = g < threshold ? 0 : 255;
    d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255;
  }
  return new ImageData(d, imageData.width, imageData.height);
}

function putData(imageData: ImageData): HTMLCanvasElement {
  const [c, ctx] = createCanvas(imageData.width, imageData.height);
  ctx.putImageData(imageData, 0, 0);
  return c;
}

// ─── jsQR — synchronous, fast ─────────────────────────────────────────────────

function tryJsQR(canvas: HTMLCanvasElement): string | null {
  const id = getImageData(canvas);
  const r = jsQR(id.data, id.width, id.height, { inversionAttempts: 'attemptBoth' });
  return r?.data ?? null;
}

// ─── ZXing — async, slower but more robust ────────────────────────────────────

async function tryZXing(canvas: HTMLCanvasElement): Promise<string | null> {
  const reader = new BrowserQRCodeReader();
  const img = document.createElement('img');
  img.src = canvas.toDataURL('image/png');
  await loadImage(img.src);
  try {
    const r = await reader.decodeFromImageElement(img);
    return r?.getText() ?? null;
  } catch {
    return null;
  }
}

// ─── Build all preprocessing variants from a single source image ─────────────

interface Variant { label: string; canvas: HTMLCanvasElement }

function buildVariants(img: HTMLImageElement, w: number, h: number): Variant[] {
  const original = drawFiltered(img, w, h);
  const grayData = toGray(getImageData(original));

  // Centre-crop (60% of image — QR is often centred in a phone photo)
  const cw = Math.round(w * 0.6), ch = Math.round(h * 0.6);
  const [crop, cropCtx] = createCanvas(cw, ch);
  cropCtx.drawImage(original, Math.round((w - cw) / 2), Math.round((h - ch) / 2), cw, ch, 0, 0, cw, ch);

  // Half-size version (helps when QR is small in a large photo)
  const hw = Math.max(Math.round(w * 0.5), 200), hh = Math.max(Math.round(h * 0.5), 200);
  const half = drawFiltered(img, hw, hh, 'contrast(150%)');

  return [
    { label: 'original',       canvas: original },
    { label: 'grayscale',      canvas: putData(grayData) },
    { label: 'high-contrast',  canvas: drawFiltered(img, w, h, 'contrast(200%) brightness(110%)') },
    { label: 'binarized-128',  canvas: putData(binarize(getImageData(original), 128)) },
    { label: 'binarized-100',  canvas: putData(binarize(getImageData(original), 100)) },
    { label: 'binarized-160',  canvas: putData(binarize(getImageData(original), 160)) },
    { label: 'centre-crop',    canvas: crop },
    { label: 'half-size',      canvas: half },
  ];
}

// ─── Master decode: jsQR sweep first (all variants), then ZXing sweep ─────────
//
// Strategy:
//   1. Run jsQR (sync, ~1–5ms per variant) across ALL 8 variants first.
//      If any hit → done in <50ms total.
//   2. Only if every jsQR attempt fails, run ZXing (async, ~200–800ms each).
//      ZXing is more robust for tough photos but much slower.
//
// This means clean/good photos decode almost instantly.
// Only genuinely hard photos pay the ZXing cost.

async function decodeQRFromImage(dataUrl: string): Promise<DecodeResult> {
  const img = await loadImage(dataUrl);
  const [w, h] = computeScaled(img.naturalWidth, img.naturalHeight);
  const variants = buildVariants(img, w, h);

  // ── Phase 1: jsQR sweep (all variants, sync) ──────────────────────────────
  for (const v of variants) {
    const text = tryJsQR(v.canvas);
    if (text) return { success: true, text, decoderUsed: 'jsQR', processingPass: v.label, qrDetected: true };
  }

  // ── Phase 2: ZXing sweep (all variants, async) ────────────────────────────
  for (const v of variants) {
    const text = await tryZXing(v.canvas);
    if (text) return { success: true, text, decoderUsed: 'ZXing', processingPass: v.label, qrDetected: true };
  }

  return { success: false, qrDetected: false };
}

// ─── URL validation ───────────────────────────────────────────────────────────

function looksLikeUrl(text: string): boolean {
  if (!text || text.length < 3) return false;
  try {
    const u = new URL(/^https?:\/\//i.test(text) ? text : `http://${text}`);
    return u.hostname.includes('.');
  } catch { return false; }
}

// ─── Component ────────────────────────────────────────────────────────────────

type Phase = 'idle' | 'reading' | 'decoding' | 'done';

export default function QRScanner({ onScanSuccess, isLoading }: QRScannerProps) {
  const [dragActive, setDragActive] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<{ type: 'no-qr' | 'invalid-url' | 'decode-fail' | 'file'; message: string } | null>(null);
  const [lastDiag, setLastDiag] = useState<{ pass?: string; decoder?: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setLastDiag(null);

    if (!file.type.startsWith('image/')) {
      setError({ type: 'file', message: 'Please upload a valid image file (JPG, PNG, WEBP, etc.).' });
      return;
    }

    setPhase('reading');

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });

    setPhase('decoding');

    let result: DecodeResult;
    try {
      result = await decodeQRFromImage(dataUrl);
    } catch {
      setPhase('idle');
      setError({ type: 'decode-fail', message: 'Unexpected error processing image. Please try again.' });
      return;
    }

    setPhase('done');

    if (!result.success || !result.text) {
      setPhase('idle');
      setError({
        type: 'no-qr',
        message: "We couldn't detect a readable QR code in this image. Try uploading a clearer photo, increasing lighting, or moving closer to the QR code.",
      });
      return;
    }

    setLastDiag({ pass: result.processingPass, decoder: result.decoderUsed });

    if (!looksLikeUrl(result.text)) {
      setPhase('idle');
      setError({
        type: 'invalid-url',
        message: `QR code detected but doesn't contain a URL. Content: "${result.text.slice(0, 80)}${result.text.length > 80 ? '…' : ''}"`,
      });
      return;
    }

    setPhase('idle');
    onScanSuccess(result.text, 'QR_IMAGE');
  }, [onScanSuccess]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const isProcessing = phase === 'reading' || phase === 'decoding';
  const disabled = isLoading || isProcessing;

  const phaseLabel: Record<Phase, string> = {
    idle: '',
    reading: 'Reading image…',
    decoding: 'Decoding QR code…',
    done: 'Done',
  };

  return (
    <div className="w-full space-y-3">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={[
          'border-2 border-dashed rounded-3xl p-10 text-center transition-all select-none',
          dragActive ? 'border-indigo-500 bg-indigo-50 scale-[1.01]' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50/50',
          disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
        ].join(' ')}
      >
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={disabled} />

        {isProcessing ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
            <p className="text-sm font-bold text-indigo-700">{phaseLabel[phase]}</p>
            <p className="text-xs text-slate-400">Scanning with multiple detection passes…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center justify-center gap-3">
              <Image className="w-9 h-9 text-indigo-500" />
              <Camera className="w-7 h-7 text-slate-400" />
            </div>
            <div>
              <p className="font-bold text-slate-700 text-sm">Upload QR Image</p>
              <p className="text-xs text-slate-400 mt-0.5">Drag & drop or click · PNG, JPG, WEBP, HEIC supported</p>
            </div>
            <div className="flex flex-wrap justify-center gap-1.5 mt-1">
              {['Screenshots', 'Camera photos', 'Printed QR', 'Low-light'].map((tag) => (
                <span key={tag} className="text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded-full">{tag}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {lastDiag && !error && (
        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-xl text-[11px] text-emerald-700 font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
          QR decoded via <strong>{lastDiag.decoder}</strong> · pass: <code className="font-mono">{lastDiag.pass}</code>
        </div>
      )}

      {error && (
        <div className={[
          'p-4 rounded-2xl border flex items-start gap-3 text-xs leading-relaxed',
          error.type === 'no-qr' ? 'bg-amber-50 border-amber-200 text-amber-800'
            : error.type === 'invalid-url' ? 'bg-blue-50 border-blue-200 text-blue-800'
            : 'bg-red-50 border-red-200 text-red-700',
        ].join(' ')}>
          {error.type === 'no-qr'
            ? <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            : <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />}
          <div>
            <p className="font-bold mb-0.5">
              {error.type === 'no-qr' ? 'QR Not Detected' : error.type === 'invalid-url' ? 'QR Detected — Not a URL' : 'Processing Error'}
            </p>
            <p>{error.message}</p>
            {error.type === 'no-qr' && (
              <ul className="mt-2 space-y-0.5 text-[10.5px] text-amber-700 list-disc list-inside">
                <li>Ensure the QR code is fully visible and in focus</li>
                <li>Try a brighter environment or increase screen brightness</li>
                <li>Move closer — QR should fill at least 30% of the image</li>
                <li>A screenshot works best if available</li>
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}