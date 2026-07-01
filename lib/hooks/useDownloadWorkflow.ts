"use client";

/**
 * lib/hooks/useDownloadWorkflow.ts
 *
 * Phase 6C-4 — Shared hook for all conversion providers.
 *
 * Every tool, converter, and processor must use this hook to route the
 * result through the DownloadWorkflowManager instead of triggering a
 * direct browser download.
 *
 * Usage:
 *   const { storeAndRedirect } = useDownloadWorkflow();
 *
 *   // In your processing handler, after getting the blob:
 *   storeAndRedirect(resultBlob, {
 *     inputFilename:   file.name,
 *     outputFilename:  `converted_${file.name}`,
 *     inputFormat:     'mp4',
 *     outputFormat:    'mp3',
 *     inputSizeBytes:  file.size,
 *     providerId:      'Transcoder',       // optional
 *     libraryId:       'ffmpeg-wasm',      // optional
 *     durationMs:      Date.now() - t0,    // optional
 *   });
 */

import { useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { downloadWorkflowManager } from "@/lib/engine/download-workflow-manager";
import type { ConversionSummary } from "@/lib/types/download-workflow";

// ---------------------------------------------------------------------------
// PARAMS
// ---------------------------------------------------------------------------

export interface DownloadWorkflowParams {
  inputFilename: string;
  outputFilename: string;
  /** Input format extension without dot (e.g. 'mp4', 'png') */
  inputFormat: string;
  /** Output format extension without dot (e.g. 'mp3', 'webp') */
  outputFormat: string;
  inputSizeBytes: number;
  /** Provider that performed the conversion (default: 'BrowserProcessor') */
  providerId?: string;
  /** Library that performed the conversion (default: 'browser') */
  libraryId?: string;
  /** Processing duration in ms (default: 0 when not measured) */
  durationMs?: number;
  processingEnv?: "browser" | "server";
}

// ---------------------------------------------------------------------------
// HOOK
// ---------------------------------------------------------------------------

export function useDownloadWorkflow() {
  const router   = useRouter();
  const pathname = usePathname();

  /**
   * Store a completed conversion result in DownloadWorkflowManager and
   * redirect the user to the /download page.
   *
   * This is the ONLY way any tool may deliver a file to the user.
   * Direct browser downloads (`<a download>`, `triggerFileDownload`) are
   * forbidden after Phase 6C-3.
   *
   * @param blob   - The output blob produced by the processor
   * @param params - Metadata about the conversion
   */
  const storeAndRedirect = useCallback(
    (blob: Blob, params: DownloadWorkflowParams) => {
      const blobUrl = URL.createObjectURL(blob);

      const summary: ConversionSummary = {
        jobId:           downloadWorkflowManager.generateJobId(),
        inputFilename:   params.inputFilename,
        outputFilename:  params.outputFilename,
        inputSizeBytes:  params.inputSizeBytes,
        outputSizeBytes: blob.size,
        inputFormat:     params.inputFormat,
        outputFormat:    params.outputFormat,
        providerId:      params.providerId     ?? "BrowserProcessor",
        libraryId:       params.libraryId      ?? "browser",
        processingEnv:   params.processingEnv  ?? "browser",
        completedAt:     new Date().toISOString(),
        durationMs:      params.durationMs     ?? 0,
        available:       true,
        expiresAt:       null,
      };

      downloadWorkflowManager.storeJob(summary, blob, blobUrl);

      const locale = pathname.split("/")[1] || "en";
      router.push(`/${locale}/download?jobId=${summary.jobId}`);
    },
    [router, pathname],
  );

  return { storeAndRedirect };
}
