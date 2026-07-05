import { NextRequest, NextResponse } from "next/server";
import {
  ACCEPTED_LOGO_MIME,
  ACCEPTED_MIME,
  ImageError,
  MAX_UPLOAD_BYTES,
  processBuildingPhoto,
  processLogo,
  processPhoto,
} from "@/lib/image";
import { saveUpload } from "@/lib/store";

export const runtime = "nodejs";
export const maxDuration = 60;

type Kind = "photo" | "building" | "logo";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const kind = (form.get("kind") as Kind) || "photo";
    const files = form.getAll("files").filter((f): f is File => f instanceof File);
    if (files.length === 0) {
      return NextResponse.json({ error: "No files received." }, { status: 400 });
    }

    const accepted = kind === "logo" ? ACCEPTED_LOGO_MIME : ACCEPTED_MIME;
    const results = [];
    for (const file of files) {
      if (!accepted.includes(file.type)) {
        return NextResponse.json(
          {
            error: `"${file.name}" is not a supported format. Use ${
              kind === "logo" ? "SVG, PNG, JPEG or WebP" : "JPEG, PNG or WebP"
            }.`,
          },
          { status: 415 },
        );
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        return NextResponse.json(
          { error: `"${file.name}" is larger than ${MAX_UPLOAD_BYTES / 1024 / 1024}MB.` },
          { status: 413 },
        );
      }
      const input = Buffer.from(await file.arrayBuffer());
      const processed =
        kind === "logo"
          ? await processLogo(input, file.type)
          : kind === "building"
            ? await processBuildingPhoto(input)
            : await processPhoto(input);
      const rec = await saveUpload(
        processed.buffer,
        processed.ext,
        processed.mime,
        processed.width,
        processed.height,
      );
      results.push({ id: rec.id, width: rec.width, height: rec.height, name: file.name });
    }
    return NextResponse.json({ files: results });
  } catch (err) {
    if (err instanceof ImageError) {
      return NextResponse.json({ error: err.message }, { status: 422 });
    }
    console.error("[upload]", err);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}
