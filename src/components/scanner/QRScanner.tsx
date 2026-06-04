import React, { useRef, useState } from 'react';
import { BrowserQRCodeReader } from '@zxing/browser';
import { Image, Loader2, ShieldAlert } from 'lucide-react';

interface QRScannerProps {
  onScanSuccess: (url: string, type: 'QR_IMAGE' | 'DIRECT_URL') => void;
  isLoading: boolean;
}

export default function QRScanner({ onScanSuccess, isLoading }: QRScannerProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const decodeImageFile = async (file: File) => {
    setError(null);

    try {
      const reader = new FileReader();

      reader.onload = async (event) => {
        const img = new window.Image();

        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            setError('Failed to process image');
            return;
          }

          // Resize for performance (important for mobile photos)
          const MAX_SIZE = 1500;

          let width = img.width;
          let height = img.height;

          if (width > height && width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          } else if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }

          canvas.width = width;
          canvas.height = height;

          ctx.filter = 'contrast(160%) brightness(110%)';
          ctx.drawImage(img, 0, 0, width, height);

          const codeReader = new BrowserQRCodeReader();

          try {
            const result = await codeReader.decodeFromCanvas(canvas);

            if (result?.getText()) {
              onScanSuccess(result.getText(), 'QR_IMAGE');
            } else {
              setError('No QR code detected in image.');
            }
          } catch {
            setError(
              'We could not detect a readable QR code. Try better lighting or a clearer image.'
            );
          }
        };

        img.onerror = () => {
          setError('Failed to load image.');
        };

        img.src = event.target?.result as string;
      };

      reader.readAsDataURL(file);
    } catch (err) {
      setError('Scanning failed unexpectedly.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files?.[0]) {
      decodeImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      decodeImageFile(e.target.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileSelect}
        className={`border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer ${
          dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300'
        } ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {isLoading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="animate-spin w-10 h-10 text-indigo-600" />
            <p className="mt-2 text-sm">Scanning QR...</p>
          </div>
        ) : (
          <div>
            <Image className="mx-auto w-10 h-10 text-indigo-600" />
            <p className="mt-2 font-bold">Upload QR Image</p>
            <p className="text-xs text-gray-500">Drag & drop or click</p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-xl text-xs flex gap-2">
          <ShieldAlert className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  );
}