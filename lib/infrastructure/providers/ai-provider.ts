/**
 * lib/infrastructure/providers/ai-provider.ts
 *
 * AI Provider — Interface + Stub Implementation
 *
 * IAIProvider: LLM / AI service interface.
 * StubAIProvider: no-op when ENABLE_AI = false.
 *
 * Future provider (Phase 6D-2): OpenAI / Anthropic
 * Swap: register OpenAIProvider — no business logic changes.
 */

import type { ProviderMetadata } from '../types';

// ---------------------------------------------------------------------------
// AI TYPES
// ---------------------------------------------------------------------------

export interface AICompletionRequest {
  prompt: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

export interface AICompletionResult {
  text: string;
  tokens?: number;
  model?: string;
}

export interface AIEmbeddingRequest {
  text: string;
  model?: string;
}

export interface AIEmbeddingResult {
  embedding: number[];
  model?: string;
}

export interface AIImageRequest {
  prompt: string;
  size?: '256x256' | '512x512' | '1024x1024';
  n?: number;
}

export interface AIImageResult {
  urls: string[];
}

// ---------------------------------------------------------------------------
// INTERFACE
// ---------------------------------------------------------------------------

export interface IAIProvider {
  getMetadata(): ProviderMetadata;
  complete(request: AICompletionRequest): Promise<AICompletionResult | null>;
  embed(request: AIEmbeddingRequest): Promise<AIEmbeddingResult | null>;
  generateImage(request: AIImageRequest): Promise<AIImageResult | null>;
  isAvailable(): boolean;
}

// ---------------------------------------------------------------------------
// STUB IMPLEMENTATION
// ---------------------------------------------------------------------------

export class StubAIProvider implements IAIProvider {
  private readonly metadata: ProviderMetadata = {
    id:             'stub-ai',
    displayName:    'Stub AI Provider',
    version:        '1.0.0',
    enabled:        false,
    dependencies:   [],
    priority:       35,
    healthStatus:   'unknown',
    capabilities:   ['completion', 'embedding', 'imageGeneration'],
    futureProvider: 'openai',
  };

  getMetadata(): ProviderMetadata {
    return { ...this.metadata };
  }

  async complete(_request: AICompletionRequest): Promise<AICompletionResult | null> {
    return null;
  }

  async embed(_request: AIEmbeddingRequest): Promise<AIEmbeddingResult | null> {
    return null;
  }

  async generateImage(_request: AIImageRequest): Promise<AIImageResult | null> {
    return null;
  }

  isAvailable(): boolean {
    return false;
  }
}

export const stubAIProvider = new StubAIProvider();
