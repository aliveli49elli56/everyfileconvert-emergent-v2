/**
 * lib/infrastructure/providers/logging-provider.ts
 *
 * Logging Provider — Interface + Console Implementation
 *
 * ILogger: structured logging interface.
 * ConsoleLogger: console.* based implementation (always active, no stub needed).
 *
 * Future enhancement: DataDog / CloudWatch integration.
 * Replace ConsoleLogger entries with a remote logger — no business logic changes.
 */

import type { ProviderMetadata } from '../types';

// ---------------------------------------------------------------------------
// LOGGING TYPES
// ---------------------------------------------------------------------------

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogContext {
  [key: string]: unknown;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: LogContext;
  timestamp: string;
  source?: string;
}

// ---------------------------------------------------------------------------
// INTERFACE
// ---------------------------------------------------------------------------

export interface ILogger {
  getMetadata(): ProviderMetadata;
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext):  void;
  warn(message: string, context?: LogContext):  void;
  error(message: string, context?: LogContext): void;
  fatal(message: string, context?: LogContext): void;
  child(source: string): ILogger;
}

// ---------------------------------------------------------------------------
// CONSOLE IMPLEMENTATION
// ---------------------------------------------------------------------------

export class ConsoleLogger implements ILogger {
  constructor(private readonly source?: string) {}

  private readonly metadata: ProviderMetadata = {
    id:             'console-logger',
    displayName:    'Console Logger',
    version:        '1.0.0',
    enabled:        true,    // Always enabled — console logging has no external dependency
    dependencies:   [],
    priority:       0,       // Highest priority — initialized first
    healthStatus:   'healthy',
    capabilities:   ['debug', 'info', 'warn', 'error', 'fatal', 'structured', 'child'],
    futureProvider: null,    // Console logging is the real implementation
  };

  getMetadata(): ProviderMetadata {
    return { ...this.metadata, id: this.source ? `console-logger-${this.source}` : this.metadata.id };
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    const entry: LogEntry = {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
      source:    this.source,
    };

    const prefix = this.source ? `[${this.source}]` : '[app]';
    const msg    = `${prefix} ${message}`;
    const safeLevel = level === 'fatal' ? 'error' : level;

    if (context && Object.keys(context).length > 0) {
      // eslint-disable-next-line no-console
      const fn = (console as unknown as Record<string, ((...args: unknown[]) => void) | undefined>)[safeLevel];
      if (typeof fn === 'function') { fn.call(console, msg, entry); } else { console.log(msg, entry); }
    } else {
      // eslint-disable-next-line no-console
      const fn = (console as unknown as Record<string, ((...args: unknown[]) => void) | undefined>)[safeLevel];
      if (typeof fn === 'function') { fn.call(console, msg); } else { console.log(msg); }
    }
  }

  debug(message: string, context?: LogContext): void { this.log('debug', message, context); }
  info(message: string,  context?: LogContext): void { this.log('info',  message, context); }
  warn(message: string,  context?: LogContext): void { this.log('warn',  message, context); }
  error(message: string, context?: LogContext): void { this.log('error', message, context); }
  fatal(message: string, context?: LogContext): void { this.log('fatal', message, context); }

  /**
   * Create a child logger with a source prefix.
   * @example const log = logger.child('DownloadManager'); log.info('Job stored');
   */
  child(source: string): ILogger {
    return new ConsoleLogger(this.source ? `${this.source}.${source}` : source);
  }
}

export const consoleLogger = new ConsoleLogger();
