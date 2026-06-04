import React, { useRef, useState } from 'react';
import { BrowserQRCodeReader } from '@zxing/library';
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
    } else {
      setDragActive(false);
    }
  };

  const decodeImageFile = (file: File) => {
    setError(null);

    const reader = new FileReader();

    reader.onload = (event) => {
      const imageDataUrl = event.target?.result as string;

      // Create safe image element (TS-friendly)
      const imageElement = document.createElement('img');

      imageElement.onload = async () => {
        try {
          // =========================
          // 1. Resize using canvas
          // =========================
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            setError('Failed to initialize image processor.');
            return;
          }

          const img = imageElement;

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

          // =========================
          // 2. Enhance image quality
          // =========================
          ctx.filter = 'contrast(160%) brightness(110%)';
          ctx.drawImage(img, 0, 0, width, height);

          const processedDataUrl = canvas.toDataURL('image/png');

          // =========================
          // 3. ZXing decode
          // =========================
          const codeReader = new BrowserQRCodeReader();

          const finalImage = document.createElement('img');
          finalImage.src = processedDataUrl;

          finalImage.onload = async () => {
            try {
              const result = await codeReader.decodeFromImageElement(finalImage);

              if (result?.getText()) {
                onScanSuccess(result.getText(), 'QR_IMAGE');
              } else {
                throw new Error('No QR found');
              }
            } catch {
              // =========================
              // 4. Fallback attempt
              // =========================
              try {
                const fallbackResult =
                  await codeReader.decodeFromImageElement(finalImage);

                if (fallbackResult?.getText()) {
                  onScanSuccess(fallbackResult.getText(), 'QR_IMAGE');
                } else {
                  setError('No QR code detected in this image.');
                }
              } catch {
                setError(
                  'We could not detect a readable QR code. Try a clearer image, better lighting, or move closer to the QR code.'
                );
              }
            }
          };

          finalImage.onerror = () => {
            setError('Failed to process image.');
          };
        } catch {
          setError('Unexpected error while processing image.');
        }
      };

      imageElement.onerror = () => {
        setError('Invalid image file.');
      };

      imageElement.src = imageDataUrl;
    };

    reader.readAsDataURL(file);
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
        className={`border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all ${
          dragActive
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-slate-300 hover:border-indigo-400'
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
            <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
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