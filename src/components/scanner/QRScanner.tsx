import React, { useRef, useState, useCallback } from 'react';
import { BrowserQRCodeReader } from '@zxing/library';
import jsQR from 'jsqr';
import { Image, Loader2, ShieldAlert, Camera, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface QRScannerProps {
  onScanSuccess: (url: string, type: 'QR_IMAGE' | 'DIRECT_URL') => void;
  isLoading: boolean;
}

// ─── Diagnostics object returned after each decode attempt ───────────────────
interface DecodeResult {
  success: boolean;
  text?: string;
  decoderUsed?: 'ZXing' | 'jsQR';
  processingPass?: string;
  qrDetected?: boolean;
}

// ─── Max dimension before downscaling ────────────────────────────────────────
const MAX_DIM = 1500;

// ─── Canvas helpers ───────────────────────────────────────────────────────────

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img');
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

function createCanvas(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Failed to get 2D context');
  return [canvas, ctx];
}

/** Resize image so its longest side ≤ MAX_DIM, preserving aspect ratio */
function computeScaledDimensions(w: number, h: number): [number, number] {
  if (w <= MAX_DIM && h <= MAX_DIM) return [w, h];
  const ratio = Math.min(MAX_DIM / w, MAX_DIM / h);
  return [Math.round(w * ratio), Math.round(h * ratio)];
}

/** Draw image onto a canvas at the given dimensions, applying CSS filter */
function drawToCanvas(
  img: HTMLImageElement,
  width: number,
  height: number,
  filter: string = 'none'
): HTMLCanvasElement {
  const [canvas, ctx] = createCanvas(width, height);
  ctx.filter = filter;
  ctx.drawImage(img, 0, 0, width, height);
  return canvas;
}

/** Convert an ImageData to grayscale by averaging RGB channels */
function toGrayscaleImageData(imageData: ImageData): ImageData {
  const data = new Uint8ClampedArray(imageData.data);
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    data[i] = data[i + 1] = data[i + 2] = gray;
  }
  return new ImageData(data, imageData.width, imageData.height);
}

/** Apply adaptive thresholding (binarization) to make QR patterns pop */
function binarizeImageData(imageData: ImageData, threshold = 128): ImageData {
  const data = new Uint8ClampedArray(imageData.data);
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    const val = gray < threshold ? 0 : 255;
    data[i] = data[i + 1] = data[i + 2] = val;
    data[i + 3] = 255;
  }
  return new ImageData(data, imageData.width, imageData.height);
}

/** Paint an ImageData onto a new canvas and return it */
function imageDataToCanvas(imageData: ImageData): HTMLCanvasElement {
  const [canvas, ctx] = createCanvas(imageData.width, imageData.height);
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/** Get ImageData from a canvas */
function getImageData(canvas: HTMLCanvasElement): ImageData {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

// ─── ZXing decoder (wraps BrowserQRCodeReader) ───────────────────────────────

async function decodeWithZXing(canvas: HTMLCanvasElement): Promise<string | null> {
  const reader = new BrowserQRCodeReader();
  const img = document.createElement('img');
  img.src = canvas.toDataURL('image/png');
  await loadImage(img.src);
  try {
    const result = await reader.decodeFromImageElement(img);
    return result?.getText() ?? null;
  } catch {
    return null;
  }
}

// ─── jsQR decoder ────────────────────────────────────────────────────────────

function decodeWithJsQR(canvas: HTMLCanvasElement): string | null {
  const imageData = getImageData(canvas);
  const result = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: 'attemptBoth',
  });
  return result?.data ?? null;
}

// ─── Multi-pass preprocessing pipeline ───────────────────────────────────────

interface PreprocessedVariant {
  label: string;
  canvas: HTMLCanvasElement;
}

