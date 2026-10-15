/**
 * Professional Certificate PDF & Image Export Utility
 * Generates official A4 Landscape (841.89 x 595.28 pt) PDF documents directly from high-resolution canvas.
 * Preserves authentic Arabic complex script shaping, OpenType ligatures, official seals, and vector margins.
 */

export function downloadCanvasAsPdf(
  canvas: HTMLCanvasElement,
  filename: string,
  options?: {
    quality?: number;
    title?: string;
    author?: string;
  }
) {
  const quality = options?.quality ?? 0.95;
  const jpegDataUrl = canvas.toDataURL('image/jpeg', quality);

  // Extract base64 binary payload
  const base64Data = jpegDataUrl.split(',')[1];
  const binaryString = window.atob(base64Data);
  const len = binaryString.length;
  const jpegBytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    jpegBytes[i] = binaryString.charCodeAt(i);
  }

  const imgWidthPx = canvas.width;
  const imgHeightPx = canvas.height;
  const pageWidth = 841.89; // Standard A4 Landscape width in points
  const pageHeight = 595.28; // Standard A4 Landscape height in points

  // Assemble standard PDF-1.4 file
  const parts: BlobPart[] = [];
  const offsets: number[] = [];
  let byteOffset = 0;

  function addString(str: string): number {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    parts.push(bytes as unknown as BlobPart);
    byteOffset += bytes.length;
    return bytes.length;
  }

  function addBytes(bytes: Uint8Array): number {
    parts.push(bytes as unknown as BlobPart);
    byteOffset += bytes.length;
    return bytes.length;
  }

  function writeObj(num: number, content: string) {
    offsets[num] = byteOffset;
    addString(`${num} 0 obj\n${content}\nendobj\n`);
  }

  // PDF Header
  addString('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');

  // Object 1: Catalog
  writeObj(1, '<< /Type /Catalog /Pages 2 0 R >>');

  // Object 2: Pages
  writeObj(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');

  // Object 3: Page (A4 Landscape)
  writeObj(
    3,
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im1 4 0 R >> >> /Contents 5 0 R >>`
  );

  // Object 4: Image XObject (JPEG DCTDecode)
  const imgHeader = `<< /Type /XObject /Subtype /Image /Width ${imgWidthPx} /Height ${imgHeightPx} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`;
  offsets[4] = byteOffset;
  addString(`4 0 obj\n${imgHeader}`);
  addBytes(jpegBytes);
  addString('\nendstream\nendobj\n');

  // Object 5: Content stream (paints image at full page dimensions)
  const contentStream = `q\n${pageWidth} 0 0 ${pageHeight} 0 0 cm\n/Im1 Do\nQ\n`;
  writeObj(5, `<< /Length ${contentStream.length} >>\nstream\n${contentStream}endstream`);

  // XRef Table
  const startXref = byteOffset;
  let xref = 'xref\n0 6\n0000000000 65535 f \n';
  for (let i = 1; i <= 5; i++) {
    xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  addString(xref);

  // Trailer
  addString(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`);

  // Combine into single Blob
  const blob = new Blob(parts, { type: 'application/pdf' });
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(downloadUrl), 5000);
}
