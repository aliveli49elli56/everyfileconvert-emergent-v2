/**
 * lib/infrastructure/providers/auth-provider.ts
 *
 * Auth Provider — Interface + Stub Implementation
 *
 * IAuthProvider: implementation-agnostic interface.
 * StubAuthProvider: memory stub used when ENABLE_AUTH = false.
 *
 * Future provider (Phase 6D-2): Auth.js / Clerk
 * Swap: register AuthJsProvider with the same token — no business logic changes.
 */

import type { ProviderMetadata } from '../types';

// ---------------------------------------------------------------------------
// AUTH TYPES
// ---------------------------------------------------------------------------

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  planId: string;
  createdAt: string;
}

export interface AuthSession {
  userId: string;
  token: string;
  expiresAt: string;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  session?: AuthSession;
  error?: string;
}

// ---------------------------------------------------------------------------
// INTERFACE
// ---------------------------------------------------------------------------

/**
 * Implementation-agnostic Auth Provider interface.
 * Future providers (Auth.js, Clerk) must implement this contract.
 * Swapping providers requires only a DI container re-registration.
 */
export interface IAuthProvider {
  /** Provider metadata for diagnostics */
  getMetadata(): ProviderMetadata;
  /** Authenticate user with credentials */
  authenticate(credentials: AuthCredentials): Promise<AuthResult>;
  /** Validate an existing session token */
  validateSession(token: string): Promise<AuthSession | null>;
  /** Terminate a session */
  revokeSession(token: string): Promise<void>;
  /** Register a new user */
  register(credentials: AuthCredentials & { name?: string }): Promise<AuthResult>;
  /** Request password reset */
  requestPasswordReset(email: string): Promise<{ sent: boolean }>;
  /** Get the current authenticated user from a session token */
  getUser(token: string): Promise<AuthUser | null>;
}

// ---------------------------------------------------------------------------
// STUB IMPLEMENTATION
// ---------------------------------------------------------------------------

/**
 * Stub Auth Provider — used when ENABLE_AUTH = false.
 * All operations return safe no-op responses.
 * No auth logic executes — browser processing is unaffected.
 */
export class StubAuthProvider implements IAuthProvider {
  private readonly metadata: ProviderMetadata = {
    id:             'stub-auth',
    displayName:    'Stub Auth Provider',
    version:        '1.0.0',
    enabled:        false,
    dependencies:   [],
    priority:       10,
    healthStatus:   'unknown',
    capabilities:   ['authenticate', 'validateSession', 'register', 'passwordReset'],
    futureProvider: 'auth.js',
  };

  getMetadata(): ProviderMetadata {
    return { ...this.metadata, healthStatus: 'unknown' };
  }

  async authenticate(_credentials: AuthCredentials): Promise<AuthResult> {
    return { success: false, error: 'Auth not enabled (ENABLE_AUTH=false)' };
  }

  async validateSession(_token: string): Promise<AuthSession | null> {
    return null;
  }

  async revokeSession(_token: string): Promise<void> {
    // no-op
  }

  async register(_credentials: AuthCredentials & { name?: string }): Promise<AuthResult> {
    return { success: false, error: 'Auth not enabled (ENABLE_AUTH=false)' };
  }

  async requestPasswordReset(_email: string): Promise<{ sent: boolean }> {
    return { sent: false };
  }

  async getUser(_token: string): Promise<AuthUser | null> {
    return null;
  }
}

export const stubAuthProvider = new StubAuthProvider();
