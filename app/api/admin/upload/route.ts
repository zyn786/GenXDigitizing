// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { cloudinary, getThumbnailUrl, getBlurUrl } from "@/lib/cloudinary";
import { getAdminUser } from "@/lib/supabase/get-user";

export async function POST(req: NextRequest) {
  try {
    const user = await getAdminUser().catch(() => null);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const results = await Promise.all(
      files.map(async (file) => {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Upload to Cloudinary
        const result = await new Promise<any>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: "genxdigitizing/portfolio",
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
      })
    );

    return NextResponse.json(results);
  } catch (error: any) {
    console.error("Cloudinary upload error:", error);
    return NextResponse.json(
      { error: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}
