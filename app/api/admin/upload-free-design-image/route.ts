// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { cloudinary, getThumbnailUrl, getBlurUrl } from "@/lib/cloudinary";

// POST /api/admin/upload-free-design-image — upload preview images to Cloudinary
// Auth: middleware.ts enforces admin role for all /api/admin/* routes.
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const results = await Promise.all(
      files.map(async (file, i) => {
        try {
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);

          const result = await new Promise<any>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              {
                folder: "genxdigitizing/free-designs",
                resource_type: "image",
                transformation: [{ quality: "auto", fetch_format: "auto" }],
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            );
            uploadStream.end(buffer);
          });

          return {
            publicId: result.public_id,
            url: result.secure_url,
            thumbnailUrl: getThumbnailUrl(result.public_id),
            blurhash: getBlurUrl(result.public_id),
            width: result.width,
            height: result.height,
            format: result.format,
          };
        } catch (err: any) {
          console.error(`Free design image upload error (file ${i}):`, err);
          throw new Error(`Failed to upload "${file.name}": ${err.message || err}`);
        }
      })
    );

    return NextResponse.json(results);
  } catch (error: any) {
    console.error("Free design image upload error:", error);
    return NextResponse.json(
      { error: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}