function buildVariants(
  img: HTMLImageElement,
  scaledW: number,
  scaledH: number
): PreprocessedVariant[] {
  const variants: PreprocessedVariant[] = [];

  // Pass 1 – Original (scaled if needed)
  const original = drawToCanvas(img, scaledW, scaledH);
  variants.push({ label: 'original', canvas: original });

  // Pass 2 – Grayscale
  const grayData = toGrayscaleImageData(getImageData(original));
  const grayCanvas = imageDataToCanvas(grayData);
  variants.push({ label: 'grayscale', canvas: grayCanvas });

  // Pass 3 – High contrast (filter applied at draw time)
  const contrast = drawToCanvas(img, scaledW, scaledH, 'contrast(180%) brightness(110%)');
  variants.push({ label: 'high-contrast', canvas: contrast });

  // Pass 4 – Grayscale + binarized (threshold 100)
  const bin100 = binarizeImageData(toGrayscaleImageData(getImageData(original)), 100);
  variants.push({ label: 'binarized-100', canvas: imageDataToCanvas(bin100) });

  // Pass 5 – Grayscale + binarized (threshold 160)
  const bin160 = binarizeImageData(toGrayscaleImageData(getImageData(original)), 160);
  variants.push({ label: 'binarized-160', canvas: imageDataToCanvas(bin160) });

  // Pass 6 – Sharpened
  const sharp = drawToCanvas(img, scaledW, scaledH, 'contrast(140%) brightness(105%) saturate(0%)');
  variants.push({ label: 'sharpened', canvas: sharp });

  // Pass 7 – Small (50% of scaled) – helps when QR is tiny
  const halfW = Math.max(Math.round(scaledW * 0.5), 200);
  const halfH = Math.max(Math.round(scaledH * 0.5), 200);
  const small = drawToCanvas(img, halfW, halfH, 'contrast(160%)');
  variants.push({ label: 'half-size', canvas: small });

  // Pass 8 – Centre crop (middle 60% of both axes) – QR often centred in a photo
  const cropW = Math.round(scaledW * 0.6);
  const cropH = Math.round(scaledH * 0.6);
  const [cropCanvas, cropCtx] = createCanvas(cropW, cropH);
  cropCtx.filter = 'contrast(160%) brightness(108%)';
  cropCtx.drawImage(
    original,
    Math.round((scaledW - cropW) / 2),
    Math.round((scaledH - cropH) / 2),
    cropW,
    cropH,
    0,
    0,
    cropW,
    cropH
  );
  variants.push({ label: 'centre-crop', canvas: cropCanvas });

  return variants;
}

// ─── Master decode function ───────────────────────────────────────────────────

async function decodeQRFromImage(dataUrl: string): Promise<DecodeResult> {
  const img = await loadImage(dataUrl);
  const [scaledW, scaledH] = computeScaledDimensions(img.naturalWidth, img.naturalHeight);

  const variants = buildVariants(img, scaledW, scaledH);

  // Try each variant with ZXing first, then jsQR
  for (const variant of variants) {
    // ZXing attempt
    const zxingText = await decodeWithZXing(variant.canvas);
    if (zxingText) {
      return {
        success: true,
        text: zxingText,
        decoderUsed: 'ZXing',
        processingPass: variant.label,
        qrDetected: true,
      };
    }

    // jsQR fallback
    const jsqrText = decodeWithJsQR(variant.canvas);
    if (jsqrText) {
      return {
        success: true,
        text: jsqrText,
        decoderUsed: 'jsQR',
        processingPass: variant.label,
        qrDetected: true,
      };
    }
  }

  return { success: false, qrDetected: false };
}

// ─── Validate decoded text is a URL ──────────────────────────────────────────

