/**
 * lib/infrastructure/providers/payment-provider.ts
 *
 * Payment Provider — Interface + Stub Implementation
 *
 * IPaymentProvider: implementation-agnostic interface.
 * StubPaymentProvider: no-op stub used when ENABLE_PAYMENTS = false.
 *
 * Future providers (Phase 6D-2): Stripe, PayPal
 * Swap: register StripeProvider or PayPalProvider — no business logic changes.
 */

import type { ProviderMetadata } from '../types';

// ---------------------------------------------------------------------------
// PAYMENT TYPES
// ---------------------------------------------------------------------------

export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'cancelled' | 'refunded';
export type BillingCycle  = 'monthly' | 'yearly';

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  clientSecret?: string;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'cancelled' | 'past_due';
  currentPeriodEnd: string;
  billingCycle: BillingCycle;
}

export interface PaymentResult {
  success: boolean;
  paymentIntentId?: string;
  subscriptionId?: string;
  error?: string;
}

export interface CheckoutSessionRequest {
  userId: string;
  planId: string;
  billingCycle: BillingCycle;
  successUrl: string;
  cancelUrl: string;
}

// ---------------------------------------------------------------------------
// INTERFACE
// ---------------------------------------------------------------------------

/**
 * Implementation-agnostic Payment Provider interface.
 * Future providers (Stripe, PayPal) must implement this contract.
 */
export interface IPaymentProvider {
  getMetadata(): ProviderMetadata;
  createCheckoutSession(request: CheckoutSessionRequest): Promise<{ sessionUrl: string | null }>;
  createSubscription(userId: string, planId: string, cycle: BillingCycle): Promise<Subscription | null>;
  cancelSubscription(subscriptionId: string): Promise<{ cancelled: boolean }>;
  getSubscription(userId: string): Promise<Subscription | null>;
  validateWebhook(payload: string, signature: string): Promise<{ valid: boolean; event?: unknown }>;
  getPortalUrl(customerId: string, returnUrl: string): Promise<string | null>;
}

// ---------------------------------------------------------------------------
// STUB IMPLEMENTATION
// ---------------------------------------------------------------------------

export class StubPaymentProvider implements IPaymentProvider {
  private readonly metadata: ProviderMetadata = {
    id:             'stub-payment',
    displayName:    'Stub Payment Provider',
    version:        '1.0.0',
    enabled:        false,
    dependencies:   [],
    priority:       20,
    healthStatus:   'unknown',
    capabilities:   ['checkout', 'subscription', 'webhook', 'portal'],
    futureProvider: 'stripe',
  };

  getMetadata(): ProviderMetadata {
    return { ...this.metadata };
  }

  async createCheckoutSession(_request: CheckoutSessionRequest): Promise<{ sessionUrl: string | null }> {
    return { sessionUrl: null };
  }

  async createSubscription(_userId: string, _planId: string, _cycle: BillingCycle): Promise<Subscription | null> {
    return null;
  }

  async cancelSubscription(_subscriptionId: string): Promise<{ cancelled: boolean }> {
    return { cancelled: false };
  }

  async getSubscription(_userId: string): Promise<Subscription | null> {
    return null;
  }

  async validateWebhook(_payload: string, _signature: string): Promise<{ valid: boolean; event?: unknown }> {
    return { valid: false };
  }

  async getPortalUrl(_customerId: string, _returnUrl: string): Promise<string | null> {
    return null;
  }
}

export const stubPaymentProvider = new StubPaymentProvider();
