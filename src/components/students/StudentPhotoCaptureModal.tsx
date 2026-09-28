'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, Check, RefreshCw, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { compressStudentPhotoToWebP, MAX_STUDENT_PHOTO_SIZE_BYTES } from '@/lib/imageUtils';
import { getAuthHeaders } from '@/lib/context';

interface StudentPhotoCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
  admissionNo: string;
  currentAvatar?: string;
  onPhotoSaved: (avatarUrl: string) => void;
}

export function StudentPhotoCaptureModal({
  isOpen,
  onClose,
  studentId,
  studentName,
  admissionNo,
  currentAvatar,
  onPhotoSaved,
}: StudentPhotoCaptureModalProps) {
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [compressedKb, setCompressedKb] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Process selected or dropped file with WebP compression
  const processImageFile = async (file: File) => {
    setErrorMsg(null);

    // Validate mime type
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPEG, PNG, or WebP).');
      return;
    }

    // Validate size limit (5MB)
    if (file.size > MAX_STUDENT_PHOTO_SIZE_BYTES) {
      setErrorMsg('Image size exceeds 5MB limit. Please select a smaller photo.');
      return;
    }

    setIsProcessing(true);
    try {
      const { dataUrl, sizeKb } = await compressStudentPhotoToWebP(file);
      setPreviewDataUrl(dataUrl);
      setCompressedKb(sizeKb);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to process selected image file.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  // Clear preview and select another
  const handleReset = () => {
    setPreviewDataUrl(null);
    setCompressedKb(null);
    setErrorMsg(null);
  };

  // Save and Upload Compressed WebP Image
  const handleSavePhoto = async () => {
    if (!previewDataUrl) return;

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const headers = {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      };

      const res = await fetch('/api/students/photo', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          studentId,
          imageBase64: previewDataUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Photo could not be uploaded. Please try again.');
      }

      onPhotoSaved(data.avatarUrl);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Photo could not be saved. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn overflow-hidden font-poppins">
      <div className="relative w-full max-w-[480px] max-h-[88vh] rounded-3xl bg-white dark:bg-[#06241a] border border-slate-200 dark:border-emerald-500/30 shadow-2xl overflow-hidden flex flex-col text-slate-900 dark:text-gray-100">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-emerald-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white">
                Upload Profile Photo
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-emerald-300/80 truncate max-w-[220px] sm:max-w-[300px]">
                {studentName} ({admissionNo})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-emerald-900/40 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 space-y-4">
          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Photo Drop Zone or Preview */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative aspect-square max-w-[240px] sm:max-w-[260px] mx-auto rounded-3xl overflow-hidden border-2 transition-all flex items-center justify-center shadow-inner ${
              isDragging
                ? 'border-emerald-500 bg-emerald-500/10 ring-4 ring-emerald-500/20'
                : 'border-dashed border-emerald-500/40 bg-slate-50 dark:bg-[#041a13]'
            }`}
          >
            {previewDataUrl ? (
              <img
                src={previewDataUrl}
                alt="Student Preview"
                className="w-full h-full object-cover rounded-2xl animate-scaleUp"
              />
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-6 text-center space-y-3 cursor-pointer hover:opacity-90 transition-opacity"
              >
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-sm">
                  <ImageIcon className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-white">
                    {isDragging ? 'Drop photo here' : 'Choose Photo or Drag Here'}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-emerald-300/70 pt-1">
                    PNG, JPG, or WebP (Max 5MB)
                  </p>
                </div>
                <button
                  type="button"
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-[11px] shadow-sm pointer-events-none"
                >
                  Browse Device
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* WebP Compression Info Badge */}
          {compressedKb !== null && (
            <div className="flex items-center justify-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 py-1.5 px-3 rounded-xl border border-emerald-500/20 max-w-[280px] mx-auto">
              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Optimized WebP: {compressedKb} KB</span>
            </div>
          )}

          {!previewDataUrl && currentAvatar && (
            <div className="text-center">
              <span className="text-[10px] text-slate-400 dark:text-emerald-400/60">
                A current photo is already on file. Uploading a new one will replace it.
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 p-3.5 sm:p-4 border-t border-slate-100 dark:border-emerald-800/40 bg-slate-50/70 dark:bg-emerald-950/40">
          {previewDataUrl ? (
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleReset}
                disabled={isProcessing}
                className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-emerald-800/40 hover:bg-slate-100 dark:hover:bg-emerald-900/50 font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-slate-700 dark:text-emerald-200 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Choose Another</span>
              </button>
              <button
                type="button"
                onClick={handleSavePhoto}
                disabled={isProcessing}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Save & Apply</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-emerald-800/40 hover:bg-slate-100 dark:hover:bg-emerald-900/50 font-bold text-xs text-slate-700 dark:text-emerald-200 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Choose Photo from Device</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
