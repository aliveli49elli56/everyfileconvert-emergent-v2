/**
 * lib/infrastructure/providers/auth-extended.ts
 *
 * Phase 6D-1 Part 2 — Extended Authentication Provider Architecture
 *
 * Extends auth capabilities to support:
 *   - Auth.js (next-auth)
 *   - Clerk
 *   - OAuth2 (Google, GitHub, Twitter, etc.)
 *   - Email magic link
 *   - Social login aggregator
 *   - API key authentication
 *
 * IMPORTANT: Does NOT modify existing auth-provider.ts.
 *            Provides additional interfaces for future auth implementations.
 *            No authentication UI is created here.
 */

import type { ProviderMetadata } from '../types';

// ---------------------------------------------------------------------------
// OAUTH TYPES
// ---------------------------------------------------------------------------

export type OAuthProvider =
  | 'google'
  | 'github'
  | 'twitter'
  | 'facebook'
  | 'discord'
  | 'linkedin'
  | 'apple';

export interface OAuthProfile {
  provider:      OAuthProvider;
  externalId:    string;
  email:         string;
  name?:         string;
  avatarUrl?:    string;
  accessToken?:  string;
  refreshToken?: string;
  tokenExpiry?:  string;
  rawProfile?:   Record<string, unknown>;
}

export interface OAuthAuthorizationUrl {
  url:   string;
  state: string;
  codeChallenge?: string;
}

export interface OAuthCallbackResult {
  success:   boolean;
  profile?:  OAuthProfile;
  error?:    string;
}

// ---------------------------------------------------------------------------
// MAGIC LINK TYPES
// ---------------------------------------------------------------------------

export interface MagicLinkRequest {
  email:      string;
  redirectTo: string;
  expiresIn?: number;  // seconds
  metadata?:  Record<string, unknown>;
}

export interface MagicLinkResult {
  sent:   boolean;
  token?: string;  // Only returned in test/dev mode
  error?: string;
}

export interface MagicLinkVerification {
  valid:    boolean;
  email?:   string;
  userId?:  string;
  error?:   string;
}

// ---------------------------------------------------------------------------
// API KEY TYPES
// ---------------------------------------------------------------------------

export type ApiKeyScope = 'read' | 'write' | 'convert' | 'admin';

export interface ApiKey {
  id:          string;
  userId:      string;
  keyHash:     string;
  displayName: string;
  scopes:      ApiKeyScope[];
  lastUsedAt?: string;
  expiresAt?:  string;
  enabled:     boolean;
  createdAt:   string;
}

export interface ApiKeyValidationResult {
  valid:   boolean;
  apiKey?: ApiKey;
  error?:  string;
}

// ---------------------------------------------------------------------------
// SESSION TYPES
// ---------------------------------------------------------------------------

