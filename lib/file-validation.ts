const FILE_SIZE_LIMIT = 200 * 1024 * 1024; // 200 MB in bytes

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateFileSize(file: File): FileValidationResult {
  if (file.size > FILE_SIZE_LIMIT) {
    const maxMB = FILE_SIZE_LIMIT / (1024 * 1024);
    const fileMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      isValid: false,
      error: `File size (${fileMB} MB) exceeds the ${maxMB.toFixed(0)} MB limit. Please upload a smaller file.`,
    };
  }
  return { isValid: true };
}

export function revokeObjectURL(url: string | null | undefined): void {
  if (url && typeof url === "string") {
    try {
      URL.revokeObjectURL(url);
    } catch (error) {
      console.warn("Failed to revoke object URL:", error);
    }
  }
}

export function clearFileBuffer(file: File | null | undefined): void {
  if (file) {
    // Explicitly dereference file to allow garbage collection
    file = null;
  }
}

export interface ConversionBlob {
  blob: Blob;
  fileName: string;
}

export function createDownloadUrl(blob: Blob): string {
  try {
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("Failed to create object URL:", error);
    throw new Error("Failed to create download URL");
  }
}

export function triggerFileDownload(
  downloadUrl: string,
  fileName: string
): void {
  try {
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = fileName;
    link.style.display = "none";

    document.body.appendChild(link);
    link.click();

    // Clean up after a short delay to ensure download starts
    setTimeout(() => {
      document.body.removeChild(link);
    }, 100);
  } catch (error) {
    console.error("Failed to trigger download:", error);
    throw new Error("Failed to download file");
  }
}
