/**
 * lib/utils/hash-utils.ts
 * Hashing and ID generation utilities
 */

// ---------------------------------------------------------------------------
// SIMPLE HASHING
// ---------------------------------------------------------------------------

/**
 * Generate a simple hash from a string
 */
export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return hash;
}

/**
 * Generate a hex hash from a string
 */
export function hashToHex(str: string): string {
  return Math.abs(hashString(str)).toString(16).padStart(8, '0');
}

/**
 * Generate a base36 hash from a string
 */
export function hashToBase36(str: string): string {
  return Math.abs(hashString(str)).toString(36);
}

// ---------------------------------------------------------------------------
// ID GENERATION
// ---------------------------------------------------------------------------

/**
 * Generate a unique ID
 */
export function generateId(prefix = ''): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 11);
  return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
}

/**
 * Generate a job ID
 */
export function generateJobId(): string {
  return generateId('job');
}

/**
 * Generate a session ID
 */
export function generateSessionId(): string {
  return generateId('sess');
}

/**
 * Generate a request ID
 */
export function generateRequestId(): string {
  return generateId('req');
}

// ---------------------------------------------------------------------------
// FILE HASHING (ASYNC)
// ---------------------------------------------------------------------------

/**
 * Generate SHA-256 hash of a file
 */
export async function hashFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a quick hash for file identification
 */
export async function quickFileHash(file: File): Promise<string> {
  // Sample first 1MB, last 1MB, and size for a reasonably unique hash
  const chunkSize = 1024 * 1024; // 1MB
  const size = file.size;

  let sample: Uint8Array;

  if (size <= chunkSize * 2) {
    // Small file: hash entire content
    const buffer = await file.arrayBuffer();
    sample = new Uint8Array(buffer);
  } else {
    // Large file: hash samples
    const head = await file.slice(0, chunkSize).arrayBuffer();
    const tail = await file.slice(size - chunkSize).arrayBuffer();
    const sizeData = new TextEncoder().encode(size.toString());

    // Combine samples
    const combined = new Uint8Array(
      chunkSize * 2 + sizeData.length
    );
    combined.set(new Uint8Array(head), 0);
    combined.set(new Uint8Array(tail), chunkSize);
    combined.set(sizeData, chunkSize * 2);

    sample = combined;
  }

  const hashBuffer = await crypto.subtle.digest('SHA-256', sample);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ---------------------------------------------------------------------------
// CACHE KEY GENERATION
// ---------------------------------------------------------------------------

/**
 * Generate a cache key from conversion parameters
 */
export function generateConversionCacheKey(
  fileHash: string,
  targetFormat: string,
  options: Record<string, unknown>
): string {
  const optionsHash = hashToHex(JSON.stringify(options));
  return `conv_${fileHash.slice(0, 16)}_${targetFormat}_${optionsHash}`;
}

// ---------------------------------------------------------------------------
// DETERMINISTIC HASHING
// ---------------------------------------------------------------------------

/**
 * Generate a deterministic variant index from a string
 * Used for A/B testing and content variations
 */
export function getDeterministicVariant(str: string, count: number): number {
  return Math.abs(hashString(str)) % count;
}

/**
 * Deterministically pick from an array
 */
export function pickDeterministic<T>(arr: T[], str: string): T {
  const index = getDeterministicVariant(str, arr.length);
  return arr[index];
}
