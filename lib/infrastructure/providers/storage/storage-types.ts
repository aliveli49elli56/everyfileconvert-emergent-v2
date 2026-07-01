/**
 * lib/infrastructure/providers/storage/storage-types.ts
 *
 * Shared types for expanded storage architecture.
 * Covers Local, Browser, S3, MinIO, and cloud storage providers.
 */

export type StorageRegion =
  | 'us-east-1' | 'us-west-2' | 'eu-west-1' | 'eu-central-1'
  | 'ap-southeast-1' | 'ap-northeast-1'
  | 'auto';   // CDN-managed

export type StorageClass =
  | 'STANDARD'
  | 'INTELLIGENT_TIERING'
  | 'STANDARD_IA'
  | 'GLACIER'
  | 'DEEP_ARCHIVE';

export interface StorageObjectMetadata {
  key:           string;
  size:          number;
  contentType:   string;
  etag?:         string;
  lastModified?: string;
  storageClass?: StorageClass;
  region?:       StorageRegion;
  tags?:         Record<string, string>;
  userMetadata?: Record<string, string>;
}

export interface MultipartUploadPart {
  partNumber: number;
  etag:       string;
  size:       number;
}

export interface MultipartUpload {
  uploadId:   string;
  key:        string;
  bucket:     string;
  parts:      MultipartUploadPart[];
  createdAt:  string;
}

export interface StorageHealthCheck {
  connected:     boolean;
  latencyMs:     number;
  bucketExists?: boolean;
  writeable?:    boolean;
  error?:        string;
}

export interface PresignedUrlOptions {
  expiresIn:    number;    // seconds
  contentType?: string;
  method?:      'GET' | 'PUT';
  maxSizeBytes?: number;
}
