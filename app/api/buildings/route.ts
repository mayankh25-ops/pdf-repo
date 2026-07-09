import { NextRequest, NextResponse } from "next/server";
import { listBuildings, saveBuildings } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ buildings: await listBuildings() });
}

/**
 * Mutates the shared building list. Body: { add?: string, remove?: string }.
 * Returns the updated list.
 */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { add?: unknown; remove?: unknown } | null;
  const add = typeof body?.add === "string" ? body.add.trim().slice(0, 160) : "";
  const remove = typeof body?.remove === "string" ? body.remove.trim() : "";
  if (!add && !remove) {
    return NextResponse.json({ error: "Nothing to change." }, { status: 400 });
  }
  let list = await listBuildings();
  if (add && !list.some((b) => b.toLowerCase() === add.toLowerCase())) {
    list = [...list, add].sort((a, b) => a.localeCompare(b));
  }
  if (remove) {
    list = list.filter((b) => b !== remove);
  }
  await saveBuildings(list);
  return NextResponse.json({ buildings: list });
}
