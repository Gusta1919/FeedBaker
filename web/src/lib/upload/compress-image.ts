const TARGET_BYTES = 1_200_000;

/**
 * Browsers reject some camera formats (notably HEIC outside Safari) in
 * createImageBitmap, so we fall back to an <img> decode before giving up.
 */
async function decode(file: File): Promise<
  | { kind: "bitmap"; source: ImageBitmap }
  | { kind: "element"; source: HTMLImageElement; revoke: () => void }
> {
  try {
    return { kind: "bitmap", source: await createImageBitmap(file) };
  } catch {
    const url = URL.createObjectURL(file);
    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const element = new Image();
        element.onload = () => resolve(element);
        element.onerror = () => reject(new Error("decode-failed"));
        element.src = url;
      });
      return {
        kind: "element",
        source: image,
        revoke: () => URL.revokeObjectURL(url),
      };
    } catch (error) {
      URL.revokeObjectURL(url);
      throw error;
    }
  }
}

function toBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", quality);
  });
}

export async function compressImageForUpload(file: File): Promise<File> {
  if (file.type === "image/gif" && file.size <= TARGET_BYTES) {
    return file;
  }

  const decoded = await decode(file);
  const source = decoded.source;
  const naturalWidth =
    decoded.kind === "bitmap" ? source.width : (source as HTMLImageElement).naturalWidth;
  const naturalHeight =
    decoded.kind === "bitmap"
      ? source.height
      : (source as HTMLImageElement).naturalHeight;

  const cleanup = () => {
    if (decoded.kind === "bitmap") decoded.source.close();
    else decoded.revoke();
  };

  if (!naturalWidth || !naturalHeight) {
    cleanup();
    throw new Error("empty-image");
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    cleanup();
    throw new Error("no-canvas");
  }

  const baseName = file.name.replace(/\.[^.]+$/, "") || "photo";
  let best: Blob | null = null;

  // Step down resolution then quality until the file is comfortably small.
  for (const maxEdge of [1600, 1280, 1024]) {
    const largest = Math.max(naturalWidth, naturalHeight);
    const scale = largest > maxEdge ? maxEdge / largest : 1;

    canvas.width = Math.round(naturalWidth * scale);
    canvas.height = Math.round(naturalHeight * scale);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(
      source as CanvasImageSource,
      0,
      0,
      canvas.width,
      canvas.height,
    );

    for (const quality of [0.85, 0.72, 0.6]) {
      const blob = await toBlob(canvas, quality);
      if (!blob) continue;
      best = blob;
      if (blob.size <= TARGET_BYTES) {
        cleanup();
        return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
      }
    }
  }

  cleanup();

  if (!best) throw new Error("encode-failed");
  return new File([best], `${baseName}.jpg`, { type: "image/jpeg" });
}

/** Square-ish avatar — smaller file and resolution than poll photos. */
export async function compressImageForAvatar(file: File): Promise<File> {
  if (file.type === "image/gif" && file.size <= 400_000) {
    return file;
  }

  const decoded = await decode(file);
  const source = decoded.source;
  const naturalWidth =
    decoded.kind === "bitmap" ? source.width : (source as HTMLImageElement).naturalWidth;
  const naturalHeight =
    decoded.kind === "bitmap"
      ? source.height
      : (source as HTMLImageElement).naturalHeight;

  const cleanup = () => {
    if (decoded.kind === "bitmap") decoded.source.close();
    else decoded.revoke();
  };

  if (!naturalWidth || !naturalHeight) {
    cleanup();
    throw new Error("empty-image");
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    cleanup();
    throw new Error("no-canvas");
  }

  const baseName = file.name.replace(/\.[^.]+$/, "") || "avatar";
  const size = Math.min(naturalWidth, naturalHeight, 512);
  canvas.width = size;
  canvas.height = size;

  const cropX = (naturalWidth - Math.min(naturalWidth, naturalHeight)) / 2;
  const cropY = (naturalHeight - Math.min(naturalWidth, naturalHeight)) / 2;
  const cropSize = Math.min(naturalWidth, naturalHeight);

  ctx.drawImage(
    source as CanvasImageSource,
    cropX,
    cropY,
    cropSize,
    cropSize,
    0,
    0,
    size,
    size,
  );

  const blob = await toBlob(canvas, 0.82);
  cleanup();

  if (!blob) throw new Error("encode-failed");
  return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
}
