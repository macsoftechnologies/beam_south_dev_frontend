import api from "../services/api";

const formatMegabytes = (bytes) => {
  if (!bytes || bytes <= 0) return "0 MB";
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Triggers a browser file download for a PDF Blob and defers revoking the
 * object URL so the browser never cancels large PDF downloads mid-write.
 */
export function triggerBlobDownload(blobData, fileName = "document.pdf") {
  const blob =
    blobData instanceof Blob && blobData.type === "application/pdf"
      ? blobData
      : new Blob([blobData], { type: "application/pdf" });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", fileName);
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();

  // Defer revocation so Chromium/Firefox/Safari finish streaming large blobs to disk
  setTimeout(() => {
    try {
      window.URL.revokeObjectURL(url);
    } catch {
      // Ignore cleanup errors
    }
  }, 15000);
}

/**
 * Fetches a PDF Blob from an API endpoint with:
 *  - Two-phase AbortController timeout (initial response timeout + rolling stall timeout)
 *  - Live download progress reporting (`onProgress`)
 *  - Strict PDF validation (`%PDF-` signature check so HTML/JSON errors never save as corrupt PDFs)
 */
export async function fetchPdfBlob(
  endpoint,
  {
    params,
    onProgress,
    initialTimeoutMs = 60000,
    stallTimeoutMs = 30000,
  } = {}
) {
  const controller = new AbortController();
  let lastLoaded = 0;
  let timedOutReason = null;

  let timer = setTimeout(() => {
    timedOutReason = "PDF generation timed out. Please try again.";
    controller.abort();
  }, initialTimeoutMs);

  const resetStallTimer = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timedOutReason = "PDF download stalled. Please try again.";
      controller.abort();
    }, stallTimeoutMs);
  };

  if (typeof onProgress === "function") {
    onProgress({
      phase: "generating",
      percent: null,
      loaded: 0,
      total: 0,
      label: "Generating...",
    });
  }

  try {
    const response = await api.get(endpoint, {
      params,
      responseType: "blob",
      signal: controller.signal,
      onDownloadProgress: (progressEvent) => {
        const loaded = progressEvent?.loaded || 0;
        const total = progressEvent?.total || 0;

        if (loaded > lastLoaded) {
          lastLoaded = loaded;
          resetStallTimer();
        }

        if (typeof onProgress === "function") {
          if (total > 0) {
            const percent = Math.min(99, Math.round((loaded / total) * 100));
            onProgress({
              phase: "downloading",
              percent,
              loaded,
              total,
              label: `Downloading... ${percent}%`,
            });
          } else if (loaded > 0) {
            onProgress({
              phase: "downloading",
              percent: null,
              loaded,
              total: 0,
              label: `Downloading... ${formatMegabytes(loaded)}`,
            });
          }
        }
      },
    });

    const rawBlob = response.data instanceof Blob
      ? response.data
      : new Blob([response.data], { type: "application/pdf" });

    if (!rawBlob || rawBlob.size === 0) {
      throw new Error("Received empty PDF response from server.");
    }

    const contentType = String(
      response.headers?.["content-type"] || rawBlob.type || ""
    ).toLowerCase();

    if (
      contentType.includes("text/html") ||
      contentType.includes("application/json") ||
      contentType.includes("text/plain")
    ) {
      throw new Error(`Server returned ${contentType} instead of a PDF.`);
    }

    // Verify PDF magic header (%PDF-) when Blob.prototype.slice/text is available
    if (typeof rawBlob.slice === "function" && typeof rawBlob.text === "function") {
      const header = await rawBlob.slice(0, 16).text();
      if (!header.includes("%PDF-")) {
        throw new Error("Server response is not a valid PDF document.");
      }
    }

    if (typeof onProgress === "function") {
      onProgress({
        phase: "complete",
        percent: 100,
        loaded: rawBlob.size,
        total: rawBlob.size,
        label: "Downloading... 100%",
      });
    }

    return rawBlob.type === "application/pdf"
      ? rawBlob
      : new Blob([rawBlob], { type: "application/pdf" });
  } catch (err) {
    if (timedOutReason) {
      const timeoutErr = new Error(timedOutReason);
      timeoutErr.code = "PDF_DOWNLOAD_TIMEOUT";
      throw timeoutErr;
    }
    throw err;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Downloads a PDF from an API endpoint and triggers the browser Save dialog.
 */
export async function downloadPdfFromApi(
  endpoint,
  fileName = "document.pdf",
  options = {}
) {
  const blob = await fetchPdfBlob(endpoint, options);
  triggerBlobDownload(blob, fileName);
  return true;
}