export interface AuthSessionData {
  userId:       string;
  email:        string;
  provider:     OAuthProvider | 'email' | 'api-key';
  sessionToken: string;
  expiresAt:    string;
  metadata?:    Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// INTERFACES
// ---------------------------------------------------------------------------

/**
 * OAuth2 Provider — supports social login with all major providers.
 * Future implementation: Auth.js OAuth handlers.
 */
export interface IOAuthProvider {
  getMetadata(): ProviderMetadata;
  getAuthorizationUrl(provider: OAuthProvider, redirectUri: string): Promise<OAuthAuthorizationUrl | null>;
  handleCallback(provider: OAuthProvider, code: string, state: string): Promise<OAuthCallbackResult>;
  refreshToken(provider: OAuthProvider, refreshToken: string): Promise<{ accessToken: string; expiresAt: string } | null>;
  revokeToken(provider: OAuthProvider, accessToken: string): Promise<boolean>;
  getSupportedProviders(): OAuthProvider[];
}

/**
 * Magic Link Provider — passwordless email authentication.
 * Future implementation: Auth.js email provider / Resend.
 */
export interface IMagicLinkProvider {
  getMetadata(): ProviderMetadata;
  sendMagicLink(request: MagicLinkRequest): Promise<MagicLinkResult>;
  verifyMagicLink(token: string): Promise<MagicLinkVerification>;
}

/**
 * API Key Provider — token-based authentication for API access.
 * Future implementation: database-backed key storage with scopes.
 */
export interface IApiKeyProvider {
  getMetadata(): ProviderMetadata;
  createApiKey(userId: string, displayName: string, scopes: ApiKeyScope[], expiresIn?: number): Promise<{ key: string; apiKey: ApiKey } | null>;
  validateApiKey(rawKey: string): Promise<ApiKeyValidationResult>;
  revokeApiKey(id: string, userId: string): Promise<boolean>;
  listApiKeys(userId: string): Promise<ApiKey[]>;
  rotateApiKey(id: string, userId: string): Promise<{ key: string; apiKey: ApiKey } | null>;
}

// ---------------------------------------------------------------------------
// STUB IMPLEMENTATIONS
// ---------------------------------------------------------------------------

export class StubOAuthProvider implements IOAuthProvider {
  private readonly metadata: ProviderMetadata = {
    id:             'stub-oauth',
    displayName:    'Stub OAuth Provider',
    version:        '1.0.0',
    enabled:        false,
    dependencies:   [],
    priority:       11,
    healthStatus:   'unknown',
    capabilities:   ['google', 'github', 'twitter', 'facebook', 'discord', 'linkedin', 'apple'],
    futureProvider: 'auth.js',
  };

  getMetadata(): ProviderMetadata { return { ...this.metadata }; }
  async getAuthorizationUrl(_p: OAuthProvider, _r: string): Promise<null> { return null; }
  async handleCallback(_p: OAuthProvider, _c: string, _s: string): Promise<OAuthCallbackResult> { return { success: false }; }
  async refreshToken(_p: OAuthProvider, _t: string): Promise<null> { return null; }
  async revokeToken(_p: OAuthProvider, _t: string): Promise<boolean> { return false; }
  getSupportedProviders(): OAuthProvider[] { return ['google', 'github', 'twitter', 'discord']; }
}

export class StubMagicLinkProvider implements IMagicLinkProvider {
  private readonly metadata: ProviderMetadata = {
    id:             'stub-magic-link',
    displayName:    'Stub Magic Link Provider',
    version:        '1.0.0',
    enabled:        false,
    dependencies:   [],
    priority:       12,
    healthStatus:   'unknown',
    capabilities:   ['magic-link', 'passwordless', 'email-auth'],
    futureProvider: 'resend',
  };

  getMetadata(): ProviderMetadata { return { ...this.metadata }; }
  async sendMagicLink(_r: MagicLinkRequest): Promise<MagicLinkResult> { return { sent: false }; }
  async verifyMagicLink(_t: string): Promise<MagicLinkVerification> { return { valid: false }; }
}

export class StubApiKeyProvider implements IApiKeyProvider {
  private readonly metadata: ProviderMetadata = {
    id:             'stub-api-key',
    displayName:    'Stub API Key Provider',
    version:        '1.0.0',
    enabled:        false,
    dependencies:   [],
    priority:       13,
    healthStatus:   'unknown',
    capabilities:   ['create-key', 'validate-key', 'revoke-key', 'rotate-key', 'scopes'],
    futureProvider: 'db-api-keys',
  };

  getMetadata(): ProviderMetadata { return { ...this.metadata }; }
  async createApiKey(_uid: string, _n: string, _s: ApiKeyScope[]): Promise<null> { return null; }
  async validateApiKey(_k: string): Promise<ApiKeyValidationResult> { return { valid: false }; }
  async revokeApiKey(_id: string, _uid: string): Promise<boolean> { return false; }
  async listApiKeys(_uid: string): Promise<ApiKey[]> { return []; }
  async rotateApiKey(_id: string, _uid: string): Promise<null> { return null; }
}

export const stubOAuthProvider     = new StubOAuthProvider();
export const stubMagicLinkProvider = new StubMagicLinkProvider();
export const stubApiKeyProvider    = new StubApiKeyProvider();