function looksLikeUrl(text: string): boolean {
  if (!text || text.length < 3) return false;
  try {
    const withScheme = /^https?:\/\//i.test(text) ? text : `http://${text}`;
    const url = new URL(withScheme);
    return url.hostname.includes('.');
  } catch {
    return false;
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

type ScanPhase =
  | 'idle'
  | 'reading'
  | 'preprocessing'
  | 'decoding'
  | 'done';

export default function QRScanner({ onScanSuccess, isLoading }: QRScannerProps) {
  const [dragActive, setDragActive] = useState(false);
  const [phase, setPhase] = useState<ScanPhase>('idle');
  const [error, setError] = useState<{ type: 'no-qr' | 'invalid-url' | 'decode-fail' | 'file'; message: string } | null>(null);
  const [lastDiag, setLastDiag] = useState<{ pass?: string; decoder?: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setLastDiag(null);

      if (!file.type.startsWith('image/')) {
        setError({ type: 'file', message: 'Please upload a valid image file (JPG, PNG, WEBP, etc.).' });
        return;
      }

      setPhase('reading');

      // Read file as data URL
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });

      setPhase('preprocessing');
      // Small delay to let the UI update
      await new Promise((r) => setTimeout(r, 20));

      setPhase('decoding');

      let result: DecodeResult;
      try {
        result = await decodeQRFromImage(dataUrl);
      } catch (err) {
        setPhase('idle');
        setError({
          type: 'decode-fail',
          message: 'An unexpected error occurred while processing the image. Please try again.',
        });
        return;
      }

      setPhase('done');

      if (!result.success || !result.text) {
        setPhase('idle');
        setError({
          type: 'no-qr',
          message:
            "We couldn't detect a readable QR code in this image. Try uploading a clearer photo, increasing lighting, or moving closer to the QR code.",
        });
        return;
      }

      setLastDiag({ pass: result.processingPass, decoder: result.decoderUsed });

      if (!looksLikeUrl(result.text)) {
        setPhase('idle');
        setError({
          type: 'invalid-url',
          message: `QR code detected but it doesn't contain a valid URL. Decoded content: "${result.text.slice(0, 80)}${result.text.length > 80 ? '…' : ''}"`,
        });
        return;
      }

      setPhase('idle');
      onScanSuccess(result.text, 'QR_IMAGE');
    },
    [onScanSuccess]
  );

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input so same file can be re-uploaded
    e.target.value = '';
  };

  const isProcessing = phase !== 'idle' && phase !== 'done';
  const disabled = isLoading || isProcessing;

  const phaseLabel: Record<ScanPhase, string> = {
    idle: '',
    reading: 'Reading image…',
    preprocessing: 'Preprocessing image (8 passes)…',
    decoding: 'Decoding QR code (ZXing + jsQR)…',
    done: 'Done',
  };

  return (
    <div className="w-full space-y-3">
      {/* Drop zone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={[
          'border-2 border-dashed rounded-3xl p-10 text-center transition-all select-none',
          dragActive
            ? 'border-indigo-500 bg-indigo-50 scale-[1.01]'
            : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50/50',
          disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
        ].join(' ')}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={disabled}
        />

        {isProcessing ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
            <p className="text-sm font-bold text-indigo-700">{phaseLabel[phase]}</p>
            <p className="text-xs text-slate-400">
              Trying multiple preprocessing passes for best accuracy…
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center justify-center gap-3">
              <Image className="w-9 h-9 text-indigo-500" />
              <Camera className="w-7 h-7 text-slate-400" />
            </div>
            <div>
              <p className="font-bold text-slate-700 text-sm">Upload QR Image</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Drag &amp; drop or click · PNG, JPG, WEBP, HEIC supported
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-1.5 mt-1">
              {['Screenshots', 'Camera photos', 'Printed QR', 'Low-light'].map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Success diagnostics (lightweight, dev-friendly) */}
      {lastDiag && !error && (
        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-xl text-[11px] text-emerald-700 font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
          QR decoded via <strong>{lastDiag.decoder}</strong> · pass: <code className="font-mono">{lastDiag.pass}</code>
        </div>
      )}

      {/* Error states */}
      {error && (
        <div
          className={[
            'p-4 rounded-2xl border flex items-start gap-3 text-xs leading-relaxed',
            error.type === 'no-qr'
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : error.type === 'invalid-url'
              ? 'bg-blue-50 border-blue-200 text-blue-800'
              : 'bg-red-50 border-red-200 text-red-700',
          ].join(' ')}
        >
          {error.type === 'no-qr' ? (
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          ) : (
            <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <p className="font-bold mb-0.5">
              {error.type === 'no-qr'
                ? 'QR Not Detected'
                : error.type === 'invalid-url'
                ? 'QR Detected — Not a URL'
                : 'Processing Error'}
            </p>
            <p>{error.message}</p>
            {error.type === 'no-qr' && (
              <ul className="mt-2 space-y-0.5 text-[10.5px] text-amber-700 list-disc list-inside">
                <li>Ensure the QR code is fully visible and in focus</li>
                <li>Try a brighter environment or increase screen brightness</li>
                <li>Move closer — the QR should fill at least 30% of the image</li>
                <li>A screenshot or screen capture works best</li>
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}