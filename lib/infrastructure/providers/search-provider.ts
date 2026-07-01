/**
 * lib/infrastructure/providers/search-provider.ts
 *
 * Search Provider — Interface + Stub Implementation
 *
 * ISearchProvider: full-text search interface.
 * StubSearchProvider: no-op when ENABLE_SEARCH = false.
 *
 * Future provider (Phase 6D-2): Elasticsearch / Algolia
 * Swap: register ElasticsearchProvider — no business logic changes.
 */

import type { ProviderMetadata } from '../types';

// ---------------------------------------------------------------------------
// SEARCH TYPES
// ---------------------------------------------------------------------------

export interface SearchQuery {
  q: string;
  index?: string;
  filters?: Record<string, unknown>;
  limit?: number;
  offset?: number;
  highlight?: boolean;
}

export interface SearchHit<T = Record<string, unknown>> {
  id: string;
  score: number;
  source: T;
  highlights?: Record<string, string[]>;
}

export interface SearchResult<T = Record<string, unknown>> {
  hits: SearchHit<T>[];
  total: number;
  took?: number;
}

export interface IndexDocumentOptions {
  id?: string;
  index: string;
}

// ---------------------------------------------------------------------------
// INTERFACE
// ---------------------------------------------------------------------------

export interface ISearchProvider {
  getMetadata(): ProviderMetadata;
  search<T = Record<string, unknown>>(query: SearchQuery): Promise<SearchResult<T>>;
  index(document: unknown, options: IndexDocumentOptions): Promise<{ id: string }>;
  delete(id: string, index: string): Promise<boolean>;
  createIndex(name: string, mapping?: unknown): Promise<void>;
  deleteIndex(name: string): Promise<void>;
  ping(): Promise<boolean>;
}

// ---------------------------------------------------------------------------
// STUB IMPLEMENTATION
// ---------------------------------------------------------------------------

export class StubSearchProvider implements ISearchProvider {
  private readonly metadata: ProviderMetadata = {
    id:             'stub-search',
    displayName:    'Stub Search Provider',
    version:        '1.0.0',
    enabled:        false,
    dependencies:   [],
    priority:       30,
    healthStatus:   'unknown',
    capabilities:   ['search', 'index', 'delete', 'createIndex'],
    futureProvider: 'elasticsearch',
  };

  getMetadata(): ProviderMetadata {
    return { ...this.metadata };
  }

  async search<T>(_query: SearchQuery): Promise<SearchResult<T>> {
    return { hits: [], total: 0 };
  }

  async index(_document: unknown, _options: IndexDocumentOptions): Promise<{ id: string }> {
    return { id: '' };
  }

  async delete(_id: string, _index: string): Promise<boolean> {
    return false;
  }

  async createIndex(_name: string, _mapping?: unknown): Promise<void> { /* no-op */ }
  async deleteIndex(_name: string): Promise<void> { /* no-op */ }

  async ping(): Promise<boolean> {
    return false;
  }
}

export const stubSearchProvider = new StubSearchProvider();
