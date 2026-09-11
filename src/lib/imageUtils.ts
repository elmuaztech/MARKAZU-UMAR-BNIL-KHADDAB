/**
 * Client-Side Image Compression Utility
 * Resizes and compresses image files into crisp, lightweight base64 Data URLs.
 * Default max dimension: 320px, JPEG quality: 0.85 (~15-30 KB output).
 */
export function compressImageFile(file: File, maxDim = 320, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided'));
      return;
    }

    // If file is SVG, read directly as Data URL
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let { width, height } = img;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(width, 1);
        canvas.height = Math.max(height, 1);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export const MAX_STUDENT_PHOTO_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB Hardcoded

/**
 * Compresses an image file or video frame to a lightweight WebP passport photo.
 * Hardcoded to enforce 5MB maximum source file size and produce tiny KB output (~15-35 KB).
 */
export function compressStudentPhotoToWebP(
  source: File | Blob | HTMLVideoElement,
  maxDim = 400,
  quality = 0.8
): Promise<{ dataUrl: string; sizeKb: number }> {
  return new Promise((resolve, reject) => {
    if (source instanceof File && source.size > MAX_STUDENT_PHOTO_SIZE_BYTES) {
      reject(new Error(`File size ${(source.size / (1024 * 1024)).toFixed(2)}MB exceeds maximum allowed 5MB limit.`));
      return;
    }

    const processImage = (img: HTMLImageElement | HTMLVideoElement) => {
      let srcW = 0;
      let srcH = 0;

      if (img instanceof HTMLVideoElement) {
        srcW = img.videoWidth || 640;
        srcH = img.videoHeight || 480;
      } else {
        srcW = img.naturalWidth || img.width;
        srcH = img.naturalHeight || img.height;
      }

      if (!srcW || !srcH) {
        reject(new Error('Invalid image dimensions'));
        return;
      }

      // Passport style crop (centered square 1:1)
      const cropSize = Math.min(srcW, srcH);
      const startX = (srcW - cropSize) / 2;
      const startY = (srcH - cropSize) / 2;

      const canvas = document.createElement('canvas');
      canvas.width = Math.min(maxDim, cropSize);
      canvas.height = Math.min(maxDim, cropSize);

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not initialize canvas context'));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Draw center-cropped square
      ctx.drawImage(img, startX, startY, cropSize, cropSize, 0, 0, canvas.width, canvas.height);

      let dataUrl = '';
      try {
        dataUrl = canvas.toDataURL('image/webp', quality);
        if (!dataUrl.startsWith('data:image/webp')) {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }
      } catch {
        dataUrl = canvas.toDataURL('image/jpeg', quality);
      }

      // Calculate output size in KB
      const base64Len = dataUrl.length - (dataUrl.indexOf(',') + 1);
      const sizeBytes = Math.round((base64Len * 3) / 4);
      const sizeKb = Number((sizeBytes / 1024).toFixed(1));

      resolve({ dataUrl, sizeKb });
    };

    if (source instanceof HTMLVideoElement) {
      processImage(source);
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image source.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to decode image file.'));
      img.onload = () => processImage(img);
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(source);
  });
}
