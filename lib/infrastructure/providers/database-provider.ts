/**
 * lib/infrastructure/providers/database-provider.ts
 *
 * Database Provider — Interface + Memory Implementation
 *
 * IDatabaseProvider: generic relational/document DB interface.
 * MemoryDatabaseProvider: in-memory store when ENABLE_DB = false.
 *
 * Future provider (Phase 6D-2): PostgreSQL (via pg / Supabase)
 * Swap: register PostgresDatabaseProvider — no business logic changes.
 */

import type { ProviderMetadata } from '../types';

// ---------------------------------------------------------------------------
// DATABASE TYPES
// ---------------------------------------------------------------------------

export type DatabaseRecord = Record<string, unknown>;

export interface QueryResult<T = DatabaseRecord> {
  rows: T[];
  rowCount: number;
  duration?: number;
}

export interface DatabaseTransaction {
  query<T = DatabaseRecord>(sql: string, params?: unknown[]): Promise<QueryResult<T>>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

export interface DatabaseConnectionStatus {
  connected: boolean;
  latencyMs?: number;
  poolSize?: number;
  error?: string;
}

// ---------------------------------------------------------------------------
// INTERFACE
// ---------------------------------------------------------------------------

export interface IDatabaseProvider {
  getMetadata(): ProviderMetadata;
  query<T = DatabaseRecord>(sql: string, params?: unknown[]): Promise<QueryResult<T>>;
  execute(sql: string, params?: unknown[]): Promise<{ affectedRows: number }>;
  transaction(): Promise<DatabaseTransaction>;
  ping(): Promise<DatabaseConnectionStatus>;
  close(): Promise<void>;
}

// ---------------------------------------------------------------------------
// MEMORY IMPLEMENTATION
// ---------------------------------------------------------------------------

export class MemoryDatabaseProvider implements IDatabaseProvider {
  private readonly tables = new Map<string, DatabaseRecord[]>();

  private readonly metadata: ProviderMetadata = {
    id:             'memory-database',
    displayName:    'Memory Database Provider',
    version:        '1.0.0',
    enabled:        false,
    dependencies:   [],
    priority:       1,
    healthStatus:   'healthy',
    capabilities:   ['query', 'execute', 'transaction', 'ping'],
    futureProvider: 'postgres',
  };

  getMetadata(): ProviderMetadata {
    return { ...this.metadata };
  }

  async query<T = DatabaseRecord>(_sql: string, _params?: unknown[]): Promise<QueryResult<T>> {
    // Memory stub: no real SQL execution
    return { rows: [], rowCount: 0 };
  }

  async execute(_sql: string, _params?: unknown[]): Promise<{ affectedRows: number }> {
    return { affectedRows: 0 };
  }

  async transaction(): Promise<DatabaseTransaction> {
    return {
      async query<T = DatabaseRecord>(_sql: string, _params?: unknown[]): Promise<QueryResult<T>> {
        return { rows: [], rowCount: 0 };
      },
      async commit():   Promise<void> { /* no-op */ },
      async rollback(): Promise<void> { /* no-op */ },
    };
  }

  async ping(): Promise<DatabaseConnectionStatus> {
    return { connected: true, latencyMs: 0 };
  }

  async close(): Promise<void> {
    this.tables.clear();
  }
}

export const memoryDatabaseProvider = new MemoryDatabaseProvider();
