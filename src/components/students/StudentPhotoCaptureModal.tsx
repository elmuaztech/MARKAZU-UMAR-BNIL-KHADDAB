'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, Check, RefreshCw, AlertCircle, ShieldAlert, Sparkles, Image as ImageIcon, SwitchCamera } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'CAMERA' | 'UPLOAD'>('CAMERA');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [compressedKb, setCompressedKb] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Camera switching state
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [availableVideoDevices, setAvailableVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);

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

  // Enumerate available video input devices safely
  const updateAvailableDevices = async () => {
    try {
      if (navigator.mediaDevices?.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setAvailableVideoDevices(videoInputs);
      }
    } catch {
      // Best-effort enumeration
    }
  };

  // Start live camera stream
  const startCamera = async (targetFacing = facingMode, targetDeviceId = selectedDeviceId) => {
    stopCameraStream();
    setCameraError(null);
    setErrorMsg(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported on this browser or device.');
      }

      // Build video constraints
      const videoConstraints: MediaTrackConstraints = {
        width: { ideal: 640 },
        height: { ideal: 480 },
      };

      if (targetDeviceId) {
        videoConstraints.deviceId = { exact: targetDeviceId };
      } else {
        videoConstraints.facingMode = { ideal: targetFacing };
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);

      // Detect actual facing mode from active track
      const activeTrack = stream.getVideoTracks()[0];
      const settings = activeTrack?.getSettings?.();
      if (settings?.facingMode === 'environment' || settings?.facingMode === 'user') {
        setFacingMode(settings.facingMode);
      } else {
        setFacingMode(targetFacing);
      }

      await updateAvailableDevices();
    } catch (err: any) {
      console.error('[CAMERA_STREAM_ERROR]', err);
      const isPermissionDenied =
        err.name === 'NotAllowedError' ||
        err.name === 'PermissionDeniedError' ||
        err.name === 'SecurityError';

      setCameraError(
        isPermissionDenied
          ? 'Camera access is needed to take a photo.'
          : err.message || 'Unable to access camera.'
      );
      setIsCameraActive(false);
    }
  };

  // Switch between Front and Back camera
  const handleSwitchCamera = async () => {
    if (isProcessing) return;

    if (availableVideoDevices.length > 1) {
      // If we have multiple enumerated devices, cycle to next device
      const currentIndex = availableVideoDevices.findIndex(
        (d) => d.deviceId === selectedDeviceId
      );
      const nextIndex = (currentIndex + 1) % availableVideoDevices.length;
      const nextDevice = availableVideoDevices[nextIndex];
      setSelectedDeviceId(nextDevice.deviceId);

      // Infer facing mode from device label if available
      const label = (nextDevice.label || '').toLowerCase();
      const nextFacing = label.includes('back') || label.includes('rear') || label.includes('environment')
        ? 'environment'
        : 'user';
      setFacingMode(nextFacing);

      await startCamera(nextFacing, nextDevice.deviceId);
    } else {
      // Toggle facingMode directly
      const nextFacing = facingMode === 'user' ? 'environment' : 'user';
      setFacingMode(nextFacing);
      setSelectedDeviceId(null);
      await startCamera(nextFacing, null);
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
      stopCameraStream();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Photo could not be saved. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn overflow-hidden">
      <div className="relative w-full max-w-[520px] max-h-[88vh] rounded-3xl bg-white dark:bg-[#06241a] border border-slate-200 dark:border-emerald-500/30 shadow-2xl overflow-hidden flex flex-col text-slate-900 dark:text-gray-100">
        {/* 1. Fixed Header */}
        <div className="shrink-0 flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-emerald-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white">
                Student Profile Photo
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-emerald-300/80 truncate max-w-[200px] sm:max-w-[280px]">
                {studentName} ({admissionNo})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopCameraStream();
              onClose();
            }}
            aria-label="Close modal"
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-emerald-900/40 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Fixed Tab Switcher (Live Camera vs Gallery Upload) */}
        {!previewDataUrl && (
          <div className="shrink-0 grid grid-cols-2 p-1.5 sm:p-2 bg-slate-50 dark:bg-emerald-950/40 border-b border-slate-100 dark:border-emerald-800/40 text-xs font-bold gap-1.5">
            <button
              type="button"
              onClick={() => {
                setActiveTab('CAMERA');
                setErrorMsg(null);
              }}
              className={`py-2 rounded-xl flex items-center justify-center gap-1.5 sm:gap-2 transition-all ${
                activeTab === 'CAMERA'
                  ? 'bg-white dark:bg-emerald-600 text-slate-950 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-emerald-300/80 dark:hover:text-white'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Live Camera</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('UPLOAD');
                stopCameraStream();
                setErrorMsg(null);
              }}
              className={`py-2 rounded-xl flex items-center justify-center gap-1.5 sm:gap-2 transition-all ${
                activeTab === 'UPLOAD'
                  ? 'bg-white dark:bg-emerald-600 text-slate-950 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-emerald-300/80 dark:hover:text-white'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Upload File</span>
            </button>
          </div>
        )}

        {/* 3. Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 p-4 sm:p-5 space-y-3.5 divide-y-0">
          {/* Error Alert Banner */}
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Active Camera Indicator & Switch Button */}
          {activeTab === 'CAMERA' && !previewDataUrl && isCameraActive && (
            <div className="flex items-center justify-between gap-2 px-1">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{facingMode === 'environment' ? 'Back camera' : 'Front camera'}</span>
              </div>
              <button
                type="button"
                onClick={handleSwitchCamera}
                disabled={!isCameraActive || isProcessing}
                aria-label="Switch camera"
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-emerald-800/50 bg-slate-50 dark:bg-emerald-950/80 text-slate-800 dark:text-emerald-200 hover:bg-slate-100 dark:hover:bg-emerald-900/60 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
              >
                <SwitchCamera className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Switch camera</span>
              </button>
            </div>
          )}

          {/* Viewfinder or Captured Preview */}
          <div className="relative aspect-square max-w-[240px] sm:max-w-[260px] mx-auto rounded-3xl overflow-hidden border-2 border-dashed border-emerald-500/40 bg-slate-100 dark:bg-[#041a13] flex items-center justify-center shadow-inner">
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
                  <div className="p-4 text-center space-y-3">
                    {cameraError ? (
                      <>
                        <ShieldAlert className="w-8 h-8 text-amber-500 mx-auto" />
                        <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">{cameraError}</p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => startCamera()}
                            className="w-full sm:w-auto px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs inline-flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Retry Camera</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab('UPLOAD');
                              stopCameraStream();
                              setErrorMsg(null);
                            }}
                            className="w-full sm:w-auto px-3 py-1.5 rounded-xl border border-slate-300 dark:border-emerald-800 text-slate-700 dark:text-emerald-300 hover:bg-slate-50 dark:hover:bg-emerald-950 font-bold text-xs inline-flex items-center justify-center gap-1.5"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload File</span>
                          </button>
                        </div>
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
                className="p-5 sm:p-6 text-center space-y-2.5 cursor-pointer hover:opacity-90 transition-opacity"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-sm">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-white">Click to Select Photo</p>
                  <p className="text-[10px] text-slate-500 dark:text-emerald-300/70 pt-0.5">
                    PNG, JPG, WEBP, or HEIC (Max 5MB)
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
              <div className="absolute inset-3.5 pointer-events-none rounded-2xl border border-white/20 flex items-center justify-center">
                <span className="text-[9px] sm:text-[10px] font-mono uppercase font-bold text-white/50 tracking-wider bg-black/30 px-2 py-0.5 rounded backdrop-blur-xs">
                  Passport Frame
                </span>
              </div>
            )}
          </div>

          {/* WebP Compression Info Badge */}
          {compressedKb !== null && (
            <div className="flex items-center justify-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 py-1.5 px-3 rounded-xl border border-emerald-500/20 max-w-[280px] mx-auto">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">Compressed to WebP: {compressedKb} KB</span>
            </div>
          )}
        </div>

        {/* 4. Fixed Action Footer */}
        <div className="shrink-0 p-3.5 sm:p-4 border-t border-slate-100 dark:border-emerald-800/40 bg-slate-50/70 dark:bg-emerald-950/40">
          {previewDataUrl ? (
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleRetake}
                disabled={isProcessing}
                className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-emerald-800/40 hover:bg-slate-100 dark:hover:bg-emerald-900/50 font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-slate-700 dark:text-emerald-200"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retake / Change</span>
              </button>
              <button
                type="button"
                onClick={handleSavePhoto}
                disabled={isProcessing}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
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
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  stopCameraStream();
                  onClose();
                }}
                disabled={isProcessing}
                className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-emerald-800/40 hover:bg-slate-100 dark:hover:bg-emerald-900/50 font-bold text-xs text-slate-700 dark:text-emerald-200 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCaptureSnapshot}
                disabled={!isCameraActive || isProcessing}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
              >
                <Camera className="w-4 h-4" />
                <span>Capture Photo</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  stopCameraStream();
                  onClose();
                }}
                disabled={isProcessing}
                className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-emerald-800/40 hover:bg-slate-100 dark:hover:bg-emerald-900/50 font-bold text-xs text-slate-700 dark:text-emerald-200 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all"
              >
                <Upload className="w-4 h-4" />
                <span>Choose Image from Device</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
