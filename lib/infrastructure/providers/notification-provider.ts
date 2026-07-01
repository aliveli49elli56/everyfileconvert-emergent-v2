/**
 * lib/infrastructure/providers/notification-provider.ts
 *
 * Notification Provider — Interface + Stub Implementation
 *
 * INotificationProvider: email/push notification interface.
 * StubNotificationProvider: no-op when ENABLE_NOTIFICATIONS = false.
 *
 * Future provider (Phase 6D-2): SendGrid / Resend
 * Swap: register SendGridNotificationProvider — no business logic changes.
 */

import type { ProviderMetadata } from '../types';

// ---------------------------------------------------------------------------
// NOTIFICATION TYPES
// ---------------------------------------------------------------------------

export type NotificationType = 'email' | 'push' | 'sms' | 'in-app';

export interface EmailNotification {
  to: string;
  from?: string;
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  templateId?: string;
  templateData?: Record<string, unknown>;
}

export interface PushNotification {
  userId: string;
  title: string;
  body: string;
  url?: string;
  icon?: string;
}

export interface NotificationResult {
  sent: boolean;
  messageId?: string;
  error?: string;
}

// ---------------------------------------------------------------------------
// INTERFACE
// ---------------------------------------------------------------------------

export interface INotificationProvider {
  getMetadata(): ProviderMetadata;
  sendEmail(notification: EmailNotification): Promise<NotificationResult>;
  sendPush(notification: PushNotification): Promise<NotificationResult>;
  sendWelcomeEmail(to: string, name?: string): Promise<NotificationResult>;
  sendPasswordResetEmail(to: string, resetLink: string): Promise<NotificationResult>;
  sendConversionCompleteEmail(to: string, filename: string, downloadUrl: string): Promise<NotificationResult>;
}

// ---------------------------------------------------------------------------
// STUB IMPLEMENTATION
// ---------------------------------------------------------------------------

export class StubNotificationProvider implements INotificationProvider {
  private readonly metadata: ProviderMetadata = {
    id:             'stub-notifications',
    displayName:    'Stub Notification Provider',
    version:        '1.0.0',
    enabled:        false,
    dependencies:   [],
    priority:       25,
    healthStatus:   'unknown',
    capabilities:   ['email', 'push', 'template'],
    futureProvider: 'sendgrid',
  };

  getMetadata(): ProviderMetadata {
    return { ...this.metadata };
  }

  private noop(): NotificationResult {
    return { sent: false };
  }

  async sendEmail(_notification: EmailNotification): Promise<NotificationResult> { return this.noop(); }
  async sendPush(_notification: PushNotification): Promise<NotificationResult>   { return this.noop(); }
  async sendWelcomeEmail(_to: string, _name?: string): Promise<NotificationResult> { return this.noop(); }
  async sendPasswordResetEmail(_to: string, _link: string): Promise<NotificationResult> { return this.noop(); }
  async sendConversionCompleteEmail(_to: string, _filename: string, _url: string): Promise<NotificationResult> { return this.noop(); }
}

export const stubNotificationProvider = new StubNotificationProvider();
