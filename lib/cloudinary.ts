// @ts-nocheck
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

// Generate optimized URL with transformations
export function getOptimizedUrl(
  publicId: string,
  options?: { width?: number; quality?: number; blur?: boolean }
): string {
  const transform: Record<string, unknown> = {
    fetch_format: "auto",
    quality: options?.quality || "auto",
    crop: "limit",
  };
  if (options?.width) transform.width = options.width;
  if (options?.blur) transform.effect = "blur:1000";

  return cloudinary.url(publicId, {
    transformation: [transform],
    secure: true,
  });
}

// Generate blur placeholder URL (tiny, blurred)
export function getBlurUrl(publicId: string): string {
  return cloudinary.url(publicId, {
    transformation: [
      { width: 40, effect: "blur:500", quality: 10, fetch_format: "auto" },
    ],
    secure: true,
  });
}

// Generate thumbnail URL
export function getThumbnailUrl(publicId: string): string {
  return cloudinary.url(publicId, {
    transformation: [
      { width: 600, crop: "limit", fetch_format: "auto", quality: "auto" },
    ],
    secure: true,
  });
}
