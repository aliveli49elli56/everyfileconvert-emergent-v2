/**
 * lib/infrastructure/providers/user-repository.ts
 *
 * User Repository — Interface + Memory Implementation
 *
 * IUserRepository: implementation-agnostic repository interface.
 * MemoryUserRepository: in-memory store used when ENABLE_DB = false.
 *
 * Future provider (Phase 6D-2): PostgreSQL / Supabase
 * Swap: register PostgresUserRepository — no business logic changes.
 */

import type { ProviderMetadata } from '../types';

// ---------------------------------------------------------------------------
// USER TYPES
// ---------------------------------------------------------------------------

export interface UserRecord {
  id: string;
  email: string;
  name?: string;
  planId: string;
  passwordHash?: string;
  createdAt: string;
  updatedAt: string;
  emailVerified: boolean;
  deletedAt?: string;
}

export type UserCreateInput = Omit<UserRecord, 'id' | 'createdAt' | 'updatedAt'>;
export type UserUpdateInput = Partial<Omit<UserRecord, 'id' | 'createdAt'>>;

// ---------------------------------------------------------------------------
// INTERFACE
// ---------------------------------------------------------------------------

export interface IUserRepository {
  getMetadata(): ProviderMetadata;
  findById(id: string): Promise<UserRecord | null>;
  findByEmail(email: string): Promise<UserRecord | null>;
  create(input: UserCreateInput): Promise<UserRecord>;
  update(id: string, input: UserUpdateInput): Promise<UserRecord | null>;
  delete(id: string): Promise<boolean>;
  list(limit?: number, offset?: number): Promise<UserRecord[]>;
  count(): Promise<number>;
}

// ---------------------------------------------------------------------------
// MEMORY IMPLEMENTATION
// ---------------------------------------------------------------------------

export class MemoryUserRepository implements IUserRepository {
  private readonly store = new Map<string, UserRecord>();
  private idCounter = 1;

  private readonly metadata: ProviderMetadata = {
    id:             'memory-user-repository',
    displayName:    'Memory User Repository',
    version:        '1.0.0',
    enabled:        false,
    dependencies:   [],
    priority:       5,
    healthStatus:   'healthy',
    capabilities:   ['find', 'create', 'update', 'delete', 'list'],
    futureProvider: 'postgres',
  };

  getMetadata(): ProviderMetadata {
    return { ...this.metadata };
  }

  async findById(id: string): Promise<UserRecord | null> {
    return this.store.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    const users = Array.from(this.store.values());
    for (const user of users) {
      if (user.email === email && !user.deletedAt) return user;
    }
    return null;
  }

  async create(input: UserCreateInput): Promise<UserRecord> {
    const id   = String(this.idCounter++);
    const now  = new Date().toISOString();
    const user: UserRecord = {
      ...input,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.store.set(id, user);
    return user;
  }

  async update(id: string, input: UserUpdateInput): Promise<UserRecord | null> {
    const existing = this.store.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...input, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.store.delete(id);
  }

  async list(limit = 100, offset = 0): Promise<UserRecord[]> {
    return Array.from(this.store.values())
      .filter(u => !u.deletedAt)
      .slice(offset, offset + limit);
  }

  async count(): Promise<number> {
    return Array.from(this.store.values()).filter(u => !u.deletedAt).length;
  }
}

export const memoryUserRepository = new MemoryUserRepository();
