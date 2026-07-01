/**
 * lib/infrastructure/providers/billing-provider.ts
 *
 * Phase 6D-1 Part 2 — Comprehensive Billing Provider
 *
 * IBillingProvider: superset of payment functionality covering:
 *   - Stripe / PayPal integration
 *   - Webhooks
 *   - Subscription lifecycle events
 *   - Invoice generation
 *   - Usage metering / metered billing
 *   - Customer portal
 *
 * StubBillingProvider: no-op stub.
 *
 * Future providers (Phase 6D-2): StripeBillingProvider, PayPalBillingProvider
 * Existing IPaymentProvider is preserved and unchanged.
 * IBillingProvider extends it with enterprise billing features.
 */

import type { ProviderMetadata } from '../types';

// ---------------------------------------------------------------------------
// BILLING TYPES
// ---------------------------------------------------------------------------

export type BillingCycle   = 'monthly' | 'yearly';
export type InvoiceStatus  = 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
export type CustomerStatus = 'active' | 'past_due' | 'canceled' | 'trialing';
export type WebhookEvent   =
  | 'subscription.created'
  | 'subscription.updated'
  | 'subscription.canceled'
  | 'payment.succeeded'
  | 'payment.failed'
  | 'invoice.created'
  | 'invoice.paid'
  | 'invoice.payment_failed'
  | 'customer.created'
  | 'customer.deleted';

// ── Customer ─────────────────────────────────────────────────────────────────

export interface BillingCustomer {
  id:               string;
  userId:           string;
  externalId:       string;   // Stripe customer ID
  email:            string;
  name?:            string;
  status:           CustomerStatus;
  defaultPaymentId?: string;
  metadata:         Record<string, string>;
  createdAt:        string;
}

// ── Subscription ─────────────────────────────────────────────────────────────

export interface BillingSubscription {
  id:                string;
  customerId:        string;
  planId:            string;
  status:            CustomerStatus;
  billingCycle:      BillingCycle;
  currentPeriodStart: string;
  currentPeriodEnd:  string;
  trialEnd?:         string;
  cancelAtPeriodEnd: boolean;
  externalId:        string;   // Stripe subscription ID
  metadata:          Record<string, string>;
  createdAt:         string;
  canceledAt?:       string;
}

// ── Invoice ───────────────────────────────────────────────────────────────────

export interface InvoiceLineItem {
  id:          string;
  description: string;
  quantity:    number;
  unitAmount:  number;    // cents
  total:       number;    // cents
  period?:     { start: string; end: string };
}

export interface BillingInvoice {
  id:           string;
  customerId:   string;
  subscriptionId?: string;
  status:       InvoiceStatus;
  currency:     string;
  subtotal:     number;  // cents
  tax:          number;  // cents
  total:        number;  // cents
  lineItems:    InvoiceLineItem[];
  pdfUrl?:      string;
  dueDate?:     string;
  paidAt?:      string;
  externalId:   string;
  createdAt:    string;
}

// ── Usage Metering ────────────────────────────────────────────────────────────

export interface UsageMeteringRecord {
  customerId:    string;
  subscriptionId: string;
  metricName:    string;
  quantity:      number;
  timestamp:     string;
  idempotencyKey: string;
}

export interface UsageSummary {
  customerId:    string;
  metricName:    string;
  totalUsage:    number;
  periodStart:   string;
  periodEnd:     string;
  limit?:        number;
  percentUsed?:  number;
}

// ── Webhook ───────────────────────────────────────────────────────────────────

export interface WebhookPayload {
  id:       string;
  event:    WebhookEvent;
  data:     unknown;
  liveMode: boolean;
  createdAt: string;
}

export interface WebhookValidationResult {
  valid:    boolean;
  payload?: WebhookPayload;
  error?:   string;
}

// ── Checkout ─────────────────────────────────────────────────────────────────

export interface CheckoutSession {
  sessionId: string;
  sessionUrl: string;
  expiresAt:  string;
}

// ---------------------------------------------------------------------------
// INTERFACE
// ---------------------------------------------------------------------------

export interface IBillingProvider {
  getMetadata(): ProviderMetadata;

  // ── Customer management ─────────────────────────────────────────────────
  createCustomer(userId: string, email: string, name?: string): Promise<BillingCustomer | null>;
  getCustomer(userId: string): Promise<BillingCustomer | null>;
  updateCustomer(customerId: string, data: Partial<{ email: string; name: string; metadata: Record<string, string> }>): Promise<BillingCustomer | null>;
  deleteCustomer(customerId: string): Promise<boolean>;

