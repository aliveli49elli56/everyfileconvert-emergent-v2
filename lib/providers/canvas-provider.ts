/**
 * lib/providers/canvas-provider.ts
 * Canvas API provider for image operations
 */

import { BaseProvider, providerFactory } from './base-provider';
import type { ProviderCapabilities } from '../types/providers';
import type { ConversionJob, ConversionResult, ConversionProgress } from '../types/conversion';

// ---------------------------------------------------------------------------
// CAPABILITIES
// ---------------------------------------------------------------------------

const CANVAS_CAPABILITIES: ProviderCapabilities = {
  maxFileSize: 100 * 1024 * 1024, // 100MB
  maxFiles: 50,
  supportsFormats: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'tiff', 'heic', 'heif', 'svg', 'ico', 'icns'],
  supportsOperations: [
    'image:convert',
    'image:crop',
    'image:resize',
    'image:rotate',
    'image:flip',
    'image:compress',
    'image:blur',
    'image:watermark',
    'image:color-adjust',
  ],
  premiumOnly: false,
  requiresAuth: false,
  estimatedSpeed: 'fast',
  qualityRating: 'high',
};

// ---------------------------------------------------------------------------
// CANVAS PROVIDER
// ---------------------------------------------------------------------------

class CanvasProvider extends BaseProvider {
  readonly id = 'canvas';
  readonly name = 'Canvas API';
  readonly type = 'client' as const;
  readonly capabilities = CANVAS_CAPABILITIES;

  async execute(
    job: ConversionJob,
    onProgress?: (progress: ConversionProgress) => void
  ): Promise<ConversionResult> {
    const { files, options } = job;
    const file = files[0];

    if (!file) {
      return this.failure('No file provided', 'INVALID_OPTIONS');
    }

    try {
      this.reportProgress(job.id, 'loading', 5, 'Loading image...', onProgress);

      // Load image
      const img = await this.loadImage(file);
      this.reportProgress(job.id, 'processing', 20, 'Processing...', onProgress);

      // Create canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        return this.failure('Could not create canvas context', 'CONVERSION_FAILED');
      }

      // Determine output dimensions
      let { width, height } = this.calculateDimensions(
        img.width,
        img.height,
        options
      );

      canvas.width = width;
      canvas.height = height;

      // Apply transformations based on operation
      this.reportProgress(job.id, 'processing', 40, 'Applying transforms...', onProgress);

      // Handle rotation
      if (options?.rotation) {
        ctx.save();
        ctx.translate(width / 2, height / 2);
        ctx.rotate((options.rotation * Math.PI) / 180);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        ctx.restore();
      } else {
        // Handle flip
        if (options?.flipH || options?.flipV) {
          ctx.save();
          ctx.scale(options.flipH ? -1 : 1, options.flipV ? -1 : 1);
          ctx.drawImage(
            img,
            options.flipH ? -width : 0,
            options.flipV ? -height : 0,
            width,
            height
          );
          ctx.restore();
        } else {
          ctx.drawImage(img, 0, 0, width, height);
        }
      }

      // Handle crop
      if (options?.crop) {
        const { x, y, w, h } = options.crop;
        const croppedCanvas = document.createElement('canvas');
        croppedCanvas.width = w;
        croppedCanvas.height = h;
        const croppedCtx = croppedCanvas.getContext('2d');
        if (croppedCtx) {
          croppedCtx.drawImage(canvas, x, y, w, h, 0, 0, w, h);
          canvas.width = w;
          canvas.height = h;
          ctx.drawImage(croppedCanvas, 0, 0);
        }
      }

      // Handle color adjustments
      if (options?.brightness || options?.contrast || options?.saturation) {
        const filter = this.buildColorFilter(options);
        ctx.filter = filter;
        ctx.drawImage(canvas, 0, 0);
        ctx.filter = 'none';
      }

      this.reportProgress(job.id, 'encoding', 80, 'Encoding...', onProgress);

      // Determine output format
      const targetFormat = options?.targetFormat || file.name.split('.').pop() || 'png';
      const mimeType = this.getMimeType(targetFormat);
      const quality = (options?.quality ?? 92) / 100;

      // Convert to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => b ? resolve(b) : reject(new Error('Conversion failed')),
          mimeType,
          quality
        );
      });

      this.reportProgress(job.id, 'complete', 100, 'Complete', onProgress);

      const filename = this.generateFilename(file.name, targetFormat);

      return this.success(blob, filename, mimeType);

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Canvas conversion failed';
      return this.failure(message, 'CONVERSION_FAILED');
    }
  }

  // ---------------------------------------------------------------------------
  // HELPER METHODS
  // ---------------------------------------------------------------------------

  private loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  private calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    options?: ConversionJob['options']
  ): { width: number; height: number } {
    let width = originalWidth;
    let height = originalHeight;

    if (options?.width || options?.height) {
      if (options?.maintainAspect !== false) {
        const aspectRatio = originalWidth / originalHeight;
        if (options.width && !options.height) {
          width = options.width;
          height = Math.round(width / aspectRatio);
        } else if (options.height && !options.width) {
          height = options.height;
          width = Math.round(height * aspectRatio);
        } else {
          width = options.width || width;
          height = options.height || height;
        }
      } else {
        width = options.width || width;
        height = options.height || height;
      }
    }

    return { width, height };
  }

  private getMimeType(format: string): string {
    const mimes: Record<string, string> = {
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      webp: 'image/webp',
      gif: 'image/gif',
      bmp: 'image/bmp',
      tiff: 'image/tiff',
    };
    return mimes[format.toLowerCase()] || 'image/png';
  }

  private generateFilename(original: string, format: string): string {
    const base = original.replace(/\.[^/.]+$/, '');
    return `${base}.${format}`;
  }

  private buildColorFilter(options: ConversionJob['options']): string {
    const filters: string[] = [];

    if (options?.brightness) {
      filters.push(`brightness(${100 + options.brightness}%)`);
    }
    if (options?.contrast) {
      filters.push(`contrast(${100 + options.contrast}%)`);
    }
    if (options?.saturation) {
      filters.push(`saturate(${100 + options.saturation}%)`);
    }

    return filters.join(' ') || 'none';
  }
}

// Register with factory
providerFactory.register('canvas', CanvasProvider);

export { CanvasProvider };
