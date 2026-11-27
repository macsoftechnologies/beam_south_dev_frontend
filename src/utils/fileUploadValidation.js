/**
 * Shared client-side validation for file size and file count limits across modules.
 */

export function formatFileSizeMB(bytes) {
  return (bytes / (1024 * 1024)).toFixed(2);
}

/**
 * Validates selected files against per-file size (MB) and total file count limits.
 * @param {File[]|FileList} fileList
 * @param {Object} options
 * @param {number} [options.existingCount=0] - Number of files already attached
 * @param {number} [options.maxFiles] - Maximum allowed total files
 * @param {number} [options.maxFileSizeMB] - Maximum allowed size per file in MB
 * @param {string} [options.label="files"] - Human-readable context label
 * @returns {{ valid: boolean, validFiles: File[], errorMessage: string | null }}
 */
export function validateUploadFiles(
  fileList,
  { existingCount = 0, maxFiles, maxFileSizeMB, label = "files" } = {}
) {
  const files = Array.from(fileList || []);
  if (files.length === 0) {
    return { valid: true, validFiles: [], errorMessage: null };
  }

  if (typeof maxFileSizeMB === "number" && maxFileSizeMB > 0) {
    const maxBytes = maxFileSizeMB * 1024 * 1024;
    const oversized = files.filter((f) => f.size > maxBytes);
    if (oversized.length > 0) {
      const details = oversized
        .slice(0, 3)
        .map((f) => `"${f.name}" (${formatFileSizeMB(f.size)} MB)`)
        .join(", ");
      const extra = oversized.length > 3 ? ` and ${oversized.length - 3} more` : "";
      return {
        valid: false,
        validFiles: [],
        errorMessage:
          oversized.length === 1
            ? `File ${details} exceeds the maximum allowed size of ${maxFileSizeMB} MB per file for ${label}.`
            : `${oversized.length} files exceed the maximum allowed size of ${maxFileSizeMB} MB per file for ${label}: ${details}${extra}.`,
      };
    }
  }

  if (typeof maxFiles === "number" && maxFiles > 0) {
    const totalAfterAdd = existingCount + files.length;
    if (totalAfterAdd > maxFiles) {
      const remaining = Math.max(0, maxFiles - existingCount);
      const errorMessage =
        existingCount === 0
          ? `Maximum ${maxFiles} ${maxFiles === 1 ? "file is" : "files are"} allowed for ${label}. You selected ${files.length} — please select ${maxFiles} or fewer.`
          : remaining === 0
            ? `Maximum ${maxFiles} ${maxFiles === 1 ? "file is" : "files are"} allowed for ${label}, and ${existingCount} ${existingCount === 1 ? "is" : "are"} already attached. Remove a file before adding more.`
            : `Maximum ${maxFiles} files are allowed for ${label}. You already have ${existingCount} attached and selected ${files.length} more — you can add up to ${remaining} more ${remaining === 1 ? "file" : "files"}.`;

      return {
        valid: false,
        validFiles: [],
        errorMessage,
      };
    }
  }

  return { valid: true, validFiles: files, errorMessage: null };
}

/**
 * Extracts a readable error message from an Axios/API error response.
 */
export function extractApiErrorMessage(err, fallback = "Upload failed. Please try again.") {
  const msg = err?.response?.data?.message;
  if (Array.isArray(msg) && msg.length > 0) return msg.join(", ");
  if (typeof msg === "string" && msg.trim()) return msg;
  if (typeof err?.message === "string" && err.message.trim()) return err.message;
  return fallback;
}
