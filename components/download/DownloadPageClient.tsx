"use client";

/**
 * components/download/DownloadPageClient.tsx
 *
 * Phase 6C-3 — Download Page (Client Component)
 *
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  ARCHITECTURE COMPLIANCE                                             ║
 * ║                                                                      ║
 * ║  ✓ Advertisement visibility: subscriptionService.shouldShowAds()    ║
 * ║  ✓ Related Converters: conversionRegistry only — no hardcoding      ║
 * ║  ✓ Related Tools: processorRegistry only — no hardcoding            ║
 * ║  ✓ Plan features: subscriptionService.getPlanFeatures()             ║
 * ║  ✓ Limits: subscriptionService.getEffectiveLimits()                 ║
 * ║  ✓ No plan name comparisons anywhere in this file                   ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Layout for FREE users:
 *   Top Ad → Conversion Summary → Download Button → Middle Ad
 *   → Related Converters → Related Tools → Bottom Ad → History
 *
 * Layout for Premium users (adsEnabled = false):
 *   Conversion Summary → Download Button → Related Converters → Related Tools → History
 */

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Download,
  ArrowRight,
  Clock,
  FileDown,
  Zap,
  RotateCcw,
  ChevronRight,
  History,
  Wrench,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

import { downloadWorkflowManager } from "@/lib/engine/download-workflow-manager";
import { subscriptionService } from "@/lib/services/subscription-service";
import { popularConvertersEngine } from "@/lib/engine/popular-converters-engine";
import { conversionRegistry } from "@/lib/registry/conversion-registry";
import { processorRegistry } from "@/lib/registry/processor-registry";
import { formatRegistry } from "@/lib/registry/format-registry";
import { DEFAULT_PLAN_ID } from "@/lib/config/subscription-config";
import AdSlot from "@/components/ads/ad-slot";
import type { DownloadPageContext, DownloadHistoryEntry } from "@/lib/types/download-workflow";
import type { ProcessorDefinition } from "@/lib/registry/processor-registry";

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes >= 1_073_741_824) return (bytes / 1_073_741_824).toFixed(1) + " GB";
  if (bytes >= 1_048_576) return (bytes / 1_048_576).toFixed(1) + " MB";
  if (bytes >= 1024) return (bytes / 1024).toFixed(1) + " KB";
  return bytes + " B";
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60_000)}m ${Math.round((ms % 60_000) / 1000)}s`;
}

function compressionRatio(inBytes: number, outBytes: number): string {
  if (inBytes === 0) return "—";
  const ratio = ((1 - outBytes / inBytes) * 100);
  if (ratio > 0) return `-${ratio.toFixed(0)}%`;
  if (ratio < 0) return `+${Math.abs(ratio).toFixed(0)}%`;
  return "0%";
}

function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

// ---------------------------------------------------------------------------
// SUB-COMPONENTS
// ---------------------------------------------------------------------------

function ExtBadge({ ext, className = "" }: { ext: string; className?: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded px-2 py-0.5 text-xs font-bold uppercase tracking-wider bg-slate-800 text-slate-200 ${className}`}
      data-testid={`ext-badge-${ext}`}
    >
      .{ext}
    </span>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 min-w-0">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
        {label}
      </span>
      <span className="text-lg font-bold text-slate-900 leading-tight truncate max-w-full">
        {value}
      </span>
      {sub && (
        <span className="text-[10px] text-slate-400 truncate max-w-full">{sub}</span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// RELATED CONVERTERS (Registry-driven — no hardcoding)
// ---------------------------------------------------------------------------

function RelatedConverters({
  inputFormat,
  outputFormat,
  locale,
}: {
  inputFormat: string;
  outputFormat: string;
  locale: string;
}) {
  // All target conversions from the Conversion Registry for this input format
  const targets = conversionRegistry.getTargets(inputFormat);

  // Build converter list, excluding the one just completed
  const converters = targets
    .filter((t) => t !== outputFormat)
    .slice(0, 8)
    .map((target) => {
      const targetFormat = formatRegistry.get(target);
      const inputFmt = formatRegistry.get(inputFormat);
      return {
        slug: `${inputFormat}-to-${target}`,
        label: `${inputFormat.toUpperCase()} to ${target.toUpperCase()}`,
        href: `/${locale}/${inputFormat}-to-${target}`,
        inputName: inputFmt?.name ?? inputFormat.toUpperCase(),
        outputName: targetFormat?.name ?? target.toUpperCase(),
      };
    })
    .filter((c) => c.label);

  if (converters.length === 0) return null;

  return (
    <section data-testid="related-converters-section">
      <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-3">
        Related Converters
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {converters.map((c) => (
          <Link
            key={c.slug}
            href={c.href}
            data-testid={`related-converter-${c.slug}`}
            className="group flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-700 transition-all hover:border-cyan-400 hover:bg-cyan-50 hover:text-cyan-700 hover:shadow-sm"
          >
            <ExtBadge ext={inputFormat} className="shrink-0 text-[9px]" />
            <ArrowRight className="h-3 w-3 shrink-0 text-slate-400 group-hover:text-cyan-500" />
            <ExtBadge ext={c.slug.split("-to-")[1] ?? ""} className="shrink-0 text-[9px]" />
            <span className="truncate ml-0.5">{c.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// POPULAR IN CATEGORY (Popular Converters Engine — Phase 7)
// ---------------------------------------------------------------------------

function PopularCategorySection({
  inputFormat,
  locale,
}: {
  inputFormat: string;
  locale: string;
}) {
  const inputFmt = formatRegistry.get(inputFormat);
  if (!inputFmt) return null;
  const popular = popularConvertersEngine.getTopForCategory(inputFmt.category, locale, 6);
  if (popular.length === 0) return null;

  return (
    <section data-testid="popular-category-section">
      <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
        <Zap className="h-3.5 w-3.5" />
        Popular {inputFmt.category.charAt(0).toUpperCase() + inputFmt.category.slice(1)} Conversions
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {popular.map(conv => (
          <Link
            key={`${conv.from}-${conv.to}`}
            href={conv.href}
            data-testid={`popular-cat-${conv.from}-${conv.to}`}
            className="group flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-700 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700 hover:shadow-sm transition-all"
          >
            <span className="font-bold uppercase text-[10px]">{conv.from}</span>
            <ArrowRight className="h-3 w-3 shrink-0 text-slate-400 group-hover:text-emerald-500" />
            <span className="font-bold uppercase text-[10px] text-emerald-600">{conv.to}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// RELATED TOOLS (Processor Registry-driven — no hardcoding)
// ---------------------------------------------------------------------------

function RelatedTools({
  inputFormat,
  outputFormat,
  locale,
}: {
  inputFormat: string;
  outputFormat: string;
  locale: string;
}) {
  const inputFmt = formatRegistry.get(inputFormat);
  const category = inputFmt?.category;

  // All processors for this category from the Processor Registry
  const tools: ProcessorDefinition[] = category
    ? processorRegistry
        .getByCategory(category)
        .filter((p) => !p.premium && p.browserSupported)
        .slice(0, 10)
    : [];

  if (tools.length === 0) return null;

  return (
    <section data-testid="related-tools-section">
      <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
        <Wrench className="h-3.5 w-3.5" />
        Related Tools
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {tools.map((tool) => (
          <Link
            key={tool.id}
            href={`/${locale}/tools`}
            data-testid={`related-tool-${tool.slug}`}
            className="group flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-700 transition-all hover:border-violet-400 hover:bg-violet-50 hover:text-violet-700 hover:shadow-sm"
          >
            <Zap className="h-3 w-3 shrink-0 text-slate-400 group-hover:text-violet-500" />
            <span className="truncate">{tool.title}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// DOWNLOAD HISTORY (In-memory + localStorage — no hardcoding)
// ---------------------------------------------------------------------------

function DownloadHistory({
  history,
  locale,
}: {
  history: DownloadHistoryEntry[];
  locale: string;
}) {
  if (history.length === 0) return null;

  return (
    <section data-testid="download-history-section">
      <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
        <History className="h-3.5 w-3.5" />
        Recent Downloads
      </h2>
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden divide-y divide-slate-100">
        {history.slice(0, 10).map((entry) => (
          <div
            key={entry.id}
            data-testid={`history-entry-${entry.id}`}
            className="flex items-center justify-between px-4 py-3 gap-3 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <ExtBadge ext={entry.format} />
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-800 truncate">
                  {entry.filename}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {formatBytes(entry.sizeBytes)} · {formatTimestamp(entry.downloadedAt)}
                </p>
              </div>
            </div>
            <Link
              href={`/${locale}/download?jobId=${entry.jobId}`}
              className="text-[10px] font-medium text-cyan-600 hover:text-cyan-700 shrink-0 flex items-center gap-1"
              data-testid={`history-link-${entry.jobId}`}
            >
              View <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// NOT FOUND STATE
// ---------------------------------------------------------------------------

function JobNotFound({ locale }: { locale: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4 text-center"
      data-testid="job-not-found"
    >
      <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center">
        <AlertCircle className="h-8 w-8 text-amber-500" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-slate-900">File No Longer Available</h1>
        <p className="text-sm text-slate-500 max-w-md">
          This download link has expired or is no longer available. Converted files are
          stored in your browser session and are removed when you close the tab or refresh
          the page.
        </p>
      </div>
      <Link
        href={`/${locale}`}
        data-testid="convert-again-btn"
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-md hover:opacity-90 transition-all"
      >
        <RotateCcw className="h-4 w-4" />
        Convert Another File
      </Link>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DOWNLOAD PAGE CLIENT — Main Component
// ---------------------------------------------------------------------------

interface Props {
  locale: string;
}

export default function DownloadPageClient({ locale }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const jobId = searchParams.get("jobId");

  const [context, setContext] = useState<DownloadPageContext | null>(null);
  const [blobAvailable, setBlobAvailable] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<DownloadHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadComplete, setDownloadComplete] = useState(false);

  // ── Load job data on mount ────────────────────────────────────────────────

  useEffect(() => {
    if (!jobId) {
      setIsLoading(false);
      return;
    }

    async function loadJob() {
      try {
        const job = downloadWorkflowManager.getJob(jobId!);
        if (!job) {
          setIsLoading(false);
          return;
        }

        const isAvailable = downloadWorkflowManager.isBlobAvailable(jobId!);
        setBlobAvailable(isAvailable);

        if (isAvailable) {
          setDownloadUrl(downloadWorkflowManager.getDownloadUrl(jobId!));
        }

        // Build DownloadPageContext via SubscriptionService
        const ctx = await downloadWorkflowManager.buildContext(
          job.summary,
          null,
          DEFAULT_PLAN_ID,
        );
        setContext(ctx);

        // Load history (exclude current job)
        const hist = await downloadWorkflowManager.getHistory("anonymous");
        setHistory(hist.filter((h) => h.jobId !== jobId));
      } catch (err) {
        console.error("[DownloadPage] Failed to load job:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadJob();

    // Cleanup expired jobs in the background
    downloadWorkflowManager.cleanupExpired().catch(() => {});
  }, [jobId]);

  // ── Handle Download ───────────────────────────────────────────────────────

  const handleDownload = useCallback(async () => {
    if (!downloadUrl || !context) return;
    setIsDownloading(true);

    try {
      // Trigger the browser file download
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = context.conversion.outputFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Record download to history via DownloadWorkflowManager
      await downloadWorkflowManager.recordDownload(null, context.conversion);

      setDownloadComplete(true);

      // Refresh history
      const hist = await downloadWorkflowManager.getHistory("anonymous");
      setHistory(hist.filter((h) => h.jobId !== jobId));
    } catch (err) {
      console.error("[DownloadPage] Download failed:", err);
    } finally {
      setIsDownloading(false);
    }
  }, [downloadUrl, context, jobId]);

  // ── Render ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center min-h-[60vh]"
        data-testid="download-page-loading"
      >
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 text-cyan-500 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Preparing download…</p>
        </div>
      </div>
    );
  }

  if (!jobId || !context) {
    return <JobNotFound locale={locale} />;
  }

  const { conversion, planId, adsEnabled, hasDownloadHistory } = context;

  // Compute display values
  const inputSize = formatBytes(conversion.inputSizeBytes);
  const outputSize = formatBytes(conversion.outputSizeBytes);
  const ratio = compressionRatio(conversion.inputSizeBytes, conversion.outputSizeBytes);
  const duration = formatDuration(conversion.durationMs);
  const completedAt = formatTimestamp(conversion.completedAt);

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8 px-4"
      data-testid="download-page"
    >
      <div className="max-w-2xl mx-auto space-y-6">

        {/* ── Top Ad (Free users only — controlled by SubscriptionService) ── */}
        {adsEnabled && (
          <div className="flex justify-center" data-testid="ad-slot-top">
            <AdSlot
              adUnit="download-top"
              width={728}
              height={90}
              planId={planId}
              className="max-w-full"
            />
          </div>
        )}

        {/* ── Page header ── */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-4 py-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              Conversion Complete
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
            Your file is ready
          </h1>
          <p className="text-sm text-slate-500">
            {conversion.inputFilename} converted to {conversion.outputFormat.toUpperCase()}
          </p>
        </div>

        {/* ── Conversion Summary Card ── */}
        <div
          className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
          data-testid="conversion-summary-card"
        >
          {/* Input → Output flow */}
          <div className="flex items-center justify-between gap-4 px-6 py-5 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
            {/* Input */}
            <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
              <ExtBadge ext={conversion.inputFormat} />
              <span className="text-xs text-slate-500 font-medium mt-0.5">Original</span>
              <span
                className="text-base font-bold text-slate-900"
                data-testid="input-size"
              >
                {inputSize}
              </span>
              <span
                className="text-[10px] text-slate-400 truncate max-w-full px-1 text-center"
                data-testid="input-filename"
              >
                {conversion.inputFilename}
              </span>
            </div>

            {/* Arrow */}
            <div className="flex flex-col items-center shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center shadow-md">
                <ArrowRight className="h-5 w-5 text-white" />
              </div>
            </div>

            {/* Output */}
            <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
              <ExtBadge ext={conversion.outputFormat} />
              <span className="text-xs text-slate-500 font-medium mt-0.5">Converted</span>
              <span
                className="text-base font-bold text-slate-900"
                data-testid="output-size"
              >
                {outputSize}
              </span>
              <span
                className="text-[10px] text-slate-400 truncate max-w-full px-1 text-center"
                data-testid="output-filename"
              >
                {conversion.outputFilename}
              </span>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 divide-x divide-slate-100 border-b border-slate-100">
            <div className="py-4 px-3" data-testid="stat-compression">
              <StatCard
                label="Compression"
                value={ratio}
              />
            </div>
            <div className="py-4 px-3" data-testid="stat-duration">
              <StatCard
                label="Duration"
                value={duration}
              />
            </div>
            <div className="py-4 px-3" data-testid="stat-provider">
              <StatCard
                label="Provider"
                value={conversion.processingEnv === "browser" ? "Browser" : "Server"}
                sub={conversion.providerId}
              />
            </div>
            <div className="py-4 px-3" data-testid="stat-completed">
              <StatCard
                label="Completed"
                value={completedAt}
              />
            </div>
          </div>

          {/* Retention info */}
          <div className="px-6 py-3 flex items-center justify-between bg-slate-50/60">
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <Clock className="h-3.5 w-3.5" />
              <span>
                {context.downloadRetentionDays > 0
                  ? `Available for ${context.downloadRetentionDays} day${context.downloadRetentionDays > 1 ? "s" : ""}`
                  : "Available this session only"}
              </span>
            </div>
            {context.upgradeEligible && context.nextPlan && (
              <Link
                href={`/${locale}/pricing`}
                className="text-[11px] font-medium text-cyan-600 hover:text-cyan-700 flex items-center gap-1"
                data-testid="upgrade-cta-retention"
              >
                Extend with {context.nextPlan.charAt(0).toUpperCase() + context.nextPlan.slice(1)} plan
                <ChevronRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        </div>

        {/* ── Download Button ── */}
        <div className="flex flex-col items-center gap-3" data-testid="download-section">
          {blobAvailable ? (
            <>
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                data-testid="download-button"
                className="w-full flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-4 text-base font-bold text-white shadow-lg shadow-emerald-200 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isDownloading ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    Downloading…
                  </>
                ) : downloadComplete ? (
                  <>
                    <FileDown className="h-5 w-5" />
                    Download Again
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5" />
                    Download {conversion.outputFilename}
                  </>
                )}
              </button>
              {downloadComplete && (
                <p
                  className="text-xs text-emerald-600 font-medium"
                  data-testid="download-complete-msg"
                >
                  Download started — check your downloads folder
                </p>
              )}
            </>
          ) : (
            /* Blob expired (page was refreshed) */
            <div
              className="w-full rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50 p-6 text-center space-y-3"
              data-testid="blob-expired-notice"
            >
              <AlertCircle className="h-8 w-8 text-amber-400 mx-auto" />
              <div>
                <p className="text-sm font-semibold text-amber-800">
                  File no longer available
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  Browser-processed files are stored in memory and are lost on page
                  refresh. Please convert your file again to download it.
                </p>
              </div>
              <Link
                href={`/${locale}`}
                data-testid="reconvert-btn"
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                Convert Again
              </Link>
            </div>
          )}

          {/* Convert another file */}
          <Link
            href={`/${locale}`}
            data-testid="convert-another-link"
            className="text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors flex items-center gap-1"
          >
            <RotateCcw className="h-3 w-3" />
            Convert another file
          </Link>
        </div>

        {/* ── Middle Ad (Free users only) ── */}
        {adsEnabled && (
          <div className="flex justify-center" data-testid="ad-slot-middle">
            <AdSlot
              adUnit="download-middle"
              width={728}
              height={90}
              planId={planId}
              className="max-w-full"
            />
          </div>
        )}

        {/* ── Related Converters (Registry-driven) ── */}
        <RelatedConverters
          inputFormat={conversion.inputFormat}
          outputFormat={conversion.outputFormat}
          locale={locale}
        />

        {/* ── Popular in this category (engine-driven) ── */}
        <PopularCategorySection
          inputFormat={conversion.inputFormat}
          locale={locale}
        />

        {/* ── Related Tools (Processor Registry-driven) ── */}
        <RelatedTools
          inputFormat={conversion.inputFormat}
          outputFormat={conversion.outputFormat}
          locale={locale}
        />

        {/* ── Bottom Ad (Free users only) ── */}
        {adsEnabled && (
          <div className="flex justify-center" data-testid="ad-slot-bottom">
            <AdSlot
              adUnit="download-bottom"
              width={728}
              height={90}
              planId={planId}
              className="max-w-full"
            />
          </div>
        )}

        {/* ── Download History ── */}
        {(hasDownloadHistory || history.length > 0) && (
          <DownloadHistory history={history} locale={locale} />
        )}

      </div>
    </div>
  );
}
