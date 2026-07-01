/**
 * lib/infrastructure/providers/storage/index.ts
 * Barrel export for expanded storage architecture.
 */

export type {
  StorageRegion, StorageClass, StorageObjectMetadata,
  MultipartUpload, MultipartUploadPart, StorageHealthCheck, PresignedUrlOptions,
} from './storage-types';

export type { IS3StorageProvider, S3Config, S3UploadOptions, S3UploadResult } from './s3-storage-provider';
export { StubS3StorageProvider, stubS3StorageProvider } from './s3-storage-provider';

export type { ILocalStorageProvider } from './local-storage-provider';
export { StubLocalStorageProvider, stubLocalStorageProvider } from './local-storage-provider';

export type { IMinioStorageProvider, MinioConfig } from './minio-storage-provider';
export { StubMinioStorageProvider, stubMinioStorageProvider } from './minio-storage-provider';
