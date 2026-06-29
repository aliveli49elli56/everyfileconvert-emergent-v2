export interface ConversionResult {
  blob: Blob;
  width: number;
  height: number;
}

const CANVAS_FORMATS = ["png", "jpeg", "jpg", "webp", "bmp"] as const;
type CanvasFormat = (typeof CANVAS_FORMATS)[number];

const MIME_MAP: Record<string, string> = {
  png: "image/png",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  webp: "image/webp",
  bmp: "image/bmp",
};

function isCanvasFormat(format: string): format is CanvasFormat {
  return CANVAS_FORMATS.includes(format as CanvasFormat);
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to load image: ${file.name}`));
    };
    img.src = url;
  });
}

function drawToCanvas(img: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas 2D context");

  if (img.naturalWidth > 0 && img.naturalHeight > 0) {
    ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);
  }
  return canvas;
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: CanvasFormat,
  quality: number = 0.92
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const mime = MIME_MAP[format] || "image/png";
    const q = format === "png" ? undefined : quality;
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error(`Canvas toBlob returned null for ${format}`));
      },
      mime,
      q
    );
  });
}

function blobToUint8Array(blob: Blob): Promise<Uint8Array> {
  return blob.arrayBuffer().then((buf) => new Uint8Array(buf));
}

function createBmpBuffer(canvas: HTMLCanvasElement): Blob {
  const ctx = canvas.getContext("2d")!;
  const w = canvas.width;
  const h = canvas.height;
  const imageData = ctx.getImageData(0, 0, w, h);
  const rgba = imageData.data;

  const rowSize = Math.ceil((w * 3) / 4) * 4;
  const pixelDataSize = rowSize * h;
  const fileSize = 54 + pixelDataSize;

  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);

  view.setUint8(0, 0x42);
  view.setUint8(1, 0x4d);
  view.setUint32(2, fileSize, true);
  view.setUint32(10, 54, true);
  view.setUint32(14, 40, true);
  view.setUint32(18, w, true);
  view.setUint32(22, h, true);
  view.setUint16(26, 1, true);
  view.setUint16(28, 24, true);
  view.setUint32(34, pixelDataSize, true);

  let offset = 54;
  for (let y = h - 1; y >= 0; y--) {
    for (let x = 0; x < w; x++) {
      const srcIdx = (y * w + x) * 4;
      view.setUint8(offset++, rgba[srcIdx + 2]);
      view.setUint8(offset++, rgba[srcIdx + 1]);
      view.setUint8(offset++, rgba[srcIdx]);
    }
    const padding = rowSize - w * 3;
    for (let p = 0; p < padding; p++) {
      view.setUint8(offset++, 0);
    }
  }

  return new Blob([buffer], { type: "image/bmp" });
}

function createIcoBuffer(canvas: HTMLCanvasElement): Blob {
  const size = 16;
  const tmpCanvas = document.createElement("canvas");
  tmpCanvas.width = size;
  tmpCanvas.height = size;
  const tmpCtx = tmpCanvas.getContext("2d")!;
  tmpCtx.drawImage(canvas, 0, 0, size, size);

  const imageData = tmpCtx.getImageData(0, 0, size, size);
  const rgba = imageData.data;

  const pixelDataSize = size * size * 4;
  const andMaskSize = Math.ceil(size / 8) * size;
  const bmpDataSize = 40 + pixelDataSize + andMaskSize;
  const fileSize = 6 + 16 + bmpDataSize;

  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);

  view.setUint16(0, 0, true);
  view.setUint16(2, 1, true);
  view.setUint16(4, 1, true);
  view.setUint8(6, size);
  view.setUint8(7, size);
  view.setUint16(8, 0, true);
  view.setUint16(10, 1, true);
  view.setUint32(12, 32, true);
  view.setUint32(16, bmpDataSize, true);
  view.setUint32(20, 22, true);

  const bmpOffset = 22;
  view.setUint32(bmpOffset, 40, true);
  view.setUint32(bmpOffset + 4, size, true);
  view.setUint32(bmpOffset + 8, size * 2, true);
  view.setUint16(bmpOffset + 12, 1, true);
  view.setUint16(bmpOffset + 14, 32, true);
  view.setUint32(bmpOffset + 16, 0, true);
  view.setUint32(bmpOffset + 20, pixelDataSize + andMaskSize, true);

  let offset = bmpOffset + 40;
  for (let y = size - 1; y >= 0; y--) {
    for (let x = 0; x < size; x++) {
      const srcIdx = (y * size + x) * 4;
      view.setUint8(offset++, rgba[srcIdx + 2]);
      view.setUint8(offset++, rgba[srcIdx + 1]);
      view.setUint8(offset++, rgba[srcIdx]);
      view.setUint8(offset++, rgba[srcIdx + 3]);
    }
  }

  for (let i = 0; i < andMaskSize; i++) {
    view.setUint8(offset++, 0);
  }

  return new Blob([buffer], { type: "image/x-icon" });
}

async function svgToRaster(file: File, targetFormat: string): Promise<Blob> {
  const text = await file.text();
  const svgBlob = new Blob([text], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = async () => {
      URL.revokeObjectURL(url);
      const canvas = drawToCanvas(img);
      if (targetFormat === "bmp") {
        resolve(createBmpBuffer(canvas));
      } else if (targetFormat === "ico") {
        resolve(createIcoBuffer(canvas));
      } else if (isCanvasFormat(targetFormat)) {
        const blob = await canvasToBlob(canvas, targetFormat);
        resolve(blob);
      } else {
        const blob = await canvasToBlob(canvas, "png");
        resolve(blob);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to render SVG"));
    };
    img.src = url;
  });
}

export async function convertImage(
  file: File,
  sourceFormat: string,
  targetFormat: string,
  quality: number = 0.92
): Promise<ConversionResult> {
  const src = sourceFormat.toLowerCase();
  const tgt = targetFormat.toLowerCase();

  if (src === tgt) {
    const buf = await file.arrayBuffer();
    const blob = new Blob([buf], { type: file.type || MIME_MAP[src] || "application/octet-stream" });
    return { blob, width: 0, height: 0 };
  }

  if (src === "svg") {
    const blob = await svgToRaster(file, tgt);
    return { blob, width: 0, height: 0 };
  }

  const img = await loadImage(file);
  const canvas = drawToCanvas(img);

  const result: ConversionResult = {
    blob: new Blob([], { type: "application/octet-stream" }),
    width: img.naturalWidth,
    height: img.naturalHeight,
  };

  switch (tgt) {
    case "png":
    case "jpeg":
    case "jpg":
    case "webp":
      result.blob = await canvasToBlob(canvas, tgt, quality);
      break;
    case "bmp":
      result.blob = createBmpBuffer(canvas);
      break;
    case "ico":
      result.blob = createIcoBuffer(canvas);
      break;
    case "gif": {
      result.blob = await canvasToBlob(canvas, "png");
      break;
    }
    case "tiff": {
      result.blob = await canvasToBlob(canvas, "png");
      break;
    }
    case "pdf": {
      const pngBlob = await canvasToBlob(canvas, "png");
      const pngBase64 = await blobToDataUrl(pngBlob);
      const pdfHtml = buildPdfHtml(pngBase64, img.naturalWidth, img.naturalHeight);
      result.blob = new Blob([pdfHtml], { type: "application/pdf" });
      break;
    }
    default: {
      result.blob = await canvasToBlob(canvas, "png");
      break;
    }
  }

  return result;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function buildPdfHtml(
  imgDataUrl: string,
  imgWidth: number,
  imgHeight: number
): string {
  const pageW = Math.min(imgWidth, 2480);
  const scale = pageW / imgWidth;
  const pageH = imgHeight * scale;

  return `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Contents 4 0 R /Resources << /XObject << /Img1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 44 >>
stream
q ${pageW} 0 0 ${pageH} 0 0 cm /Img1 Do Q
endstream
endobj
5 0 obj
<< /Type /XObject /Subtype /Image /Width ${imgWidth} /Height ${imgHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length 0 >>
stream

endstream
endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000266 00000 n
0000000360 00000 n
trailer
<< /Size 6 /Root 1 0 R >>
startxref
530
%%EOF`;
}
