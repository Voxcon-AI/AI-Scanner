// Shared utility functions for ai.scanner

/**
 * Sanitize filename by removing or replacing unsafe characters
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .slice(0, 255);
}

/**
 * Validate folder path against whitelist patterns
 */
export function validateFolderPath(path: string, allowedPaths: string[]): boolean {
  const normalizedPath = path.toLowerCase().trim();
  return allowedPaths.some((allowed) => normalizedPath.startsWith(allowed.toLowerCase()));
}

/**
 * Check if file extension is supported for analysis
 */
export function isSupportedFileType(filename: string): boolean {
  const supportedExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.tiff', '.tif'];
  const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));
  return supportedExtensions.includes(ext);
}
