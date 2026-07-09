import { NextRequest, NextResponse } from "next/server";
import {
  ACCEPTED_LOGO_MIME,
  ACCEPTED_MIME,
  ImageError,
  MAX_UPLOAD_BYTES,
  processBuildingPhoto,
  processLogo,
} from "@/lib/image";
import { listProfiles, saveProfile, saveUpload } from "@/lib/store";
import { assetUrl } from "@/lib/sample";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const toClient = (p: Awaited<ReturnType<typeof listProfiles>>[number]) => ({
  id: p.id,
  name: p.name,
  accent: p.accent,
  logoScale: p.logoScale,
  logo: { id: p.logoId, url: assetUrl(p.logoId), width: p.logoWidth, height: p.logoHeight },
  building: p.buildingId
    ? {
        id: p.buildingId,
        url: assetUrl(p.buildingId),
        width: p.buildingWidth ?? 0,
        height: p.buildingHeight ?? 0,
      }
    : null,
});

export async function GET() {
  return NextResponse.json({
    profiles: (await listProfiles()).map(toClient),
    // Without CWR_DATA_DIR the store lives on the container's temp disk and
    // every deploy erases reports, uploads, brands and accounts.
    ephemeralStorage: !process.env.CWR_DATA_DIR && process.env.NODE_ENV === "production",
  });
}

/**
 * Creates or updates a company profile. Multipart form:
 *   name, accent, logoScale, optional id (= update), optional logo file
 * (required when creating; when updating, omitting keeps the current logo).
 */
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const id = String(form.get("id") ?? "").trim() || undefined;
    const name = String(form.get("name") ?? "").trim().slice(0, 120);
    const accentRaw = String(form.get("accent") ?? "").trim();
    const accent = /^#[0-9a-fA-F]{6}$/.test(accentRaw) ? accentRaw : "#D9232E";
    const scaleRaw = Number(form.get("logoScale"));
    const logoScale = Number.isFinite(scaleRaw) ? Math.min(3, Math.max(0.5, scaleRaw)) : 1;
    if (!name) return NextResponse.json({ error: "Brand name is required." }, { status: 400 });

    let logoFields: { logoId: string; logoWidth: number; logoHeight: number } | undefined;
    const logoFile = form.get("logo");
    if (logoFile instanceof File && logoFile.size > 0) {
      if (!ACCEPTED_LOGO_MIME.includes(logoFile.type)) {
        return NextResponse.json({ error: "Logo must be SVG, PNG, JPEG or WebP." }, { status: 415 });
      }
      if (logoFile.size > MAX_UPLOAD_BYTES) {
        return NextResponse.json({ error: "Logo file is too large." }, { status: 413 });
      }
      const processed = await processLogo(Buffer.from(await logoFile.arrayBuffer()), logoFile.type);
      const rec = await saveUpload(
        processed.buffer,
        processed.ext,
        processed.mime,
        processed.width,
        processed.height,
      );
      logoFields = { logoId: rec.id, logoWidth: rec.width, logoHeight: rec.height };
    } else if (!id) {
      return NextResponse.json({ error: "A logo file is required." }, { status: 400 });
    }

    // Optional default building/hero photo for report covers.
    let buildingFields:
      | { buildingId: string; buildingWidth: number; buildingHeight: number }
      | undefined;
    const buildingFile = form.get("building");
    if (buildingFile instanceof File && buildingFile.size > 0) {
      if (!ACCEPTED_MIME.includes(buildingFile.type)) {
        return NextResponse.json(
          { error: "Building photo must be JPEG, PNG or WebP." },
          { status: 415 },
        );
      }
      if (buildingFile.size > MAX_UPLOAD_BYTES) {
        return NextResponse.json({ error: "Building photo is too large." }, { status: 413 });
      }
      const processed = await processBuildingPhoto(Buffer.from(await buildingFile.arrayBuffer()));
      const rec = await saveUpload(
        processed.buffer,
        processed.ext,
        processed.mime,
        processed.width,
        processed.height,
      );
      buildingFields = {
        buildingId: rec.id,
        buildingWidth: rec.width,
        buildingHeight: rec.height,
      };
    }

    const profile = await saveProfile({
      id,
      name,
      accent,
      logoScale,
      ...logoFields,
      ...buildingFields,
    });
    if (!profile) {
      return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }
    return NextResponse.json({ profile: toClient(profile) });
  } catch (err) {
    if (err instanceof ImageError) {
      return NextResponse.json({ error: err.message }, { status: 422 });
    }
    console.error("[profiles]", err);
    return NextResponse.json({ error: "Could not save the profile." }, { status: 500 });
  }
}
