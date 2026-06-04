/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Image, Loader2, ShieldAlert } from 'lucide-react';

interface QRScannerProps {
  onScanSuccess: (url: string, type: 'QR_IMAGE' | 'DIRECT_URL') => void;
  isLoading: boolean;
}

export default function QRScanner({ onScanSuccess, isLoading }: QRScannerProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag & Drop Handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const decodeImageFile = (file: File) => {
    setError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setError('Sorry, failed to initialize binary image processor.');
          return;
        }
        ctx.drawImage(img, 0, 0, img.width, img.height);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code && code.data) {
          onScanSuccess(code.data, 'QR_IMAGE');
        } else {
          setError('No valid QR code found in this image. Please try another high-resolution image.');
        }
      };
      img.onerror = () => {
        setError('Failed to read the uploaded image file.');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError(null);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      decodeImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files[0]) {
      decodeImageFile(e.target.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <div
        id="dropzone-qr"
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileSelect}
        className={`relative border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all ${
          dragActive
            ? 'border-indigo-500 bg-indigo-50/20'
            : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50/50'
        } ${isLoading ? 'pointer-events-none opacity-60' : ''}`}
      >
        <input
          id="qr-file-input"
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={isLoading}
        />

        {isLoading ? (
          <div className="flex flex-col items-center py-6">
            <Loader2 className="h-12 w-12 text-indigo-600 animate-spin mb-4" />
            <h3 className="text-lg font-black text-slate-800 mb-1">Scanning QR code and analyzing link...</h3>
            <p className="text-xs text-slate-500">Tracing redirection channels, querying cyber databases, and evaluating AI...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center py-6">
            <div className="h-16 w-16 bg-slate-100/80 rounded-full flex items-center justify-center mb-4 text-slate-400 group-hover:text-slate-600 transition-colors">
              <Image className="h-8 w-8 text-indigo-600/80" />
            </div>
            <h3 className="text-base font-black text-slate-800 mb-1">Drag & drop your QR image file here</h3>
            <p className="text-xs text-slate-500 mb-4">or click to browse from your device</p>
            <button
              type="button"
              className="inline-flex items-center justify-center px-4 py-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 focus:outline-none"
            >
              Browse Images
            </button>
          </div>
        )}
      </div>

      {/* Error displays */}
      {error && (
        <div className="mt-4 p-4 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-4 text-red-700 animate-fade-in">
          <ShieldAlert className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="text-xs font-bold">Security / Technical Note</h4>
            <p className="text-[11px] text-red-650/90 mt-1 leading-relaxed">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-600 text-xs font-bold"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
