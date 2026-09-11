'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, Check, RefreshCw, AlertCircle, ShieldAlert, Sparkles, Image as ImageIcon } from 'lucide-react';
import { compressStudentPhotoToWebP, MAX_STUDENT_PHOTO_SIZE_BYTES } from '@/lib/imageUtils';

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
  const [activeTab, setActiveTab] = useState<'CAMERA' | 'UPLOAD'>('CAMERA');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [compressedKb, setCompressedKb] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stop camera stream safely
  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Start live camera stream
  const startCamera = async () => {
    setCameraError(null);
    setErrorMsg(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera device access is not supported on this browser or connection.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.error('[CAMERA_STREAM_ERROR]', err);
      setCameraError(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Camera permission denied. Please allow camera access in your browser address bar.'
          : err.message || 'Unable to access camera.'
      );
      setIsCameraActive(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'CAMERA' && !previewDataUrl) {
      startCamera();
    } else {
      stopCameraStream();
    }

    return () => {
      stopCameraStream();
    };
  }, [isOpen, activeTab, previewDataUrl]);

  if (!isOpen) return null;

  // Handle Live Snapshot Capture
  const handleCaptureSnapshot = async () => {
    if (!videoRef.current) return;
    setErrorMsg(null);
    setIsProcessing(true);
    try {
      const { dataUrl, sizeKb } = await compressStudentPhotoToWebP(videoRef.current);
      setPreviewDataUrl(dataUrl);
      setCompressedKb(sizeKb);
      stopCameraStream();
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not capture photo from video feed.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Device File Upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);

    // Enforce 5MB Hardcoded Maximum
    if (file.size > MAX_STUDENT_PHOTO_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      setErrorMsg(`Maximum upload size is 5MB. The selected file (${sizeMb} MB) exceeds this limit.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
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

  // Retake or Clear Preview
  const handleRetake = () => {
    setPreviewDataUrl(null);
    setCompressedKb(null);
    setErrorMsg(null);
    if (activeTab === 'CAMERA') {
      startCamera();
    }
  };

  // Save and Upload Compressed WebP Image
  const handleSavePhoto = async () => {
    if (!previewDataUrl) return;

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/students/photo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId,
          imageBase64: previewDataUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to upload student photo to server.');
      }

      onPhotoSaved(data.avatarUrl);
      stopCameraStream();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save student photo.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#06241a] border border-slate-200 dark:border-emerald-500/30 shadow-2xl overflow-hidden text-slate-900 dark:text-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-emerald-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white">
                Student Profile Photo
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-emerald-300/80 truncate max-w-[240px]">
                {studentName} ({admissionNo})
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCameraStream();
              onClose();
            }}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-emerald-900/40 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher (Live Camera vs Gallery Upload) */}
        {!previewDataUrl && (
          <div className="grid grid-cols-2 p-2 bg-slate-50 dark:bg-emerald-950/40 border-b border-slate-100 dark:border-emerald-800/40 text-xs font-bold">
            <button
              onClick={() => {
                setActiveTab('CAMERA');
                setErrorMsg(null);
              }}
              className={`py-2 rounded-xl flex items-center justify-center gap-2 transition-all ${
                activeTab === 'CAMERA'
                  ? 'bg-white dark:bg-emerald-600 text-slate-950 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:text-emerald-300/80 dark:hover:text-white'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Live Camera</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('UPLOAD');
                stopCameraStream();
                setErrorMsg(null);
              }}
              className={`py-2 rounded-xl flex items-center justify-center gap-2 transition-all ${
                activeTab === 'UPLOAD'
                  ? 'bg-white dark:bg-emerald-600 text-slate-950 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:text-emerald-300/80 dark:hover:text-white'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Upload File (Max 5MB)</span>
            </button>
          </div>
        )}

        {/* Error Alert Banner */}
        {errorMsg && (
          <div className="m-4 p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Viewfinder or Captured Preview */}
          <div className="relative aspect-square max-w-[280px] mx-auto rounded-3xl overflow-hidden border-2 border-dashed border-emerald-500/40 bg-slate-100 dark:bg-[#041a13] flex items-center justify-center shadow-inner">
            {previewDataUrl ? (
              // Captured / Uploaded Image Preview
              <img
                src={previewDataUrl}
                alt="Student Preview"
                className="w-full h-full object-cover rounded-2xl animate-scaleUp"
              />
            ) : activeTab === 'CAMERA' ? (
              // Live Video Stream Viewfinder
              <>
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  autoPlay
                  className={`w-full h-full object-cover ${isCameraActive ? 'block' : 'hidden'}`}
                />
                {!isCameraActive && (
                  <div className="p-4 text-center space-y-2">
                    {cameraError ? (
                      <>
                        <ShieldAlert className="w-8 h-8 text-amber-500 mx-auto" />
                        <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">{cameraError}</p>
                        <button
                          onClick={startCamera}
                          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 shadow-sm"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Retry Camera</span>
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs text-slate-500 dark:text-emerald-300 font-medium">Initializing camera...</span>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              // File Upload Drop Area
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-6 text-center space-y-3 cursor-pointer hover:opacity-90 transition-opacity"
              >
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-sm">
                  <ImageIcon className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-white">Click to Select Student Photo</p>
                  <p className="text-[10px] text-slate-500 dark:text-emerald-300/70 pt-1">
                    PNG, JPG, WEBP, or HEIC (Maximum 5MB limit)
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            )}

            {/* Passport Frame Alignment Guide */}
            {!previewDataUrl && (
              <div className="absolute inset-4 pointer-events-none rounded-2xl border border-white/20 flex items-center justify-center">
                <span className="text-[10px] font-mono uppercase font-bold text-white/50 tracking-wider bg-black/30 px-2 py-0.5 rounded backdrop-blur-xs">
                  Passport Frame
                </span>
              </div>
            )}
          </div>

          {/* WebP Compression Info Badge */}
          {compressedKb !== null && (
            <div className="flex items-center justify-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 py-1.5 px-3 rounded-xl border border-emerald-500/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Compressed to WebP: {compressedKb} KB (Storage-Optimized)</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2">
            {previewDataUrl ? (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleRetake}
                  disabled={isProcessing}
                  className="py-2.5 rounded-xl border border-slate-200 dark:border-emerald-800/40 hover:bg-slate-100 dark:hover:bg-emerald-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-slate-700 dark:text-emerald-200"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Retake / Change</span>
                </button>
                <button
                  type="button"
                  onClick={handleSavePhoto}
                  disabled={isProcessing}
                  className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
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
            ) : activeTab === 'CAMERA' ? (
              <button
                type="button"
                onClick={handleCaptureSnapshot}
                disabled={!isCameraActive || isProcessing}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
              >
                <Camera className="w-4 h-4" />
                <span>Capture Photo</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
              >
                <Upload className="w-4 h-4" />
                <span>Choose Image from Device</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
