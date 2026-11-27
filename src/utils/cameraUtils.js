/**
 * Requests a camera MediaStream preferring the rear ("environment") camera on
 * mobiles and tablets, while seamlessly falling back to the default webcam on PCs.
 * @returns {Promise<MediaStream>}
 */
export async function getPreferredCameraStream() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error("Camera API is not supported in this browser or context.");
  }

  try {
    return await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" } },
    });
  } catch (err) {
    if (
      err?.name === "OverconstrainedError" ||
      err?.name === "ConstraintNotSatisfiedError" ||
      err?.name === "NotFoundError"
    ) {
      return await navigator.mediaDevices.getUserMedia({ video: true });
    }
    throw err;
  }
}
