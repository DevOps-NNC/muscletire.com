const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

export const MAX_BLOG_IMAGE_BYTES = 8 * 1024 * 1024;

const SUPPORTED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/gif", "image/webp"]);

function hasImageSignature(bytes: Buffer, contentType: string) {
  if (contentType === "image/png") return bytes.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE);
  if (contentType === "image/jpeg") return bytes.subarray(0, 3).equals(Buffer.from([255, 216, 255]));
  if (contentType === "image/gif") {
    const header = bytes.subarray(0, 6).toString("ascii");
    return header === "GIF87a" || header === "GIF89a";
  }
  if (contentType === "image/webp") {
    return bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP";
  }
  return false;
}

export function decodeBlogImageUpload(dataUrl: string, declaredContentType: string) {
  const contentType = declaredContentType.trim().toLowerCase();
  if (!SUPPORTED_IMAGE_TYPES.has(contentType)) {
    throw new Error("Blog uploads must use a supported image MIME type.");
  }

  const match = /^data:([^;,]+);base64,([a-zA-Z0-9+/=\s]+)$/.exec(dataUrl);
  if (!match) throw new Error("Blog upload must be a base64 data URL.");

  const dataUrlContentType = match[1].toLowerCase();
  if (dataUrlContentType !== contentType) {
    throw new Error("Blog upload MIME type does not match its data URL.");
  }

  const bytes = Buffer.from(match[2].replace(/\s/g, ""), "base64");
  if (bytes.length === 0) throw new Error("Blog upload contains no image data.");
  if (bytes.length > MAX_BLOG_IMAGE_BYTES) throw new Error("Blog images must be 8 MiB or smaller.");
  if (!hasImageSignature(bytes, contentType)) throw new Error("Blog upload contains invalid image data.");

  return { bytes, contentType };
}
