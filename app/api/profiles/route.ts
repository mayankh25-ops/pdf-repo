import { NextRequest, NextResponse } from "next/server";
import { ACCEPTED_LOGO_MIME, ImageError, MAX_UPLOAD_BYTES, processLogo } from "@/lib/image";
import { listProfiles, saveProfile, saveUpload } from "@/lib/store";
import { assetUrl } from "@/lib/sample";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const toClient = (p: Awaited<ReturnType<typeof listProfiles>>[number]) => ({
  id: p.id,
  name: p.name,
  accent: p.accent,
  logo: { id: p.logoId, url: assetUrl(p.logoId), width: p.logoWidth, height: p.logoHeight },
});

export async function GET() {
  return NextResponse.json({ profiles: (await listProfiles()).map(toClient) });
}

/** Creates a company profile: multipart form with name, accent, logo file. */
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const name = String(form.get("name") ?? "").trim().slice(0, 120);
    const accentRaw = String(form.get("accent") ?? "").trim();
    const accent = /^#[0-9a-fA-F]{6}$/.test(accentRaw) ? accentRaw : "#D9232E";
    if (!name) return NextResponse.json({ error: "Brand name is required." }, { status: 400 });

    const logoFile = form.get("logo");
    if (!(logoFile instanceof File) || logoFile.size === 0) {
      return NextResponse.json({ error: "A logo file is required." }, { status: 400 });
    }
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
    const profile = await saveProfile({
      name,
      accent,
      logoId: rec.id,
      logoWidth: rec.width,
      logoHeight: rec.height,
    });
    return NextResponse.json({ profile: toClient(profile) });
  } catch (err) {
    if (err instanceof ImageError) {
      return NextResponse.json({ error: err.message }, { status: 422 });
    }
    console.error("[profiles]", err);
    return NextResponse.json({ error: "Could not create the profile." }, { status: 500 });
  }
}
