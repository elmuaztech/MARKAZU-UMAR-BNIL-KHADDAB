const fs = require('fs');

/**
 * Creates a valid, standard PDF 1.4 document containing a single landscape page with an embedded JPEG image.
 * Uses exact A4 landscape dimensions (841.89 x 595.28 pt).
 */
function buildA4LandscapePdfFromJpeg(jpegBuffer, imgWidthPx, imgHeightPx) {
  const pageWidth = 841.89;
  const pageHeight = 595.28;

  // PDF components
  const parts = [];
  const offsets = [];

  function addPart(str) {
    const buf = Buffer.isBuffer(str) ? str : Buffer.from(str, 'binary');
    parts.push(buf);
    return buf.length;
  }

  let byteOffset = 0;
  function writeObj(num, content) {
    offsets[num] = byteOffset;
    byteOffset += addPart(`${num} 0 obj\n${content}\nendobj\n`);
  }

  // Header
  byteOffset += addPart('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');

  // Object 1: Catalog
  writeObj(1, '<< /Type /Catalog /Pages 2 0 R >>');

  // Object 2: Pages
  writeObj(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');

  // Object 3: Page (A4 Landscape)
  writeObj(
    3,
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im1 4 0 R >> >> /Contents 5 0 R >>`
  );

  // Object 4: Image XObject
  const imgStreamHeader = `<< /Type /XObject /Subtype /Image /Width ${imgWidthPx} /Height ${imgHeightPx} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBuffer.length} >>\nstream\n`;
  const imgStreamFooter = '\nendstream';
  
  offsets[4] = byteOffset;
  byteOffset += addPart(`4 0 obj\n${imgStreamHeader}`);
  byteOffset += addPart(jpegBuffer);
  byteOffset += addPart(`${imgStreamFooter}\nendobj\n`);

  // Object 5: Page Content stream (places the image to fill the page)
  const contentStream = `q\n${pageWidth} 0 0 ${pageHeight} 0 0 cm\n/Im1 Do\nQ\n`;
  writeObj(5, `<< /Length ${contentStream.length} >>\nstream\n${contentStream}endstream`);

  // XRef table
  const startXref = byteOffset;
  let xref = `xref\n0 6\n0000000000 65535 f \n`;
  for (let i = 1; i <= 5; i++) {
    xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  byteOffset += addPart(xref);

  // Trailer
  byteOffset += addPart(
    `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`
  );

  return Buffer.concat(parts);
}

// Generate a dummy 1x1 JPEG to test PDF validity
// Minimal 1x1 white JPEG:
const dummyJpeg = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
  0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
  0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
  0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20, 0x24, 0x2e, 0x27, 0x20,
  0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29, 0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27,
  0x39, 0x3d, 0x38, 0x32, 0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
  0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01,
  0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04,
  0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f,
  0x00, 0xbf, 0x80, 0xff, 0xd9
]);

const pdfBuf = buildA4LandscapePdfFromJpeg(dummyJpeg, 1, 1);
fs.writeFileSync('tests/sample_landscape.pdf', pdfBuf);
console.log('Successfully created sample_landscape.pdf, size:', pdfBuf.length, 'bytes');
