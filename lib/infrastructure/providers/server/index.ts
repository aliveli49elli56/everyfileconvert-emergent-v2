/**
 * lib/infrastructure/providers/server/index.ts
 * Barrel export for all server provider interfaces and stubs.
 */

export type { IFFmpegServerProvider, FFmpegConversionOptions, FFmpegConversionResult, FFmpegServerCapabilities } from './ffmpeg-server-provider';
export { StubFFmpegServerProvider, stubFFmpegServerProvider } from './ffmpeg-server-provider';

export type { ILibreOfficeProvider, LibreOfficeConversionOptions, LibreOfficeConversionResult, LibreOfficeFormat } from './libreoffice-provider';
export { StubLibreOfficeProvider, stubLibreOfficeProvider } from './libreoffice-provider';

export type { IGhostscriptProvider, GhostscriptCompressOptions, GhostscriptConversionResult } from './ghostscript-provider';
export { StubGhostscriptProvider, stubGhostscriptProvider } from './ghostscript-provider';

export type { ISharpProvider, SharpProcessOptions, SharpProcessResult, SharpOutputFormat } from './sharp-provider';
export { StubSharpProvider, stubSharpProvider } from './sharp-provider';

export type { IPuppeteerProvider, PuppeteerPdfOptions, PuppeteerScreenshotOptions, PuppeteerResult } from './puppeteer-provider';
export { StubPuppeteerProvider, stubPuppeteerProvider } from './puppeteer-provider';

export type {
  ICalibreProvider, CalibreConversionOptions, CalibreConversionResult, EbookFormat,
  IOCRProvider, OCROptions, OCRResult,
  IAIProcessingProvider, AIDocumentAnalysisOptions, AIDocumentAnalysisResult,
} from './calibre-provider';
export {
  StubCalibreProvider, stubCalibreProvider,
  StubOCRProvider, stubOCRProvider,
  StubAIProcessingProvider, stubAIProcessingProvider,
} from './calibre-provider';
