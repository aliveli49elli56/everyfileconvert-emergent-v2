/**
 * lib/di/service-registration.ts
 *
 * Foundational DI descriptor types: ServiceToken and ServiceRegistration.
 *
 * Design principles:
 *   - ServiceToken<T> carries TypeScript type information for compile-time safety
 *   - ServiceRegistration<T> is the complete descriptor for a service
 *   - No concrete implementations here — pure types and descriptors
 *
 * Rule: All future infrastructure services MUST be registered through
 *       ServiceContainer. Direct instantiation outside the container is
 *       prohibited for infrastructure services.
 */

// ---------------------------------------------------------------------------
// SERVICE TOKEN
// ---------------------------------------------------------------------------

/**
 * Branded identifier for a service. Carries its TypeScript interface type
 * so that container.resolve(token) returns the correct type automatically.
 *
 * @template T — the service interface type this token represents
 *
 * @example
 *   export const LOGGER_TOKEN = new ServiceToken<ILogger>('Logger');
 *   const logger = container.resolve(LOGGER_TOKEN); // → ILogger
 */
export class ServiceToken<T> {
  /** Human-readable identifier used in error messages and diagnostics */
  readonly id: string;

  constructor(id: string) {
    this.id = id;
  }

  toString(): string {
    return `ServiceToken(${this.id})`;
  }
}

// ---------------------------------------------------------------------------
// SERVICE SCOPE
// ---------------------------------------------------------------------------

/**
 * Controls the instantiation lifecycle of a service.
 *
 * - singleton: one instance per container (recommended for stateful services)
 * - transient: new instance on every resolve (for stateless utilities)
 */
export type ServiceScope = 'singleton' | 'transient';

// ---------------------------------------------------------------------------
// REGISTRATION METADATA
// ---------------------------------------------------------------------------

export interface ServiceRegistrationMetadata {
  /** Human-readable display name for diagnostics and health reports */
  name: string;
  /** Short description of what this service does */
  description?: string;
  /** Tokens this service depends on (used for dep-graph reporting) */
  dependsOn?: Array<ServiceToken<unknown>>;
  /** Free-form tags (e.g. 'infrastructure', 'core', 'stub') */
  tags?: string[];
  /** Marks this service as part of the infrastructure DI layer */
  isInfrastructure?: boolean;
}

// ---------------------------------------------------------------------------
// SERVICE REGISTRATION DESCRIPTOR
// ---------------------------------------------------------------------------

/**
 * Complete descriptor for a service registered in the container.
 *
 * @template T — the service interface type
 *
 * @example
 *   const reg: ServiceRegistration<ILogger> = {
 *     token:   LOGGER_TOKEN,
 *     factory: () => new ConsoleLogger(),
 *     scope:   'singleton',
 *     metadata: { name: 'Logger', isInfrastructure: true },
 *   };
 */
export interface ServiceRegistration<T> {
  /** Typed token — identifies and types this service */
  token: ServiceToken<T>;
  /** Factory called to create the service instance */
  factory: (container: import('./service-container').ServiceContainer) => T;
  /** Instantiation scope */
  scope: ServiceScope;
  /** Diagnostic metadata */
  metadata: ServiceRegistrationMetadata;
}
