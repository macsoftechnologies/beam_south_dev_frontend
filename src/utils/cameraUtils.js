/**
 * Requests a camera MediaStream preferring the requested facingMode ("environment" for back,
 * "user" for front), stopping any previous stream tracks first. Falls back to deviceId cycling
 * when multiple cameras exist and facingMode returns the same camera, or to { video: true } on PCs.
 * @param {"environment"|"user"} [facingMode="environment"]
 * @param {MediaStream|null} [currentStream=null]
 * @returns {Promise<MediaStream>}
 */
export async function getPreferredCameraStream(facingMode = "environment", currentStream = null) {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error("Camera API is not supported in this browser or context.");
  }

  const previousDeviceId = currentStream?.getVideoTracks?.()?.[0]?.getSettings?.()?.deviceId;
  if (currentStream) {
    currentStream.getTracks().forEach((track) => track.stop());
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: facingMode } },
    });

    const newDeviceId = stream.getVideoTracks?.()?.[0]?.getSettings?.()?.deviceId;
    if (
      currentStream &&
      previousDeviceId &&
      newDeviceId &&
      previousDeviceId === newDeviceId &&
      navigator.mediaDevices.enumerateDevices
    ) {
      const devices = (await navigator.mediaDevices.enumerateDevices()).filter(
        (d) => d.kind === "videoinput"
      );
      if (devices.length > 1) {
        const idx = devices.findIndex((d) => d.deviceId === previousDeviceId);
        const nextDevice = devices[(idx + 1) % devices.length];
        stream.getTracks().forEach((track) => track.stop());
        return await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: nextDevice.deviceId } },
        });
      }
    }

    return stream;
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