  // ── Subscriptions ────────────────────────────────────────────────────────
  createSubscription(customerId: string, planId: string, cycle: BillingCycle): Promise<BillingSubscription | null>;
  getSubscription(customerId: string): Promise<BillingSubscription | null>;
  updateSubscription(subscriptionId: string, planId: string): Promise<BillingSubscription | null>;
  cancelSubscription(subscriptionId: string, immediately?: boolean): Promise<boolean>;
  reactivateSubscription(subscriptionId: string): Promise<BillingSubscription | null>;

  // ── Checkout ─────────────────────────────────────────────────────────────
  createCheckoutSession(customerId: string, planId: string, cycle: BillingCycle, successUrl: string, cancelUrl: string): Promise<CheckoutSession | null>;
  createPortalSession(customerId: string, returnUrl: string): Promise<string | null>;

  // ── Invoices ─────────────────────────────────────────────────────────────
  getInvoice(invoiceId: string): Promise<BillingInvoice | null>;
  listInvoices(customerId: string, limit?: number): Promise<BillingInvoice[]>;
  getUpcomingInvoice(customerId: string): Promise<BillingInvoice | null>;

  // ── Usage Metering ────────────────────────────────────────────────────────
  recordUsage(record: Omit<UsageMeteringRecord, 'idempotencyKey'>): Promise<boolean>;
  getUsageSummary(customerId: string, metricName: string): Promise<UsageSummary | null>;

  // ── Webhooks ─────────────────────────────────────────────────────────────
  validateWebhook(payload: string, signature: string): Promise<WebhookValidationResult>;
  processWebhookEvent(event: WebhookPayload): Promise<{ processed: boolean; error?: string }>;

  // ── Health ────────────────────────────────────────────────────────────────
  ping(): Promise<{ ok: boolean; latencyMs: number }>;
}

// ---------------------------------------------------------------------------
// STUB IMPLEMENTATION
// ---------------------------------------------------------------------------

export class StubBillingProvider implements IBillingProvider {
  private readonly metadata: ProviderMetadata = {
    id:             'stub-billing',
    displayName:    'Stub Billing Provider',
    version:        '1.0.0',
    enabled:        false,
    dependencies:   [],
    priority:       22,
    healthStatus:   'unknown',
    capabilities:   ['customer', 'subscription', 'invoice', 'usage-metering', 'webhook', 'portal', 'checkout'],
    futureProvider: 'stripe',
  };

  getMetadata(): ProviderMetadata { return { ...this.metadata }; }

  async createCustomer(_uid: string, _e: string): Promise<null>           { return null; }
  async getCustomer(_uid: string): Promise<null>                          { return null; }
  async updateCustomer(_id: string, _d: unknown): Promise<null>           { return null; }
  async deleteCustomer(_id: string): Promise<boolean>                     { return false; }
  async createSubscription(_cid: string, _pid: string, _c: BillingCycle): Promise<null> { return null; }
  async getSubscription(_cid: string): Promise<null>                      { return null; }
  async updateSubscription(_sid: string, _pid: string): Promise<null>     { return null; }
  async cancelSubscription(_sid: string): Promise<boolean>               { return false; }
  async reactivateSubscription(_sid: string): Promise<null>              { return null; }
  async createCheckoutSession(_cid: string, _pid: string, _c: BillingCycle, _su: string, _cu: string): Promise<null> { return null; }
  async createPortalSession(_cid: string, _r: string): Promise<null>     { return null; }
  async getInvoice(_id: string): Promise<null>                           { return null; }
  async listInvoices(_cid: string): Promise<BillingInvoice[]>            { return []; }
  async getUpcomingInvoice(_cid: string): Promise<null>                  { return null; }
  async recordUsage(_r: Omit<UsageMeteringRecord, 'idempotencyKey'>): Promise<boolean> { return false; }
  async getUsageSummary(_cid: string, _m: string): Promise<null>        { return null; }
  async validateWebhook(_p: string, _s: string): Promise<WebhookValidationResult> { return { valid: false }; }
  async processWebhookEvent(_e: WebhookPayload): Promise<{ processed: boolean }> { return { processed: false }; }
  async ping(): Promise<{ ok: boolean; latencyMs: number }> { return { ok: false, latencyMs: 0 }; }
}

export const stubBillingProvider = new StubBillingProvider();
