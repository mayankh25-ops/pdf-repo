import { NextRequest, NextResponse } from "next/server";
import { listBuildings, saveBuildings } from "@/lib/store";
import { assetUrl } from "@/lib/sample";
import type { BuildingEntry } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const toClient = (b: BuildingEntry) => ({
  name: b.name,
  photo: b.photoId
    ? {
        id: b.photoId,
        url: assetUrl(b.photoId),
        width: b.photoWidth ?? 0,
        height: b.photoHeight ?? 0,
      }
    : null,
});

export async function GET() {
  return NextResponse.json({ buildings: (await listBuildings()).map(toClient) });
}

/**
 * Mutates the shared building list.
 * Body: { add?: string, photoId?, photoWidth?, photoHeight?, remove?: string }
 * (the photo is uploaded first via /api/upload and referenced by id here).
 */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const add = typeof body?.add === "string" ? body.add.trim().slice(0, 160) : "";
  const remove = typeof body?.remove === "string" ? body.remove.trim() : "";
  if (!add && !remove) {
    return NextResponse.json({ error: "Nothing to change." }, { status: 400 });
  }
  let list = await listBuildings();
  if (add) {
    const photoId =
      typeof body?.photoId === "string" && /^[a-f0-9]{16,64}$/.test(body.photoId)
        ? body.photoId
        : undefined;
    const entry: BuildingEntry = {
      name: add,
      ...(photoId
        ? {
            photoId,
            photoWidth: Number(body?.photoWidth) || 0,
            photoHeight: Number(body?.photoHeight) || 0,
          }
        : {}),
    };
    const existing = list.findIndex((b) => b.name.toLowerCase() === add.toLowerCase());
    if (existing >= 0) {
      // Re-adding an existing name updates its photo.
      list[existing] = { ...list[existing], ...entry, name: list[existing].name };
    } else {
      list = [...list, entry].sort((a, b) => a.name.localeCompare(b.name));
    }
  }
  if (remove) {
    list = list.filter((b) => b.name !== remove);
  }
  await saveBuildings(list);
  return NextResponse.json({ buildings: list.map(toClient) });
}
